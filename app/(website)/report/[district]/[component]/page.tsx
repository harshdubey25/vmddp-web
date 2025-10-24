"use client";
export const runtime = 'edge';
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from 'next/navigation';
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

interface Application {
  id: string;
  applicantName: string;
  village: string;
  taluka: string;
  status: "pending" | "approved" | "selected" | "rejected";
  submittedDate: string;
  mobile: string;
}

export default function Report({ params }: { params: { district: string; component: string } }) {
  const router = useRouter();
  const district = params.district;
  const component = decodeURIComponent(params.component);
  const [statusFilter, setStatusFilter] = useState("all");
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_FRAPPE_BASE_URL}/api/method/vmddp_app.vmddp.doctype.app_form.app_form.get_applications_list?district=${district}&component=${component}&limit=100&page=1`, {
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
  }, [district, component]);

  const filteredApplications = applications.filter((app) => {
    if (statusFilter === "all") return true;
    return app.status === statusFilter;
  });

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

  const statusCounts = {
    all: applications.length,
    pending: applications.filter(a => a.status === "pending").length,
    approved: applications.filter(a => a.status === "approved").length,
    selected: applications.filter(a => a.status === "selected").length,
    rejected: applications.filter(a => a.status === "rejected").length,
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
              <p className="text-2xl font-bold">{statusCounts.all}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Pending</p>
              <p className="text-2xl font-bold text-chart-4">{statusCounts.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Approved</p>
              <p className="text-2xl font-bold text-chart-3">{statusCounts.approved}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Selected</p>
              <p className="text-2xl font-bold text-chart-1">{statusCounts.selected}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Rejected</p>
              <p className="text-2xl font-bold text-chart-5">{statusCounts.rejected}</p>
            </CardContent>
          </Card>
        </div>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div>
                <CardTitle>Applications List</CardTitle>
                <CardDescription>
                  {loading ? "Loading..." : `${filteredApplications.length} applications found`}
                </CardDescription>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses ({statusCounts.all})</SelectItem>
                  <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
                  <SelectItem value="approved">Approved ({statusCounts.approved})</SelectItem>
                  <SelectItem value="selected">Selected ({statusCounts.selected})</SelectItem>
                  <SelectItem value="rejected">Rejected ({statusCounts.rejected})</SelectItem>
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
                    ) : filteredApplications.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          No applications found
                        </td>
                      </tr>
                    ) : (
                      filteredApplications.map((app, index) => (
                        <tr
                          key={app.id}
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
    </div>
  );
}
