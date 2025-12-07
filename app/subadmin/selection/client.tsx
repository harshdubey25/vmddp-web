"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Search,
    Download,
    CheckCircle,
    MapPin,
    User,
    Package,
    Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { frappeBrowser } from "@/lib/frappe";
import { getStatusBadge } from "@/lib/status-utils";

interface ApplicationSelectionItem {
    id: string;
    realApplicationId: string;
    applicantName: string;
    mobile: string;
    village: string;
    component: string;
    status: "Approved" | "Selected";
    submittedDate: string;
}interface SubAdminSelectionClientProps {
    applications: ApplicationSelectionItem[];
    stats: {
        approved: number;
        selected: number;
        total: number;
    };
}

export default function SubAdminSelectionClient({ applications: initialApplications, stats }: SubAdminSelectionClientProps) {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [villageFilter, setVillageFilter] = useState("all");
    const [applications, setApplications] = useState<ApplicationSelectionItem[]>(initialApplications);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 20;

    // Village data from API (grouped by village)
    interface VillageData {
        village_id: string;
        village_name: string;
        district: string;
        taluka: string;
        components: { component: string; application_count: number }[];
    }

    const [villages, setVillages] = useState<VillageData[]>([]);
    const [countsLoading, setCountsLoading] = useState(false);
    const [villageSearchQuery, setVillageSearchQuery] = useState("");
    const [currentCountsPage, setCurrentCountsPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<"Selected" | "Approved">("Selected");
    const [pagination, setPagination] = useState({
        has_next_page: false,
        has_previous_page: false,
        total_records: null as number | null
    });

    // Get unique villages for application filter dropdown
    const applicationVillages = Array.from(new Set(applications.map(app => app.village))).sort();

    // Fetch village data from backend API
    useEffect(() => {
        const fetchVillages = async () => {
            setCountsLoading(true);
            try {
                const response = await frappeBrowser.call().get('vmddp_app.api.reports.village_selection_status_per_component', {
                    page: currentCountsPage,
                    limit: 5,
                    status: statusFilter,
                    village: villageSearchQuery || undefined
                });

                const data = response?.message || response?.data || response;
                const villagesData = data?.data || [];
                const paginationData = data?.pagination || {};

                setVillages(villagesData);
                setPagination({
                    has_next_page: paginationData.has_next_page || false,
                    has_previous_page: paginationData.has_previous_page || false,
                    total_records: paginationData.total_records || null
                });
            } catch (error) {
                console.error('Error fetching villages:', error);
                setVillages([]);
            } finally {
                setCountsLoading(false);
            }
        };

        fetchVillages();
    }, [currentCountsPage, villageSearchQuery, statusFilter]);

    const allFilteredApplications = applications
        .filter((app) => {
            const matchesSearch =
                app.realApplicationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                app.applicantName.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesVillage = villageFilter === "all" || app.village === villageFilter;

            return matchesSearch && matchesVillage;
        })
        .sort((a, b) => new Date(a.submittedDate).getTime() - new Date(b.submittedDate).getTime());

    const totalItems = allFilteredApplications.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const filteredApplications = allFilteredApplications.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, villageFilter]);

    const handleSelect = async (appId: string) => {
        const app = applications.find(a => a.id === appId);
        if (!app) return;

        const originalAppId = app.realApplicationId;

        // const currentSelected = applications.filter(
        //     a => a.village === app.village && a.component === app.component && a.status === "Selected"
        // ).length;

        // if (currentSelected >= 5) {
        //     toast({
        //         title: "Quota Reached",
        //         description: `Selection limit (5) already reached for ${app.village} - ${app.component}`,
        //         variant: "destructive",
        //     });
        //     return;
        // }

        try {
            // Update the App Form doctype via API using original application ID
            await frappeBrowser.db().updateDoc('App Form', originalAppId, {
                status: 'Selected',
            });

            setApplications(prev =>
                prev.map(application => {
                    const applicantOriginalId = application.realApplicationId;
                    return applicantOriginalId === originalAppId
                        ? { ...application, status: "Selected" as const }
                        : application;
                })
            );

            toast({
                title: "Application Selected",
                description: `${app.applicantName} has been selected (all their components)`,
            });
        } catch (error) {
            console.error('Error updating application status:', error);
            toast({
                title: "Error",
                description: `Failed to select ${app.applicantName}. Please try again.`,
                variant: "destructive",
            });
        }
    };

    const canSelect = (app: ApplicationSelectionItem) => {
        if (app.status === "Selected") return false;

        // Check if this person has already been selected for any component
        const originalAppId = app.realApplicationId;
        const alreadySelected = applications.some(a => {
            const aOriginalId = a.id.includes('-') ? a.id.split('-')[0] : a.id;
            return aOriginalId === originalAppId && a.status === "Selected";
        });

        if (alreadySelected) return false;

        // const quota = getVillageComponentQuota(app.village, app.component);
        // return quota.selected < quota.total;
        return true;
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="flex h-14 sm:h-16 items-center justify-between border-b pl-12 pr-3 py-3 md:px-6 bg-background">
                <div>
                    <h1 className="font-display font-semibold text-base sm:text-lg md:text-xl" data-testid="text-selection-title">
                        Beneficiary Selection
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Manage approved and selected applications
                    </p>
                </div>
                <Button variant="outline" className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-10" data-testid="button-export">
                    <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Export</span>
                </Button>
            </header>

            <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 bg-muted/30">
                <div className="space-y-4 sm:space-y-6 max-w-7xl">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                        <Card>
                            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
                                <CardDescription className="text-xs sm:text-sm">Approved</CardDescription>
                                <CardTitle className="text-2xl sm:text-3xl">
                                    {stats.approved}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
                                <CardDescription className="text-xs sm:text-sm">Selected</CardDescription>
                                <CardTitle className="text-2xl sm:text-3xl">
                                    {stats.selected}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        <Card className="sm:col-span-2 md:col-span-1">
                            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
                                <CardDescription className="text-xs sm:text-sm">Total Applications</CardDescription>
                                <CardTitle className="text-2xl sm:text-3xl">
                                    {stats.total}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* Selection Status by Village and Component */}
                    <Card>
                        <CardHeader className="p-3 sm:p-4 md:p-6">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base sm:text-lg md:text-xl">
                                            {statusFilter === "Selected" ? "Selected" : "Approved"} Applications by Village
                                        </CardTitle>
                                        <CardDescription className="text-xs sm:text-sm">
                                            {countsLoading ? 'Loading...' : pagination.total_records !== null ? `${pagination.total_records} total villages` : `${villages.length} villages found`}
                                        </CardDescription>
                                    </div>
                                    <Select value={statusFilter} onValueChange={(value: any) => {
                                        setStatusFilter(value);
                                        setCurrentCountsPage(1);
                                    }}>
                                        <SelectTrigger className="w-32 h-9 text-xs sm:text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Selected">Selected</SelectItem>
                                            <SelectItem value="Approved">Approved</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="relative max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search village..."
                                        value={villageSearchQuery}
                                        onChange={(e) => {
                                            setVillageSearchQuery(e.target.value);
                                            setCurrentCountsPage(1);
                                        }}
                                        className="pl-10 text-xs sm:text-sm h-9"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-4 md:p-6">
                            {countsLoading ? (
                                <div className="text-center py-8 text-sm text-muted-foreground">Loading villages...</div>
                            ) : villages.length === 0 ? (
                                <div className="text-center py-8 text-sm text-muted-foreground">No villages found</div>
                            ) : (
                                <>
                                    <Accordion type="multiple" className="w-full">
                                        {villages.map((village) => {
                                            const totalCount = village.components.reduce((sum, c) => sum + c.application_count, 0);

                                            return (
                                                <AccordionItem key={village.village_id} value={village.village_id}>
                                                    <AccordionTrigger className="hover:no-underline py-3">
                                                        <div className="flex items-center justify-between w-full pr-4">
                                                            <div className="flex items-center gap-3">
                                                                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                                                                <div className="text-left">
                                                                    <h3 className="font-semibold text-sm sm:text-base">{village.village_name}</h3>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {village.district} • {village.taluka}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-lg sm:text-xl font-semibold text-primary">
                                                                    {totalCount}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">total applications</p>
                                                            </div>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                                                            {village.components.map((comp) => (
                                                                <div key={comp.component} className="p-3 border rounded-lg bg-muted/30">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                                        <p className="text-xs sm:text-sm font-medium truncate">{comp.component}</p>
                                                                    </div>
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-xs text-muted-foreground">Count</span>
                                                                        <span className="text-base font-semibold text-primary">
                                                                            {comp.application_count}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            );
                                        })}
                                    </Accordion>

                                    {/* Pagination for counts */}
                                    {(pagination.has_next_page || pagination.has_previous_page) && (
                                        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentCountsPage(p => Math.max(1, p - 1))}
                                                disabled={!pagination.has_previous_page}
                                            >
                                                Previous
                                            </Button>
                                            <span className="text-sm text-muted-foreground px-3">
                                                Page {currentCountsPage}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentCountsPage(p => p + 1)}
                                                disabled={!pagination.has_next_page}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Applications List */}
                    <Card>
                        <CardHeader className="p-3 sm:p-4 md:p-6">
                            <div className="flex flex-col md:flex-row gap-2 sm:gap-4 items-start md:items-center justify-between">
                                <div>
                                    <CardTitle className="text-base sm:text-lg md:text-xl">Approved Applications (FIFO Order)</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">
                                        {totalItems} applications • Page {currentPage} of {totalPages}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                                <div className="relative">
                                    <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by ID or name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-8 sm:pl-10 text-xs sm:text-sm h-8 sm:h-10"
                                        data-testid="input-search"
                                    />
                                </div>

                                <Select value={villageFilter} onValueChange={setVillageFilter}>
                                    <SelectTrigger data-testid="select-village-filter" className="text-xs sm:text-sm h-8 sm:h-10">
                                        <SelectValue placeholder="Filter by village" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Villages</SelectItem>
                                        {applicationVillages.map(village => (
                                            <SelectItem key={village} value={village}>{village}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[720px]">
                                        <thead className="bg-muted/50 border-b">
                                            <tr>
                                                <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm">Date</th>
                                                <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm">Application ID</th>
                                                <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm">Applicant</th>
                                                <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm">Village</th>
                                                <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm">Component</th>
                                                <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm">Status</th>
                                                <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredApplications.map((app, index) => {
                                                return (
                                                    <tr
                                                        key={app.id}
                                                        className="border-b hover:bg-muted/30 transition-colors"
                                                        data-testid={`application-row-${index}`}
                                                    >
                                                        <td className="p-2 sm:p-3 md:p-4">
                                                            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                                                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                                                <span className="hidden xs:inline">
                                                                    {app.submittedDate === 'Unknown'
                                                                        ? 'Unknown'
                                                                        : new Date(app.submittedDate).toLocaleDateString()
                                                                    }
                                                                </span>
                                                                <span className="xs:hidden">
                                                                    {app.submittedDate === 'Unknown'
                                                                        ? 'N/A'
                                                                        : new Date(app.submittedDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })
                                                                    }
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="p-2 sm:p-3 md:p-4">
                                                            <div className="font-mono text-xs sm:text-sm">
                                                                <span className="font-semibold">
                                                                    {app.realApplicationId}
                                                                </span>
                                                                {/* {app.id.includes('-') && (
                                                                        <p className="text-xs text-muted-foreground mt-1">
                                                                            Component: {app.component}
                                                                        </p>
                                                                    )} */}
                                                            </div>
                                                        </td>
                                                        <td className="p-2 sm:p-3 md:p-4">
                                                            <div className="flex items-center gap-1 sm:gap-2">
                                                                <User className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                                                                <div className="min-w-0">
                                                                    <p className="font-medium text-xs sm:text-sm truncate">{app.applicantName}</p>
                                                                    <p className="text-xs text-muted-foreground">{app.mobile}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-2 sm:p-3 md:p-4">
                                                            <div className="flex items-center gap-1 sm:gap-2">
                                                                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                                                                <p className="text-xs sm:text-sm truncate">{app.village}</p>
                                                            </div>
                                                        </td>
                                                        <td className="p-2 sm:p-3 md:p-4">
                                                            <div className="flex items-center gap-1 sm:gap-2">
                                                                <Package className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                                                                <p className="text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{app.component}</p>
                                                            </div>
                                                        </td>
                                                        <td className="p-2 sm:p-3 md:p-4">
                                                            {getStatusBadge(app.status)}
                                                        </td>
                                                        <td className="p-2 sm:p-3 md:p-4">
                                                            {app.status === "Approved" && (
                                                                <Button
                                                                    size="sm"
                                                                    // disabled={!canSelect(app)}
                                                                    onClick={() => handleSelect(app.id)}
                                                                    className="gap-1 sm:gap-2 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                                                                    data-testid={`button-select-${index}`}
                                                                // title={!canSelect(app) ? "Already selected or quota reached" : "Select this applicant for all their components"}
                                                                >
                                                                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                                                    <span className="hidden xs:inline">Select</span>
                                                                </Button>
                                                            )}
                                                            {app.status === "Selected" && (
                                                                <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-chart-3">
                                                                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                                                    <span className="hidden xs:inline">Selected</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-0 pt-3 sm:pt-4">
                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                        Showing {filteredApplications.length} items on page {currentPage}
                                        {filteredApplications.length < pageSize && currentPage > 1 ? ' (last page)' : ''}
                                    </p>
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (currentPage > 1) {
                                                            setCurrentPage(currentPage - 1);
                                                        }
                                                    }}
                                                    className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                                                />
                                            </PaginationItem>

                                            {/* Page numbers */}
                                            {(() => {
                                                const hasNextPage = filteredApplications.length === pageSize && currentPage < totalPages;
                                                const maxVisiblePages = hasNextPage ? currentPage + 2 : currentPage;
                                                const startPage = Math.max(1, currentPage - 2);
                                                const endPage = Math.min(totalPages, Math.min(maxVisiblePages, startPage + 4));

                                                return Array.from({ length: endPage - startPage + 1 }, (_, i) => {
                                                    const pageNum = startPage + i;
                                                    return (
                                                        <PaginationItem key={pageNum}>
                                                            <PaginationLink
                                                                href="#"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    setCurrentPage(pageNum);
                                                                }}
                                                                isActive={pageNum === currentPage}
                                                            >
                                                                {pageNum}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    );
                                                });
                                            })()}

                                            {filteredApplications.length === pageSize && currentPage < totalPages && currentPage > 3 && (
                                                <>
                                                    <PaginationItem>
                                                        <PaginationEllipsis />
                                                    </PaginationItem>
                                                </>
                                            )}

                                            <PaginationItem>
                                                <PaginationNext
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (currentPage < totalPages) {
                                                            setCurrentPage(currentPage + 1);
                                                        }
                                                    }}
                                                    className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
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
    );
}
