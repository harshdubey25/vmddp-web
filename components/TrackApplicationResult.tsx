"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    FileText,
    MapPin,
    Package,
    Phone,
    XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { frappePublic } from "@/lib/frappe";

interface ComponentStatus {
    name: string;
    status: string;
}

interface Application {
    id: string;
    applicantName: string;
    mobile: string;
    district: string;
    taluka: string;
    village: string;
    component: string;
    status: "pending" | "approved" | "selected" | "rejected";
    submittedDate: string;
    rejectionReason?: string;
    selectedComponents?: ComponentStatus[];
    allComponents?: ComponentStatus[];
}

interface TrackApplicationResultProps {
    backHref?: string;
}

export default function TrackApplicationResult({ backHref = "/track" }: TrackApplicationResultProps) {
    const { t } = useTranslation("common");
    const searchParams = useSearchParams();
    const mobile = searchParams.get("mobile");
    const appId = searchParams.get("appId");
    const aadhar = searchParams.get("aadhar");

    const [applications, setApplications] = useState<Application[]>([]);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const params: Record<string, string> = {};
                if (mobile) params.phone_number = mobile.trim();
                if (appId) params.application_number = appId.trim();
                if (aadhar) params.aadhar_number = aadhar.trim();

                const response = await frappePublic.call().get("vmddp_app.api.api.get_application_status", params);

                if (response.message?.error) {
                    setApplications([]);
                } else if (response.message && typeof response.message === "object" && !Array.isArray(response.message)) {
                    const app: Application = {
                        ...response.message,
                        status: response.message.status.toLowerCase() as Application["status"],
                    };
                    setApplications([app]);
                    setSelectedApp(app);
                } else {
                    const apps: Application[] = (response.message || []).map((app: any) => ({
                        ...app,
                        status: app.status.toLowerCase() as Application["status"],
                    }));
                    setApplications(apps);
                    if (apps.length === 1) {
                        setSelectedApp(apps[0]);
                    }
                }
            } catch (error) {
                console.error("Error fetching applications:", error);
                setApplications([]);
            } finally {
                setLoading(false);
            }
        };

        if (mobile || appId || aadhar) {
            fetchApplications();
            return;
        }

        setLoading(false);
    }, [mobile, appId, aadhar]);

    const getStatusBadge = (status: Application["status"]) => {
        const statusConfig = {
            pending: { label: t("pending_review"), variant: "secondary" as const, icon: Clock, iconColor: "text-yellow-600" },
            approved: { label: t("approved"), variant: "default" as const, icon: CheckCircle, iconColor: "text-green-600" },
            selected: { label: t("selected"), variant: "default" as const, icon: CheckCircle, iconColor: "text-green-600" },
            rejected: { label: t("rejected"), variant: "destructive" as const, icon: XCircle, iconColor: "text-red-600" },
            unverified: { label: "Unverified", variant: "destructive" as const, icon: AlertCircle, iconColor: "text-red-600" },
        };

        const config = statusConfig[status] || { label: status || "Unknown", variant: "destructive" as const, icon: AlertCircle, iconColor: "text-red-600" };
        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className="gap-1.5">
                <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
                {config.label}
            </Badge>
        );
    };

    const StatusTimeline = ({ status }: { status: Application["status"] }) => {
        const steps = [
            { key: "pending", label: "Submitted", icon: FileText },
            { key: "approved", label: "Approved by DPO", icon: CheckCircle },
            { key: "selected", label: "Final Selection", icon: CheckCircle },
        ];

        const statusOrder = ["pending", "approved", "selected"];
        const currentIndex = statusOrder.indexOf(status);

        if (status === "rejected") {
            return (
                <div className="flex items-center gap-3 p-4 border border-destructive/50 rounded-lg bg-destructive/5">
                    <XCircle className="w-6 h-6 text-destructive flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-destructive">Application Rejected</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Your application did not meet the eligibility criteria
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="relative w-full">
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => {
                        const isCompleted = index <= currentIndex;
                        const isCurrent = index === currentIndex;
                        const StepIcon = step.icon;

                        return (
                            <div key={step.key} className="flex flex-col items-center flex-1">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${isCompleted
                                        ? "bg-chart-3 border-chart-3 text-white"
                                        : "bg-background border-muted-foreground/30 text-muted-foreground"
                                        }`}
                                >
                                    <StepIcon className="w-5 h-5" />
                                </div>
                                <p
                                    className={`text-xs sm:text-sm mt-2 text-center ${isCurrent ? "font-semibold" : "text-muted-foreground"
                                        }`}
                                >
                                    {step.label}
                                </p>
                                {index < steps.length - 1 && (
                                    <div
                                        className={`absolute top-5 h-0.5 transition-colors ${index < currentIndex ? "bg-chart-3" : "bg-muted-foreground/30"
                                            }`}
                                        style={{
                                            left: `${(index / (steps.length - 1)) * 100 + 10}%`,
                                            right: `${100 - ((index + 1) / (steps.length - 1)) * 100 + 10}%`,
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const ApplicationCard = ({ app }: { app: Application }) => (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle className="font-display text-xl mb-2">{app.applicantName.replace(/'/g, "&apos")}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Application ID: <span className="font-mono font-semibold">{app.id.replace(/'/g, "&apos")}</span>
                        </CardDescription>
                    </div>
                    {getStatusBadge(app.status)}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-semibold mb-4">Application Progress</h3>
                    <StatusTimeline status={app.status} />
                </div>

                <Separator />

                {app.status === "rejected" && (
                    <>
                        <div className="flex items-start gap-3 p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-sm">Reason for Rejection</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {app.rejectionReason || "No specific reason provided"}
                                </p>
                            </div>
                        </div>
                        <Separator />
                    </>
                )}

                {app.selectedComponents && app.selectedComponents.length > 0 && (
                    <>
                        <div className="p-4 border border-green-200 rounded-lg bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-semibold text-sm text-green-900 dark:text-green-100 mb-2">Selected Components</p>
                                    <div className="space-y-1.5">
                                        {app.selectedComponents.map((comp, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                <span className="text-sm font-medium text-green-800 dark:text-green-200">{comp.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Separator />
                    </>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                            <p className="text-sm text-muted-foreground">Mobile Number</p>
                            <p className="font-medium font-mono">{app.mobile.replace(/'/g, "&apos")}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                            <p className="text-sm text-muted-foreground">Location</p>
                            <p className="font-medium">
                                {app.village.replace(/'/g, "&apos")}, {app.taluka.replace(/'/g, "&apos")}, {app.district.replace(/'/g, "&apos")}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 sm:col-span-2">
                        <Package className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm text-muted-foreground mb-2">Components</p>
                            {app.allComponents && app.allComponents.length > 0 ? (
                                <div className="space-y-2">
                                    {app.allComponents.map((comp, idx) => (
                                        <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50">
                                            <span className="font-medium text-sm">{comp.name}</span>
                                            <Badge
                                                variant={comp.status === "Selected" ? "default" : "secondary"}
                                                className={comp.status === "Selected" ? "bg-green-600" : ""}
                                            >
                                                {comp.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="font-medium">{app.component.replace(/'/g, "&apos")}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                            <p className="text-sm text-muted-foreground">Submitted On</p>
                            <p className="font-medium">{new Date(app.submittedDate.replace(/'/g, "&apos")).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-16rem)] py-12 sm:py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-muted rounded w-1/3"></div>
                        <div className="h-64 bg-muted rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-16rem)] py-12 sm:py-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link href={backHref}>
                    <Button variant="ghost" className="mb-6 gap-2" data-testid="button-back-to-search">
                        <ArrowLeft className="w-4 h-4" />
                        Search Again
                    </Button>
                </Link>

                {applications.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-display font-semibold text-xl mb-2">No Application Found</h3>
                            <p className="text-muted-foreground mb-6">
                                {!mobile && !appId && !aadhar
                                    ? "Please provide a mobile number, application ID, or Aadhaar number to search"
                                    : mobile
                                        ? `No applications found for mobile number ${mobile}`
                                        : appId
                                            ? `No application found with ID ${appId}`
                                            : `No application found for Aadhaar number ${aadhar}`}
                            </p>
                            <Link href={backHref}>
                                <Button data-testid="button-try-again">
                                    {!mobile && !appId ? "Go to Search" : "Try Another Search"}
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}

                {applications.length === 1 && selectedApp && (
                    <div className="space-y-4">
                        <h1 className="font-display font-semibold text-2xl sm:text-3xl">
                            Application Status
                        </h1>
                        <ApplicationCard app={selectedApp} />
                    </div>
                )}

                {applications.length > 1 && !selectedApp && (
                    <div className="space-y-6">
                        <div>
                            <h1 className="font-display font-semibold text-2xl sm:text-3xl mb-2">
                                Multiple Applications Found
                            </h1>
                            <p className="text-muted-foreground">
                                Select an application to view its status
                            </p>
                        </div>

                        <div className="grid gap-4">
                            {applications.map((app, index) => (
                                <Card
                                    key={`${app.id}-${index}`}
                                    className="cursor-pointer hover-elevate active-elevate-2 transition-colors"
                                    onClick={() => setSelectedApp(app)}
                                    data-testid={`card-application-${app.id}`}
                                >
                                    <CardContent className="py-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <p className="font-semibold">{app.applicantName}</p>
                                                    {getStatusBadge(app.status)}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                    <span className="font-mono">{app.id}</span>
                                                    <span>•</span>
                                                    <span>{app.component}</span>
                                                    <span>•</span>
                                                    <span>{new Date(app.submittedDate).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {applications.length > 1 && selectedApp && (
                    <div className="space-y-4">
                        <Button
                            variant="ghost"
                            onClick={() => setSelectedApp(null)}
                            className="gap-2"
                            data-testid="button-back-to-list"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to List
                        </Button>
                        <ApplicationCard app={selectedApp} />
                    </div>
                )}
            </div>
        </div>
    );
}