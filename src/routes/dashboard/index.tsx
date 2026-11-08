import { createFileRoute, Link, redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"

import { auth } from "@/lib/auth"

const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const headers = getRequestHeaders()
  // console.log("[server] cookie header:", headers.get("cookie"))
  const session = await auth.api.getSession({ headers })
  // console.log("[server] session found:", !!session)
  return session
})

export const Route = createFileRoute("/dashboard/")({
  async beforeLoad({ location }) {
    const session = await getSession()

    if (!session) {
      throw redirect({
        to: "/auth/$path",
        params: { path: "sign-in" },
        search: { redirectTo: location.href }
      })
    }

    return { session }
  },
  component: Dashboard
})

function Dashboard() {
  const { session } = Route.useRouteContext()

  return (
    <div className="flex flex-col items-center my-auto">
      <h1 className="text-2xl">Hello, {session.user.email}</h1>

      <Link to="/auth/$path" params={{ path: "sign-out" }}>
        Sign Out
      </Link>
    </div>
  )
}