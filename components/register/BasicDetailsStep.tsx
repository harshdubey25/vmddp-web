import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  control: any;
  errors: any;
  familyMemberCount: number;
  setFamilyMemberCount: (n: number) => void;
}

const BasicDetailsStep = ({ control, errors, familyMemberCount, setFamilyMemberCount }: Props) => (
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
          <Select {...field} onValueChange={field.onChange} value={field.value}>
            <SelectTrigger id="gender" data-testid="select-gender">
              <SelectValue placeholder="Select Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        )} />
        {errors.gender && <span className="text-red-500 text-xs">{errors.gender.message}</span>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="caste">Caste *</Label>
        <Controller name="caste" control={control} rules={{ required: "Caste is required" }} render={({ field }) => (
          <Select {...field} onValueChange={field.onChange} value={field.value}>
            <SelectTrigger id="caste" data-testid="select-caste">
              <SelectValue placeholder="Select Caste" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="sc">SC</SelectItem>
              <SelectItem value="st">ST</SelectItem>
              <SelectItem value="obc">OBC</SelectItem>
            </SelectContent>
          </Select>
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
        <Controller name="aadhaarImage" control={control} rules={{ required: "Aadhar image is required" }} render={({ field }) => <Input {...field} id="aadhaarImage" type="file" accept="image/*" data-testid="input-aadhaar-image" />} />
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
        <Controller name="rationCardImage" control={control} rules={{ required: "Ration card image is required" }} render={({ field }) => <Input {...field} id="rationCardImage" type="file" accept="image/*" data-testid="input-ration-card-image" />} />
        {errors.rationCardImage && <span className="text-red-500 text-xs">{errors.rationCardImage.message}</span>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="familyRationCardImage">Family Ration Card Image</Label>
        <Controller name="familyRationCardImage" control={control} render={({ field }) => <Input {...field} id="familyRationCardImage" type="file" accept="image/*" data-testid="input-family-ration-card-image" />} />
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
          <Select {...field} onValueChange={field.onChange} value={field.value}>
            <SelectTrigger id="district" data-testid="select-district">
              <SelectValue placeholder="Select District" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nagpur">Nagpur</SelectItem>
              <SelectItem value="amravati">Amravati</SelectItem>
              <SelectItem value="yavatmal">Yavatmal</SelectItem>
            </SelectContent>
          </Select>
        )} />
        {errors.district && <span className="text-red-500 text-xs">{errors.district.message}</span>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="taluka">Taluka *</Label>
        <Controller name="taluka" control={control} rules={{ required: "Taluka is required" }} render={({ field }) => (
          <Select {...field} onValueChange={field.onChange} value={field.value}>
            <SelectTrigger id="taluka" data-testid="select-taluka">
              <SelectValue placeholder="Select Taluka" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="taluka1">Taluka 1</SelectItem>
              <SelectItem value="taluka2">Taluka 2</SelectItem>
            </SelectContent>
          </Select>
        )} />
        {errors.taluka && <span className="text-red-500 text-xs">{errors.taluka.message}</span>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="village">Village *</Label>
        <Controller name="village" control={control} rules={{ required: "Village is required" }} render={({ field }) => (
          <Select {...field} onValueChange={field.onChange} value={field.value}>
            <SelectTrigger id="village" data-testid="select-village">
              <SelectValue placeholder="Select Village" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="village1">Village 1</SelectItem>
              <SelectItem value="village2">Village 2</SelectItem>
            </SelectContent>
          </Select>
        )} />
        {errors.village && <span className="text-red-500 text-xs">{errors.village.message}</span>}
      </div>
    </div>
  </div>
);

export default BasicDetailsStep;