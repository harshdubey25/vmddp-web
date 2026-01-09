"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, MapPin, User, Calendar, FileText } from "lucide-react";
import Link from 'next/link';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { frappePublic } from "@/lib/frappe";
import { useRouter, useSearchParams } from "next/navigation";
interface Application {
    id: string;
    applicantName: string;
    village: string;
    taluka: string;
    status: "pending" | "approved" | "selected" | "rejected";
    submittedDate: string;
    mobile: string;
}

export default function Report({
    district,
    component
}: {
    district: string;
    component: string;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, selected: 0, rejected: 0 });
    const page = parseInt(searchParams.get('page') || '1', 10);
    const status = searchParams.get('status') || 'All';
    useEffect(() => {
        const fetchApplications = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_FRAPPE_BASE_URL}/api/method/vmddp_app.vmddp.doctype.app_form.app_form.get_applications_list?district=${district}&component=${component}&limit=10&page=${page}&status=${status}`, {
                    withCredentials: true
                });
                console.log('API response:', res.data);
                const apiApps = Array.isArray(res.data.message?.message) ? res.data.message.message : [];
                const mappedApps = apiApps.map((app: any) => ({
                    id: app.application_id,
                    applicantName: [app.first_name, app.mid_name, app.last_name].filter(Boolean).join(" "),
                    village: app.village,
                    taluka: app.taluka,
                    status: (app.status || "pending").toLowerCase(),
                    submittedDate: app.submitted_date,
                    mobile: app.mobile_no,
                }));
                setApplications(mappedApps);
            } catch (err) {
                setError("Failed to fetch applications");
                setApplications([]);
            } finally {
                setLoading(false);
            }
        };
        fetchApplications();
    }, [district, component, page, status]);
    useEffect(() => {

        const fetchApplicationCount = async () => {
            const response = await frappePublic.call().get(`vmddp_app.vmddp.doctype.app_form.app_form.get_applications_by_district_component?district=${district}&component=${component}`)

            setCounts({
                approved: response?.message?.approved ?? 0,
                rejected: response?.message?.rejected ?? 0,
                pending: response?.message?.pending ?? 0,
                all: response?.message?.total ?? 0,
                selected: response?.message?.selected ?? 0
            });
        }
        fetchApplicationCount();
    }, [applications]);


    const getStatusBadge = (status: string) => {
        const variants: Record<string, { className: string; label: string }> = {
            pending: { className: "bg-chart-4/10 text-chart-4 border-chart-4/20", label: "Pending" },
            approved: { className: "bg-chart-3/10 text-chart-3 border-chart-3/20", label: "Approved" },
            selected: { className: "bg-chart-1/10 text-chart-1 border-chart-1/20", label: "Selected" },
            rejected: { className: "bg-chart-5/10 text-chart-5 border-chart-5/20", label: "Rejected" },
        };

        return (
            <Badge variant="outline" className={variants[status]?.className}>
                {variants[status]?.label}
            </Badge>
        );
    };

    const updatePage = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', newPage.toString());
        router.push(`?${params.toString()}`);
    };

    const handleNextPage = () => {
        updatePage(page + 1);
    }

    const handlePreviousPage = () => {
        if (page > 1) {
            updatePage(page - 1);
        }
    }

    const handleStatusChange = (newStatus: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('status', newStatus);
        params.set('page', '1'); // Reset to first page when status changes
        router.push(`?${params.toString()}`);

    };

    return (
        <div className="min-h-screen py-12 sm:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <Link href="/beneficiaries">
                        <Button variant="ghost" className="gap-2 mb-4" data-testid="button-back">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Beneficiaries
                        </Button>
                    </Link>
                    <div className="flex items-start gap-3">
                        <MapPin className="w-6 h-6 text-primary mt-1" />
                        <div>
                            <h1 className="font-display font-semibold text-2xl sm:text-3xl" data-testid="text-report-title">
                                {district} - {component}
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Detailed application report for this district and component
                            </p>
                        </div>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground mb-1">Total</p>
                            <p className="text-2xl font-bold">{counts.all}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground mb-1">Pending</p>
                            <p className="text-2xl font-bold text-chart-4">{counts.pending}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground mb-1">Approved</p>
                            <p className="text-2xl font-bold text-chart-3">{counts.approved}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground mb-1">Selected</p>
                            <p className="text-2xl font-bold text-chart-1">{counts.selected}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground mb-1">Rejected</p>
                            <p className="text-2xl font-bold text-chart-5">{counts.rejected}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Applications Table */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                            <div>
                                <CardTitle>Applications List</CardTitle>
                            </div>
                            <Select value={status} onValueChange={handleStatusChange}>
                                <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Statuses ({counts.all})</SelectItem>
                                    <SelectItem value="pending">Pending ({counts.pending})</SelectItem>
                                    <SelectItem value="approved">Approved ({counts.approved})</SelectItem>
                                    <SelectItem value="selected">Selected ({counts.selected})</SelectItem>
                                    <SelectItem value="rejected">Rejected ({counts.rejected})</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted/50 border-b">
                                        <tr>
                                            <th className="text-left p-4 font-semibold text-sm">Application ID</th>
                                            <th className="text-left p-4 font-semibold text-sm">Applicant Name</th>
                                            <th className="text-left p-4 font-semibold text-sm">Village</th>
                                            <th className="text-left p-4 font-semibold text-sm">Taluka</th>
                                            <th className="text-left p-4 font-semibold text-sm">Status</th>
                                            <th className="text-left p-4 font-semibold text-sm">Submitted Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                                    Loading applications...
                                                </td>
                                            </tr>
                                        ) : error ? (
                                            <tr>
                                                <td colSpan={6} className="p-8 text-center text-destructive">
                                                    {error}
                                                </td>
                                            </tr>
                                        ) : applications.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                                    No applications found
                                                </td>
                                            </tr>
                                        ) : (
                                            applications.map((app, index) => (
                                                <tr
                                                    key={`${app.id}-${index}`}
                                                    className="border-b hover:bg-muted/30 transition-colors"
                                                    data-testid={`application-row-${index}`}
                                                >
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="w-4 h-4 text-muted-foreground" />
                                                            <span className="font-mono text-sm font-semibold">{app.id}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <User className="w-4 h-4 text-muted-foreground" />
                                                            <div>
                                                                <p className="font-medium text-sm">{app.applicantName}</p>
                                                                <p className="text-xs text-muted-foreground">{app.mobile}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="text-sm">{app.village}</span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="text-sm">{app.taluka}</span>
                                                    </td>
                                                    <td className="p-4">{getStatusBadge(app.status)}</td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(app.submittedDate).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Pagination className="justify-center my-8">
                <PaginationContent>
                    <PaginationItem>
                        <Button
                            variant="outline"
                            onClick={handlePreviousPage}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                    </PaginationItem>
                    <PaginationItem>
                        <span className="px-4 py-2">Page {page}</span>
                    </PaginationItem>
                    <PaginationItem>
                        <Button
                            variant="outline"
                            onClick={handleNextPage}
                            disabled={applications.length < 10}
                        >
                            Next
                        </Button>
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    );
}
