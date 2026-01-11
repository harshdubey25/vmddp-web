'use client';

import { FrappeProvider } from "frappe-react-sdk";
import { useEffect, useCallback, useRef } from "react";
import { setupTokenRefreshTimer, refreshAccessToken } from "@/lib/tokenRefresh";
import { mutate } from "swr";

function TokenRefreshManager({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Setup proactive token refresh timer
        const intervalId = setupTokenRefreshTimer();
        return () => clearInterval(intervalId);
    }, []);

    return <>{children}</>;
}

export function FrappeClientProvider({ children }: { children: React.ReactNode }) {
    const isRefreshing = useRef(false);
    const refreshPromise = useRef<Promise<string | null> | null>(null);

    // Handle 401/403 errors - refresh token and revalidate all SWR queries
    const handleError = useCallback(async (error: any, key: string) => {
        const status = error?.httpStatus || error?.status || error?.response?.status;

        // Check if it's an auth error (401 or 403)
        if (status === 401 || status === 403) {
            // Prevent multiple simultaneous refresh calls
            if (!isRefreshing.current) {
                isRefreshing.current = true;
                refreshPromise.current = refreshAccessToken();
            }

            const newToken = await refreshPromise.current;
            isRefreshing.current = false;
            refreshPromise.current = null;

            if (newToken) {
                // Token refreshed successfully - revalidate the failed query
                mutate(key);
            } else {
                // Refresh failed - redirect to login
                if (typeof window !== "undefined") {
                    window.location.href = "/login";
                }
            }
        }
    }, []);

    return (
        <FrappeProvider
            url={process.env.NEXT_PUBLIC_FRAPPE_BASE_URL!}
            tokenParams={{
                useToken: true,
                token: () =>
                    typeof window !== "undefined"
                        ? localStorage.getItem("frappe_access_token") ?? ""
                        : "",
                type: "Bearer",
            }}
            enableSocket={false}
            swrConfig={{
                onError: handleError,
                shouldRetryOnError: false, // We handle retries manually via mutate
            }}
        >
            <TokenRefreshManager>
                {children}
            </TokenRefreshManager>
        </FrappeProvider>
    );
}