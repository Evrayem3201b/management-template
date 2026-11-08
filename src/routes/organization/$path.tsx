import { createFileRoute, notFound, redirect } from "@tanstack/react-router"
import { createIsomorphicFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"

import { Organization } from "@/components/auth/organization/organization"
import { auth } from "@/lib/auth"
import { authClient } from "@/lib/auth-client"
import { organizationPlugin } from "@/lib/auth/organization-plugin"

const validOrganizationPaths = Object.values(
  organizationPlugin().viewPaths.organization
)

export const Route = createFileRoute("/organization/$path")({
  async beforeLoad({ params: { path }, location }) {
    if (!validOrganizationPaths.includes(path)) {
      throw notFound()
    }

    // Isomorphic session check using native Better Auth methods (No QueryClient)
    const getSessionIso = createIsomorphicFn()
      .server(async () => {
        return await auth.api.getSession({
          headers: getRequestHeaders(),
        })
      })
      .client(async () => {
        const { data } = await authClient.getSession()
        return data
      })

    const session = await getSessionIso()

    if (!session) {
      throw redirect({
        to: "/auth/$path",
        params: { path: "sign-in" },
        search: { redirectTo: location.href },
      })
    }

    return { session }
  },
  component: OrganizationPage,
})

function OrganizationPage() {
  const { path } = Route.useParams()
  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-6">
      <Organization path={path} />
    </div>
  )
}