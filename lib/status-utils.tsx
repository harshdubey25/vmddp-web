import { Badge } from "@/components/ui/badge";

export type ApplicationStatus = "Approved" | "Pending" | "Rejected" | "Selected" | "Not Assigned";

export const getStatusBadge = (status: ApplicationStatus) => {
    const variants: Record<ApplicationStatus, { variant: string; className: string }> = {
        Pending: { variant: "outline", className: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
        Approved: { variant: "outline", className: "bg-chart-3/10 text-chart-3 border-chart-3/20" },
        Rejected: { variant: "outline", className: "bg-chart-5/10 text-chart-5 border-chart-5/20" },
        Selected: { variant: "outline", className: "bg-chart-1/10 text-chart-1 border-chart-1/20" },
        "Not Assigned": { variant: "outline", className: "bg-muted/30 text-muted-foreground border-muted/50" },
    };

    return (
        <Badge variant={variants[status]?.variant as any} className={variants[status]?.className}>
            {status}
        </Badge>
    );
};
