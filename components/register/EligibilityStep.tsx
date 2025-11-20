import { Controller, useWatch } from "react-hook-form";
import dynamic from "next/dynamic";
const TagNumberVerification = dynamic(() => import("@/components/TagValidation"), { ssr: false });
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { JSX } from "react";
import { useState } from "react";
import { useTranslation } from 'react-i18next';
interface Props {
  control: any;
  errors: any;
  criteriaFields: any[];
  values: any;
  setValue?: any;
}

const EligibilityStep = ({ values, control, errors, criteriaFields, setValue }: Props) => {
  const { t, i18n } = useTranslation('common');
  console.log(values)

  const sortedCriteriaFields = Array.isArray(criteriaFields)
    ? criteriaFields
    : [];

  const mainFieldNames = sortedCriteriaFields?.map((field, idx) => {
    const fieldKey = field.fieldname || field.name || `criteria_${idx}`;
    return `eligibility[${idx}].value`;
  }) || [];

  // Watch all mainFieldNames at once
  const mainFieldValues = useWatch({ control, name: mainFieldNames });

  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  const [tagValidation, setTagValidation] = useState<{
    [key: string]: { loading: boolean; valid?: boolean; message?: string };
  }>({});

  const handleValidateTag = async (fieldKey: string, value: string) => {
    setTagValidation((p) => ({ ...p, [fieldKey]: { loading: true } }));
    try {
      const res = await fetch("/api/validate-tag-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagNumber: value }),
      });
      const data = await res.json();
      console.log("Tag validation response data:", data);
      setTagValidation((p) => ({
        ...p,
        [fieldKey]: { loading: false, valid: !!data.valid, message: data.message },
      }));
    } catch (err) {
      setTagValidation((p) => ({
        ...p,
        [fieldKey]: { loading: false, valid: false, message: "Validation failed" },
      }));
    }
  };

  const uploadFile = async (file: File, fieldName: string): Promise<string | null> => {
    setUploading(prev => ({ ...prev, [fieldName]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('is_private', '0');
      formData.append('folder', 'Home');

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
        // If URL already starts with https/http, return as is
        if (fileUrl.startsWith('https://') || fileUrl.startsWith('http://')) {
          return fileUrl;
        }
        // Otherwise, prepend the base URL
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
      <h2 className="font-display font-semibold text-xl mb-4">{t('eligibility_details_title')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sortedCriteriaFields?.map((field, idx) => {
          // ...existing code...
          const fieldKey = field.fieldname || field.name || `criteria_${idx}`;
          const mainValueName = `eligibility[${idx}].value`;
          const mainNameName = `eligibility[${idx}].name`;
          const mainTypeName = `eligibility[${idx}].type`;
          const label = (i18n.language === 'mr' && field.name_in_local_language)
            ? field.name_in_local_language
            : (field.label || field.name1 || fieldKey);
          const type = field.type || "text";
          const required = field.required || field.mandatory || false;

          // ...existing code for mainInput...
          let mainInput = null;
          if (type === "checkbox") {
            mainInput = (
              <div className="space-y-3 p-4 border rounded-lg bg-muted/20 h-24" key={mainValueName}>
                <Controller
                  name={mainNameName}
                  control={control}
                  defaultValue={fieldKey}
                  render={({ field }) => <input type="hidden" {...field} />}
                />
                <Controller
                  name={mainTypeName}
                  control={control}
                  defaultValue="checkbox"
                  render={({ field }) => <input type="hidden" {...field} />}
                />
                <div className="flex items-center justify-between">
                  <Label htmlFor={mainValueName} className="text-sm font-medium">
                    {label}{required ? " *" : ""}
                  </Label>
                  <Controller
                    name={mainValueName}
                    control={control}
                    rules={required ? { required: t('field_required', { field: label }) } : {}}
                    render={({ field }) => (
                      <Checkbox
                        id={mainValueName}
                        checked={!!field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                    )}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('eligibility_checkbox_description')}
                </p>
                {errors?.eligibility?.[idx]?.value && (
                  <span className="text-red-500 text-xs flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.eligibility[idx].value.message}
                  </span>
                )}
              </div>
            );
          } else if (type === "number" || type === "Int") {
            // Parse min and max values
            const minValue = field.minimum ? parseFloat(field.minimum) : null;
            const maxValue = field.maximum ? parseFloat(field.maximum) : null;

            // Build validation rules
            const validationRules: any = {};
            if (required) {
              validationRules.required = t('field_required', { field: label });
            }

            // Add min validation
            if (minValue !== null) {
              validationRules.min = {
                value: minValue,
                message: `${label} must be at least ${minValue}`
              };
            }

            // Add max validation
            if (maxValue !== null) {
              validationRules.max = {
                value: maxValue,
                message: `${label} must be at most ${maxValue}`
              };
            }

            mainInput = (
              <div className="space-y-2" key={mainValueName}>
                <Controller
                  name={mainNameName}
                  control={control}
                  defaultValue={fieldKey}
                  render={({ field }) => <input type="hidden" {...field} />}
                />
                <Controller
                  name={mainTypeName}
                  control={control}
                  defaultValue={type}
                  render={({ field }) => <input type="hidden" {...field} />}
                />
                <Label htmlFor={mainValueName}>{label}{required ? " *" : ""}</Label>
                <Controller
                  name={mainValueName}
                  control={control}
                  rules={validationRules}
                  render={({ field: rhfField }) => (
                    <Input
                      {...rhfField}
                      id={mainValueName}
                      type="number"
                      value={rhfField.value ?? ""}
                      placeholder={field.placeholder || undefined}
                      min={minValue !== null ? minValue.toString() : undefined}
                      max={maxValue !== null ? maxValue.toString() : undefined}
                    />
                  )}
                />
                {errors?.eligibility?.[idx]?.value && <span className="text-red-500 text-xs">{errors.eligibility[idx].value.message}</span>}
              </div>
            );
          } else if (type === "file") {
            mainInput = (
              <div className="space-y-2" key={mainValueName}>
                <Controller
                  name={mainNameName}
                  control={control}
                  defaultValue={fieldKey}
                  render={({ field }) => <input type="hidden" {...field} />}
                />
                <Controller
                  name={mainTypeName}
                  control={control}
                  defaultValue="file"
                  render={({ field }) => <input type="hidden" {...field} />}
                />
                <Label htmlFor={mainValueName}>{label}{required ? " *" : ""}</Label>
                <Controller
                  name={mainValueName}
                  control={control}
                  rules={required ? { required: t('field_required', { field: label }) } : {}}
                  render={({ field }) => (
                    <>
                      <Input id={mainValueName} type="file" accept="image/*" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await uploadFile(file, mainValueName);
                          if (url) {
                            field.onChange(url);
                          }
                        }
                      }} disabled={uploading[mainValueName]} />
                      {uploading[mainValueName] && <span className="text-blue-500 text-xs">{t('uploading')}</span>}
                      {field.value && !uploading[mainValueName] && (
                        <span className="text-green-600 text-xs flex items-center gap-1">
                          ✓ {t('file_uploaded')}: {field.value.split('/').pop()}
                        </span>
                      )}
                    </>
                  )}
                />
                {errors?.eligibility?.[idx]?.value && <span className="text-red-500 text-xs">{errors.eligibility[idx].value.message}</span>}
              </div>
            );
          } else {
            mainInput = (
              <div className="space-y-2" key={mainValueName}>
                <Controller
                  name={mainNameName}
                  control={control}
                  defaultValue={fieldKey}
                  render={({ field }) => <input type="hidden" {...field} />}
                />
                <Controller
                  name={mainTypeName}
                  control={control}
                  defaultValue="text"
                  render={({ field }) => <input type="hidden" {...field} />}
                />
                <Label htmlFor={mainValueName}>{label}{required ? " *" : ""}</Label>
                <Controller
                  name={mainValueName}
                  control={control}
                  rules={required ? { required: t('field_required', { field: label }) } : {}}
                  render={({ field: rhfField }) => (
                    <Input {...rhfField} id={mainValueName} type="text" value={rhfField.value ?? ""} placeholder={field.placeholder || undefined} />
                  )}
                />
                {errors?.eligibility?.[idx]?.value && <span className="text-red-500 text-xs">{errors.eligibility[idx].value.message}</span>}
              </div>
            );
          }

          // Render child table inputs if present
          const childInputs: JSX.Element[] = [];
          // Get watched value for this field from mainFieldValues
          const mainFieldValue = mainFieldValues?.[idx];
          let childIdx = 0;
          if (Array.isArray(field.criteria_fields)) {
            field.criteria_fields.forEach((child: any, cidx: number) => {
              const childRequired = required; // Child fields are mandatory if parent is mandatory
              const maxChars = child.max_number_of_characters ? parseInt(child.max_number_of_characters) : null;

              if (child.condition === "=") {
                const count = Number(mainFieldValue) || 0;
                for (let i = 0; i < count; i++) {
                  const childValueName = `eligibility[${idx}].child[${childIdx}].value`;
                  const childNameName = `eligibility[${idx}].child[${childIdx}].name`;
                  const childTypeName = `eligibility[${idx}].child[${childIdx}].type`;
                  const childVerifiedName = `eligibility[${idx}].child[${childIdx}].verified`;

                  // Build validation rules for child fields
                  const childValidationRules: any = {};
                  if (childRequired) {
                    childValidationRules.required = t('field_required', { field: child.field });
                  }
                  if (maxChars) {
                    childValidationRules.pattern = {
                      value: new RegExp(`^.{${maxChars}}$`),
                      message: `${child.field} must be exactly ${maxChars} characters`
                    };
                  }

                  childInputs.push(
                    <div className="space-y-2" key={childValueName}>
                      <Controller
                        name={childNameName}
                        control={control}
                        defaultValue={child.field}
                        render={({ field }) => <input type="hidden" {...field} />}
                      />
                      <Controller
                        name={childTypeName}
                        control={control}
                        defaultValue="text"
                        render={({ field }) => <input type="hidden" {...field} />}
                      />
                      <Controller
                        name={childVerifiedName}
                        control={control}
                        defaultValue={false}
                        render={({ field }) => <input type="hidden" {...field} />}
                      />
                      <Label htmlFor={childValueName}>{child.field} (#{i + 1}){childRequired ? " *" : ""}</Label>
                      <Controller
                        name={childValueName}
                        control={control}
                        rules={childValidationRules}
                        render={({ field: rhfField }) => (
                          <>
                            {child.extra_validation === "Tag Number" ? (
                              <TagNumberVerification
                                disabled={false}
                                showLabel={false}
                                value={rhfField.value ?? ""}
                                onChange={(value) => rhfField.onChange(value)}
                                onVerificationComplete={(verified, data) => {
                                  try {
                                    // Store verification status using setValue
                                    const setValueFunc = setValue || control?.setValue;
                                    if (setValueFunc && typeof setValueFunc === 'function') {
                                      setValueFunc(childVerifiedName, verified, {
                                        shouldValidate: false,
                                        shouldDirty: true
                                      });
                                    }
                                  } catch (error) {
                                    console.error('Error in verification complete callback:', error);
                                  }
                                }}
                              />
                            ) : (
                              <Input
                                {...rhfField}
                                id={childValueName}
                                type="text"
                                value={rhfField.value ?? ""}
                                placeholder={child.placeholder || undefined}
                                maxLength={maxChars || undefined}
                                onChange={(e) => {
                                  let value = e.target.value;
                                  if (maxChars) {
                                    value = value.slice(0, maxChars);
                                  }
                                  rhfField.onChange(value);
                                }}
                              />
                            )}
                          </>
                        )}
                      />
                      {errors?.eligibility?.[idx]?.child?.[childIdx]?.value && <span className="text-red-500 text-xs">{errors.eligibility[idx].child[childIdx].value.message}</span>}
                    </div>
                  );
                  childIdx++;
                }
              } else {
                const childValueName = `eligibility[${idx}].child[${childIdx}].value`;
                const childNameName = `eligibility[${idx}].child[${childIdx}].name`;
                const childTypeName = `eligibility[${idx}].child[${childIdx}].type`;
                const childVerifiedName = `eligibility[${idx}].child[${childIdx}].verified`;

                // Build validation rules for child fields
                const childValidationRules: any = {};
                if (childRequired) {
                  childValidationRules.required = t('field_required', { field: child.field });
                }
                if (maxChars) {
                  childValidationRules.pattern = {
                    value: new RegExp(`^.{${maxChars}}$`),
                    message: `${child.field} must be exactly ${maxChars} characters`
                  };
                }

                childInputs.push(
                  <div className="space-y-2" key={childValueName}>
                    <Controller
                      name={childNameName}
                      control={control}
                      defaultValue={child.field}
                      render={({ field }) => <input type="hidden" {...field} />}
                    />
                    <Controller
                      name={childTypeName}
                      control={control}
                      defaultValue="text"
                      render={({ field }) => <input type="hidden" {...field} />}
                    />
                    <Controller
                      name={childVerifiedName}
                      control={control}
                      defaultValue={false}
                      render={({ field }) => <input type="hidden" {...field} />}
                    />
                    <Label htmlFor={childValueName}>{child.field} ({child.condition}){childRequired ? " *" : ""}</Label>
                    <Controller
                      name={childValueName}
                      control={control}
                      rules={childValidationRules}
                      render={({ field: rhfField }) => (
                        <>
                          {child.extra_validation === "Tag Number" ? (
                            <TagNumberVerification
                              disabled={false}
                              showLabel={false}
                              value={rhfField.value ?? ""}
                              onChange={(value) => rhfField.onChange(value)}
                              onVerificationComplete={(verified, data) => {
                                try {
                                  // Store verification status using setValue
                                  const setValueFunc = setValue || control?.setValue;
                                  if (setValueFunc && typeof setValueFunc === 'function') {
                                    setValueFunc(childVerifiedName, verified, {
                                      shouldValidate: false,
                                      shouldDirty: true
                                    });
                                  }
                                } catch (error) {
                                  console.error('Error in verification complete callback:', error);
                                }
                              }}
                            />
                          ) : (
                            <Input
                              {...rhfField}
                              id={childValueName}
                              type="text"
                              value={rhfField.value ?? ""}
                              placeholder={child.placeholder || undefined}
                              maxLength={maxChars || undefined}
                              onChange={(e) => {
                                let value = e.target.value;
                                if (maxChars) {
                                  value = value.slice(0, maxChars);
                                }
                                rhfField.onChange(value);
                              }}
                            />
                          )}
                        </>
                      )}
                    />
                    {errors?.eligibility?.[idx]?.child?.[childIdx]?.value && <span className="text-red-500 text-xs">{errors.eligibility[idx].child[childIdx].value.message}</span>}
                  </div>
                );
                childIdx++;
              }
            });
          }

          return (
            <>
              {mainInput}
              {childInputs}
            </>
          );
        })}
      </div>
    </div>
  );
};

export default EligibilityStep;