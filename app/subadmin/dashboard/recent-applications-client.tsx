"use client";
import { useState } from "react";
import { getStatusBadge } from "@/lib/status-utils";
import ApplicationDetailsDialog from "@/components/ApplicationDetailsDialog";

interface Application {
    id: string;
    applicant: string;
    component: string;
    village: string;
    status: 'Approved' | 'Pending' | 'Rejected' | 'Selected';
    date: string;
}

interface RecentApplicationsClientProps {
    applications: Application[];
}

export default function RecentApplicationsClient({ applications }: RecentApplicationsClientProps) {
    const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

    return (
        <>
            <div className="space-y-3 sm:space-y-4">
                {applications.map((app) => (
                    <div
                        key={app.id}
                        className="flex flex-col p-3 sm:p-4 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                        data-testid={`application-${app.id}`}
                        onClick={() => {
                            setSelectedApplication(app);
                            setIsDetailsDialogOpen(true);
                        }}
                    >
                        <div className="flex-1">
                            <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3 mb-2 sm:mb-3">
                                <p className="font-mono text-xs sm:text-sm font-semibold truncate">{app.id}</p>
                                {getStatusBadge(app.status)}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs sm:text-sm">
                                <div>
                                    <span className="text-muted-foreground">Applicant: </span>
                                    <span className="font-medium">{app.applicant}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Component: </span>
                                    <span className="font-medium">{app.component}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Village: </span>
                                    <span className="font-medium">{app.village}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <ApplicationDetailsDialog
                application={selectedApplication}
                isOpen={isDetailsDialogOpen}
                onClose={() => {
                    setIsDetailsDialogOpen(false);
                    setSelectedApplication(null);
                }}
                showReviewActions={false}
            />
        </>
    );
}
