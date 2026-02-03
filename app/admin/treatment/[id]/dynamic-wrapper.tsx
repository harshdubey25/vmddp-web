"use client";

import dynamic from "next/dynamic";

const ViewTreatmentApplication = dynamic(() => import("./client"), {
    ssr: false,
    loading: () => (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="w-8 h-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                        <p className="text-muted-foreground">Loading...</p>
                    </div>
                </div>
            </div>
        </div>
    )
});

export default function DynamicWrapper({ id }: { id: string }) {
    return <ViewTreatmentApplication id={id} />;
}
