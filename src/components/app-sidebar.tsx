// src/components/app-sidebar.tsx
import { Link, useRouterState } from "@tanstack/react-router";
import {
    BriefcaseBusiness,
    Building2,
    CalendarDays,
    ChevronsUpDown,
    CircleDollarSign,
    LayoutDashboard,
    LogIn,
    LogOut,
    Palette,
    Settings,
    ShieldCheck,
    UserCog,
    UserPlus,
    Users,
    UserX,
    Wrench,
    type LucideIcon,
} from "lucide-react";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSkeleton,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OrganizationSwitcher } from "@/components/auth/organization/organization-switcher";
import { authClient } from "@/lib/auth-client";

import ThemeToggle from "./ThemeToggle";

/* -------------------------------------------------------------------------- */
/* Roles                                                                      */
/* -------------------------------------------------------------------------- */

type AppRole = "owner" | "manager" | "technician";

// A member can hold several comma-separated roles; the highest one wins.
const ROLE_PRIORITY: AppRole[] = ["owner", "manager", "technician"];

function resolveRole(raw?: string | null): AppRole | null {
    if (!raw) return null;
    const held = raw.split(",").map((r) => r.trim());
    return ROLE_PRIORITY.find((r) => held.includes(r)) ?? null;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* -------------------------------------------------------------------------- */
/* Navigation config                                                          */
/* -------------------------------------------------------------------------- */

type NavItem = {
    title: string;
    url: string;
    icon: LucideIcon;
    /** Omit to show for every signed-in user. */
    roles?: AppRole[];
    /** Per-role label overrides. */
    labels?: Partial<Record<AppRole, string>>;
};

type NavGroup = {
    label: string;
    items: NavItem[];
};

const WORKSPACE_GROUPS: NavGroup[] = [
    {
        label: "Operations",
        items: [
            {
                title: "Dashboard",
                url: "/dashboard",
                icon: LayoutDashboard,
                roles: ["owner", "manager", "technician"],
            },
            {
                title: "Jobs",
                url: "/jobs",
                icon: BriefcaseBusiness,
                roles: ["owner", "manager", "technician"],
                labels: { technician: "My Jobs" },
            },
            {
                title: "Schedule",
                url: "/schedule",
                icon: CalendarDays,
                roles: ["owner", "manager", "technician"],
            },
            {
                title: "Customers",
                url: "/customers",
                icon: Users,
                roles: ["owner", "manager"],
            },
        ],
    },
    {
        label: "Business",
        items: [
            {
                title: "Finances",
                url: "/finances",
                icon: CircleDollarSign,
                roles: ["owner", "manager"],
            },
            {
                title: "Team",
                url: "/team",
                icon: UserCog,
                roles: ["owner", "manager"],
            },
        ],
    },
    {
        label: "Account",
        items: [
            // No `roles`: everyone signed in, including users with no workspace yet.
            { title: "Settings", url: "/settings/account", icon: Settings },
        ],
    },
];

const PLATFORM_GROUP: NavGroup = {
    label: "Platform",
    items: [
        { title: "Users", url: "/admin/users", icon: ShieldCheck },
        { title: "Organizations", url: "/admin/organizations", icon: Building2 }
    ],

};

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function AppSidebar() {
    const pathname = useRouterState({ select: (s) => s.location.pathname });
    const { setOpenMobile } = useSidebar();

    const { data: session, isPending: sessionPending } = authClient.useSession();
    const { data: activeOrg, isPending: orgPending } =
        authClient.useActiveOrganization();
    const { data: activeMember, isPending: memberPending } =
        authClient.useActiveMember();

    const user = session?.user ?? null;
    const role = resolveRole(activeMember?.role);

    // Global (platform) role + impersonation marker, both set by the admin plugin.
    const globalRole = (user as { role?: string | null } | null)?.role ?? null;
    const isPlatformAdmin = !!globalRole?.split(",").includes("admin");
    const impersonating = !!(
        session?.session as { impersonatedBy?: string | null } | undefined
    )?.impersonatedBy;

    const isLoading = sessionPending || (!!user && (orgPending || memberPending));
    const hasWorkspace = !!activeOrg && !!role;

    const initials = user
        ? user.name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase()
        : "";

    function isActive(url: string) {
        return pathname === url || pathname.startsWith(`${url}/`);
    }

    function visibleItems(group: NavGroup) {
        return group.items.filter((item) =>
            item.roles ? !!role && item.roles.includes(role) : true,
        );
    }

    async function stopImpersonating() {
        await authClient.admin.stopImpersonating();
        // Full reload so every cached session value is refreshed.
        window.location.assign("/admin/users");
    }

    function renderGroup(group: NavGroup) {
        const items = visibleItems(group);
        if (items.length === 0) return null;

        return (
            <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        {items.map((item) => {
                            const title = (role && item.labels?.[role]) || item.title;
                            return (
                                <SidebarMenuItem key={item.url}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(item.url)}
                                        tooltip={title}
                                    >
                                        <Link
                                            to={item.url}
                                            onClick={() => setOpenMobile(false)}
                                        >
                                            <item.icon />
                                            <span>{title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        );
    }

    return (
        <Sidebar collapsible="icon" variant="sidebar">
            {/* ------------------------------ Header ------------------------------ */}
            <SidebarHeader className="border-b border-sidebar-border p-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild size="lg" tooltip="Home">
                            <Link to="/" onClick={() => setOpenMobile(false)}>
                                <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <Wrench className="size-5" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">Siyana</span>
                                    <span className="truncate text-xs text-muted-foreground">
                                        Service management
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                {user && (
                    <div className="group-data-[collapsible=icon]:hidden">
                        <OrganizationSwitcher />
                    </div>
                )}
            </SidebarHeader>

            {/* ------------------------------ Content ----------------------------- */}
            <SidebarContent>
                {isLoading ? (
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <SidebarMenuItem key={i}>
                                        <SidebarMenuSkeleton showIcon />
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ) : user ? (
                    <>
                        {/* Signed in, but no active workspace yet */}
                        {!hasWorkspace && (
                            <SidebarGroup>
                                <SidebarGroupLabel>Get started</SidebarGroupLabel>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        <SidebarMenuItem>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isActive("/settings/organizations")}
                                                tooltip="Set up your workspace"
                                            >
                                                <Link
                                                    to="/settings/$path"
                                                    params={{ path: "organizations" }}
                                                    onClick={() => setOpenMobile(false)}
                                                >
                                                    <Wrench />
                                                    <span>Set up your workspace</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        )}

                        {WORKSPACE_GROUPS.map(renderGroup)}

                        {isPlatformAdmin && renderGroup(PLATFORM_GROUP)}
                    </>
                ) : (
                    <SidebarGroup>
                        <SidebarGroupLabel>Get started</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive("/auth/sign-in")}
                                        tooltip="Sign in"
                                    >
                                        <Link
                                            to="/auth/$path"
                                            params={{ path: "sign-in" }}
                                            onClick={() => setOpenMobile(false)}
                                        >
                                            <LogIn />
                                            <span>Sign in</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive("/auth/sign-up")}
                                        tooltip="Create account"
                                    >
                                        <Link
                                            to="/auth/$path"
                                            params={{ path: "sign-up" }}
                                            onClick={() => setOpenMobile(false)}
                                        >
                                            <UserPlus />
                                            <span>Create account</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>

            {/* ------------------------------ Footer ------------------------------ */}
            <SidebarFooter className="border-t border-sidebar-border p-3">
                <div className="flex items-center justify-between gap-2 px-1 py-1 group-data-[collapsible=icon]:flex-col">
                    <div className="flex min-w-0 items-center gap-2">
                        <Palette className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm text-muted-foreground group-data-[collapsible=icon]:hidden">
                            Appearance
                        </span>
                    </div>
                    <ThemeToggle />
                </div>

                {user && (
                    <SidebarMenu>
                        {impersonating && (
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    onClick={() => void stopImpersonating()}
                                    tooltip="Stop impersonating"
                                    className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200"
                                >
                                    <UserX />
                                    <span>Stop impersonating</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )}

                        <SidebarMenuItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <SidebarMenuButton
                                        size="lg"
                                        tooltip="Account"
                                        className="data-[state=open]:bg-sidebar-accent"
                                    >
                                        <Avatar className="size-8 rounded-lg">
                                            <AvatarImage
                                                src={user.image || undefined}
                                                alt={user.name}
                                            />
                                            <AvatarFallback className="rounded-lg">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-medium">{user.name}</span>
                                            <span className="truncate text-xs text-muted-foreground">
                                                {user.email}
                                            </span>
                                        </div>

                                        <ChevronsUpDown className="ml-auto size-4" />
                                    </SidebarMenuButton>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                    side="top"
                                    align="end"
                                    sideOffset={8}
                                    className="w-60"
                                >
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium">{user.name}</span>
                                            <span className="text-xs font-normal text-muted-foreground">
                                                {[
                                                    role ? capitalize(role) : null,
                                                    isPlatformAdmin ? "Platform admin" : null,
                                                ]
                                                    .filter(Boolean)
                                                    .join(" · ") || "No workspace"}
                                            </span>
                                        </div>
                                    </DropdownMenuLabel>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem asChild variant="destructive">
                                        <Link to="/auth/$path" params={{ path: "sign-out" }}>
                                            <LogOut className="mr-2 size-4" />
                                            Sign out
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </SidebarMenuItem>
                    </SidebarMenu>
                )}
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}