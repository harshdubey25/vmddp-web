"use client"
import { useState } from "react";
import { Controller, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AutoComplete } from "../ui/searchable-input";
interface Props {
  control: any;
  errors: any;
  familyMemberCount: number;
  setFamilyMemberCount: (n: number) => void;
}

const BasicDetailsStep = ({ control, errors, familyMemberCount, setFamilyMemberCount }: Props) => {

  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});

  const watchedDistrict = useWatch({ control, name: 'district' });
  const watchedTaluka = useWatch({ control, name: 'taluka' });

  const uploadFile = async (file: File, fieldName: string): Promise<string | null> => {
    setUploading(prev => ({ ...prev, [fieldName]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('is_private', '0');
      formData.append('folder', 'Home'); // or appropriate folder

      const response = await fetch(`${process.env.NEXT_PUBLIC_FRAPPE_BASE_URL}/api/method/vmddp_app.api.api.file_upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      const fileUrl = result.message?.data?.file_url;
      if (fileUrl) {
        return `${process.env.NEXT_PUBLIC_FRAPPE_BASE_URL}${fileUrl}`;
      }
      return null;
    } catch (error) {
      console.error('File upload error:', error);
      return null;
    } finally {
      setUploading(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display font-semibold text-xl mb-4">Basic Details</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Controller name="firstName" control={control} rules={{ required: "First Name is required" }} render={({ field }) => <Input {...field} id="firstName" data-testid="input-first-name" />} />
          {errors.firstName && <span className="text-red-500 text-xs">{errors.firstName.message}</span>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="middleName">Mid Name</Label>
          <Controller name="middleName" control={control} render={({ field }) => <Input {...field} id="middleName" data-testid="input-middle-name" />} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Controller name="lastName" control={control} rules={{ required: "Last Name is required" }} render={({ field }) => <Input {...field} id="lastName" data-testid="input-last-name" />} />
          {errors.lastName && <span className="text-red-500 text-xs">{errors.lastName.message}</span>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="gender">Gender *</Label>
          <Controller name="gender" control={control} rules={{ required: "Gender is required" }} render={({ field }) => (
            <AutoComplete {...field} doctype="Gender Master" onSelectedValueChange={field.onChange} selectedValue={field.value} />
          )} />
          {errors.gender && <span className="text-red-500 text-xs">{errors.gender.message}</span>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Controller name="category" control={control} rules={{ required: "Category is required" }} render={({ field }) => (
            <AutoComplete {...field} doctype="Category Master" onSelectedValueChange={field.onChange} selectedValue={field.value} />
          )} />
          {errors.caste && <span className="text-red-500 text-xs">{errors.caste.message}</span>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="mobile">Mobile No. *</Label>
        <Controller name="mobile" control={control} rules={{ required: "Mobile number is required" }} render={({ field }) => <Input {...field} id="mobile" type="tel" data-testid="input-mobile" />} />
        {errors.mobile && <span className="text-red-500 text-xs">{errors.mobile.message}</span>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="aadhaar">Aadhar Number *</Label>
          <Controller name="aadhaar" control={control} rules={{ required: "Aadhar number is required" }} render={({ field }) => <Input {...field} id="aadhaar" data-testid="input-aadhaar" />} />
          {errors.aadhaar && <span className="text-red-500 text-xs">{errors.aadhaar.message}</span>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="aadhaarImage">Aadhar Image *</Label>
          <Controller name="aadhaarImage" control={control} rules={{ required: "Aadhar image is required" }} render={({ field }) => (
            <>
              <Input id="aadhaarImage" type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = await uploadFile(file, 'aadhaarImage');
                  if (url) {
                    field.onChange(url);
                  }
                }
              }} data-testid="input-aadhaar-image" disabled={uploading.aadhaarImage} />
              {uploading.aadhaarImage && <span className="text-blue-500 text-xs">Uploading...</span>}
            </>
          )} />
          {errors.aadhaarImage && <span className="text-red-500 text-xs">{errors.aadhaarImage.message}</span>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rationCardMembers">Number of members in Ration Card *</Label>
          <Controller name="rationCardMembers" control={control} rules={{ required: "Number of members is required", min: { value: 1, message: "At least 1 member required" } }} render={({ field }) => (
            <Input {...field} id="rationCardMembers" type="number" min="1" value={field.value || ''} onChange={e => { field.onChange(e); setFamilyMemberCount(parseInt(e.target.value) || 0); }} data-testid="input-ration-card-members" />
          )} />
          {errors.rationCardMembers && <span className="text-red-500 text-xs">{errors.rationCardMembers.message}</span>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="rationCardImage">Self Ration Card Image *</Label>
          <Controller name="rationCardImage" control={control} rules={{ required: "Ration card image is required" }} render={({ field }) => (
            <>
              <Input id="rationCardImage" type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = await uploadFile(file, 'rationCardImage');
                  if (url) {
                    field.onChange(url);
                  }
                }
              }} data-testid="input-ration-card-image" disabled={uploading.rationCardImage} />
              {uploading.rationCardImage && <span className="text-blue-500 text-xs">Uploading...</span>}
            </>
          )} />
          {errors.rationCardImage && <span className="text-red-500 text-xs">{errors.rationCardImage.message}</span>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="familyRationCardImage">Family Ration Card Image</Label>
          <Controller name="familyRationCardImage" control={control} render={({ field }) => (
            <>
              <Input id="familyRationCardImage" type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = await uploadFile(file, 'familyRationCardImage');
                  if (url) {
                    field.onChange(url);
                  }
                }
              }} data-testid="input-family-ration-card-image" disabled={uploading.familyRationCardImage} />
              {uploading.familyRationCardImage && <span className="text-blue-500 text-xs">Uploading...</span>}
            </>
          )} />
          {errors.familyRationCardImage && <span className="text-red-500 text-xs">{errors.familyRationCardImage.message}</span>}
        </div>
      </div>
      {familyMemberCount > 1 && (
        <div className="space-y-4">
          <h3 className="font-medium text-sm">Family Members&apos; Aadhar Numbers ({familyMemberCount - 1} members)</h3>
          {Array.from({ length: familyMemberCount - 1 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Label htmlFor={`familyAadhaar${index + 1}`}>Family Member {index + 1} Aadhar Number *</Label>
              <Controller name={`familyAadhaar${index + 1}`} control={control} rules={{ required: "Aadhar number is required" }} render={({ field }) => <Input {...field} id={`familyAadhaar${index + 1}`} data-testid={`input-family-aadhaar-${index + 1}`} placeholder="Enter 12-digit Aadhar number" />} />
              {errors[`familyAadhaar${index + 1}`] && <span className="text-red-500 text-xs">{errors[`familyAadhaar${index + 1}`].message}</span>}

            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="district">District *</Label>
          <Controller name="district" control={control} rules={{ required: "District is required" }} render={({ field }) => (
            <AutoComplete doctype="District Master" onSelectedValueChange={field.onChange} selectedValue={field.value} />
          )} />
          {errors.district && <span className="text-red-500 text-xs">{errors.district.message}</span>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="taluka">Taluka *</Label>
          <Controller name="taluka" control={control} rules={{ required: "Taluka is required" }} render={({ field }) => (
            <AutoComplete doctype="Taluka Master" onSelectedValueChange={field.onChange} selectedValue={field.value} filters={watchedDistrict ? [['district', '=', watchedDistrict]] : undefined} />
          )} />
          {errors.taluka && <span className="text-red-500 text-xs">{errors.taluka.message}</span>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="village">Village *</Label>
          <Controller name="village" control={control} rules={{ required: "Village is required" }} render={({ field }) => (
            <AutoComplete doctype="Village Master" onSelectedValueChange={field.onChange} selectedValue={field.value} filters={watchedDistrict && watchedTaluka ? [['district', '=', watchedDistrict], ['taluka', '=', watchedTaluka]] : undefined} />
          )} />
          {errors.village && <span className="text-red-500 text-xs">{errors.village.message}</span>}
        </div>
      </div>
    </div>
  );
}

export default BasicDetailsStep;