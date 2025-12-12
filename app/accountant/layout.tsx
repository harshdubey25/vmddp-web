import AdminSidebar from "@/components/AdminSidebar";

export default function AccountantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden">
            <AdminSidebar userRole="accountant" />
            {children}
        </div>
    );
}