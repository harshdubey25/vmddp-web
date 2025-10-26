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
                <header className="flex items-center justify-between p-6 border-b bg-card">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <BarChart3 className="w-6 h-6" />
                            Reports & Analytics
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Zone-specific reports and insights
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                        <MapPin className="w-4 h-4 text-primary" />
                        <div className="text-sm">
                            <span className="font-medium">{assignedZone.district}</span>
                            {/* <span className="text-muted-foreground"> • {assignedZone.taluka}</span> */}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-6 bg-muted/30">
                    <div className="space-y-6 max-w-7xl">
                        <ReportsStats />

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
