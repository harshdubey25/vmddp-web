"use client";

import dynamic from "next/dynamic";

// Dynamically load the client form to bypass server-side rendering issues
const ClaimForm = dynamic<{ appId: string }>(() => import("./client"), {
    ssr: false,
    loading: () => (
        <div className="h-screen bg-background w-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-muted-foreground">Loading...</p>
            </div>
        </div>
    )
});

export default function DynamicWrapper({ appId }: { appId: string }) {
    return <ClaimForm appId={appId} />;
}
