
export const ROLES = {
    OWNER: "owner",
    MANAGER: "manager",
    TECHNICIAN: "technician",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
