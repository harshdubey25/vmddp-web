export const runtime = 'edge';
import dynamic from "next/dynamic";

const ComponentAllocationDetails = dynamic(() => import("./client"), {
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

export default function Page({ params }: { params: Promise<{ applicationId: string }> }) {
    return <ComponentAllocationDetails params={params} />;
}
