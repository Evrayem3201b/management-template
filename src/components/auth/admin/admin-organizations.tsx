// src/components/admin/admin-organizations.tsx
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { listAdminOrganizations } from "@/lib/admin/admin-organizations.functions"

type Result = Awaited<ReturnType<typeof listAdminOrganizations>>

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" })

export function AdminOrganizations() {
    const [search, setSearch] = useState("")
    const [query, setQuery] = useState("")
    const [page, setPage] = useState(1)
    const [result, setResult] = useState<Result | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [reloadKey, setReloadKey] = useState(0)

    // Debounce typing, and go back to page 1 on a new search.
    useEffect(() => {
        const timer = setTimeout(() => {
            setQuery(search.trim())
            setPage(1)
        }, 300)
        return () => clearTimeout(timer)
    }, [search])

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setError(null)

        listAdminOrganizations({ data: { search: query, page } })
            .then((data) => {
                if (!cancelled) setResult(data)
            })
            .catch((e: unknown) => {
                if (cancelled) return
                const message = e instanceof Error ? e.message : ""
                setError(
                    message === "Forbidden"
                        ? "You do not have permission to view organizations."
                        : "Could not load organizations."
                )
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [query, page, reloadKey])

    const total = result?.total ?? 0
    const pageSize = result?.pageSize ?? 25
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1
    const to = Math.min(page * pageSize, total)

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h2 className="text-lg font-semibold">Organizations</h2>
                <p className="text-sm text-muted-foreground">
                    Every business on the platform. Read-only.
                </p>
            </div>

            <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or slug"
                className="max-w-sm"
            />

            {error ? (
                <div className="flex flex-col items-start gap-3 rounded-lg border p-6">
                    <p className="text-sm">{error}</p>
                    <Button variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
                        Retry
                    </Button>
                </div>
            ) : (
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Organization</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead className="text-right">Members</TableHead>
                                <TableHead className="text-right">Jobs</TableHead>
                                <TableHead>Created</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {loading && !result ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : result?.organizations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No organizations found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                result?.organizations.map((org) => (
                                    <TableRow key={org.id} className={loading ? "opacity-60" : undefined}>
                                        <TableCell>
                                            <div className="font-medium">{org.name}</div>
                                            <div className="text-xs text-muted-foreground">{org.slug}</div>
                                        </TableCell>
                                        <TableCell>
                                            {org.owners.length === 0 ? (
                                                <span className="text-muted-foreground">No owner</span>
                                            ) : (
                                                org.owners.map((o) => (
                                                    <div key={o.email}>
                                                        <div>{o.name}</div>
                                                        <div className="text-xs text-muted-foreground">{o.email}</div>
                                                    </div>
                                                ))
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">{org.memberCount}</TableCell>
                                        <TableCell className="text-right tabular-nums">{org.jobCount}</TableCell>
                                        <TableCell>{dateFormat.format(new Date(org.createdAt))}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {!error && total > 0 && (
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                        {from}–{to} of {total}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1 || loading}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={to >= total || loading}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}