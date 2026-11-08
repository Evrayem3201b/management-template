// src/lib/auth/permissions.ts
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements as organizationStatements } from "better-auth/plugins/organization/access";
import { adminAc } from "better-auth/plugins/admin/access";

// Combine global admin statements and organization statements
const statement = {
    ...organizationStatements,
    ...adminAc.statements,
} as const;

export const ac = createAccessControl(statement);

// --- GLOBAL ROLES (Platform-wide) ---
export const admin = ac.newRole({
    ...adminAc.statements
});

export const user = ac.newRole({
    // Standard global users have no special global admin powers by default
});

// --- ORGANIZATION ROLES (Workspace-specific for Plumbing Business) ---
export const owner = ac.newRole({
    organization: ["update", "delete"],
    member: ["create", "update", "delete"],
    invitation: ["create", "cancel"],
});

export const manager = ac.newRole({
    organization: ["update"],
    member: ["create", "update"],
    invitation: ["create", "cancel"],
});

export const technician = ac.newRole({
    // Technicians can view/update jobs or service records within their assigned org
});
