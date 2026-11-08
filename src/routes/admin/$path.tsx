// routes/admin/$path.tsx
import { createFileRoute, notFound } from "@tanstack/react-router"

import { Admin } from "@/components/auth/admin/admin"

const validAdminPaths = ["users", "organizations"]

export const Route = createFileRoute("/admin/$path")({
  beforeLoad({ params: { path } }) {
    if (!validAdminPaths.includes(path)) throw notFound()
  },
  component: AdminPage
})

function AdminPage() {
  const { path } = Route.useParams()
  return <Admin path={path} />
}