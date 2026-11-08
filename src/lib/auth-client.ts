// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { adminClient, organizationClient } from "better-auth/client/plugins";

import {
    ac,
    admin as adminRole,
    user as userRole,
    owner,
    manager,
    technician,
} from "./permissions";

export const authClient = createAuthClient({
    plugins: [
        organizationClient({
            ac,
            roles: {
                owner,
                manager,
                technician,
            },
        }),
        adminClient({
            ac,
            roles: {
                admin: adminRole,
                user: userRole,
            },
        }),
    ],
});