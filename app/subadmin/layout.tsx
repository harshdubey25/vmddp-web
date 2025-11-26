import AdminSidebar from "@/components/AdminSidebar";

export default function SubAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden">
            <AdminSidebar userRole="subadmin" />
            {children}
        </div>
    );
}
