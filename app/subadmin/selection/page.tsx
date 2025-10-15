"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import AdminSidebar from "@/components/AdminSidebar";
import {
  Search,
  Download,
  CheckCircle,
  MapPin,
  User,
  Package,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Application {
  id: string;
  applicantName: string;
  fatherName: string;
  mobile: string;
  district: string;
  taluka: string;
  village: string;
  component: string;
  status: "approved" | "selected";
  submittedDate: string;
  animalCount?: number;
}

export default function SubAdminSelection() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [villageFilter, setVillageFilter] = useState("all");

  // Mock zone - in real app, this would come from auth context
  const assignedZone = {
    district: "Nagpur",
    taluka: "Nagpur Rural",
  };

  // Using useState for stateful updates when selecting applications
  const [applications, setApplications] = useState<Application[]>([
    {
      id: "APP-2025-001247",
      applicantName: "Ramesh Kumar Patil",
      fatherName: "Vishwanath Patil",
      mobile: "9876543210",
      district: "Nagpur",
      taluka: "Nagpur Rural",
      village: "Khapa",
      component: "Animal Induction (Calved Cow)",
      status: "approved",
      submittedDate: "2025-01-06",
      animalCount: 2,
    },
    {
      id: "APP-2025-001248",
      applicantName: "Suresh Deshmukh",
      fatherName: "Mohan Deshmukh",
      mobile: "9876543211",
      district: "Nagpur",
      taluka: "Nagpur Rural",
      village: "Khapa",
      component: "HGM Purchase",
      status: "approved",
      submittedDate: "2025-01-07",
      animalCount: 3,
    },
    {
      id: "APP-2025-001249",
      applicantName: "Lakshmi Bai Kale",
      fatherName: "Dattatray Kale",
      mobile: "9876543212",
      district: "Nagpur",
      taluka: "Nagpur Rural",
      village: "Khapa",
      component: "Fertility Feed",
      status: "selected",
      submittedDate: "2025-01-05",
      animalCount: 1,
    },
    {
      id: "APP-2025-001250",
      applicantName: "Ganesh Wankhede",
      fatherName: "Shankar Wankhede",
      mobile: "9876543213",
      district: "Nagpur",
      taluka: "Nagpur Rural",
      village: "Khapa",
      component: "Animal Induction (Calved Cow)",
      status: "approved",
      submittedDate: "2025-01-08",
      animalCount: 2,
    },
    {
      id: "APP-2025-001251",
      applicantName: "Anita Thakre",
      fatherName: "Ramesh Thakre",
      mobile: "9876543214",
      district: "Nagpur",
      taluka: "Nagpur Rural",
      village: "Mouda",
      component: "HGM Purchase",
      status: "approved",
      submittedDate: "2025-01-04",
      animalCount: 3,
    },
    {
      id: "APP-2025-001252",
      applicantName: "Prakash Bhoyar",
      fatherName: "Vitthal Bhoyar",
      mobile: "9876543215",
      district: "Nagpur",
      taluka: "Nagpur Rural",
      village: "Mouda",
      component: "Chaff Cutter",
      status: "approved",
      submittedDate: "2025-01-06",
      animalCount: 1,
    },
    {
      id: "APP-2025-001253",
      applicantName: "Savita Meshram",
      fatherName: "Vishnu Meshram",
      mobile: "9876543216",
      district: "Nagpur",
      taluka: "Nagpur Rural",
      village: "Parseoni",
      component: "Animal Induction (Calved Cow)",
      status: "approved",
      submittedDate: "2025-01-03",
      animalCount: 2,
    },
  ]);

  // Get unique villages
  const villages = Array.from(new Set(applications.map(app => app.village))).sort();

  // Calculate village quotas per component
  const getVillageComponentQuota = (village: string, component: string) => {
    const selectedCount = applications.filter(
      app => app.village === village && app.component === component && app.status === "selected"
    ).length;
    return { selected: selectedCount, total: 5 };
  };

  // Get all unique village-component combinations
  const getVillageComponentCombinations = () => {
    const combinations = new Map<string, { village: string; component: string; count: number }>();
    
    applications.forEach(app => {
      const key = `${app.village}-${app.component}`;
      if (!combinations.has(key)) {
        const quota = getVillageComponentQuota(app.village, app.component);
        combinations.set(key, {
          village: app.village,
          component: app.component,
          count: quota.selected
        });
      }
    });
    
    return Array.from(combinations.values());
  };

  // Group components by village for accordion
  const getVillageGroups = () => {
    const groups = new Map<string, { village: string; components: { component: string; selected: number; total: number }[]; totalSelected: number; totalQuota: number }>();
    
    applications.forEach(app => {
      if (!groups.has(app.village)) {
        groups.set(app.village, {
          village: app.village,
          components: [],
          totalSelected: 0,
          totalQuota: 0
        });
      }
      
      const group = groups.get(app.village)!;
      const existingComponent = group.components.find(c => c.component === app.component);
      
      if (!existingComponent) {
        const quota = getVillageComponentQuota(app.village, app.component);
        group.components.push({
          component: app.component,
          selected: quota.selected,
          total: quota.total
        });
        group.totalSelected += quota.selected;
        group.totalQuota += quota.total;
      }
    });
    
    return Array.from(groups.values()).sort((a, b) => a.village.localeCompare(b.village));
  };

  const filteredApplications = applications
    .filter((app) => {
      const matchesSearch =
        app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.applicantName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesVillage = villageFilter === "all" || app.village === villageFilter;

      return matchesSearch && matchesVillage;
    })
    .sort((a, b) => new Date(a.submittedDate).getTime() - new Date(b.submittedDate).getTime());

  const handleSelect = (appId: string) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    let wasSelected = false;

    setApplications(prev => {
      // Check quota with latest state before mutation
      const currentSelected = prev.filter(
        a => a.village === app.village && a.component === app.component && a.status === "selected"
      ).length;

      if (currentSelected >= 5) {
        toast({
          title: "Quota Reached",
          description: `Selection limit (5) already reached for ${app.village} - ${app.component}`,
          variant: "destructive",
        });
        return prev; // Return unchanged state
      }

      wasSelected = true;
      return prev.map(application =>
        application.id === appId ? { ...application, status: "selected" as const } : application
      );
    });

    if (wasSelected) {
      toast({
        title: "Application Selected",
        description: `${app.applicantName} has been selected as a beneficiary`,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "selected") {
      return <Badge className="bg-chart-1/10 text-chart-1 border-chart-1/20" variant="outline">Selected</Badge>;
    }
    return <Badge className="bg-chart-3/10 text-chart-3 border-chart-3/20" variant="outline">Approved</Badge>;
  };

  const canSelect = (app: Application) => {
    if (app.status === "selected") return false;
    const quota = getVillageComponentQuota(app.village, app.component);
    return quota.selected < quota.total;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar userRole="subadmin" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b px-6 bg-background">
          <div>
            <h1 className="font-display font-semibold text-xl" data-testid="text-selection-title">
              Beneficiary Selection
            </h1>
            <p className="text-sm text-muted-foreground">
              Select up to 5 beneficiaries per village per component
            </p>
          </div>
          <Button variant="outline" className="gap-2" data-testid="button-export">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-muted/30">
          <div className="space-y-6 max-w-7xl">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Approved</CardDescription>
                  <CardTitle className="text-3xl">
                    {applications.filter(app => app.status === "approved").length}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Selected</CardDescription>
                  <CardTitle className="text-3xl">
                    {applications.filter(app => app.status === "selected").length}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Villages Covered</CardDescription>
                  <CardTitle className="text-3xl">{villages.length}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Village-Grouped Quota Accordion */}
            <Card>
              <CardHeader>
                <CardTitle>Selection Quota Status</CardTitle>
                <CardDescription>Selection progress grouped by village (5 per component per village)</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {getVillageGroups().map((villageGroup) => {
                    const villagePercentage = (villageGroup.totalSelected / villageGroup.totalQuota) * 100;
                    const isVillageComplete = villageGroup.components.every(c => c.selected >= c.total);

                    return (
                      <AccordionItem key={villageGroup.village} value={villageGroup.village}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-3">
                              <MapPin className="w-5 h-5 text-primary" />
                              <div className="text-left">
                                <h3 className="font-semibold">{villageGroup.village}</h3>
                                <p className="text-xs text-muted-foreground">
                                  {villageGroup.components.length} component{villageGroup.components.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-sm font-semibold">
                                  {villageGroup.totalSelected} / {villageGroup.totalQuota}
                                </p>
                                <p className="text-xs text-muted-foreground">total selected</p>
                              </div>
                              {isVillageComplete && (
                                <CheckCircle className="w-5 h-5 text-chart-3" />
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                            {villageGroup.components.map((comp) => {
                              const percentage = (comp.selected / comp.total) * 100;
                              const isComplete = comp.selected >= comp.total;

                              return (
                                <div key={comp.component} className="p-3 border rounded-lg space-y-2 bg-muted/30">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium truncate">{comp.component}</p>
                                    </div>
                                    {isComplete && (
                                      <CheckCircle className="w-4 h-4 text-chart-3 flex-shrink-0 ml-2" />
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Selected</span>
                                    <span className="font-semibold">
                                      {comp.selected} / {comp.total}
                                    </span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full transition-all ${
                                        isComplete ? "bg-chart-3" : "bg-chart-1"
                                      }`}
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>

            {/* Applications List */}
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div>
                    <CardTitle>Approved Applications (FIFO Order)</CardTitle>
                    <CardDescription>
                      {filteredApplications.length} applications • Sorted by submission date
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by ID or name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search"
                    />
                  </div>

                  <Select value={villageFilter} onValueChange={setVillageFilter}>
                    <SelectTrigger data-testid="select-village-filter">
                      <SelectValue placeholder="Filter by village" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Villages</SelectItem>
                      {villages.map(village => (
                        <SelectItem key={village} value={village}>{village}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="text-left p-4 font-semibold text-sm">Date</th>
                          <th className="text-left p-4 font-semibold text-sm">Application ID</th>
                          <th className="text-left p-4 font-semibold text-sm">Applicant</th>
                          <th className="text-left p-4 font-semibold text-sm">Village</th>
                          <th className="text-left p-4 font-semibold text-sm">Component</th>
                          <th className="text-left p-4 font-semibold text-sm">Status</th>
                          <th className="text-left p-4 font-semibold text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredApplications.map((app, index) => {
                          const quota = getVillageComponentQuota(app.village, app.component);
                          const isQuotaFull = quota.selected >= quota.total;

                          return (
                            <tr
                              key={app.id}
                              className="border-b hover:bg-muted/30 transition-colors"
                              data-testid={`application-row-${index}`}
                            >
                              <td className="p-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(app.submittedDate).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="font-mono text-sm font-semibold">{app.id}</span>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium text-sm">{app.applicantName}</p>
                                    <p className="text-xs text-muted-foreground">{app.mobile}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm">{app.village}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {quota.selected}/{quota.total} selected for this component
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <Package className="w-4 h-4 text-muted-foreground" />
                                  <p className="text-sm">{app.component}</p>
                                </div>
                              </td>
                              <td className="p-4">
                                {getStatusBadge(app.status)}
                              </td>
                              <td className="p-4">
                                {app.status === "approved" && (
                                  <Button
                                    size="sm"
                                    disabled={!canSelect(app)}
                                    onClick={() => handleSelect(app.id)}
                                    className="gap-2"
                                    data-testid={`button-select-${index}`}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Select
                                  </Button>
                                )}
                                {app.status === "selected" && (
                                  <div className="flex items-center gap-2 text-sm text-chart-3">
                                    <CheckCircle className="w-4 h-4" />
                                    Selected
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
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
