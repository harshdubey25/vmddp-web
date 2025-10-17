"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFrappeGetDocList } from "frappe-react-sdk";
import AdminSidebar from "@/components/AdminSidebar";
import { MessageSquare } from "lucide-react";

export default function SubAdminMessages() {
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const { data: frappeDistricts, isLoading: districtsLoading } = useFrappeGetDocList("District Master", {
    fields: ["name1"],
    limit: 100,
  });
  const districts = ["all", ...(frappeDistricts ? frappeDistricts.map((d: any) => d.name1) : [])];

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar userRole="subadmin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b px-6 bg-background">
          <div>
            <h1 className="font-display font-semibold text-xl" data-testid="text-messages-title">
              Contact Messages
            </h1>
            <p className="text-sm text-muted-foreground">Manage messages from your district</p>
          </div>
          <div className="flex items-center gap-3">
            <Select onValueChange={setSelectedDistrictId} value={selectedDistrictId}>
              <SelectTrigger className="w-[200px]" data-testid="select-dpo-district">
                <SelectValue placeholder="Select your district" />
              </SelectTrigger>
              <SelectContent>
                {districts.map((district) => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 bg-muted/30">
          <div className="flex items-center justify-center h-full">
            <Card className="max-w-md mx-auto">
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Welcome to DPO Dashboard</h3>
                <p className="text-sm text-muted-foreground">
                  Select your district from the dropdown above to view and manage contact messages
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}






