"use client"
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";

import {
  FileText,
  LayoutDashboard,
  LogOut,
  Shield,
  Users,
  Package,
  BarChart3,
  Banknote,
  ChevronRight,
  ChevronLeft,
  TargetIcon,
  GraduationCap,
  Stethoscope,
  FileCheck,
  Building2,
  RefreshCcw,
  Target
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface AdminSidebarProps {
  userRole: "admin" | "subadmin" | "accountant" | "secretory";
}

type MenuItem = {
  icon: any;
  label: string;
  path: string;
  type?: never;
} | {
  type: "separator";
  label?: string;
  icon?: never;
  path?: never;
};

const adminMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
  { icon: FileText, label: "Applications", path: "/admin/applications" },
  { icon: FileText, label: "Selection", path: "/admin/selection" },

  { icon: Users, label: "Sub-Admins", path: "/admin/subadmins" },
  { icon: Package, label: "Components", path: "/admin/components" },
  { icon: TargetIcon, label: "Target Allocation", path: "/admin/target-allocation" },
  { icon: Target, label: "Target and Achievement", path: "/admin/target-achievement" },
  { icon: FileCheck, label: "Parantage Confirmation", path: "/admin/parantage-confirmation" },
  {
    icon: RefreshCcw,
    label: "Refund Approval",
    path: "/admin/refunds",
  },
  { icon: BarChart3, label: "Reports", path: "/admin/reports" },
  { type: "separator", label: "Stock Management" },
  { icon: Package, label: "Total Stock", path: "/admin/stock" },
  { icon: Package, label: "District Stock", path: "/admin/district-stock" },
  { icon: BarChart3, label: "Stock Report", path: "/admin/stock-report" },
  { type: "separator", label: "Target Based Allocation" },
  { icon: GraduationCap, label: "Farmer Training", path: "/admin/farmer-training" },
  { icon: Stethoscope, label: "Treatment of Infertile Animal", path: "/admin/treatment" }
];
// { icon: Settings, label: "Settings", path: "/admin/settings" }
const subAdminMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/subadmin/dashboard" },
  { icon: FileText, label: "Applications", path: "/subadmin/applications" },
  { icon: FileText, label: "Selection", path: "/subadmin/selection" },
  { icon: FileText, label: "Messages", path: "/subadmin/messages" },
  { icon: TargetIcon, label: "Quota Details", path: "/subadmin/quota-details" },
  { icon: FileText, label: "Reports", path: "/subadmin/reports" },
  { type: "separator", label: "Target Based Allocation" },
  { icon: GraduationCap, label: "Farmer Training", path: "/subadmin/farmer-training" },
  { icon: Stethoscope, label: "Treatment of Infertile Animal", path: "/subadmin/treatment" }
]
const accountantMenuItems: MenuItem[] = [
  { icon: Target, label: "Target", path: "/accountant/target-achievement" },
  { icon: FileText, label: "DD Collection", path: "/accountant/dd" },
  { icon: BarChart3, label: "DD Reports", path: "/accountant/dd-report" },
  { icon: Package, label: "Component Allocation", path: "/accountant/component-allocation" },
  {
    icon: Building2,
    label: "Vendor Payments",
    path: "/accountant/vendor-payments",

  },
  {
    icon: Building2,
    label: "Vendor Payments Report",
    path: "/accountant/vendor-payments-report",

  },
  {
    icon: Banknote,
    label: "DBT Claims",
    path: "/accountant/dbt-claims",
  },
  { icon: FileCheck, label: "Parantage Confirmation", path: "/accountant/parantage-confirmation" },
  {
    icon: RefreshCcw,
    label: "Refund Module",
    path: "/accountant/refunds",

  },
  { icon: TargetIcon, label: "Admin Expenses", path: "/accountant/admin-expenses" },
  { type: "separator", label: "Target Based Allocation" },
  { icon: GraduationCap, label: "Farmer Training", path: "/accountant/farmer-training" },
  { icon: Stethoscope, label: "Treatment of Infertile Animal", path: "/accountant/treatment" }
]

const secretoryMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/secretory/dashboard" },
  { icon: TargetIcon, label: "Target and Achievement", path: "/secretory/target-achievement" },
  { icon: FileCheck, label: "DBT Summary", path: "/secretory/dbt-summary" },
  { icon: FileText, label: "All Target Report", path: "/secretory/all-target" },
]
// { icon: LayoutDashboard, label: "Dashboard", path: "/accountant" },
// { icon: BarChart3, label: "Reports", path: "/subadmin/reports" },;
export default function AdminSidebar({ userRole }: AdminSidebarProps) {
  const { logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // const menuItems = userRole === "admin" ? adminMenuItems : subAdminMenuItems;
  let menuItems = [];
  let sidebarTitle = "";
  switch (userRole) {
    case "accountant":
      sidebarTitle = "Accountant";
      menuItems = accountantMenuItems;
      break;
    case "subadmin":
      sidebarTitle = "Sub-Admin";
      menuItems = subAdminMenuItems;
      break;
    case "secretory":
      sidebarTitle = "Secretary";
      menuItems = secretoryMenuItems;
      break;
    case "admin":
    default:
      sidebarTitle = "Administrator";
      menuItems = adminMenuItems;
      break;
  }
  const location = usePathname();
  return (
    <>
      {/* Toggle Arrow Button - Always visible on mobile */}
      <button
        className="md:hidden fixed left-0 top-3 z-50 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-2 rounded-r-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop always visible, Mobile slide-out */}
      <div className={`
        fixed md:relative
        h-screen w-72 sm:w-80 md:w-56 lg:w-64 flex flex-col border-r bg-gradient-to-b from-background via-background to-muted/20 shadow-2xl md:shadow-none
        z-50 transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="flex h-16 md:h-14 lg:h-16 items-center gap-3 md:gap-2 lg:gap-3 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-background px-5 md:px-4 lg:px-6 pt-1 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50" />
          <div className="w-10 h-10 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 shadow-md relative z-10">
            <Shield className="w-5 h-5 md:w-4 md:h-4 lg:w-5 lg:h-5 text-primary-foreground" />
          </div>
          <div className="min-w-0 relative z-10">
            <h2 className="font-display font-bold text-sm md:text-xs lg:text-sm truncate bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">VMDDP</h2>
            <p className="text-xs md:text-[10px] lg:text-xs text-muted-foreground font-medium truncate">
              {sidebarTitle}
            </p>
          </div>
        </div>

        <ScrollArea className="flex-1 px-3 md:px-2 lg:px-3 py-4 md:py-3 lg:py-4">
          <nav className="space-y-1">
            {menuItems.map((item, index) => {
              if (item.type === "separator") {
                return (
                  <div key={`separator-${index}`} className="my-4">
                    <Separator className="bg-gradient-to-r from-transparent via-primary/30 to-transparent h-[2px]" />
                    {item.label && (
                      <p className="text-xs text-muted-foreground mt-3 px-3 font-bold uppercase tracking-wider">
                        {item.label}
                      </p>
                    )}
                  </div>
                );
              }

              const Icon = item.icon;
              const isActive = location === item.path;

              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start gap-3 md:gap-2 lg:gap-3 text-sm md:text-xs lg:text-sm px-3 md:px-2 lg:px-3 h-10 md:h-9 transition-all duration-200 group relative overflow-hidden ${
                      isActive 
                        ? "bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 shadow-sm font-semibold" 
                        : "hover:bg-primary/5 hover:translate-x-1"
                    }`}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/50 rounded-r-full" />
                    )}
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                      isActive 
                        ? "bg-gradient-to-br from-primary to-primary/70 shadow-md" 
                        : "bg-muted/50 group-hover:bg-primary/10 group-hover:scale-110"
                    }`}>
                      <Icon className={`w-4 h-4 md:w-3.5 md:h-3.5 flex-shrink-0 transition-colors ${
                        isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                      }`} />
                    </div>
                    <span className="truncate">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="p-3 md:p-2 lg:p-3 bg-gradient-to-t from-muted/20 to-transparent">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 md:gap-2 lg:gap-3 text-sm md:text-xs lg:text-sm px-3 md:px-2 lg:px-3 h-10 md:h-9 text-destructive hover:text-destructive hover:bg-destructive/10 hover:translate-x-1 transition-all group relative overflow-hidden border border-transparent hover:border-destructive/20"
            data-testid="button-logout"
            onClick={() => {
              setMobileMenuOpen(false);
              logout();
            }}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/10 group-hover:bg-destructive/20 group-hover:scale-110 transition-all">
              <LogOut className="w-4 h-4 md:w-3.5 md:h-3.5 flex-shrink-0" />
            </div>
            <span className="font-medium">Logout</span>
          </Button>
        </div>
      </div>
    </>
  );
}
