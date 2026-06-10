"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFrappeCreateDoc, useFrappeGetDocList, useFrappeAuth, useFrappeGetDoc, useFrappeGetCall, useFrappeUpdateDoc } from "frappe-react-sdk";
import { validateAndCompressImages, uploadImagesWithCompression } from "@/lib/image-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Stethoscope, ClipboardList, Save, CalendarIcon, MapPin, Pill, Plus, Trash2, X, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import type { MedicineEntry, TreatmentFormData } from "@/types/subadmin";
import { Badge } from "@/components/ui/badge";

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE_MB = 5;

interface ExistingTreatmentSymptomEntry {
  symtomp: string;
}

interface ExistingTreatmentMedicineEntry {
  date?: string;
  medicine_name?: string;
  dose?: string;
  schedule?: string;
  route_of_administration?: string;
  batch_number?: string;
  expiry_date?: string;
  price?: number;
  unit?: string;
}

interface ExistingTreatmentDoc {
  name: string;
  first_name: string;
  middle_name?: string;
  surname: string;
  aadhar_number?: string;
  district: string;
  taluka: string;
  village: string;
  animal_type: string;
  tag_number: string;
  examination_date?: string;
  veterinarian_name?: string;
  symptom?: ExistingTreatmentSymptomEntry[];
  suggested_treatment?: string;
  treatment_given?: string;
  treatment_date?: string;
  primary_treatment?: string;
  actual_treatment_outcome?: string;
  follow_up_observations?: string;
  medicine?: ExistingTreatmentMedicineEntry[];
  gallery_table?: { image: string }[];
  comment?: string;
}

function getFileUrl(path: string) {
  if (!path) return "";
  return path.startsWith("http") ? path : `${process.env.NEXT_PUBLIC_FRAPPE_BASE_URL}${path}`;
}

