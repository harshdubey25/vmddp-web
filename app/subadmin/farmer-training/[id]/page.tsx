"use client";
export const runtime = 'edge';

import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useFrappeGetDoc, useFrappeAuth } from "frappe-react-sdk";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Dynamic imports for lucide-react icons
const ArrowLeft = dynamic(() => import("lucide-react").then(mod => mod.ArrowLeft), { ssr: false });
const FileText = dynamic(() => import("lucide-react").then(mod => mod.FileText), { ssr: false });
const GraduationCap = dynamic(() => import("lucide-react").then(mod => mod.GraduationCap), { ssr: false });
const MapPin = dynamic(() => import("lucide-react").then(mod => mod.MapPin), { ssr: false });
const Building = dynamic(() => import("lucide-react").then(mod => mod.Building), { ssr: false });
const Users = dynamic(() => import("lucide-react").then(mod => mod.Users), { ssr: false });
const Image = dynamic(() => import("lucide-react").then(mod => mod.Image), { ssr: false });
const IndianRupee = dynamic(() => import("lucide-react").then(mod => mod.IndianRupee), { ssr: false });
const Loader2 = dynamic(() => import("lucide-react").then(mod => mod.Loader2), { ssr: false });
const X = dynamic(() => import("lucide-react").then(mod => mod.X), { ssr: false });

// Dynamic imports for UI components
const Button = dynamic(() => import("@/components/ui/button").then(mod => mod.Button), { ssr: false });
const Card = dynamic(() => import("@/components/ui/card").then(mod => mod.Card), { ssr: false });
const CardContent = dynamic(() => import("@/components/ui/card").then(mod => mod.CardContent), { ssr: false });
const CardHeader = dynamic(() => import("@/components/ui/card").then(mod => mod.CardHeader), { ssr: false });
const CardTitle = dynamic(() => import("@/components/ui/card").then(mod => mod.CardTitle), { ssr: false });
const Badge = dynamic(() => import("@/components/ui/badge").then(mod => mod.Badge), { ssr: false });
const Dialog = dynamic(() => import("@/components/ui/dialog").then(mod => mod.Dialog), { ssr: false });
const DialogContent = dynamic(() => import("@/components/ui/dialog").then(mod => mod.DialogContent), { ssr: false });
const DialogHeader = dynamic(() => import("@/components/ui/dialog").then(mod => mod.DialogHeader), { ssr: false });
const DialogTitle = dynamic(() => import("@/components/ui/dialog").then(mod => mod.DialogTitle), { ssr: false });

interface ImageTableEntry {
  image: string;
}

interface PDFTableEntry {
  pdf_file: string;
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
  number_of_male?: number;
  number_of_female?: number;
  images_table?: PDFTableEntry[];
  gallery_table?: ImageTableEntry[];
  training_material: number;
  logistics: number;
  refreshment: number;
  docstatus: number;
  creation: string;
  inventory_items?: Array<{
    inventory_item: string;
    quantity: number;
    rate: number;
  }>;
}

const EXPENSE_PER_HEAD = 360;

export default function ViewFarmerTrainingApplication() {
  const router = useRouter();
  const params = useParams();
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
    const inventoryTotal = (application.inventory_items || []).reduce((sum, item) => {
      return sum + ((item.quantity || 0) * (item.rate || 0));
    }, 0);
    return (application.training_material || 0) + (application.logistics || 0) + (application.refreshment || 0) + inventoryTotal;
  };

  const getExpectedBudget = () => {
    if (!application) return 0;
    return application.number_of_participants * EXPENSE_PER_HEAD;
  };

  const getRemainingBudget = () => {
    return getExpectedBudget() - getTotalBudget();
  };

  const { currentUser } = useFrappeAuth();


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
                    <p className="text-sm text-muted-foreground">Total Participants</p>
                    <p className="font-medium text-2xl">{application.number_of_participants}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Male Participants</p>
                      <p className="font-medium text-lg">{application.number_of_male || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Female Participants</p>
                      <p className="font-medium text-lg">{application.number_of_female || 0}</p>
                    </div>
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
                  <FileText className="w-4 h-4" />
                  Participant List PDFs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {application.images_table && application.images_table.length > 0 ? (
                  <div className="space-y-2">
                    {application.images_table.map((entry, idx) => {
                      const pdfUrl = entry.pdf_file.startsWith('http') ? entry.pdf_file : `${process.env.NEXT_PUBLIC_FRAPPE_BASE_URL}${entry.pdf_file}`;
                      const fileName = pdfUrl.split('/').pop() || `PDF ${idx + 1}`;
                      return (
                        <a
                          key={idx}
                          href={pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
                        >
                          <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                          <span className="font-medium text-sm truncate">{fileName}</span>
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No PDFs uploaded</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Gallery Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                {application.gallery_table && application.gallery_table.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {application.gallery_table.map((entry, idx) => {
                      const imageUrl = entry.image.startsWith('http') ? entry.image : `${process.env.NEXT_PUBLIC_FRAPPE_BASE_URL}${entry.image}`;
                      return (
                        <div
                          key={idx}
                          className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => setPreviewImage(imageUrl)}
                        >
                          <img
                            src={imageUrl}
                            alt={`Gallery image ${idx + 1}`}
                            className="w-full h-32 object-cover"
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Image className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No images uploaded</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Image Preview</DialogTitle>
                </DialogHeader>
                <div className="relative w-full h-full flex items-center justify-center">
                  {previewImage && (
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="max-w-full max-h-[70vh] object-contain"
                    />
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" />
                  Fund Allocation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Expected Budget</span>
                      <span className="font-semibold">{formatCurrency(getExpectedBudget())}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {application.number_of_participants} participants × ₹{EXPENSE_PER_HEAD} per head
                    </p>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Allocated</span>
                      <span className="text-xl font-bold">{formatCurrency(getTotalBudget())}</span>
                    </div>
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
                  {/* Inventory Items Table */}
                  {Array.isArray(application.inventory_items) && application.inventory_items.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-2">Inventory Items</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border text-sm">
                          <thead>
                            <tr className="bg-muted">
                              <th className="px-3 py-2 border">Item Name</th>
                              <th className="px-3 py-2 border">Quantity</th>
                              <th className="px-3 py-2 border">Rate</th>
                              <th className="px-3 py-2 border">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {application.inventory_items.map((item: any, idx: number) => (
                              <tr key={idx}>
                                <td className="px-3 py-2 border">{item.inventory_item}</td>
                                <td className="px-3 py-2 border text-right">{item.quantity}</td>
                                <td className="px-3 py-2 border text-right">{formatCurrency(item.rate)}</td>
                                <td className="px-3 py-2 border text-right">{formatCurrency((item.quantity || 0) * (item.rate || 0))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Balance Remaining</span>
                      <span className={cn(
                        "font-bold text-lg",
                        getRemainingBudget() < 0 ? "text-destructive" : "text-green-600"
                      )}>
                        {formatCurrency(getRemainingBudget())}
                      </span>
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
