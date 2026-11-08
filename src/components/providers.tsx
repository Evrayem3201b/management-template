
import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { AuthProvider } from "#/components/auth/auth-provider";
import { organizationPlugin } from "@/lib/auth/organization-plugin"
import { adminPlugin } from "@/lib/auth/admin-plugin"
import { authClient } from "#/lib/auth-client";
import { Toaster } from "#/components/ui/sonner";
import { platformAdminPlugin } from "./auth/admin/platform-admin-plugin";

export function Providers({ children }: { children: ReactNode }) {
    const navigate = useNavigate();

    return (
        <AuthProvider
            authClient={authClient}
            navigate={navigate}
            redirectTo="/dashboard"
            emailAndPassword={{
                requireEmailVerification: false,
            }}
            Link={({ href, ...props }) => (
                <Link to={href as never} {...props} />
            )}
            plugins={[
                organizationPlugin({
                    additionalRoles: { manager: "Manager", technician: "Technician" }
                }),
                adminPlugin({
                    roles: ["user", "admin"],
                    defaultRole: "user",
                    impersonationRedirectTo: "/dashboard"
                }),
                platformAdminPlugin()
            ]}
        >
            {children}
            <Toaster />
        </AuthProvider>
    );
}
