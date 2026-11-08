import {
    BriefcaseBusiness,
    CalendarDays,
    CircleDollarSign,
    ClipboardList,
    LayoutDashboard,
    Settings,
    ShieldCheck,
    Users,
} from "lucide-react";
import type { Role } from "./roles";
import { ROLES } from "./roles";

export interface NavItem {
    label: string;
    to: string;
    roles: Role[];
    icon: any;
}

const managementNavigation = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Jobs",
        url: "/jobs",
        icon: BriefcaseBusiness,
    },
    {
        title: "Customers",
        url: "/customers",
        icon: Users,
    },
    {
        title: "Finances",
        url: "/finances",
        icon: CircleDollarSign,
    },
    {
        title: "Team",
        url: "/team",
        icon: ShieldCheck,
    },
];

const technicianNavigation = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "My Jobs",
        url: "/jobs",
        icon: ClipboardList,
    },
    {
        title: "Schedule",
        url: "/schedule",
        icon: CalendarDays,
    },
];


export const navigation: NavItem[] = [
    { label: "Dashboard", to: "/dashboard", roles: [ROLES.OWNER, ROLES.MANAGER], icon: LayoutDashboard, },
    { label: "Jobs", to: "/jobs", roles: [ROLES.OWNER, ROLES.MANAGER, ROLES.TECHNICIAN], icon: BriefcaseBusiness },
    { label: "Customers", to: "/customers", roles: [ROLES.OWNER, ROLES.MANAGER], icon: Users },
    { label: "Finances", to: "/finances", roles: [ROLES.OWNER, ROLES.MANAGER], icon: CircleDollarSign },
    { label: "Team", to: "/team", roles: [ROLES.OWNER, ROLES.MANAGER], icon: Users },
    { label: "Settings", to: "/settings", roles: [ROLES.OWNER], icon: Settings },
];