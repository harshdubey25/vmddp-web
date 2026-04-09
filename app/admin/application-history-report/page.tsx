"use client"
import { useState } from "react"
import { useFrappeGetCall, useFrappeGetDocList } from "frappe-react-sdk"
import {
    Search,
    ArrowLeft,
    FileText,
    ChevronLeft,
    ChevronRight,
    Download,
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useExport } from "@/hooks/use-export"

interface ComponentInfo {
    component: string
    component_status: string
    subsidy_given?: number
    type?: string
}

interface SubsidyInfo {
    component: string
    subsidy_given: number
}

interface SubsidyQuantityInfo {
    component: string
    subsidy_quantity_given: number
}

interface ApplicationHistoryItem {
    app_form: string
    first_name: string
    mid_name: string | null
    last_name: string
    aadhar_number: string
    district: string
    taluka: string
    village: string
    mobile_no: string
    benefited_components: ComponentInfo[]
    pending_components: ComponentInfo[]
    total_subsidy_given: SubsidyInfo[]
    total_subsidy_quantity_given: SubsidyQuantityInfo[]
}

interface ApplicationHistoryResponse {
    message: {
        applications: ApplicationHistoryItem[]
        total: number
        page: number
        page_size: number
        total_pages: number
    }
}

const PAGE_SIZE = 20

