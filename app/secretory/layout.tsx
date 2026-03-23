"use client"
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/context/AuthContext";
import { getUserRole } from "@/lib/utils";

export default function SecretoryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useAuth();
    const sidebarRole = getUserRole(user?.roles);

    return (
        <div className="flex min-h-screen">
            <AdminSidebar userRole={sidebarRole} />
            {children}
        </div>
    );
}
