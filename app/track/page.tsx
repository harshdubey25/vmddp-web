import TrackApplicationForm from "@/components/TrackApplicationForm";

export default function Track() {
    return (
        <div className="min-h-[calc(100vh-16rem)] py-12 sm:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h1 className="font-display font-semibold text-2xl sm:text-3xl mb-3" data-testid="text-track-title">
                        Track Your Application
                    </h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Enter your mobile number or application ID to check the current status of your VMDDP scheme application
                    </p>
                </div>
                <TrackApplicationForm />
            </div>
        </div>
    );
}
