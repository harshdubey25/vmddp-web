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
}

export default function SubAdminSelectionClient({ applications: initialApplications }: SubAdminSelectionClientProps) {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [villageFilter, setVillageFilter] = useState("all");
    const [applications, setApplications] = useState<ApplicationSelectionItem[]>(initialApplications);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 20;

    // Debug: Log application statuses
    console.log('Applications loaded:', applications.length);
    console.log('Approved count:', applications.filter(a => a.status === 'Approved').length);
    console.log('Selected count:', applications.filter(a => a.status === 'Selected').length);    // Get unique villages
    const villages = Array.from(new Set(applications.map(app => app.village))).sort();

    // Calculate village quotas per component
    const getVillageComponentQuota = (village: string, component: string) => {
        // Get unique people (by original application ID) selected for this village and component
        const selectedApplications = applications.filter(
            app => app.village === village && app.component === component && app.status === "Selected"
        );

        // Count unique people by extracting original application IDs
        const uniqueSelectedPeople = new Set(
            selectedApplications.map(app => app.realApplicationId)
        );

        return { selected: uniqueSelectedPeople.size, total: 5 };
    };

    // Group components by village for accordion
    const getVillageGroups = () => {
        const groups = new Map<string, { village: string; components: { component: string; selected: number; total: number }[]; totalSelected: number; totalQuota: number }>();

        applications.forEach(app => {
            if (!groups.has(app.village)) {
                groups.set(app.village, {
                    village: app.village,
                    components: [],
                    totalSelected: 0,
                    totalQuota: 0
                });
            }

            const group = groups.get(app.village)!;
            const existingComponent = group.components.find(c => c.component === app.component);

            if (!existingComponent) {
                const quota = getVillageComponentQuota(app.village, app.component);
                group.components.push({
                    component: app.component,
                    selected: quota.selected,
                    total: quota.total
                });
                group.totalSelected += quota.selected;
                group.totalQuota += quota.total;
            }
        });

        return Array.from(groups.values()).sort((a, b) => a.village.localeCompare(b.village));
    };

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
                        Select up to 5 per village/component
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
                                    {new Set(
                                        applications
                                            .filter(app => app.status === "Approved")
                                            .map(app => app.realApplicationId)
                                    ).size}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
                                <CardDescription className="text-xs sm:text-sm">Selected</CardDescription>
                                <CardTitle className="text-2xl sm:text-3xl">
                                    {new Set(
                                        applications
                                            .filter(app => app.status === "Selected")
                                            .map(app => app.realApplicationId)
                                    ).size}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        <Card className="sm:col-span-2 md:col-span-1">
                            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
                                <CardDescription className="text-xs sm:text-sm">Total Component Entries</CardDescription>
                                <CardTitle className="text-2xl sm:text-3xl">
                                    {applications.length}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* Village-Grouped Quota Accordion */}
                    <Card>
                        <CardHeader className="p-3 sm:p-4 md:p-6">
                            <CardTitle className="text-base sm:text-lg md:text-xl">Selection Quota Status</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">Selection progress grouped by village (5 per component per village)</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-4 md:p-6">
                            <Accordion type="multiple" className="w-full">
                                {getVillageGroups().map((villageGroup) => {
                                    const isVillageComplete = villageGroup.components.every(c => c.selected >= c.total);

                                    return (
                                        <AccordionItem key={villageGroup.village} value={villageGroup.village}>
                                            <AccordionTrigger className="hover:no-underline py-3">
                                                <div className="flex items-center justify-between w-full pr-2 sm:pr-4">
                                                    <div className="flex items-center gap-2 sm:gap-3">
                                                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                                                        <div className="text-left">
                                                            <h3 className="font-semibold text-sm sm:text-base">{villageGroup.village}</h3>
                                                            <p className="text-xs text-muted-foreground">
                                                                {villageGroup.components.length} component{villageGroup.components.length !== 1 ? 's' : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 sm:gap-3">
                                                        <div className="text-right">
                                                            <p className="text-xs sm:text-sm font-semibold">
                                                                {villageGroup.totalSelected} / {villageGroup.totalQuota}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground hidden xs:block">total selected</p>
                                                        </div>
                                                        {isVillageComplete && (
                                                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-chart-3 flex-shrink-0" />
                                                        )}
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-2">
                                                    {villageGroup.components.map((comp: any) => {
                                                        const percentage = (comp.selected / comp.total) * 100;
                                                        const isComplete = comp.selected >= comp.total;

                                                        return (
                                                            <div key={comp.component} className="p-2 sm:p-3 border rounded-lg space-y-2 bg-muted/30">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-xs sm:text-sm font-medium truncate">{comp.component}</p>
                                                                    </div>
                                                                    {isComplete && (
                                                                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-chart-3 flex-shrink-0 ml-2" />
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center justify-between text-xs sm:text-sm">
                                                                    <span className="text-muted-foreground">Selected</span>
                                                                    <span className="font-semibold">
                                                                        {comp.selected} / {comp.total}
                                                                    </span>
                                                                </div>
                                                                <div className="w-full bg-muted rounded-full h-2">
                                                                    <div
                                                                        className={`h-2 rounded-full transition-all ${isComplete ? "bg-chart-3" : "bg-chart-1"
                                                                            }`}
                                                                        style={{ width: `${percentage}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>
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
                                        {villages.map(village => (
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
                                                const quota = getVillageComponentQuota(app.village, app.component);

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
                                                                <div className="min-w-0">
                                                                    <p className="text-xs sm:text-sm truncate">{app.village}</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {quota.selected}/{quota.total} selected
                                                                    </p>
                                                                </div>
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
