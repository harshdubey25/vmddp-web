"use client"
import { useState } from "react";
import { Controller, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from 'react-i18next';
import { useFrappeGetDocList } from "frappe-react-sdk";
import AadhaarVerification from "@/components/AadhaarVerification";
interface Props {
  control: any;
  errors: any;
  familyMemberCount: number;
  setFamilyMemberCount: (n: number) => void;
  isAadhaarVerified?: boolean;
  setIsAadhaarVerified?: (verified: boolean) => void;
}

const BasicDetailsStep = ({
  control,
  errors,
  familyMemberCount,
  setFamilyMemberCount,
  isAadhaarVerified = false,
  setIsAadhaarVerified = () => { }
}: Props) => {

  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  const [aadhaarVerificationData, setAadhaarVerificationData] = useState<any>(null);
  const { t } = useTranslation('common');

  const watchedDistrict = useWatch({ control, name: 'district' });
  const watchedTaluka = useWatch({ control, name: 'taluka' });
  const watchedAadhaar = useWatch({ control, name: 'aadhar_number' });

  const { data: genderData } = useFrappeGetDocList("Gender Master", {
    fields: ["name"],
    limit: 100,
  });

  const { data: categoryData } = useFrappeGetDocList("Category Master", {
    fields: ["name"],
    limit: 100,
  });

  const { data: districtData } = useFrappeGetDocList("District Master", {
    fields: ["name"],
    limit: 100,
  });

  const { data: talukaData } = useFrappeGetDocList("Taluka Master", {
    fields: ["name"],
    filters: watchedDistrict ? [['district', '=', watchedDistrict]] : undefined,
    limit: 100,
  });

  const { data: villageData } = useFrappeGetDocList("Village Master", {
    fields: ["name1"],
    filters: watchedDistrict && watchedTaluka ? [['district', '=', watchedDistrict], ['taluka', '=', watchedTaluka]] : undefined,

  });

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

  const handleAadhaarVerificationComplete = (verified: boolean, data?: any) => {
    setIsAadhaarVerified(verified);
    if (verified && data) {
      setAadhaarVerificationData(data);
    } else {
      setAadhaarVerificationData(null);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display font-semibold text-xl mb-4">{t('basic_details_title')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">{t('first_name')} *</Label>
          <Controller
            name="firstName"
            control={control}
            rules={{
              required: t('first_name_required'),
              pattern: {
                value: /^[^\s]+$/,
                message: 'First name should be a single word without spaces'
              }
            }}
            render={({ field }) => (
              <Input
                {...field}
                id="firstName"
                data-testid="input-first-name"
                onChange={(e) => {
                  const value = e.target.value.replace(/\s/g, '');
                  field.onChange(value);
                }}
              />
            )}
          />
          {errors.firstName && <span className="text-red-500 text-xs">{errors.firstName.message}</span>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="middleName">{t('middle_name')}</Label>
          <Controller
            name="middleName"
            control={control}
            rules={{
              pattern: {
                value: /^[^\s]*$/,
                message: 'Middle name should be a single word without spaces'
              }
            }}
            render={({ field }) => (
              <Input
                {...field}
                id="middleName"
                data-testid="input-middle-name"
                onChange={(e) => {
                  const value = e.target.value.replace(/\s/g, '');
                  field.onChange(value);
                }}
              />
            )}
          />
          {errors.middleName && <span className="text-red-500 text-xs">{errors.middleName.message}</span>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">{t('last_name')} *</Label>
          <Controller
            name="lastName"
            control={control}
            rules={{
              required: t('last_name_required'),
              pattern: {
                value: /^[^\s]+$/,
                message: 'Last name should be a single word without spaces'
              }
            }}
            render={({ field }) => (
              <Input
                {...field}
                id="lastName"
                data-testid="input-last-name"
                onChange={(e) => {
                  const value = e.target.value.replace(/\s/g, '');
                  field.onChange(value);
                }}
              />
            )}
          />
          {errors.lastName && <span className="text-red-500 text-xs">{errors.lastName.message}</span>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="gender">{t('gender')} *</Label>
          <Controller name="gender" control={control} rules={{ required: t('gender_required') }} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder={t('select_gender')} />
              </SelectTrigger>
              <SelectContent className={genderData && genderData.length > 8 ? "max-h-48 overflow-y-auto" : ""}>
                {genderData?.map((item) => (
                  <SelectItem key={item.name} value={item.name}>{item.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
          {errors.gender && <span className="text-red-500 text-xs">{errors.gender.message}</span>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">{t('category')} *</Label>
          <Controller name="category" control={control} rules={{ required: t('category_required') }} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder={t('select_category')} />
              </SelectTrigger>
              <SelectContent className={categoryData && categoryData.length > 8 ? "max-h-48 overflow-y-auto" : ""}>
                {categoryData?.map((item) => (
                  <SelectItem key={item.name} value={item.name}>{item.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
          {errors.caste && <span className="text-red-500 text-xs">{errors.caste.message}</span>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="mobile">{t('mobile_no')} *</Label>
        <Controller name="mobile" control={control} rules={{ required: t('mobile_required') }} render={({ field }) => <Input {...field} id="mobile" type="tel" data-testid="input-mobile" />} />
        {errors.mobile && <span className="text-red-500 text-xs">{errors.mobile.message}</span>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="aadhar">{t('aadhar_number')} *</Label>
          <Controller
            name="aadhar_number"
            control={control}
            rules={{
              required: t('aadhar_required'),
              pattern: {
                value: /^\d{12}$/,
                message: t('aadhar_invalid'),
              },
            }}
            render={({ field }) => (
              <Input
                {...field}
                id="aadhar_number"
                data-testid="input-aadhar"
                inputMode="numeric"
                maxLength={12}
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                  field.onChange(value);
                }}
              />
            )}
          />
          {errors.aadhar_number && <span className="text-red-500 text-xs">{errors.aadhar_number.message}</span>}

          {/* Aadhaar Verification Section */}
          {watchedAadhaar && watchedAadhaar.length === 12 && (
            <div className="mt-3">
              <AadhaarVerification
                aadhaar={watchedAadhaar}
                onVerificationComplete={handleAadhaarVerificationComplete}
                disabled={uploading.aadhaarImage}
              />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="aadhaarImage">{t('aadhar_image')} *</Label>
          <Controller name="aadhaarImage" control={control} rules={{ required: t('aadhar_image_required') }} render={({ field }) => (
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
              {uploading.aadhaarImage && <span className="text-blue-500 text-xs">{t('uploading')}</span>}
            </>
          )} />
          {errors.aadhaarImage && <span className="text-red-500 text-xs">{errors.aadhaarImage.message}</span>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rationCardMembers">{t('ration_card_members')} *</Label>
          <Controller
            name="rationCardMembers"
            control={control}
            rules={{
              required: t('ration_card_members_required'),
              min: { value: 0, message: 'Minimum 0 members allowed' },
              max: { value: 99, message: 'Maximum 99 members allowed' },
              pattern: { value: /^[0-9]\d*$/, message: 'Only non-negative numbers are allowed' }
            }}
            render={({ field }) => {
              const currentValue = parseInt(field.value) || 0;

              const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;
                const numValue = parseInt(value);

                // Allow spinner changes (when value comes from browser's built-in increment/decrement)
                if (!isNaN(numValue) && numValue >= 0 && numValue <= 99) {
                  field.onChange(numValue.toString());
                  setFamilyMemberCount(numValue);
                }
                // For direct typing, allow single digits (0-9)
                else if (value.length <= 1) {
                  const singleDigit = value.replace(/[^0-9]/g, '');
                  if (singleDigit !== '') {
                    field.onChange(singleDigit);
                    setFamilyMemberCount(parseInt(singleDigit));
                  } else if (value === '') {
                    field.onChange('0');
                    setFamilyMemberCount(0);
                  }
                }
              };

              const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
                // Allow navigation keys, backspace, delete, and arrow keys (for spinners)
                const allowedKeys = ['ArrowUp', 'ArrowDown', 'Tab', 'Backspace', 'Delete', 'Enter', 'Home', 'End'];

                // Prevent typing numbers if current value is already double digit
                if (currentValue >= 10 && !allowedKeys.includes(e.key)) {
                  e.preventDefault();
                  return;
                }

                // For single digits, prevent typing if it would create invalid input
                if (currentValue < 10 && e.key >= '0' && e.key <= '9') {
                  // Allow any digit 0-9 for direct typing
                  if (currentValue > 0 && e.key >= '0' && e.key <= '9') {
                    e.preventDefault();
                  }
                }
              };

              return (
                <Input
                  {...field}
                  id="rationCardMembers"
                  type="number"
                  min="0"
                  max="99"
                  step="1"
                  value={field.value || '0'}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  data-testid="input-ration-card-members"
                  onBlur={() => {
                    // Ensure value is within bounds and update family count
                    const value = parseInt(field.value) || 0;
                    const clampedValue = Math.max(0, Math.min(99, value));
                    field.onChange(clampedValue.toString());
                    setFamilyMemberCount(clampedValue);
                  }}
                />
              );
            }}
          />
          {errors.rationCardMembers && <span className="text-red-500 text-xs">{errors.rationCardMembers.message}</span>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="rationCardImage">{t('self_ration_card_image')} *</Label>
          <Controller name="rationCardImage" control={control} rules={{ required: t('ration_card_image_required') }} render={({ field }) => (
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
              {uploading.rationCardImage && <span className="text-blue-500 text-xs">{t('uploading')}</span>}
            </>
          )} />
          {errors.rationCardImage && <span className="text-red-500 text-xs">{errors.rationCardImage.message}</span>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="familyRationCardImage">{t('family_ration_card_image')}</Label>
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
              {uploading.familyRationCardImage && <span className="text-blue-500 text-xs">{t('uploading')}</span>}
            </>
          )} />
          {errors.familyRationCardImage && <span className="text-red-500 text-xs">{errors.familyRationCardImage.message}</span>}
        </div>
      </div>
      {familyMemberCount > 1 && (
        <div className="space-y-4">
          <h3 className="font-medium text-sm">{t('family_members_aadhar')} ({familyMemberCount - 1} members)</h3>
          {Array.from({ length: familyMemberCount - 1 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Label htmlFor={`familyAadhaar${index + 1}`}>{t('family_member_aadhar', { index: index + 1 })} *</Label>
              <Controller
                name={`familyAadhaar${index + 1}`}
                control={control}
                rules={{
                  required: t('aadhar_required'),
                  pattern: {
                    value: /^\d{12}$/,
                    message: t('aadhar_invalid'),
                  },
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id={`familyAadhaar${index + 1}`}
                    data-testid={`input-family-aadhaar-${index + 1}`}
                    placeholder={t('aadhar_placeholder')}
                    inputMode="numeric"
                    maxLength={12}
                    onChange={e => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                      field.onChange(value);
                    }}
                  />
                )}
              />
              {errors[`familyAadhaar${index + 1}`] && <span className="text-red-500 text-xs">{errors[`familyAadhaar${index + 1}`].message}</span>}

            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="district">{t('district')} *</Label>
          <Controller name="district" control={control} rules={{ required: t('district_required') }} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder={t('select_district')} />
              </SelectTrigger>
              <SelectContent className={districtData && districtData.length > 8 ? "max-h-48 overflow-y-auto" : ""}>
                {districtData?.map((item) => (
                  <SelectItem key={item.name} value={item.name}>{item.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
          {errors.district && <span className="text-red-500 text-xs">{errors.district.message}</span>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="taluka">{t('taluka')} *</Label>
          <Controller name="taluka" control={control} rules={{ required: t('taluka_required') }} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value} disabled={!watchedDistrict}>
              <SelectTrigger>
                <SelectValue placeholder={t('select_taluka')} />
              </SelectTrigger>
              <SelectContent className={talukaData && talukaData.length > 8 ? "max-h-48 overflow-y-auto" : ""}>
                {talukaData?.map((item) => (
                  <SelectItem key={item.name} value={item.name}>{item.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
          {!watchedDistrict ? (
            <span className="text-amber-600 text-xs">{t('select_district_first')}</span>
          ) : errors.taluka && <span className="text-red-500 text-xs">{errors.taluka.message}</span>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="village">{t('village')} *</Label>
          <Controller name="village" control={control} rules={{ required: t('village_required') }} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value} disabled={!watchedDistrict || !watchedTaluka}>
              <SelectTrigger>
                <SelectValue placeholder={t('select_village')} />
              </SelectTrigger>
              <SelectContent className={villageData && villageData.length > 8 ? "max-h-48 overflow-y-auto" : ""}>
                {villageData?.map((item) => (
                  <SelectItem key={item.name1} value={item.name1}>{item.name1}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
          {!watchedDistrict || !watchedTaluka ? (
            <span className="text-amber-600 text-xs">{t('select_taluka_first')}</span>
          ) : errors.village && <span className="text-red-500 text-xs">{errors.village.message}</span>}
        </div>
      </div>
    </div>
  );
}

export default BasicDetailsStep;