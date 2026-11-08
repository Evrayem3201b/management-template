// src/lib/admin-organizations.functions.ts
import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { count, desc, eq, ilike, inArray, or } from "drizzle-orm"

import { db } from "@/db/index"
import { jobs, member, organization, user } from "@/db/schema" // adjust the path to your schema
import { auth } from "@/lib/auth"

const PAGE_SIZE = 25

async function requirePlatformAdmin() {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session) throw new Error("Unauthorized")

    // Uses the admin plugin's permission check instead of comparing role strings.
    const { success } = await auth.api.userHasPermission({
        body: { userId: session.user.id, permissions: { user: ["list"] } }
    })
    if (!success) throw new Error("Forbidden")
}

export const listAdminOrganizations = createServerFn({ method: "GET" })
    .validator((input: { search?: string; page?: number }) => ({
        search: (input.search ?? "").trim().slice(0, 100),
        page: Math.max(1, Math.floor(input.page ?? 1))
    }))
    .handler(async ({ data }) => {
        await requirePlatformAdmin()

        const pattern = `%${data.search.replace(/[\\%_]/g, "\\$&")}%`
        const where = data.search
            ? or(ilike(organization.name, pattern), ilike(organization.slug, pattern))
            : undefined

        const [{ total }] = await db
            .select({ total: count() })
            .from(organization)
            .where(where)

        const rows = await db
            .select({
                id: organization.id,
                name: organization.name,
                slug: organization.slug,
                createdAt: organization.createdAt
            })
            .from(organization)
            .where(where)
            .orderBy(desc(organization.createdAt))
            .limit(PAGE_SIZE)
            .offset((data.page - 1) * PAGE_SIZE)

        const ids = rows.map((r) => r.id)
        if (ids.length === 0) {
            return { total, pageSize: PAGE_SIZE, organizations: [] }
        }

        const [memberCounts, jobCounts, owners] = await Promise.all([
            db
                .select({ organizationId: member.organizationId, n: count() })
                .from(member)
                .where(inArray(member.organizationId, ids))
                .groupBy(member.organizationId),
            db
                .select({ organizationId: jobs.organizationId, n: count() })
                .from(jobs)
                .where(inArray(jobs.organizationId, ids))
                .groupBy(jobs.organizationId),
            db
                .select({
                    organizationId: member.organizationId,
                    role: member.role,
                    name: user.name,
                    email: user.email
                })
                .from(member)
                .innerJoin(user, eq(member.userId, user.id))
                .where(inArray(member.organizationId, ids))
        ])

        const members = new Map(memberCounts.map((r) => [r.organizationId, r.n]))
        const jobTotals = new Map(jobCounts.map((r) => [r.organizationId, r.n]))

        return {
            total,
            pageSize: PAGE_SIZE,
            organizations: rows.map((r) => ({
                id: r.id,
                name: r.name,
                slug: r.slug,
                createdAt: r.createdAt.toISOString(),
                memberCount: members.get(r.id) ?? 0,
                jobCount: jobTotals.get(r.id) ?? 0,
                owners: owners
                    .filter(
                        (o) =>
                            o.organizationId === r.id &&
                            o.role.split(",").map((x) => x.trim()).includes("owner")
                    )
                    .map((o) => ({ name: o.name, email: o.email }))
            }))
        }
    })