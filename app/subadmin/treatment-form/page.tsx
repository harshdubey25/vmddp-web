"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Stethoscope, ClipboardList, Save } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface MedicineEntry {
  id: string;
  date: Date | undefined;
  medicineName: string;
  batchNumber: string;
  expiryDate: Date | undefined;
  price: string;
}

interface FormData {
  firstName: string;
  middleName: string;
  surname: string;
  district: string;
  taluka: string;
  village: string;
  animalType: string;
  tagNumber: string;
  examinationDate: Date | undefined;
  veterinarianName: string;
  symptoms: string[];
  customSymptom: string;
  suggestedTreatment: string;
  treatmentGiven: string;
  treatmentDate: Date | undefined;
  primaryTreatment: string;
  actualTreatment: string;
  treatmentDays: string;
  treatmentGap: string;
  followUpNotes: string;
  medicines: MedicineEntry[];
}

const predefinedSymptoms = [
  "Anestrus",
  "Repeat Breeding",
  "Silent Heat",
  "Delayed Puberty",
  "Ovarian Cyst",
  "Uterine Infection",
  "Hormonal Imbalance",
  "Poor Body Condition",
  "Nutritional Deficiency",
];

export default function TreatmentForm() {
  const { toast } = useToast();
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    middleName: "",
    surname: "",
    district: "",
    taluka: "",
    village: "",
    animalType: "",
    tagNumber: "",
    examinationDate: undefined,
    veterinarianName: "",
    symptoms: [],
    customSymptom: "",
    suggestedTreatment: "",
    treatmentGiven: "",
    treatmentDate: undefined,
    primaryTreatment: "",
    actualTreatment: "",
    treatmentDays: "",
    treatmentGap: "",
    followUpNotes: "",
    medicines: [],
  });

  const handleSymptomToggle = (symptom: string) => {
    setFormData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter((s) => s !== symptom)
        : [...prev.symptoms, symptom],
    }));
  };

  const handleSubmit = () => {
    if (!formData.firstName || !formData.surname) {
      toast({
        title: "Validation Error",
        description: "Please enter owner's first name and surname.",
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

    toast({
      title: "Application Submitted",
      description: "Treatment of Infertile Animal application has been registered successfully.",
    });

    router.push("/subadmin/treatment");
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between p-6 border-b bg-card">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/subadmin/treatment")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-treatment-form">
                <Stethoscope className="w-6 h-6" />
                Treatment of Infertile Animal
              </h1>
              <p className="text-sm text-muted-foreground">
                Register new application for infertility treatment
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-muted/30">
          <div className="space-y-6 max-w-4xl mx-auto">
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
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="middleName">Middle Name</Label>
                      <Input
                        id="middleName"
                        value={formData.middleName}
                        onChange={(e) => setFormData(prev => ({ ...prev, middleName: e.target.value }))}
                        placeholder="Enter middle name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="surname">Surname *</Label>
                      <Input
                        id="surname"
                        value={formData.surname}
                        onChange={(e) => setFormData(prev => ({ ...prev, surname: e.target.value }))}
                        placeholder="Enter surname"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Location</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="district">District *</Label>
                      <Input
                        id="district"
                        value={formData.district}
                        onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                        placeholder="Enter district"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taluka">Taluka *</Label>
                      <Input
                        id="taluka"
                        value={formData.taluka}
                        onChange={(e) => setFormData(prev => ({ ...prev, taluka: e.target.value }))}
                        placeholder="Enter taluka"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="village">Village *</Label>
                      <Input
                        id="village"
                        value={formData.village}
                        onChange={(e) => setFormData(prev => ({ ...prev, village: e.target.value }))}
                        placeholder="Enter village"
                      />
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
                          <SelectItem value="Cow">Cow</SelectItem>
                          <SelectItem value="Buffalo">Buffalo</SelectItem>
                          <SelectItem value="Goat">Goat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tagNumber">Tag Number *</Label>
                      <Input
                        id="tagNumber"
                        value={formData.tagNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, tagNumber: e.target.value }))}
                        placeholder="e.g., MH-31-BF-001234"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Examination Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Examination Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.examinationDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.examinationDate ? format(formData.examinationDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.examinationDate}
                            onSelect={(date) => setFormData(prev => ({ ...prev, examinationDate: date }))}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="veterinarianName">Veterinarian Name</Label>
                      <Input
                        id="veterinarianName"
                        value={formData.veterinarianName}
                        onChange={(e) => setFormData(prev => ({ ...prev, veterinarianName: e.target.value }))}
                        placeholder="Dr. Name"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Symptoms</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {predefinedSymptoms.map((symptom) => (
                      <div key={symptom} className="flex items-center space-x-2">
                        <Checkbox
                          id={symptom}
                          checked={formData.symptoms.includes(symptom)}
                          onCheckedChange={() => handleSymptomToggle(symptom)}
                        />
                        <Label htmlFor={symptom} className="text-sm font-normal cursor-pointer">
                          {symptom}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Treatment Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryTreatment">Primary Treatment</Label>
                      <Input
                        id="primaryTreatment"
                        value={formData.primaryTreatment}
                        onChange={(e) => setFormData(prev => ({ ...prev, primaryTreatment: e.target.value }))}
                        placeholder="Treatment name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Treatment Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.treatmentDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.treatmentDate ? format(formData.treatmentDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.treatmentDate}
                            onSelect={(date) => setFormData(prev => ({ ...prev, treatmentDate: date }))}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="followUpNotes">Follow-up Observations</Label>
                    <Textarea
                      id="followUpNotes"
                      value={formData.followUpNotes}
                      onChange={(e) => setFormData(prev => ({ ...prev, followUpNotes: e.target.value }))}
                      placeholder="Enter follow-up notes and observations"
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => router.push("/subadmin/treatment")}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="gap-2" data-testid="button-submit-bottom">
                <Save className="w-4 h-4" />
                Submit Application
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
