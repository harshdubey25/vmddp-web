"use client"
import { Card, CardContent } from "@/components/ui/card";
import {
    FileText,
    CheckCircle,
    Clock,
    XCircle
} from "lucide-react";
import { useFrappeAuth, useFrappeGetCall } from "frappe-react-sdk";

export default function ReportsStats() {
    const { currentUser } = useFrappeAuth();
    const { data: response, isLoading, error } = useFrappeGetCall('vmddp_app.api.v1.dashboard.subadmin_dashboard_data', undefined, undefined, {
        revalidateOnFocus: false,
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="border-2 border-muted">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-3">
                                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-muted animate-pulse rounded-xl"></div>
                            </div>
                            <div className="h-8 sm:h-10 bg-muted animate-pulse rounded w-16 mb-2"></div>
                            <div className="h-3 sm:h-4 bg-muted animate-pulse rounded w-24"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="border-2 border-muted">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-muted flex items-center justify-center">
                                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                                </div>
                            </div>
                            <p className="text-2xl sm:text-3xl font-bold mb-1">--</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">Unable to fetch</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="relative overflow-hidden border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-blue-600/10 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/10 opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110" />
                <CardContent className="p-4 sm:p-6 relative">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6">
                            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 text-blue-600 drop-shadow-sm">{response?.message?.total_applications?.toString() ?? "0"}</p>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Applications</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 border-green-500/30 bg-gradient-to-br from-green-500/20 to-green-600/10 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/10 opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110" />
                <CardContent className="p-4 sm:p-6 relative">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6">
                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 text-green-600 drop-shadow-sm">{response?.message?.approved_applications?.toString() ?? "0"}</p>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Approved</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 border-orange-500/30 bg-gradient-to-br from-yellow-500/20 to-orange-600/10 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-600/10 opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110" />
                <CardContent className="p-4 sm:p-6 relative">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6">
                            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 text-orange-600 drop-shadow-sm">{response?.message?.pending_applications?.toString() ?? "0"}</p>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Pending</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 border-red-500/30 bg-gradient-to-br from-red-500/20 to-red-600/10 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/10 opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110" />
                <CardContent className="p-4 sm:p-6 relative">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6">
                            <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 text-red-600 drop-shadow-sm">{response?.message?.rejected_applications?.toString() ?? "0"}</p>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Rejected</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}