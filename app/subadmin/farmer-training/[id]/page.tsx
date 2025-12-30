"use client";

import { useRouter, useParams } from "next/navigation";
import { useFrappeGetDoc } from "frappe-react-sdk";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, GraduationCap, MapPin, Building, Users, Image, IndianRupee, Loader2 } from "lucide-react";

export const runtime = 'edge';

interface ImageTableEntry {
  image: string;
}

interface Application {
  name: string;
  event_name: string;
  event_date: string;
  district: string;
  taluka: string;
  village: string;
  venue_type: string;
  venue_name: string;
  number_of_participants: number;
  images_table?: ImageTableEntry[];
  training_material: number;
  logistics: number;
  refreshment: number;
  docstatus: number;
  creation: string;
}

const EXPENSE_PER_HEAD = 360;

export default function ViewFarmerTrainingApplication() {
  const router = useRouter();
  const params = useParams();
  
  const applicationId = params?.id ? decodeURIComponent(Array.isArray(params.id) ? params.id[0] : params.id) : null;

  const { data: application, isLoading, error } = useFrappeGetDoc<Application>(
    "Farmer Training Application",
    applicationId || "",
    applicationId ? undefined : null
  );


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTotalBudget = () => {
    if (!application) return 0;
    return (application.training_material || 0) + (application.logistics || 0) + (application.refreshment || 0);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">Application not found</p>
              <Button onClick={() => router.push("/subadmin/farmer-training")}>
                Back to Applications
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between p-6 border-b bg-card">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/subadmin/farmer-training")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-title">
                <FileText className="w-6 h-6" />
                Training Application Details
              </h1>
              <p className="text-sm text-muted-foreground" data-testid="text-app-id">{application.name}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-muted/30">
          <div className="space-y-6 max-w-4xl">
            <Card className="border-0 bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="font-mono font-semibold text-lg">{application.name}</p>
                    <p className="text-sm text-muted-foreground">Submitted on {new Date(application.creation).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Event Name</p>
                    <p className="font-medium">{application.event_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Event Date</p>
                    <p className="font-medium">{new Date(application.event_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">District</p>
                    <p className="font-medium">{application.district}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Taluka</p>
                    <p className="font-medium">{application.taluka}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Village</p>
                    <p className="font-medium">{application.village}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Training Venue
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Venue Type</p>
                    <p className="font-medium">{application.venue_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Venue Name</p>
                    <p className="font-medium">{application.venue_name}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Participants
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Number of Participants</p>
                    <p className="font-medium text-2xl">{application.number_of_participants}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Budget</p>
                    <p className="font-semibold text-lg">{formatCurrency(getTotalBudget())}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Participant List Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                {application.images_table && application.images_table.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {application.images_table.map((entry, idx) => (
                      <div key={idx} className="border rounded-lg overflow-hidden">
                        <img 
                          src={entry.image.startsWith('http') ? entry.image : `${process.env.NEXT_PUBLIC_FRAPPE_BASE_URL}${entry.image}`}
                          alt={`Participant list ${idx + 1}`}
                          className="w-full h-32 object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Image className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No images uploaded</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" />
                  Fund Allocation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Budget</span>
                      <span className="text-xl font-bold">{formatCurrency(getTotalBudget())}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {application.number_of_participants} participants × ₹{EXPENSE_PER_HEAD}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Training Material</p>
                      <p className="font-semibold">{formatCurrency(application.training_material)}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Logistics</p>
                      <p className="font-semibold">{formatCurrency(application.logistics)}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Refreshment</p>
                      <p className="font-semibold">{formatCurrency(application.refreshment)}</p>
                    </div>
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
