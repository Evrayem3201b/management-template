import { useState } from "react"
import { authClient } from "@/lib/auth-client" // Adjust path to your auth client

type CreateOrgInput = {
    name: string
    slug: string
    logo?: string
}

export function useCreateOrganization() {
    const [isPending, setIsPending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const createOrganization = async (
        values: CreateOrgInput,
        onSuccess?: (data: any) => void
    ) => {
        setIsPending(true)
        setError(null)

        try {
            const { data, error: authError } = await authClient.organization.create({
                name: values.name,
                slug: values.slug,
                logo: values.logo,
            })

            if (authError) {
                setError(authError.message || "Failed to create organization")
                return { success: false, error: authError }
            }

            if (onSuccess && data) {
                onSuccess(data)
            }

            return { success: true, data }
        } catch (err: any) {
            const errorMessage = err?.message || "An unexpected error occurred"
            setError(errorMessage)
            return { success: false, error: { message: errorMessage } }
        } finally {
            setIsPending(false)
        }
    }

    return {
        createOrganization,
        isPending,
        error,
    }
}