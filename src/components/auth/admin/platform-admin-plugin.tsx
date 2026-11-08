// src/lib/auth/platform-admin-plugin.tsx
import { createAuthPlugin } from "@better-auth-ui/core"
import { Building2 } from "lucide-react"
import { AdminOrganizations } from "#/components/auth/admin/admin-organizations"

export const platformAdminPlugin = createAuthPlugin("platform-admin", () => ({
    adminTabs: [
        {
            id: "organizations",
            path: "organizations",
            label: (
                <>
                    <Building2 /> Organizations
                </>
            ),
            component: AdminOrganizations
        }
    ]
}))