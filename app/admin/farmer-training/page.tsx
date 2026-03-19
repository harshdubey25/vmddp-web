"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFrappeGetDocList } from "frappe-react-sdk";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Download, GraduationCap, Upload, Search, FileText, Loader2 } from "lucide-react";
import { Application } from "@/types/subadmin";
import { cn } from "@/lib/utils";





export default function FarmerTraining() {
  const router = useRouter();
  const { toast } = useToast();


  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const { data: applications, isLoading, error } = useFrappeGetDocList<Application>("Farmer Training Application", {
    fields: [
      "name",
      "event_name",
      "event_date",
      "district",
      "taluka",
      "village",
      "venue_name",
      "venue_type",
      "number_of_participants",
      "no_of_male",
      "no_of_female",
      "training_material",
      "logistics",
      "refreshment",
      "docstatus",
      "creation"
    ],
    orderBy: {
      field: "creation",
      order: "desc"
    },
  });

  const filteredApplications = (applications || []).filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.event_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.docstatus.toString() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRecords = filteredApplications.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedApplications = filteredApplications.slice(startIndex, endIndex);



  const handleViewDetails = (app: Application) => {
    router.push(`/admin/farmer-training/${encodeURIComponent(app.name)}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTotalBudget = (app: Application) => {
    return (app.training_material || 0) + (app.logistics || 0) + (app.refreshment || 0);
  };

  const handleExport = async () => {
    if (!filteredApplications || filteredApplications.length === 0) {
      toast({
        title: "No data",
        description: "There are no applications to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      const XLSX = await import('xlsx');

      // Prepare data for export
      const exportData = filteredApplications.map(app => ({
        'Application ID': app.name,
        'Event Name': app.event_name,
        'Event Date': new Date(app.event_date).toLocaleDateString('en-GB'),
        'District': app.district,
        'Taluka': app.taluka,
        'Village': app.village,
        'Venue Type': app.venue_type,
        'Venue Name': app.venue_name,
        'Participants': app.number_of_participants,
        'Training Material': formatCurrency(app.training_material || 0),
        'Logistics': formatCurrency(app.logistics || 0),
        'Refreshment': formatCurrency(app.refreshment || 0),
        'Total Budget': formatCurrency(getTotalBudget(app)),
        'Status': app.docstatus === 0 ? 'Draft' : app.docstatus === 1 ? 'Submitted' : 'Cancelled',
        'Created On': new Date(app.creation).toLocaleDateString('en-GB'),
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Auto-size columns
      const headers = Object.keys(exportData[0]);
      const colWidths = headers.map(header => {
        const maxLength = Math.max(
          header.length,
          ...exportData.map(row => String(row[header as keyof typeof row] || '').length)
        );
        return { wch: maxLength + 2 }; // Add padding
      });
      worksheet['!cols'] = colWidths;

      // Create workbook and add worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Farmer Training');

      // Generate filename with date
      const date = new Date().toISOString().split('T')[0];
      const filename = `farmer-training-applications-${date}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);

      toast({
        title: "Export successful",
        description: `Exported ${filteredApplications.length} applications.`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export applications. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between p-6 border-b bg-card">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-farmer-training-title">
              <GraduationCap className="w-6 h-6" />
              Farmer Training
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage training applications
            </p>
          </div>
          <Button variant="outline" className="gap-2" onClick={handleExport} data-testid="button-export">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-muted/30">
          <div className="space-y-6 max-w-7xl">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Training Applications</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total {filteredApplications.length} applications found
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by ID or event name..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-10"
                      data-testid="input-search"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger data-testid="select-status-filter">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="0">Draft</SelectItem>
                      <SelectItem value="1">Submitted</SelectItem>
                      <SelectItem value="2">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <p className="text-sm text-muted-foreground">
                  {totalRecords} applications found • Page {currentPage} of {totalPages || 1}
                </p>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : error ? (
                  <div className="text-center py-12 text-destructive">
                    Error loading applications. Please try again.
                  </div>
                ) : filteredApplications && filteredApplications.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No applications found.
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden flex flex-col">
                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                      <table className="w-full min-w-[800px]">
                        <thead className="bg-muted sticky top-0 z-30 border-b">
                          <tr>
                            <th className="text-left p-3 text-xs sm:text-sm font-medium">#</th>
                            <th className="text-left p-3 text-xs sm:text-sm font-medium">Application ID</th>
                            <th className="text-left p-3 text-xs sm:text-sm font-medium">Event Name</th>
                            <th className="text-left p-3 text-xs sm:text-sm font-medium">Date</th>
                            <th className="text-left p-3 text-xs sm:text-sm font-medium">Venue</th>
                            <th className="text-left p-3 text-xs sm:text-sm font-medium">Participants</th>
                            <th className="text-left p-3 text-xs sm:text-sm font-medium">Budget</th>
                            <th className="text-left p-3 text-xs sm:text-sm font-medium">Status</th>
                            <th className="text-left p-3 text-xs sm:text-sm font-medium">Actions</th>

                          </tr>
                        </thead>
                        <tbody>
                          {paginatedApplications.map((app, idx) => (
                            <tr key={app.name} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                              <td className="p-3 text-xs sm:text-sm text-muted-foreground">{startIndex + idx + 1}</td>
                              <td className="p-3 text-xs sm:text-sm font-mono">{app.name}</td>
                              <td className="p-3 text-xs sm:text-sm">{app.event_name}</td>
                              <td className="p-3 text-xs sm:text-sm">{new Date(app.event_date).toLocaleDateString()}</td>
                              <td className="p-3 text-xs sm:text-sm">{app.venue_name}</td>
                              <td className="p-3 text-xs sm:text-sm">{app.number_of_participants}</td>
                              <td className="p-3 text-xs sm:text-sm">{formatCurrency(getTotalBudget(app))}</td>
                              <td className="p-3 text-xs sm:text-sm">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    app.docstatus === 0 && "bg-yellow-50 text-yellow-700 border-yellow-200",
                                    app.docstatus === 1 && "bg-green-50 text-green-700 border-green-200",
                                    app.docstatus === 2 && "bg-red-50 text-red-700 border-red-200"
                                  )}
                                >
                                  {app.docstatus === 0 ? "Draft" : app.docstatus === 1 ? "Submitted" : "Cancelled"}
                                </Badge>
                              </td>
                              <td className="p-3 text-xs sm:text-sm">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(app)}
                                  data-testid="button-view-details"
                                >
                                  <FileText className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
                }

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center mt-4 pt-4 border-t">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>

                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={() => setCurrentPage(pageNum)}
                                isActive={currentPage === pageNum}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
