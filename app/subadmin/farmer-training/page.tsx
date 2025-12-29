"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, GraduationCap, Upload, Search, FileText } from "lucide-react";

interface FundAllocation {
  trainingMaterial: number;
  logistics: number;
  refreshment: number;
  totalAmount: number;
}

interface Application {
  id: string;
  eventName: string;
  eventDate: string;
  district: string;
  taluka: string;
  village: string;
  trainingVenue: string;
  numberOfParticipants: number;
  participantListImage: string;
  fundAllocation: FundAllocation;
  status: "pending" | "approved" | "selected" | "rejected";
  submittedDate: string;
}

const mockApplications: Application[] = [
  {
    id: "VMDDP-FT-2024-001",
    eventName: "Dairy Management Training",
    eventDate: "2024-12-25",
    district: "Nagpur",
    taluka: "Saoner",
    village: "Saoner",
    trainingVenue: "Krishi Vigyan Kendra",
    numberOfParticipants: 25,
    participantListImage: "/uploads/participants_001.jpg",
    fundAllocation: {
      trainingMaterial: 15000,
      logistics: 8000,
      refreshment: 12000,
      totalAmount: 35000,
    },
    status: "pending",
    submittedDate: "2024-12-16",
  },
  {
    id: "VMDDP-FT-2024-002",
    eventName: "Animal Healthcare Workshop",
    eventDate: "2024-12-22",
    district: "Nagpur",
    taluka: "Parseoni",
    village: "Parseoni",
    trainingVenue: "Gram Panchayat Hall",
    numberOfParticipants: 20,
    participantListImage: "/uploads/participants_002.jpg",
    fundAllocation: {
      trainingMaterial: 10000,
      logistics: 5000,
      refreshment: 8000,
      totalAmount: 23000,
    },
    status: "approved",
    submittedDate: "2024-12-14",
  },
  {
    id: "VMDDP-FT-2024-003",
    eventName: "Fodder Cultivation Training",
    eventDate: "2024-12-20",
    district: "Nagpur",
    taluka: "Ramtek",
    village: "Ramtek",
    trainingVenue: "Agricultural College",
    numberOfParticipants: 30,
    participantListImage: "/uploads/participants_003.jpg",
    fundAllocation: {
      trainingMaterial: 20000,
      logistics: 12000,
      refreshment: 18000,
      totalAmount: 50000,
    },
    status: "selected",
    submittedDate: "2024-12-12",
  },
];

export default function FarmerTraining() {
  const router = useRouter();

  const assignedZone = {
    district: "Nagpur",
    taluka: "Hingna",
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredApplications = mockApplications.filter((app) => {
    const matchesSearch =
      app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.eventName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-chart-4/10 text-chart-4 border-chart-4/20">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-chart-3/10 text-chart-3 border-chart-3/20">Approved</Badge>;
      case "selected":
        return <Badge variant="outline" className="bg-chart-1/10 text-chart-1 border-chart-1/20">Selected</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-chart-5/10 text-chart-5 border-chart-5/20">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewDetails = (app: Application) => {
    router.push(`/subadmin/farmer-training/${encodeURIComponent(app.id)}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between p-6 border-b bg-card">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-farmer-training-title">
              <GraduationCap className="w-6 h-6" />
              Farmer Training
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage training applications for {assignedZone.district} - {assignedZone.taluka}
            </p>
          </div>
          <Button variant="outline" className="gap-2" data-testid="button-export">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-muted/30">
          <div className="space-y-6 max-w-7xl">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Training Applications</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total {filteredApplications.length} applications found
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={() => router.push("/subadmin/farmer-training-form")}
                    data-testid="button-create-application"
                  >
                    <Upload className="w-3 h-3" />
                    Create New Application
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by ID or event name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="selected">Selected</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">Application ID</th>
                          <th className="text-left p-3 text-sm font-medium">Event Name</th>
                          <th className="text-left p-3 text-sm font-medium">Date</th>
                          <th className="text-left p-3 text-sm font-medium">Venue</th>
                          <th className="text-left p-3 text-sm font-medium">Participants</th>
                          <th className="text-left p-3 text-sm font-medium">Budget</th>
                          <th className="text-left p-3 text-sm font-medium">Status</th>
                          <th className="text-left p-3 text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredApplications.map((app) => (
                          <tr key={app.id} className="border-b hover:bg-muted/30">
                            <td className="p-3 text-sm font-mono">{app.id}</td>
                            <td className="p-3 text-sm">{app.eventName}</td>
                            <td className="p-3 text-sm">{app.eventDate}</td>
                            <td className="p-3 text-sm">{app.trainingVenue}</td>
                            <td className="p-3 text-sm">{app.numberOfParticipants}</td>
                            <td className="p-3 text-sm">{formatCurrency(app.fundAllocation.totalAmount)}</td>
                            <td className="p-3 text-sm">{getStatusBadge(app.status)}</td>
                            <td className="p-3 text-sm">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(app)}
                                data-testid="button-view-details"
                              >
                                <FileText className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
