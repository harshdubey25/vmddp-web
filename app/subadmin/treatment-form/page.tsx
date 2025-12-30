"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFrappeCreateDoc, useFrappeGetDocList } from "frappe-react-sdk";
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
import type { MedicineEntry, TreatmentFormData } from "@/types/subadmin";
import { MapPin, Pill, Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TreatmentForm() {
  const { toast } = useToast();
  const router = useRouter();
  const { createDoc, loading: isSubmitting } = useFrappeCreateDoc();

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
  });

  const { data: districtData } = useFrappeGetDocList("District Master", {
    fields: ["name", "name1"],
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

  const { data: itemData } = useFrappeGetDocList("Item", {
    fields: ["name", "item_name"],
    limit: 1000,
  });

  const { data: symptomsData } = useFrappeGetDocList("Symptoms", {
    fields: ["name", "symptom_name"],
    limit: 1000,
  });

  const { data: medicineData } = useFrappeGetDocList("Medicine", {
    fields: ["name", "medicine_name"],
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
      id: `med-${Date.now()}`,
      date: undefined,
      medicineName: "",
      batchNumber: "",
      expiryDate: undefined,
      price: "",
    };
    setFormData((prev) => ({
      ...prev,
      medicines: [...prev.medicines, newMedicine],
    }));
  };

  const updateMedicine = (id: string, field: keyof MedicineEntry, value: any) => {
    setFormData((prev) => ({
      ...prev,
      medicines: prev.medicines.map((m) =>
        m.id === id ? { ...m, [field]: value } : m
      ),
    }));
  };

  const removeMedicine = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((m) => m.id !== id),
    }));
  };

  const handleSubmit = async () => {
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

    try {
      const symptomsTable = formData.symptoms.map((symptom) => ({
        symptom: symptom,
      }));

      const medicinesTable = formData.medicines
        .filter((med) => med.medicineName) 
        .map((med) => ({
          date: med.date ? format(med.date, "yyyy-MM-dd") : undefined,
          medicine_name: med.medicineName,
          batch_number: med.batchNumber,
          expiry_date: med.expiryDate ? format(med.expiryDate, "yyyy-MM-dd") : undefined,
          price: med.price ? parseFloat(med.price) : 0,
        }));

      const docData = {
        doctype: "Treatment of Infertile Animal",
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
      };

      await createDoc("Treatment of Infertile Animal", docData);

      toast({
        title: "Application Submitted",
        description: "Treatment of Infertile Animal application has been registered successfully.",
      });

      router.push("/subadmin/treatment");
    } catch (error: any) {
      console.error("Error submitting treatment form:", error);
      toast({
        title: "Submission Error",
        description: error?.message || "Failed to submit the application. Please try again.",
        variant: "destructive",
      });
    }
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
                    <div className="space-y-2">
                      <Label htmlFor="surname">Aadhar Number *</Label>
                      <Input
                        id="aadharNumber"
                        value={formData.aadharNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, aadharNumber: e.target.value }))}
                        placeholder="Enter Aadhar number"
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

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Follow-up / Observations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryTreatment">Primary Treatment Outcome</Label>
                      <Input
                        id="primaryTreatment"
                        value={formData.primaryTreatment}
                        onChange={(e) => setFormData((prev) => ({ ...prev, primaryTreatment: e.target.value }))}
                        placeholder="Enter primary treatment outcome"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="actualTreatment">Actual Treatment Outcome</Label>
                      <Input
                        id="actualTreatment"
                        value={formData.actualTreatment}
                        onChange={(e) => setFormData((prev) => ({ ...prev, actualTreatment: e.target.value }))}
                        placeholder="Enter actual treatment outcome"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="followUpNotes">Manual Notes</Label>
                    <Textarea
                      id="followUpNotes"
                      value={formData.followUpNotes}
                      onChange={(e) => setFormData(prev => ({ ...prev, followUpNotes: e.target.value }))}
                      placeholder="Enter any additional observations or notes..."
                      rows={3}
                    />
                  </div>
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
                            <Label>Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !medicine.date && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {medicine.date ? format(medicine.date, "PP") : "Select date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={medicine.date}
                                  onSelect={(d) => updateMedicine(medicine.id, "date", d)}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="space-y-2">
                            <Label>Medicine Name</Label>
                            <Select
                              value={medicine.medicineName}
                              onValueChange={(value) => updateMedicine(medicine.id, "medicineName", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select medicine" />
                              </SelectTrigger>
                              <SelectContent>
                                {medicineData?.map((med: any) => (
                                  <SelectItem key={med.name} value={med.name}>
                                    {med.medicine_name || med.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Batch Number</Label>
                            <Input
                              placeholder="Enter batch number"
                              value={medicine.batchNumber}
                              onChange={(e) => updateMedicine(medicine.id, "batchNumber", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Expiry Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !medicine.expiryDate && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {medicine.expiryDate ? format(medicine.expiryDate, "PP") : "Select date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={medicine.expiryDate}
                                  onSelect={(d) => updateMedicine(medicine.id, "expiryDate", d)}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="space-y-2">
                            <Label>Price (₹)</Label>
                            <Input
                              type="number"
                              placeholder="Enter price"
                              value={medicine.price}
                              onChange={(e) => updateMedicine(medicine.id, "price", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => router.push("/subadmin/treatment")}
                data-testid="button-cancel"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="gap-2" 
                data-testid="button-submit-bottom"
                disabled={isSubmitting}
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
