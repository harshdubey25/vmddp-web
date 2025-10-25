"use client"
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import {
  FileText,
  LayoutDashboard,
  LogOut,
  Shield
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminSidebarProps {
  userRole: "admin" | "subadmin";
}

const adminMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
  { icon: FileText, label: "Applications", path: "/admin/applications" },

];
// { icon: Users, label: "Sub-Admins", path: "/admin/subadmins" },
// { icon: Package, label: "Components", path: "/admin/components" },
// { icon: BarChart3, label: "Reports", path: "/admin/reports" },
// { icon: Settings, label: "Settings", path: "/admin/settings" },
const subAdminMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/subadmin/dashboard" },
  { icon: FileText, label: "Applications", path: "/subadmin/applications" },
  { icon: FileText, label: "Selection", path: "/subadmin/selection" },
  { icon: FileText, label: "Messages", path: "/subadmin/messages" },
]
// {icon:FileText,label:"Reports",path:"/subadmin/reports" }
// { icon: BarChart3, label: "Reports", path: "/subadmin/reports" },;
export default function AdminSidebar({ userRole }: AdminSidebarProps) {
  const { logout } = useAuth()
  const menuItems = userRole === "admin" ? adminMenuItems : subAdminMenuItems;
  const location = usePathname();
  return (
    <div className="flex h-screen w-64 flex-col border-r bg-muted/30">
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-sm">VMDDP</h2>
          <p className="text-xs text-muted-foreground">
            {userRole === "admin" ? "Administrator" : "Sub-Admin"}
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;

            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3"
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      <div className="p-3">

        <Button variant="ghost" className="w-full justify-start gap-3" data-testid="button-logout" onClick={logout}>
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </Button>

      </div>
    </div>
  );
}
