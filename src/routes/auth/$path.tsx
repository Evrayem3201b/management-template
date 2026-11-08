// /auth/$path
import { viewPaths } from "@better-auth-ui/core";
import { createFileRoute, redirect } from "@tanstack/react-router";


import { Auth } from "#/components/auth/auth";
import { organizationPlugin } from "#/lib/auth/organization-plugin";

const validAuthPathSegments = new Set(
  [
    ...Object.values(viewPaths.auth),
    ...Object.values(organizationPlugin().viewPaths.auth),
  ]
);

export const Route = createFileRoute("/auth/$path")({
  beforeLoad({ params }) {
    if (!validAuthPathSegments.has(params.path)) {
      throw redirect({ to: "/" });
    }
  },
  component: AuthPage,
});

function AuthPage() {
  const { path } = Route.useParams();

  return (
    <div className="my-auto flex justify-center p-4 md:p-6">
      <Auth path={path} />
    </div>
  );
}