export default function TreatmentForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id");
  const { createDoc, loading: isSubmitting } = useFrappeCreateDoc();
  const { updateDoc } = useFrappeUpdateDoc();
  const [compressingImages, setCompressingImages] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { currentUser } = useFrappeAuth();
  const [selectedItem, setSelectedItem] = useState("");

  const { data: dpoData } = useFrappeGetDoc("DPO", currentUser || undefined);
  const assignedDistrict = dpoData?.district;

  const { data: quotaSummary } = useFrappeGetCall<{
    message: {
      treatment: {
        count: number;
        budget_used: number;
        physical_target: number;
        financial_target: number;
      };
    };
  }>("vmddp_app.api.v1.dashboard.get_quota_summary",
    dpoData?.district ? { district: dpoData.district } : undefined,
    dpoData?.district ? undefined : null
  );

  const { data: remainingStockData } = useFrappeGetCall<{ message: number }>(
    "vmddp_app.api.v1.stock.get_remaining_treatment_of_infertile_animal_stock_quantity",
    assignedDistrict ? { district: assignedDistrict, item: selectedItem } : undefined,
    assignedDistrict ? undefined : null
  );

  const [existingGalleryTable, setExistingGalleryTable] = useState<{ image: string }[]>([]);
  const [initialComment, setInitialComment] = useState<string>("");
  const [loadedEditDocId, setLoadedEditDocId] = useState<string | null>(null);

  const { data: editDoc } = useFrappeGetDoc<ExistingTreatmentDoc>(
    "Treatment of Infertile Animal",
    editingId || "",
    editingId ? undefined : null
  );

  const removeExistingGalleryImage = (idx: number) => {
    setExistingGalleryTable((prev) => prev.filter((_, i) => i !== idx));
  };

  const remainingStockQuantity = remainingStockData?.message ?? null;

  const [formData, setFormData] = useState<TreatmentFormData>({
    firstName: "",
    middleName: "",
    surname: "",
    aadharNumber: "",
    district: "",
    taluka: "",
    village: "",
    animalType: "",
    tagNumber: "",
    examinationDate: undefined,
    veterinarianName: "",
    symptoms: [],
    suggestedTreatment: "",
    treatmentGiven: "",
    treatmentDate: undefined,
    primaryTreatment: "",
    actualTreatment: "",
    followUpNotes: "",
    medicines: [],
    galleryImages: [],
  });

  const { data: districtData } = useFrappeGetDocList("District Master", {
    fields: ["name", "name1"],
    filters: assignedDistrict ? [["name", "=", assignedDistrict]] : undefined,
    limit: 1000,
  });

  const { data: talukaData, mutate: mutateTaluka } = useFrappeGetDocList("Taluka Master", {
    fields: ["name", "name1", "district"],
    filters: formData.district ? [["district", "=", formData.district]] : undefined,
    limit: 1000,
  });

  const { data: villageData, mutate: mutateVillage } = useFrappeGetDocList("Village Master", {
    fields: ["name", "name1", "taluka"],
    filters: formData.taluka ? [["taluka", "=", formData.taluka]] : undefined,
    limit: 1000,
  });

  useEffect(() => {
    if (assignedDistrict && !formData.district) {
      setFormData(prev => ({ ...prev, district: assignedDistrict }));
    }
  }, [assignedDistrict, formData.district]);

  useEffect(() => {
    if (!editingId) {
      setLoadedEditDocId(null);
      setExistingGalleryTable([]);
      setInitialComment("");
      return;
    }

    if (!editDoc || loadedEditDocId === editingId) {
      return;
    }

    setLoadedEditDocId(editingId);
    setExistingGalleryTable(editDoc.gallery_table || []);
    setInitialComment(editDoc.comment || "");

    const symptoms = (editDoc.symptom || []).map((s) => s.symtomp).filter(Boolean);
    const medicines: MedicineEntry[] = (editDoc.medicine || []).map((m, idx) => ({
      unit: m.unit || "",
      id: `med-existing-${idx}`,
      date: m.date ? new Date(m.date) : undefined,
      medicineName: m.medicine_name || "",
      dose: m.dose || "",
      schedule: m.schedule || "",
      routeOfAdministration: m.route_of_administration || "",
      batchNumber: m.batch_number || "",
      expiryDate: m.expiry_date ? new Date(m.expiry_date) : undefined,
      price: typeof m.price === "number" ? String(m.price) : "",
    }));

    setFormData({
      firstName: editDoc.first_name || "",
      middleName: editDoc.middle_name || "",
      surname: editDoc.surname || "",
      aadharNumber: editDoc.aadhar_number || "",
      district: editDoc.district || assignedDistrict || "",
      taluka: editDoc.taluka || "",
      village: editDoc.village || "",
      animalType: editDoc.animal_type || "",
      tagNumber: editDoc.tag_number || "",
      examinationDate: editDoc.examination_date ? new Date(editDoc.examination_date) : undefined,
      veterinarianName: editDoc.veterinarian_name || "",
      symptoms,
      suggestedTreatment: editDoc.suggested_treatment || "",
      treatmentGiven: editDoc.treatment_given || "",
      treatmentDate: editDoc.treatment_date ? new Date(editDoc.treatment_date) : undefined,
      primaryTreatment: editDoc.primary_treatment || "",
      actualTreatment: editDoc.actual_treatment_outcome || "",
      followUpNotes: editDoc.follow_up_observations || "",
      medicines,
      galleryImages: [],
    });
  }, [assignedDistrict, editDoc, editingId, loadedEditDocId]);

  const { data: itemData } = useFrappeGetDocList("Item", {
    fields: ["name", "item_name"],
    limit: 1000,
  });

  const { data: symptomsData } = useFrappeGetDocList("Symptoms", {
    fields: ["name", "symptom_name"],
    limit: 1000,
  });

  const { data: medicineData } = useFrappeGetDocList("Stock Item", {
    fields: ["name", "item_name", "unit_of_measure", "rate", "stock_item_group"],
    filters: [["stock_item_group", "=", "Medicine"]],
    limit: 1000,
  });

  const { data: treatmentData } = useFrappeGetDocList("Treatment", {
    fields: ["name", "treatment_name"],
    limit: 1000,
  });

  const handleSymptomToggle = (symptom: string) => {
    setFormData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter((s) => s !== symptom)
        : [...prev.symptoms, symptom],
    }));
  };

  const removeSymptom = (symptom: string) => {
    setFormData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.filter((s) => s !== symptom),
    }));
  };

  const addMedicine = () => {
    const newMedicine: MedicineEntry = {
      unit: "",
      id: `med-${Date.now()}`,
      date: undefined,
      medicineName: "",
      dose: "",
      schedule: "",
      routeOfAdministration: "",
      batchNumber: "",
      expiryDate: undefined,
      price: "",
    };
    setFormData((prev) => ({
      ...prev,
      medicines: [...prev.medicines, newMedicine],
    }));
  };

  const getMedicineRate = (medicineName: string): number => {
    const med = medicineData?.find((m: any) => m.name === medicineName);
    return med?.rate ? parseFloat(med.rate) : 0;
  };

  const updateMedicine = (id: string, field: keyof MedicineEntry, value: any) => {
    setFormData((prev) => ({
      ...prev,
      medicines: prev.medicines.map((m) => {
        if (m.id !== id) return m;
        const updated = { ...m, [field]: value };
        // Auto-set unit and calculate price when dose or medicine changes
        if (field === "medicineName") {
          const selectedMed = medicineData?.find((md: any) => md.name === value);
          updated.unit = selectedMed?.unit_of_measure || "";
        }
        if (field === "dose" || field === "medicineName") {
          const dose = parseFloat(field === "dose" ? value : updated.dose) || 0;
          const rate = getMedicineRate(field === "medicineName" ? value : updated.medicineName);
          updated.price = dose > 0 && rate > 0 ? (dose * rate).toFixed(2) : updated.price;
        }
        return updated;
      }),
    }));
  };

  const removeMedicine = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((m) => m.id !== id),
    }));
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files);
    const existingCount = existingGalleryTable.length;
    const queuedCount = formData.galleryImages.length;
    const totalImages = existingCount + queuedCount + newImages.length;
    const remainingSlots = Math.max(0, MAX_IMAGES - existingCount - queuedCount);

    if (totalImages > MAX_IMAGES) {
      toast({
        title: "Image Limit Exceeded",
        description: `Maximum ${MAX_IMAGES} images allowed. You can add ${remainingSlots} more.`,
        variant: "destructive",
      });
      return;
    }

    setCompressingImages(true);

    try {
      const { validFiles, errors } = await validateAndCompressImages(newImages, {
        maxSizeMB: MAX_IMAGE_SIZE_MB,
        compressionOptions: {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: 'image/jpeg',
        },
      });

      // Show errors if any
      errors.forEach(error => {
        toast({
          title: "Validation Error",
          description: error,
          variant: "destructive",
        });
      });

      if (validFiles.length > 0) {
        setFormData(prev => ({
          ...prev,
          galleryImages: [...prev.galleryImages, ...validFiles],
        }));

        toast({
          title: "Images Compressed",
          description: `${validFiles.length} image(s) compressed and ready for upload.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCompressingImages(false);
      e.target.value = '';
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index),
    }));
  };


  const targetsAchieved = useMemo(() => {
    if (!quotaSummary?.message?.treatment) return { physical: false, financial: false, both: false };

    const { count, budget_used, physical_target, financial_target } = quotaSummary.message.treatment;

    const physicalAchieved = count >= physical_target;
    const financialAchieved = budget_used >= financial_target;

    return {
      physical: physicalAchieved,
      financial: financialAchieved,
      both: physicalAchieved && financialAchieved,
      either: physicalAchieved || financialAchieved,
    };
  }, [quotaSummary]);

  const hasValidTarget = useMemo(() => {
    if (!quotaSummary?.message?.treatment) return false;
    const { physical_target, financial_target } = quotaSummary.message.treatment;
    return physical_target > 0 && financial_target > 0;
  }, [quotaSummary]);

  const targetMetrics = useMemo(() => {
    if (!quotaSummary?.message?.treatment) {
      return {
        physicalTarget: 0,
        physicalAchieved: 0,
        physicalRemaining: 0,
        financialTarget: 0,
        financialUsed: 0,
        financialRemaining: 0,
        currentApplicationCost: 0,
        wouldExceedPhysical: false,
        wouldExceedFinancial: false,
        budgetAfterSubmission: 0,
      };
    }

    const { count, budget_used, physical_target, financial_target } = quotaSummary.message.treatment;
    const physicalRemaining = physical_target - count;
    const financialRemaining = financial_target - budget_used;

    const totalMedicineCost = formData.medicines.reduce((sum, med) => {
      return sum + (parseFloat(med.price) || 0);
    }, 0);

    return {
      physicalTarget: physical_target,
      physicalAchieved: count,
      physicalRemaining,
      financialTarget: financial_target,
      financialUsed: budget_used,
      financialRemaining,
      currentApplicationCost: totalMedicineCost,
      wouldExceedPhysical: count >= physical_target,
      wouldExceedFinancial: (budget_used + totalMedicineCost) > financial_target,
      budgetAfterSubmission: budget_used + totalMedicineCost,
    };
  }, [quotaSummary, formData.medicines]);

  const formatBudget = (amount: number): string => {
    if (amount < 10000000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    }
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  };

  const totalDoseInForm = formData.medicines.reduce((sum, med) => {
    return sum + (parseFloat(med.dose) || 0);
  }, 0);

  const wouldExceedStock = remainingStockQuantity !== null && totalDoseInForm > remainingStockQuantity;

  const handleSubmit = async () => {
    if (isProcessing || isSubmitting || compressingImages) {
      return;
    }

    if (!hasValidTarget) {
      toast({
        title: "No Target Allocated",
        description: "Cannot submit application. No physical or financial target has been allocated for this component.",
        variant: "destructive",
      });
      return;
    }

    if (targetsAchieved.either) {
      const messages = [];
      if (targetsAchieved.physical) messages.push("physical target");
      if (targetsAchieved.financial) messages.push("financial target");

      toast({
        title: "Target Achieved",
        description: `The ${messages.join(" and ")} has been achieved. Cannot submit new applications.`,
        variant: "destructive",
      });
      return;
    }

    if (wouldExceedStock) {
      toast({
        title: "Stock Exceeded",
        description: `The number of books and certificates assigned for this application exceeds the items assigned in the stock for this district. Total dose: ${totalDoseInForm}, Remaining stock: ${remainingStockQuantity}.`,
        variant: "destructive",
      });
      return;
    }

    if (!formData.firstName || !formData.surname) {
      toast({
        title: "Validation Error",
        description: "Please enter owner name.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.district || !formData.taluka || !formData.village) {
      toast({
        title: "Validation Error",
        description: "Please select or enter location details.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.animalType || !formData.tagNumber) {
      toast({
        title: "Validation Error",
        description: "Please enter animal type and tag number.",
        variant: "destructive",
      });
      return;
    }

    if (formData.tagNumber.length !== 12) {
      toast({
        title: "Validation Error",
        description: "Tag number must be exactly 12 alphanumeric characters.",
        variant: "destructive",
      });
      return;
    }
    if (formData.aadharNumber.length !== 12) {
      toast({
        title: "Validation Error",
        description: "Aadhar number must be exactly 12",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const symptomsTable = formData.symptoms.map((symptom) => ({
        symtomp: symptom,
      }));

      const medicinesTable = formData.medicines
        .filter((med) => med.medicineName)
        .map((med) => ({
          date: med.date ? format(med.date, "yyyy-MM-dd") : undefined,
          medicine_name: med.medicineName,
          dose: med.dose || undefined,
          schedule: med.schedule || undefined,
          route_of_administration: med.routeOfAdministration || undefined,
          batch_number: med.batchNumber,
          expiry_date: med.expiryDate ? format(med.expiryDate, "yyyy-MM-dd") : undefined,
          price: med.price ? parseFloat(med.price) : 0,
        }));

      // Upload gallery images
      const galleryTableEntries = formData.galleryImages.length > 0
        ? await uploadImagesWithCompression(formData.galleryImages, {
          isPrivate: false,
          folder: 'Home',
        })
        : [];

      const nextGalleryTable = [...existingGalleryTable, ...galleryTableEntries];

      const docData = {
        first_name: formData.firstName,
        middle_name: formData.middleName || undefined,
        surname: formData.surname,
        aadhar_number: formData.aadharNumber || undefined,
        district: formData.district,
        taluka: formData.taluka,
        village: formData.village,
        animal_type: formData.animalType,
        tag_number: formData.tagNumber,
        examination_date: formData.examinationDate
          ? format(formData.examinationDate, "yyyy-MM-dd")
          : undefined,
        veterinarian_name: formData.veterinarianName || undefined,
        symptom: symptomsTable.length > 0 ? symptomsTable : undefined,
        suggested_treatment: formData.suggestedTreatment || undefined,
        treatment_given: formData.treatmentGiven || undefined,
        treatment_date: formData.treatmentDate
          ? format(formData.treatmentDate, "yyyy-MM-dd")
          : undefined,
        primary_treatment: formData.primaryTreatment || undefined,
        actual_treatment_outcome: formData.actualTreatment || undefined,
        follow_up_observations: formData.followUpNotes || undefined,
        medicine: medicinesTable.length > 0 ? medicinesTable : undefined,
        ...(editingId
          ? { gallery_table: nextGalleryTable }
          : { gallery_table: nextGalleryTable.length > 0 ? nextGalleryTable : undefined }),
      };

      if (editingId) {
        await updateDoc("Treatment of Infertile Animal", editingId, docData);
      } else {
        await createDoc("Treatment of Infertile Animal", {
          doctype: "Treatment of Infertile Animal",
          ...docData,
        });
      }

      toast({
        title: editingId ? "Application Updated" : "Application Submitted",
        description: editingId
          ? "Treatment of Infertile Animal application updated successfully."
          : "Treatment of Infertile Animal application has been registered successfully.",
      });

      router.push("/subadmin/treatment");
    } catch (error: any) {
      console.error("Error submitting treatment form:", error);
      toast({
        title: "Submission Error",
        description: error?.message || "Failed to submit the application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between p-6 border-b bg-primary/5 backdrop-blur-md flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/subadmin/treatment")}
              className="bg-background/50 hover:bg-background border-border/50 backdrop-blur-sm"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3 text-foreground" data-testid="heading-treatment-form">
                <div className="p-2 bg-primary/10 text-primary rounded-lg shadow-sm">
                  <Stethoscope className="w-5 h-5" />
                </div>
                Treatment of Infertile Animal
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {editingId ? "Update the existing application" : "Register new application for infertility treatment"}
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-muted/30">
          <div className="space-y-6 max-w-4xl mx-auto">
            {!hasValidTarget && (
              <Alert variant="destructive" className="border-2">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle className="text-lg font-bold">
                  No Target Allocated
                </AlertTitle>
                <AlertDescription className="text-base">
                  No physical or financial target has been allocated for Treatment of Infertile Animal component in your district. Please contact the administrator to set up targets before submitting applications.
                </AlertDescription>
              </Alert>
            )}
            {hasValidTarget && targetsAchieved.either && (
              <Alert variant="destructive" className="border-2">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle className="text-lg font-bold">
                  {targetsAchieved.both
                    ? "Physical Target and Financial Target Achieved"
                    : targetsAchieved.physical
                      ? "Physical Target Achieved"
                      : "Financial Target Achieved"}
                </AlertTitle>
                <AlertDescription className="text-base">
                  {targetsAchieved.both && (
                    <>The district has achieved both the physical target ({quotaSummary?.message?.treatment?.physical_target} applications) and financial target ({formatBudget(quotaSummary?.message?.treatment?.financial_target || 0)}).</>
                  )}
                  {targetsAchieved.physical && !targetsAchieved.financial && (
                    <>The district has achieved the physical target of {quotaSummary?.message?.treatment?.physical_target} applications.</>
                  )}
                  {targetsAchieved.financial && !targetsAchieved.physical && (
                    <>The district has achieved the financial target of {formatBudget(quotaSummary?.message?.treatment?.financial_target || 0)}.</>
                  )}
                  {" "}
                  No new applications can be submitted at this time.
                </AlertDescription>
              </Alert>
            )}

            {editingId && initialComment.trim() && (
              <Card className="border-2 border-blue-200 bg-blue-50/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Comment</CardTitle>
                  <CardDescription>Please review this comment before updating the application.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-sm text-foreground">{initialComment}</div>
                </CardContent>
              </Card>
            )}

            <fieldset disabled={!hasValidTarget || targetsAchieved.either}>
              {hasValidTarget && (
                <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm shadow-sm transition-all hover:shadow-md">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                  <CardHeader className="pb-3 relative z-10">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold text-primary">
                      <AlertCircle className="w-5 h-5" />
                      Live Target Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Physical Target */}
                      <div className="space-y-2 p-3 bg-background rounded-lg border">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Physical Target</span>
                          {targetMetrics.wouldExceedPhysical && (
                            <Badge variant="destructive" className="text-xs">Limit Reached</Badge>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Target:</span>
                            <span className="font-semibold">{targetMetrics.physicalTarget}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Achieved:</span>
                            <span className="font-semibold">{targetMetrics.physicalAchieved}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Remaining:</span>
                            <span className={cn("font-bold", targetMetrics.physicalRemaining <= 0 ? "text-destructive" : "text-green-600")}>
                              {targetMetrics.physicalRemaining}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Financial Target */}
                      <div className="space-y-2 p-3 bg-background rounded-lg border">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Financial Target</span>
                          {targetMetrics.wouldExceedFinancial && (
                            <Badge variant="destructive" className="text-xs">Would Exceed</Badge>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Target:</span>
                            <span className="font-semibold">{formatBudget(targetMetrics.financialTarget)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Used:</span>
                            <span className="font-semibold">{formatBudget(targetMetrics.financialUsed)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">This Application:</span>
                            <span className={cn("font-semibold", targetMetrics.currentApplicationCost > 0 ? "text-blue-600" : "")}>
                              {formatBudget(targetMetrics.currentApplicationCost)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm pt-1 border-t">
                            <span className="text-muted-foreground">Remaining:</span>
                            <span className={cn("font-bold", targetMetrics.wouldExceedFinancial ? "text-destructive" : "text-green-600")}>
                              {formatBudget(targetMetrics.financialRemaining - targetMetrics.currentApplicationCost)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {targetMetrics.wouldExceedFinancial && targetMetrics.currentApplicationCost > 0 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Warning: This application cost ({formatBudget(targetMetrics.currentApplicationCost)}) would exceed the remaining financial target.
                          After submission, total would be {formatBudget(targetMetrics.budgetAfterSubmission)} / {formatBudget(targetMetrics.financialTarget)}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" />
                    Owner & Animal Details
                  </CardTitle>
                  <CardDescription>
                    Enter owner, location, and animal information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm">Owner Name</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => {
                            const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9\s\-.,()]/g, "");
                            setFormData(prev => ({ ...prev, firstName: sanitizedValue }));
                          }}
                          placeholder="Enter first name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="middleName">Middle Name</Label>
                        <Input
                          id="middleName"
                          value={formData.middleName}
                          onChange={(e) => {
                            const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9\s\-.,()]/g, "");
                            setFormData(prev => ({ ...prev, middleName: sanitizedValue }));
                          }}
                          placeholder="Enter middle name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="surname">Surname *</Label>
                        <Input
                          id="surname"
                          value={formData.surname}
                          onChange={(e) => {
                            const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9\s\-.,()]/g, "");
                            setFormData(prev => ({ ...prev, surname: sanitizedValue }));
                          }}
                          placeholder="Enter surname"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="aadharNumber">Aadhar Number *</Label>
                        <Input
                          id="aadharNumber"
                          value={formData.aadharNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 12);
                            setFormData(prev => ({ ...prev, aadharNumber: value }));
                          }}
                          placeholder="Enter 12-digit Aadhar number"
                          maxLength={12}
                          inputMode="numeric"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4" />
                      Location Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="district">District *</Label>
                        <Select
                          value={formData.district}
                          onValueChange={(value) => {
                            setFormData(prev => ({ ...prev, district: value, taluka: "", village: "" }));
                            mutateTaluka();
                            mutateVillage();
                          }}
                        >
                          <SelectTrigger id="district">
                            <SelectValue placeholder="Select district" />
                          </SelectTrigger>
                          <SelectContent>
                            {districtData?.map((district: any) => (
                              <SelectItem key={district.name} value={district.name}>
                                {district.name1 || district.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="taluka">Taluka *</Label>
                        <Select
                          value={formData.taluka}
                          onValueChange={(value) => {
                            setFormData(prev => ({ ...prev, taluka: value, village: "" }));
                            mutateVillage();
                          }}
                          disabled={!formData.district}
                        >
                          <SelectTrigger id="taluka">
                            <SelectValue placeholder="Select taluka" />
                          </SelectTrigger>
                          <SelectContent>
                            {talukaData?.map((taluka: any) => (
                              <SelectItem key={taluka.name} value={taluka.name}>
                                {taluka.name1 || taluka.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="village">Village *</Label>
                        <Select
                          value={formData.village}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, village: value }))}
                          disabled={!formData.taluka}
                        >
                          <SelectTrigger id="village">
                            <SelectValue placeholder="Select village" />
                          </SelectTrigger>
                          <SelectContent>
                            {villageData?.map((village: any) => (
                              <SelectItem key={village.name} value={village.name}>
                                {village.name1 || village.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm">Animal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="animalType">Animal Type *</Label>
                        <Select value={formData.animalType} onValueChange={(value) => setFormData(prev => ({ ...prev, animalType: value }))}>
                          <SelectTrigger id="animalType">
                            <SelectValue placeholder="Select animal type" />
                          </SelectTrigger>
                          <SelectContent>
                            {itemData?.map((item: any) => (
                              <SelectItem key={item.name} value={item.name}>
                                {item.item_name || item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tagNumber">Tag Number *</Label>
                        <Input
                          id="tagNumber"
                          value={formData.tagNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
                            setFormData(prev => ({ ...prev, tagNumber: value.toLocaleUpperCase() }));
                          }}
                          placeholder="e.g., MH31BF001234"
                          maxLength={12}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm">Examination Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="examinationDate">Examination Date</Label>
                        <Input
                          id="examinationDate"
                          type="date"
                          value={formData.examinationDate ? format(formData.examinationDate, "yyyy-MM-dd") : ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, examinationDate: e.target.value ? new Date(e.target.value) : undefined }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="veterinarianName">Veterinarian Name</Label>
                        <Input
                          id="veterinarianName"
                          value={formData.veterinarianName}
                          onChange={(e) => {
                            const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9\s\-.,()]/g, "");
                            setFormData(prev => ({ ...prev, veterinarianName: sanitizedValue }));
                          }}
                          placeholder="Dr. Name"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm">Diagnosis - Symptoms Found</h3>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          {formData.symptoms.length > 0
                            ? `${formData.symptoms.length} symptom(s) selected`
                            : "Select symptoms"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-4" align="start">
                        <div className="space-y-3">
                          <div className="text-sm font-medium">Select Symptoms</div>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {symptomsData?.map((symptom: any) => (
                              <div key={symptom.name} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`symptom-${symptom.name}`}
                                  checked={formData.symptoms.includes(symptom.name)}
                                  onCheckedChange={() => handleSymptomToggle(symptom.name)}
                                />
                                <label
                                  htmlFor={`symptom-${symptom.name}`}
                                  className="text-sm cursor-pointer font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {symptom.symptom_name || symptom.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    {formData.symptoms.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">Selected:</span>
                        {formData.symptoms.map((s) => (
                          <Badge key={s} variant="secondary" className="gap-1">
                            {s}
                            <X
                              className="w-3 h-3 cursor-pointer"
                              onClick={() => removeSymptom(s)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm">Treatment</h3>
                    <h3 className="font-semibold text-sm">Suggested Treatment</h3>
                    <Select
                      value={formData.suggestedTreatment}
                      onValueChange={(v) => setFormData((prev) => ({ ...prev, suggestedTreatment: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select suggested treatment" />
                      </SelectTrigger>
                      <SelectContent>
                        {treatmentData?.map((t: any) => (
                          <SelectItem key={t.name} value={t.name}>
                            {t.treatment_name || t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm">Treatment Given</h3>
                    <Select
                      value={formData.treatmentGiven}
                      onValueChange={(v) => setFormData((prev) => ({ ...prev, treatmentGiven: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select treatment given" />
                      </SelectTrigger>
                      <SelectContent>
                        {treatmentData?.map((t: any) => (
                          <SelectItem key={t.name} value={t.name}>
                            {t.treatment_name || t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="treatmentDate">Treatment Date</Label>
                      <Input
                        id="treatmentDate"
                        type="date"
                        value={formData.treatmentDate ? format(formData.treatmentDate, "yyyy-MM-dd") : ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, treatmentDate: e.target.value ? new Date(e.target.value) : undefined }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm">Follow-up / Observations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primaryTreatment">Primary Treatment Outcome</Label>
                        <Input
                          id="primaryTreatment"
                          value={formData.primaryTreatment}
                          onChange={(e) => {
                            const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9\s\-.,()]/g, "");
                            setFormData((prev) => ({ ...prev, primaryTreatment: sanitizedValue }));
                          }}
                          placeholder="Enter primary treatment outcome"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="actualTreatment">Actual Treatment Outcome</Label>
                        <Input
                          id="actualTreatment"
                          value={formData.actualTreatment}
                          onChange={(e) => {
                            const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9\s\-.,()]/g, "");
                            setFormData((prev) => ({ ...prev, actualTreatment: sanitizedValue }));
                          }}
                          placeholder="Enter actual treatment outcome"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="followUpNotes">Manual Notes</Label>
                      <Textarea
                        id="followUpNotes"
                        value={formData.followUpNotes}
                        onChange={(e) => {
                          const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9\s\-.,()]/g, "");
                          setFormData(prev => ({ ...prev, followUpNotes: sanitizedValue }));
                        }}
                        placeholder="Enter any additional observations or notes..."
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gallery-images">Gallery Images (Max {MAX_IMAGES})</Label>
                    <Input
                      id="gallery-images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryUpload}
                      data-testid="input-gallery-images"
                    />
                    {editingId && existingGalleryTable.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">
                          Existing Images
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {existingGalleryTable.map((entry, idx) => {
                            const url = getFileUrl(entry.image);
                            return (
                              <div
                                key={`${entry.image}-${idx}`}
                                className="group relative overflow-hidden rounded-md border bg-muted/10"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={url}
                                  alt={`Gallery ${idx + 1}`}
                                  className="h-28 w-full object-cover"
                                />
                                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-background/80 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="truncate text-xs text-primary underline"
                                  >
                                    View
                                  </a>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeExistingGalleryImage(idx)}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {formData.galleryImages.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        {formData.galleryImages.map((img, idx) => (
                          <div key={idx} className="relative border rounded p-2">
                            <p className="text-xs truncate">{img.name}</p>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="mt-1"
                              onClick={() => removeGalleryImage(idx)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Pill className="w-5 h-5" />
                        Medicine Tracking
                      </CardTitle>
                      <CardDescription>
                        Record medicines administered with batch and pricing details
                      </CardDescription>
                    </div>
                    <Button variant="outline" onClick={addMedicine} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Medicine
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {formData.medicines.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      <Pill className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No medicines added yet</p>
                      <p className="text-sm">Click &ldquo;Add Medicine&rdquo; to record administered medicines</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {wouldExceedStock && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            The total medicine dose ({totalDoseInForm}) for this application exceeds the items assigned in the stock for this district. Remaining stock: <strong>{remainingStockQuantity}</strong>.
                          </AlertDescription>
                        </Alert>
                      )}
                      {formData.medicines.map((medicine, index) => (
                        <div
                          key={medicine.id}
                          className="p-4 border rounded-lg space-y-4 bg-muted/30"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">Medicine #{index + 1}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeMedicine(medicine.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`medicine-date-${medicine.id}`}>Date</Label>
                              <Input
                                id={`medicine-date-${medicine.id}`}
                                type="date"
                                value={medicine.date ? format(medicine.date, "yyyy-MM-dd") : ""}
                                onChange={(e) => updateMedicine(medicine.id, "date", e.target.value ? new Date(e.target.value) : undefined)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Medicine Name</Label>
                              <Select
                                value={medicine.medicineName}
                                onValueChange={(value) => {
                                  updateMedicine(medicine.id, "medicineName", value);
                                  setSelectedItem(value);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select medicine" />
                                </SelectTrigger>
                                <SelectContent>
                                  {medicineData?.map((med: any) => (
                                    <SelectItem key={med.name} value={med.name}>
                                      {med.item_name || med.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Dose</Label>
                              <Input
                                type="number"
                                placeholder="e.g., 10, 5"
                                inputMode="decimal"
                                min="0"
                                value={medicine.dose || ""}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  updateMedicine(medicine.id, "dose", value);
                                }}
                                onKeyDown={(e) => {
                                  if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Medicine Unit</Label>
                              <div className="flex items-center h-10 px-3 rounded-md border bg-muted text-sm">
                                {medicine.unit || "—"}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Schedule</Label>
                              <Input
                                placeholder="e.g., Twice daily, Once weekly"
                                value={medicine.schedule || ""}
                                onChange={(e) => {
                                  const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9\s\-.,()]/g, "");
                                  updateMedicine(medicine.id, "schedule", sanitizedValue);
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Route of Administration</Label>
                              <Input
                                placeholder="e.g., Oral, Injection, Topical"
                                value={medicine.routeOfAdministration || ""}
                                onChange={(e) => {
                                  const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9\s\-.,()]/g, "");
                                  updateMedicine(medicine.id, "routeOfAdministration", sanitizedValue);
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Batch Number</Label>
                              <Input
                                placeholder="Enter batch number"
                                value={medicine.batchNumber || ""}
                                onChange={(e) => {
                                  const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9\s\-.,()]/g, "");
                                  updateMedicine(medicine.id, "batchNumber", sanitizedValue);
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`medicine-expiry-${medicine.id}`}>Expiry Date</Label>
                              <Input
                                id={`medicine-expiry-${medicine.id}`}
                                type="date"
                                value={medicine.expiryDate ? format(medicine.expiryDate, "yyyy-MM-dd") : ""}
                                onChange={(e) => updateMedicine(medicine.id, "expiryDate", e.target.value ? new Date(e.target.value) : undefined)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Calculated Price (₹)</Label>
                              <div className="flex items-center h-10 px-3 rounded-md border bg-muted text-sm">
                                {(() => {
                                  const dose = parseFloat(medicine.dose) || 0;
                                  const rate = getMedicineRate(medicine.medicineName);
                                  const calculated = dose * rate;
                                  return calculated > 0
                                    ? `₹${calculated.toFixed(2)} (${dose} × ₹${rate.toFixed(2)})`
                                    : "—";
                                })()}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Price (₹)</Label>
                              <Input
                                type="number"
                                placeholder="Enter price"
                                value={medicine.price || ""}
                                onChange={(e) => updateMedicine(medicine.id, "price", e.target.value)}
                                className={cn(targetMetrics.wouldExceedFinancial && "border-destructive focus-visible:ring-destructive")}
                              />
                              {targetMetrics.wouldExceedFinancial && parseFloat(medicine.price || "0") > 0 && (
                                <p className="text-xs text-destructive">⚠️ Would exceed financial target</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </fieldset>

            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => router.push("/subadmin/treatment")}
                data-testid="button-cancel"
                disabled={isSubmitting || isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="gap-2"
                data-testid="button-submit-bottom"
                disabled={!hasValidTarget || isSubmitting || isProcessing || targetsAchieved.either || targetMetrics.wouldExceedFinancial || wouldExceedStock || compressingImages}
              >
                <Save className="w-4 h-4" />
                {compressingImages ? "Compressing Images..." : (isSubmitting || isProcessing) ? "Submitting..." : !hasValidTarget ? "No Target Allocated" : targetsAchieved.either ? "Target Achieved" : targetMetrics.wouldExceedFinancial ? "Would Exceed Budget" : wouldExceedStock ? "Stock Exceeded" : "Submit Application"}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
