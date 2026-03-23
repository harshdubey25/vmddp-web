"use client";

import { useFrappeGetCall, useFrappeGetDocList } from "frappe-react-sdk"; import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
    User,
    MapPin,
    FileText,
    CreditCard,
    Building2,
    CalendarDays,
    IndianRupee,
    Package,
    Image as ImageIcon,
    AlertCircle,
    MessageSquare,
} from "lucide-react";

interface DDDoc {
    name: string;
    application: string;
    component: string;
    item: string;
    dd_number: string;
    dd_date: string;
    amount: number;
    source_bank_name: string;
    branch_name: string;
    dd_image?: string;
    docstatus: number;
    remarks?: string;
}

interface ApplicationDetails {
    name: string;
    first_name: string;
    mid_name: string;
    last_name: string;
    aadhar_number: string;
    district: string;
    taluka: string;
    village: string;
    component_name: string;
    component_status: string;
    amount: number;
    response?: string;
}

interface DDDetailsModalProps {
    appName: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function InfoRow({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-muted shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-medium text-sm break-words">{value ?? "—"}</p>
            </div>
        </div>
    );
}

export default function DDDetailsModal({ appName, open, onOpenChange }: DDDetailsModalProps) {
    const { data: applicationResponse, isLoading: loadingApp } = useFrappeGetCall(
        appName ? "vmddp_app.api.v1.accountant.get_application_details" : null as unknown as string,
        appName ? { app_form: appName } : undefined,
        undefined,
        { revalidateOnFocus: false },
    );

    const application: ApplicationDetails | undefined = applicationResponse?.message?.[0];

    const { data: ddList, isLoading: loadingDD } = useFrappeGetDocList<DDDoc>("DD", {
        fields: [
            "name",
            "application",
            "component",
            "item",
            "dd_number",
            "dd_date",
            "amount",
            "source_bank_name",
            "branch_name",
            "dd_image",
            "docstatus",
            "remarks",
        ],
        filters: appName
            ? [["application", "=", appName]]
            : [["name", "=", "__none__"]],
        limit: 1,
        orderBy: { field: "creation", order: "desc" },
    });
    const dd: DDDoc | undefined = ddList?.[0];

    const isLoading = loadingApp || loadingDD;

    const getFullName = (app?: ApplicationDetails) =>
        [app?.first_name, app?.mid_name, app?.last_name].filter(Boolean).join(" ") || "—";

    const formatAadhaar = (num?: string) =>
        num ? num.replace(/(\d{4})/g, "$1 ").trim() : "—";

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const getDDStatusBadge = (docstatus?: number) => {
        if (docstatus === 1)
            return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Submitted</Badge>;
        if (docstatus === 2)
            return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">DD Returned</Badge>;
        return <Badge variant="outline">Draft</Badge>;
    };

    const baseUrl = process.env.NEXT_PUBLIC_FRAPPE_BASE_URL || "";

    // Build the proxied image URL — private S3 files need auth, so route through the Next.js API proxy
    const ddImageUrl = (() => {
        const raw = dd?.dd_image;
        if (!raw) return null;
        // If already an absolute S3/CDN URL with a key, proxy it via generate_file
        if (raw.startsWith("http")) {
            try {
                const u = new URL(raw);
                const key = u.searchParams.get("key");
                const fileName = u.pathname.split("/").pop() || "file";
                if (key) {
                    return `/api/method/frappe_s3_attachment.controller.generate_file?key=${encodeURIComponent(key)}&file_name=${encodeURIComponent(fileName)}`;
                }
            } catch {
                // fall through to relative path handling
            }
            return raw;
        }
        // Relative Frappe path — proxy through Next.js so the bearer token is attached
        const fileName = raw.split("/").pop() || "file";
        return `/api/method/frappe_s3_attachment.controller.generate_file?key=${encodeURIComponent(raw.replace(/^\//, ""))}&file_name=${encodeURIComponent(fileName)}`;
    })();
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        DD Details
                    </DialogTitle>
                    {appName && (
                        <p className="text-sm text-muted-foreground font-mono">{appName}</p>
                    )}
                </DialogHeader>

                {isLoading ? (
                    <div className="space-y-6 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <Skeleton className="h-8 w-8 rounded-lg" />
                                    <div className="flex-1 space-y-1">
                                        <Skeleton className="h-3 w-20" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 py-2">
                        {/* Applicant Information */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <User className="h-4 w-4 text-primary" />
                                <h3 className="font-semibold text-sm">Applicant Information</h3>
                            </div>
                            {!application ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                                    <AlertCircle className="h-4 w-4" />
                                    Application details not available.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InfoRow
                                        icon={User}
                                        label="Full Name"
                                        value={getFullName(application)}
                                    />
                                    <InfoRow
                                        icon={FileText}
                                        label="Aadhaar Number"
                                        value={
                                            <span className="font-mono">
                                                {formatAadhaar(application.aadhar_number)}
                                            </span>
                                        }
                                    />
                                    <InfoRow
                                        icon={MapPin}
                                        label="Location"
                                        value={[application.village, application.taluka, application.district]
                                            .filter(Boolean)
                                            .join(", ")}
                                    />
                                    <InfoRow
                                        icon={Package}
                                        label="Component"
                                        value={application.component_name}
                                    />
                                    <InfoRow
                                        icon={IndianRupee}
                                        label="DD Required"
                                        value={`₹${(application.amount || 0).toLocaleString("en-IN")}`}
                                    />
                                    <InfoRow
                                        icon={FileText}
                                        label="Application Status"
                                        value={
                                            <Badge variant="secondary" className="mt-0.5">
                                                {application.component_status}
                                            </Badge>
                                        }
                                    />
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* DD Details */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-primary" />
                                    <h3 className="font-semibold text-sm">Demand Draft Details</h3>
                                </div>
                                {dd && getDDStatusBadge(dd.docstatus)}
                            </div>
                            {!dd ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                                    <AlertCircle className="h-4 w-4" />
                                    No DD record found for this application.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <InfoRow
                                            icon={CreditCard}
                                            label="DD Number"
                                            value={<span className="font-mono">{dd.dd_number}</span>}
                                        />
                                        <InfoRow
                                            icon={CalendarDays}
                                            label="DD Date"
                                            value={formatDate(dd.dd_date)}
                                        />
                                        <InfoRow
                                            icon={IndianRupee}
                                            label="DD Amount"
                                            value={`₹${(dd.amount || 0).toLocaleString("en-IN")}`}
                                        />
                                        <InfoRow
                                            icon={Package}
                                            label="Animal / Item"
                                            value={dd.item || "—"}
                                        />
                                        <InfoRow
                                            icon={Building2}
                                            label="Bank Name"
                                            value={dd.source_bank_name}
                                        />
                                        <InfoRow
                                            icon={Building2}
                                            label="Branch Name"
                                            value={dd.branch_name}
                                        />
                                    </div>

                                    {/* Cancellation Remarks */}
                                    {dd.docstatus === 2 && dd.remarks && (
                                        <div className="mt-2 p-3 bg-red-500/10 rounded-lg flex items-start gap-2">
                                            <MessageSquare className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-0.5">Cancellation Remark</p>
                                                <p className="text-sm text-red-700 dark:text-red-300">{dd.remarks}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* DD Image */}
                                    {ddImageUrl && (
                                        <div className="mt-4 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                                <p className="text-xs text-muted-foreground">DD Image</p>
                                            </div>
                                            <a
                                                href={ddImageUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block rounded-lg overflow-hidden border max-w-xs hover:opacity-90 transition-opacity"
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={ddImageUrl}
                                                    alt="DD Image"
                                                    className="w-full object-contain max-h-64"
                                                />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
