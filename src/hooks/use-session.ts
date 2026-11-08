
import { authClient } from "#/lib/auth-client";

export function useCurrentSession() {
    const result = authClient.useSession();

    return {
        session: result.data?.session ?? null,
        user: result.data?.user ?? null,
        isPending: result.isPending,
        isAuthenticated: !!result.data?.user,
        error: result.error,
        refetch: result.refetch,
    };
}