export default function ApplicationHistoryReport() {
    const [searchText, setSearchText] = useState("")
    const [appFormFilter, setAppFormFilter] = useState("")
    const [districtFilter, setDistrictFilter] = useState("all")
    const [appliedSearchText, setAppliedSearchText] = useState("")
    const [appliedAppFormFilter, setAppliedAppFormFilter] = useState("")
    const [currentPage, setCurrentPage] = useState(1)

    const { data: districts } = useFrappeGetDocList('District Master')

    const { isExporting, handleExport: exportData } = useExport({
        method: "vmddp_app.api.v1.admin.export_application_history",
        filename: "application-history-report",
    })

    const { data, isLoading } = useFrappeGetCall<ApplicationHistoryResponse>(
        "vmddp_app.api.v1.admin.get_application_history",
        {
            search: appliedSearchText.length === 0 ? null : appliedSearchText,
            app_form: appliedAppFormFilter.length === 0 ? null : appliedAppFormFilter,
            district: districtFilter === 'all' ? null : districtFilter,
            page: currentPage,
            page_size: PAGE_SIZE,
        }
    )

    const applications = data?.message?.applications ?? []
    const totalItems = data?.message?.total ?? 0
    const totalPages = data?.message?.total_pages ?? 1

    const handleSearch = () => {
        setAppliedSearchText(searchText)
        setAppliedAppFormFilter(appFormFilter)
        setCurrentPage(1)
    }

    const handleExport = () => {
        const params: Record<string, string> = {}
        if (appliedSearchText) params.search = appliedSearchText
        if (appliedAppFormFilter) params.app_form = appliedAppFormFilter
        if (districtFilter !== "all") params.district = districtFilter
        exportData({ params, format: "excel" })
    }

    const getFullName = (app: ApplicationHistoryItem) => {
        return [app.first_name, app.mid_name, app.last_name].filter(Boolean).join(" ")
    }

    return (
        <div className="w-full bg-background min-h-screen overflow-y-auto">
            <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/reports">
                            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                            </Button>
                        </Link>
                        <div className="flex flex-col gap-1">
                            <h1 className="text-xl sm:text-2xl font-display font-bold" data-testid="text-page-title">
                                Application History Report
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                View beneficiary application history with component and subsidy details
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="default"
                        size="sm"
                        className="gap-2"
                        disabled={isExporting}
                        onClick={handleExport}
                        data-testid="button-export"
                    >
                        <Download className="h-4 w-4" />
                        {isExporting ? "Exporting..." : "Export Excel"}
                    </Button>
                </div>

                {/* Search & Table */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Application History
                                </CardTitle>
                                <CardDescription>Search by name, Aadhaar, mobile number, or application ID</CardDescription>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search name, Aadhaar, mobile..."
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                        className="pl-9 w-52"
                                        data-testid="input-search"
                                    />
                                </div>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Application ID..."
                                        value={appFormFilter}
                                        onChange={(e) => setAppFormFilter(e.target.value.trim())}
                                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                        className="pl-9 w-44"
                                        data-testid="input-app-form"
                                    />
                                </div>
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={handleSearch}
                                    data-testid="button-search"
                                >
                                    <Search className="h-4 w-4 mr-1" />
                                    Search
                                </Button>
                                <Select value={districtFilter} onValueChange={(v) => { setDistrictFilter(v); setCurrentPage(1) }}>
                                    <SelectTrigger className="w-36" data-testid="select-district">
                                        <SelectValue placeholder="District" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Districts</SelectItem>
                                        {districts?.map((d) => (
                                            <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-12 text-sm text-muted-foreground">Loading application history...</div>
                        ) : applications.length === 0 ? (
                            <div className="text-center py-12 text-sm text-muted-foreground">No applications found</div>
                        ) : (
                            <div className="border rounded-lg overflow-hidden">
                                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)]">
                                    <table className="w-full min-w-[1200px]">
                                        <thead className="bg-muted sticky top-0 z-30">
                                            <tr>
                                                <th className="text-left p-3 text-xs font-medium border whitespace-nowrap">Application ID</th>
                                                <th className="text-left p-3 text-xs font-medium border whitespace-nowrap">Name</th>
                                                <th className="text-left p-3 text-xs font-medium border whitespace-nowrap">District</th>
                                                <th className="text-left p-3 text-xs font-medium border whitespace-nowrap">Benefited Components</th>
                                                <th className="text-left p-3 text-xs font-medium border whitespace-nowrap">Pending Components</th>
                                                <th className="text-left p-3 text-xs font-medium border whitespace-nowrap">Subsidy Given</th>
                                                <th className="text-left p-3 text-xs font-medium border whitespace-nowrap">Subsidy Quantity Given</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {applications.map((app) => (
                                                <tr key={app.app_form} className="border-b hover:bg-muted/30" data-testid={`row-${app.app_form}`}>
                                                    <td className="p-3 text-xs font-mono font-medium border whitespace-nowrap">{app.app_form}</td>
                                                    <td className="p-3 text-xs border whitespace-nowrap">{getFullName(app)}</td>
                                                    <td className="p-3 text-xs border whitespace-nowrap">{app.district}</td>
                                                    <td className="p-3 text-xs border">
                                                        {app.benefited_components.length > 0 ? (
                                                            <div className="flex flex-col gap-1">
                                                                {app.benefited_components.map((c, i) => {
                                                                    const isClickable = c.type === "for_component_allocation" || c.type === "for_dbt_claims";
                                                                    const badge = (
                                                                        <Badge key={i} variant="default" className={`bg-green-600 text-[10px] gap-1 w-fit ${isClickable ? "cursor-pointer hover:bg-green-700" : ""}`}>
                                                                            {c.component}
                                                                            {c.subsidy_given != null && (
                                                                                <span> — ₹{c.subsidy_given.toLocaleString("en-IN")}</span>
                                                                            )}
                                                                        </Badge>
                                                                    )
                                                                    if (c.type === "for_component_allocation") {
                                                                        return (
                                                                            <Link key={i} href={`/accountant/component-allocation/allocated/${encodeURIComponent(`${app.app_form}-${c.component}`)}`}>
                                                                                {badge}
                                                                            </Link>
                                                                        );
                                                                    }
                                                                    if (c.type === "for_dbt_claims") {
                                                                        return (
                                                                            <Link key={i} href={`/admin/dbt-claims-report?search=${encodeURIComponent(app.app_form)}&component=${encodeURIComponent(c.component)}`}>
                                                                                {badge}
                                                                            </Link>
                                                                        );
                                                                    }
                                                                    return badge;
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">—</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-xs border">
                                                        {app.pending_components.length > 0 ? (
                                                            <div className="flex flex-col gap-1">
                                                                {app.pending_components.map((c, i) => (
                                                                    <Badge key={i} variant="secondary" className="text-[10px] gap-1 w-fit">
                                                                        {c.component}{c.component_status !== "Selected" && <span className="text-muted-foreground">({c.component_status})</span>}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">—</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-xs border">
                                                        {app.total_subsidy_given.length > 0 ? (
                                                            <div className="flex flex-col gap-1">
                                                                {app.total_subsidy_given.map((s, i) => (
                                                                    <div key={i} className="flex items-center justify-between gap-2 text-[11px]">
                                                                        <span className="text-muted-foreground">{s.component}</span>
                                                                        <span className="font-medium text-green-700 whitespace-nowrap">₹{s.subsidy_given.toLocaleString("en-IN")}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">—</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-xs border">
                                                        {app.total_subsidy_quantity_given.length > 0 ? (
                                                            <div className="flex flex-col gap-1">
                                                                {app.total_subsidy_quantity_given.map((s, i) => (
                                                                    <div key={i} className="flex items-center justify-between gap-2 text-[11px]">
                                                                        <span className="text-muted-foreground">{s.component}</span>
                                                                        <span className="font-medium text-purple-700 whitespace-nowrap">{s.subsidy_quantity_given.toLocaleString("en-IN")}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalItems > 0 && (
                            <div className="flex items-center justify-between pt-4 mt-4 border-t">
                                <p className="text-sm text-muted-foreground">
                                    Page {currentPage} of {totalPages} &bull; {totalItems} total applications
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        data-testid="button-prev-page"
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage((p) => p + 1)}
                                        disabled={currentPage >= totalPages}
                                        data-testid="button-next-page"
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
