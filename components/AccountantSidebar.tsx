"use client"
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  LogOut,
  Receipt,
  FileText,
  FolderOpen,
  ShoppingCart,
  Calculator,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const accountantMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/accountant/dashboard", description: "Overview & workflow" },
  { icon: FileText, label: "DD Collection", path: "/accountant/dd_collection", description: "Collect demand drafts" },
  { icon: ShoppingCart, label: "Purchase Entry", path: "/accountant/purchase_entry", description: "Record purchases" },
  { icon: FolderOpen, label: "Documents", path: "/accountant/document_collection", description: "Upload documents" },
  { icon: Receipt, label: "Claims", path: "/accountant/claim", description: "Manage claims" },
];

export default function AccountantSidebar() {
  const { logout } = useAuth();
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-muted/30">
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Calculator className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-sm">VMDDP</h2>
          <p className="text-xs text-muted-foreground">Accountant Portal</p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {accountantMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3 h-auto py-3"
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-sm">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  </div>
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      <div className="p-3">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3"  
          data-testid="button-logout" 
          onClick={logout}
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}
