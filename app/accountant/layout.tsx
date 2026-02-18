"use client"
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/context/AuthContext";
import { getUserRole } from "@/lib/utils";

export default function AccountantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useAuth();
    const sidebarRole = getUserRole(user?.roles);

    return (
        <div className="flex h-screen overflow-hidden">
            <AdminSidebar userRole={sidebarRole} />
            {children}
        </div>
    );
}