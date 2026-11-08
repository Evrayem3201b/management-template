// src/components/Header.tsx
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight, UserX } from "lucide-react";
import { Fragment, useState } from "react";
import { toast } from "sonner";

import { UserButton } from "@/components/auth/user/user-button";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

/* -------------------------------------------------------------------------- */
/* Breadcrumbs                                                                */
/* -------------------------------------------------------------------------- */

type Crumb = { label: string; href?: string };

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  jobs: "Jobs",
  customers: "Customers",
  finances: "Finances",
  team: "Team",
  schedule: "Schedule",
  settings: "Settings",
  organization: "Organization",
  organizations: "Organizations",
  people: "People",
  account: "Account",
  security: "Security",
  admin: "Admin",
  users: "Users",
  "sign-in": "Sign in",
  "sign-up": "Sign up",
  "sign-out": "Sign out",
  "forgot-password": "Forgot password",
  "reset-password": "Reset password",
  "accept-invitation": "Accept invitation",
};

// Only routes that exist on their own. `/admin` and `/organization` have no page.
const LINKABLE = new Set([
  "/dashboard",
  "/jobs",
  "/customers",
  "/finances",
  "/team",
  "/schedule",
  "/settings",
]);

function labelFor(segment: string) {
  if (LABELS[segment]) return LABELS[segment];

  // IDs (uuids and other long tokens) get a generic label.
  if (/^[0-9a-f-]{16,}$/i.test(segment) || segment.length > 24) return "Details";

  return decodeURIComponent(segment)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [{ label: "Home" }];

  // "/auth/sign-in" reads better as just "Sign in".
  const start = segments[0] === "auth" ? 1 : 0;

  return segments.slice(start).map((segment, i, list) => {
    const href = "/" + segments.slice(0, start + i + 1).join("/");
    const isLast = i === list.length - 1;

    return {
      label: labelFor(segment),
      href: !isLast && LINKABLE.has(href) ? href : undefined,
    };
  });
}

/* -------------------------------------------------------------------------- */
/* Impersonation banner                                                       */
/* -------------------------------------------------------------------------- */

function ImpersonationBanner() {
  const { data: session } = authClient.useSession();
  const [pending, setPending] = useState(false);

  const impersonating = !!(
    session?.session as { impersonatedBy?: string | null } | undefined
  )?.impersonatedBy;

  async function stop() {
    if (pending) return;
    setPending(true);

    try {
      const { error } = await authClient.admin.stopImpersonating();

      if (error) {
        toast.error(error.message ?? "Couldn't stop impersonating. Try again.");
        setPending(false);
        return;
      }

      // Full reload so every cached session value is refreshed.
      window.location.assign("/admin/users");
    } catch {
      toast.error("Network error. Check your connection and try again.");
      setPending(false);
    }
  }

  if (!impersonating) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-3 bg-amber-500 px-4 py-1.5 text-sm font-medium text-amber-950"
    >
      <span className="truncate">Viewing as {session?.user.name}</span>

      <Button
        size="sm"
        variant="secondary"
        className="h-7"
        disabled={pending}
        onClick={() => void stop()}
      >
        <UserX />
        {pending ? "Returning..." : "Stop"}
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Header                                                                     */
/* -------------------------------------------------------------------------- */

export default function Header() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const crumbs = buildCrumbs(pathname);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <ImpersonationBanner />

      <div className="flex h-14 items-center gap-2 px-4 sm:px-6">
        <SidebarTrigger className="-ml-1" />

        <Separator
          orientation="vertical"
          className="mr-1 data-[orientation=vertical]:h-4"
        />

        <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
          <ol className="flex min-w-0 items-center gap-1.5 text-sm">
            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1;

              return (
                <Fragment key={`${i}-${crumb.label}`}>
                  <li
                    className={`min-w-0 items-center ${isLast ? "flex" : "hidden sm:flex"
                      }`}
                  >
                    {crumb.href ? (
                      <Link
                        to={crumb.href}
                        className="truncate text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {crumb.label}
                      </Link>
                    ) : isLast ? (
                      <h1
                        aria-current="page"
                        className="truncate font-semibold tracking-tight"
                      >
                        {crumb.label}
                      </h1>
                    ) : (
                      <span className="truncate text-muted-foreground">
                        {crumb.label}
                      </span>
                    )}
                  </li>

                  {!isLast && (
                    <ChevronRight
                      aria-hidden
                      className="hidden size-3.5 shrink-0 text-muted-foreground sm:block"
                    />
                  )}
                </Fragment>
              );
            })}
          </ol>
        </nav>

        {/* <div className="flex shrink-0 items-center gap-2">
          <UserButton />
        </div> */}
      </div>
    </header>
  );
}