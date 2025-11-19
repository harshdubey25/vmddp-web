"use client"

import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/context/AuthContext";
import {
    BarChart3,
    MapPin,
} from "lucide-react";
import ReportsStats from "./reportsStats";
import ApplicationByComponent from "./applicationByComponent";
import VillageWiseApplications from "./villageWiseApplications";
import DetailApplicationReport from "./detailApplicationReport";

export default function SubAdminReports() {
    const { user } = useAuth()
    // Mock zone - in real app, this would come from auth context
    const assignedZone = {
        district: user?.dpo.district,
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            <AdminSidebar userRole="subadmin" />
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex flex-col xs:flex-row items-start xs:items-center justify-between pl-12 pr-3 py-3 md:p-6 border-b bg-card gap-2 xs:gap-0">
                    <div>
                        <h1 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
                            Reports & Analytics
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Zone-specific reports
                        </p>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-muted rounded-lg">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                        <div className="text-xs sm:text-sm">
                            <span className="font-medium">{assignedZone.district}</span>
                            {/* <span className="text-muted-foreground"> • {assignedZone.taluka}</span> */}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 bg-muted/30">
                    <div className="space-y-4 sm:space-y-6 max-w-7xl">
                        <ReportsStats />

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            <ApplicationByComponent />

                            <VillageWiseApplications />
                        </div>

                        <DetailApplicationReport />
                    </div>
                </main>
            </div>
        </div>
    );
}
