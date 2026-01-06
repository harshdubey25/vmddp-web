"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFrappeCreateDoc, useFrappeGetDocList, useFrappePostCall, useFrappeAuth, useFrappeGetDoc } from "frappe-react-sdk";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, GraduationCap, FileText, MapPin, Building, IndianRupee, Save, X, Target, Upload, CalendarIcon, AlertTriangle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FarmerTrainingFormData, TRAINING_VENUE_OPTIONS, EXPENSE_PER_HEAD, MAX_TRAINING_IMAGES } from "@/types/subadmin";

const MAX_IMAGES = MAX_TRAINING_IMAGES;
const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

const validateImageSize = (file: File, toast: any): boolean => {
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    toast({
      title: "File Size Exceeded",
      description: `Image "${file.name}" is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum size is ${MAX_IMAGE_SIZE_MB}MB.`,
      variant: "destructive",
    });
    return false;
  }
  return true;
};

export default function FarmerTrainingForm() {
  const { toast } = useToast();
  const router = useRouter();
  const { createDoc, loading: isSubmitting } = useFrappeCreateDoc();
  const [uploadingImages, setUploadingImages] = useState(false);
  const { currentUser } = useFrappeAuth();

  const { data: dpoData } = useFrappeGetDoc("DPO", currentUser || undefined);
  const assignedDistrict = dpoData?.district;

  const { data: trainingTarget } = useFrappeGetDocList(
    "Target Allocation",
    {
      fields: ["name", "district", "component", "physical_target", "financial_target"],
      filters: [["component", "=", "Farmer Training"]],
      limit: 1,
    }
  );

  const { data: submittedApplications } = useFrappeGetDocList(
    "Farmer Training Application",
    {
      fields: ["name", "number_of_participants"],
      filters: [["docstatus", "=", 1]],
      limit: 1000,
    }
  );

  const physicalTarget = trainingTarget?.[0]?.physical_target || 500;
  const achievedCount = submittedApplications?.reduce((sum, app: any) => sum + (app.number_of_participants || 0), 0) || 0;

  const targetData = {
    physical: physicalTarget,
    achieved: achievedCount,
  };

  const [formData, setFormData] = useState<FarmerTrainingFormData>({
    eventName: "",
    eventDate: undefined,
    district: "",
    taluka: "",
    village: "",
    venueType: "",
    venueName: "",
    numberOfParticipants: "",
    participantListImages: [],
    galleryImages: [],
    trainingMaterial: "",
    logistics: "",
    refreshment: "",
    totalAmount: "0",
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

  const remainingTarget = targetData.physical - targetData.achieved;
  const targetProgress = (targetData.achieved / targetData.physical) * 100;
  const currentParticipants = parseInt(formData.numberOfParticipants) || 0;
  const wouldExceedTarget = currentParticipants > remainingTarget;
  
  const expectedBudget = currentParticipants * EXPENSE_PER_HEAD;
  const allocatedBudget = (
    parseFloat(formData.trainingMaterial) || 0
  ) + (
    parseFloat(formData.logistics) || 0
  ) + (
    parseFloat(formData.refreshment) || 0
  );
  const remainingBudget = expectedBudget - allocatedBudget;
  const exceedsTotal = allocatedBudget > expectedBudget;

  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const { call: validateBudget } = useFrappePostCall('vmddp_app.vmddp.doctype.farmer_training_application.farmer_training_application.calculate_budget');

  useEffect(() => {
    const checkBackendValidation = async () => {
      if (!currentParticipants) {
        setValidationMessage(null);
        return;
      }

      try {
        const result = await validateBudget({
          number_of_participants: formData.numberOfParticipants || '0',
          training_material: formData.trainingMaterial || '0',
          logistics: formData.logistics || '0',
          refreshment: formData.refreshment || '0'
        });
        
        if (result?.success) {
          if (Math.abs(result.expected_budget - expectedBudget) > 0.01 || 
              Math.abs(result.allocated_budget - allocatedBudget) > 0.01) {
            setValidationMessage('⚠️ Calculation mismatch detected with backend');
          } else {
            setValidationMessage(null);
          }
        }
      } catch (error) {
        console.error('Validation error:', error);
        setValidationMessage(null);
      }
    };
    
    checkBackendValidation();
  }, [formData.numberOfParticipants, formData.trainingMaterial, formData.logistics, formData.refreshment, validateBudget]);

  const handleInputChange = (field: keyof FarmerTrainingFormData, value: string | Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === "district") {
      setFormData(prev => ({ ...prev, taluka: "", village: "" }));
      mutateTaluka();
      mutateVillage();
    } else if (field === "taluka") {
      setFormData(prev => ({ ...prev, village: "" }));
      mutateVillage();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files);
    const totalImages = formData.participantListImages.length + newImages.length;
    
    if (totalImages > MAX_IMAGES) {
      toast({
        title: "Image Limit Exceeded",
        description: `Maximum ${MAX_IMAGES} images allowed. You can add ${MAX_IMAGES - formData.participantListImages.length} more.`,
        variant: "destructive",
      });
      return;
    }

    const validFiles: File[] = [];
    
    for (let i = 0; i < newImages.length; i++) {
      const file = newImages[i];
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: `"${file.name}" is not an image file.`,
          variant: "destructive",
        });
        continue;
      }
      
      if (!validateImageSize(file, toast)) {
        continue;
      }
      
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        participantListImages: [...prev.participantListImages, ...validFiles],
      }));
    }
    
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      participantListImages: prev.participantListImages.filter((_, i) => i !== index),
    }));
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files);
    const totalImages = formData.galleryImages.length + newImages.length;
    
    if (totalImages > MAX_IMAGES) {
      toast({
        title: "Image Limit Exceeded",
        description: `Maximum ${MAX_IMAGES} images allowed. You can add ${MAX_IMAGES - formData.galleryImages.length} more.`,
        variant: "destructive",
      });
      return;
    }

    const validFiles: File[] = [];
    
    for (let i = 0; i < newImages.length; i++) {
      const file = newImages[i];
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: `"${file.name}" is not an image file.`,
          variant: "destructive",
        });
        continue;
      }
      
      // Check file size
      if (!validateImageSize(file, toast)) {
        continue;
      }
      
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        galleryImages: [...prev.galleryImages, ...validFiles],
      }));
    }
    
    e.target.value = '';
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.eventName || !formData.eventDate || !formData.district || 
        !formData.taluka || !formData.village || !formData.venueType ||
        !formData.venueName || !formData.numberOfParticipants) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields including venue name.",
        variant: "destructive",
      });
      return;
    }

    const participants = parseInt(formData.numberOfParticipants);
    if (participants > 30) {
      toast({
        title: "Validation Error",
        description: "Maximum 30 participants allowed per training session.",
        variant: "destructive",
      });
      return;
    }

    if (wouldExceedTarget) {
      toast({
        title: "Target Exceeded",
        description: `Cannot submit. Only ${remainingTarget} participants remaining in target allocation.`,
        variant: "destructive",
      });
      return;
    }

    if (exceedsTotal) {
      toast({
        title: "Budget Exceeded",
        description: "Sub-allocations cannot exceed the total budget amount.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingImages(true);

      let imageTableEntries: Array<{ image: string }> = [];
      if (formData.participantListImages.length > 0) {
        const uploadPromises = formData.participantListImages.map(async (file) => {
          const uploadFormData = new FormData();
          uploadFormData.append('file', file);
          uploadFormData.append('is_private', '0');
          uploadFormData.append('folder', 'Home');

          const response = await fetch('/api/method/upload_file', {
            method: 'POST',
            body: uploadFormData,
          });

          if (!response.ok) {
            throw new Error('Upload failed');
          }

          const result = await response.json();
          const fileUrl = result.message?.file_url;
          return { image: fileUrl };
        });
        
        imageTableEntries = await Promise.all(uploadPromises);
      }

      let galleryTableEntries: Array<{ image: string }> = [];
      if (formData.galleryImages.length > 0) {
        const uploadPromises = formData.galleryImages.map(async (file) => {
          const uploadFormData = new FormData();
          uploadFormData.append('file', file);
          uploadFormData.append('is_private', '0');
          uploadFormData.append('folder', 'Home');

          const response = await fetch('/api/method/upload_file', {
            method: 'POST',
            body: uploadFormData,
          });

          if (!response.ok) {
            throw new Error('Upload failed');
          }

          const result = await response.json();
          const fileUrl = result.message?.file_url;
          return { image: fileUrl };
        });
        
        galleryTableEntries = await Promise.all(uploadPromises);
      }

      setUploadingImages(false);

      await createDoc('Farmer Training Application', {
        event_name: formData.eventName,
        event_date: format(formData.eventDate!, 'yyyy-MM-dd'),
        district: formData.district,
        taluka: formData.taluka,
        village: formData.village,
        venue_type: formData.venueType,
        venue_name: formData.venueName,
        number_of_participants: parseInt(formData.numberOfParticipants),
        images_table: imageTableEntries,
        gallery_table: galleryTableEntries,
        training_material: parseFloat(formData.trainingMaterial) || 0,
        logistics: parseFloat(formData.logistics) || 0,
        refreshment: parseFloat(formData.refreshment) || 0,
      });

      toast({
        title: "Application Submitted",
        description: "Farmer training application has been submitted successfully.",
      });

      router.push("/subadmin/farmer-training");
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const handleCancel = () => {
    router.push("/subadmin/farmer-training");
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between p-6 border-b bg-card">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-form-title">
                <GraduationCap className="w-6 h-6" />
                New Farmer Training Application
              </h1>
              <p className="text-sm text-muted-foreground">
                Fill in the details to create a new training application
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto pb-6">
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="w-5 h-5" />
                  Target Status - Farmer Training
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Physical Target: <strong className="text-foreground">{targetData.physical}</strong> participants</span>
                  <span className="text-muted-foreground">Achieved: <strong className="text-foreground">{targetData.achieved}</strong> participants</span>
                </div>
                <Progress value={targetProgress} className="h-3" />
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{targetProgress.toFixed(1)}% Achieved</span>
                  <span className="text-muted-foreground">Remaining: <strong className="text-foreground">{remainingTarget}</strong> participants</span>
                </div>
                {wouldExceedTarget && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Cannot exceed target! Only {remainingTarget} participants remaining. Please adjust the number.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Event Details
                </CardTitle>
                <CardDescription>
                  Enter the training event information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventName">Event Name *</Label>
                    <Input
                      id="eventName"
                      value={formData.eventName}
                      onChange={(e) => handleInputChange("eventName", e.target.value)}
                      placeholder="e.g., Dairy Management Training"
                      data-testid="input-event-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Event Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.eventDate && "text-muted-foreground"
                          )}
                          data-testid="button-event-date"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.eventDate ? format(formData.eventDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.eventDate}
                          onSelect={(date) => handleInputChange("eventDate", date)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Location Details
                </CardTitle>
                <CardDescription>
                  Select the training location
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="district">District *</Label>
                    <Select value={formData.district} onValueChange={(value) => handleInputChange("district", value)}>
                      <SelectTrigger id="district" data-testid="select-district">
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
                      onValueChange={(value) => handleInputChange("taluka", value)}
                      disabled={!formData.district}
                    >
                      <SelectTrigger id="taluka" data-testid="select-taluka">
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
                      onValueChange={(value) => handleInputChange("village", value)}
                      disabled={!formData.taluka}
                    >
                      <SelectTrigger id="village" data-testid="select-village">
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Training Venue
                </CardTitle>
                <CardDescription>
                  Specify venue type and name
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="venueType">Venue Type *</Label>
                    <Select value={formData.venueType} onValueChange={(value) => handleInputChange("venueType", value)}>
                      <SelectTrigger id="venueType" data-testid="select-venue-type">
                        <SelectValue placeholder="Select venue type" />
                      </SelectTrigger>
                      <SelectContent>
                        {TRAINING_VENUE_OPTIONS.map((v) => (
                          <SelectItem key={v} value={v}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="venueName">Venue Name *</Label>
                    <Input
                      id="venueName"
                      value={formData.venueName}
                      onChange={(e) => handleInputChange("venueName", e.target.value)}
                      placeholder="e.g., Krishi Vigyan Kendra"
                      data-testid="input-venue-name"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Participants
                </CardTitle>
                <CardDescription>
                  Enter number of participants (Maximum 30 per session)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="participants">Number of Participants *</Label>
                  <Input
                    id="participants"
                    type="number"
                    min="1"
                    max="30"
                    value={formData.numberOfParticipants}
                    onChange={(e) => handleInputChange("numberOfParticipants", e.target.value)}
                    placeholder="Enter number (max 30)"
                    data-testid="input-participants"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="images">Participant List Images (Max {MAX_IMAGES})</Label>
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    data-testid="input-images"
                  />
                  {formData.participantListImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {formData.participantListImages.map((img, idx) => (
                        <div key={idx} className="relative border rounded p-2">
                          <p className="text-xs truncate">{img.name}</p>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="mt-1"
                            onClick={() => removeImage(idx)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
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
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="w-5 h-5" />
                  Fund Allocation
                </CardTitle>
                <CardDescription>
                  Allocate budget across different expense categories
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Expected Budget</span>
                    <span className="font-semibold text-lg">{formatCurrency(expectedBudget)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {currentParticipants} participants × ₹{EXPENSE_PER_HEAD} per head
                  </div>
                  {validationMessage && (
                    <div className="text-xs text-amber-600 font-medium">
                      {validationMessage}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="training-material">Training Material (₹)</Label>
                    <Input
                      id="training-material"
                      type="number"
                      min="0"
                      value={formData.trainingMaterial}
                      onChange={(e) => handleInputChange("trainingMaterial", e.target.value)}
                      placeholder="0"
                      data-testid="input-training-material"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logistics">Logistics (₹)</Label>
                    <Input
                      id="logistics"
                      type="number"
                      min="0"
                      value={formData.logistics}
                      onChange={(e) => handleInputChange("logistics", e.target.value)}
                      placeholder="0"
                      data-testid="input-logistics"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="refreshment">Refreshment (₹)</Label>
                    <Input
                      id="refreshment"
                      type="number"
                      min="0"
                      value={formData.refreshment}
                      onChange={(e) => handleInputChange("refreshment", e.target.value)}
                      placeholder="0"
                      data-testid="input-refreshment"
                    />
                  </div>
                </div>
                
                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Allocated</span>
                    <span className={cn("font-semibold", exceedsTotal && "text-destructive")}>
                      {formatCurrency(allocatedBudget)}
                    </span>
                  </div>
                  <Progress 
                    value={(allocatedBudget / expectedBudget) * 100} 
                    className={cn("h-2", exceedsTotal && "bg-destructive/20")}
                  />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Balance Remaining</span>
                    <span className={cn(
                      "font-bold text-lg",
                      remainingBudget < 0 ? "text-destructive" : "text-green-600"
                    )}>
                      {formatCurrency(remainingBudget)}
                    </span>
                  </div>
                </div>
                
                {exceedsTotal && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Sub-allocations exceed expected budget by {formatCurrency(Math.abs(remainingBudget))}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="gap-2"
                data-testid="button-cancel"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                type="submit"
                className="gap-2"
                disabled={wouldExceedTarget || exceedsTotal || isSubmitting || uploadingImages}
                data-testid="button-submit"
              >
                <Save className="w-4 h-4" />
                {uploadingImages ? 'Uploading Images...' : isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
