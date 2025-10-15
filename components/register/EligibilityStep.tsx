import { Controller, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { JSX } from "react";
import { useState } from "react";
interface Props {
  control: any;
  errors: any;
  criteriaFields: any[];
  values: any;
}

const EligibilityStep = ({ values, control, errors, criteriaFields }: Props) => {

  console.log(values)
  // Collect all mainFieldNames for useWatch
  const mainFieldNames = criteriaFields?.map((field, idx) => {
    const fieldKey = field.fieldname || field.name || `criteria_${idx}`;
    return `eligibility[${idx}].value`;
  }) || [];

  // Watch all mainFieldNames at once
  const mainFieldValues = useWatch({ control, name: mainFieldNames });

  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});

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
      <h2 className="font-display font-semibold text-xl mb-4">Eligibility Details</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {criteriaFields?.map((field, idx) => {
          // ...existing code...
          const fieldKey = field.fieldname || field.name || `criteria_${idx}`;
          const mainValueName = `eligibility[${idx}].value`;
          const mainNameName = `eligibility[${idx}].name`;
          const label = field.label || fieldKey;
          const type = field.type || "text";
          const required = field.required || false;

          // ...existing code for mainInput...
          let mainInput = null;
          if (type === "checkbox") {
            mainInput = (
              <div className="space-y-3 p-4 border rounded-lg bg-muted/20" key={mainValueName}>
                <Controller
                  name={mainNameName}
                  control={control}
                  defaultValue={fieldKey}
                  render={({ field }) => <input type="hidden" {...field} />}
                />
                <div className="flex items-center justify-between">
                  <Label htmlFor={mainValueName} className="text-sm font-medium">
                    {label}{required ? " *" : ""}
                  </Label>
                  <Controller
                    name={mainValueName}
                    control={control}
                    rules={required ? { required: `${label} is required` } : {}}
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
                  Check the box if you meet this eligibility requirement
                </p>
                {errors?.eligibility?.[idx]?.value && (
                  <span className="text-red-500 text-xs flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.eligibility[idx].value.message}
                  </span>
                )}
              </div>
            );
          } else if (type === "number") {
            mainInput = (
              <div className="space-y-2" key={mainValueName}>
                <Controller
                  name={mainNameName}
                  control={control}
                  defaultValue={fieldKey}
                  render={({ field }) => <input type="hidden" {...field} />}
                />
                <Label htmlFor={mainValueName}>{label}{required ? " *" : ""}</Label>
                <Controller
                  name={mainValueName}
                  control={control}
                  rules={required ? { required: `${label} is required` } : {}}
                  render={({ field }) => (
                    <Input {...field} id={mainValueName} type="number" value={field.value ?? ""} />
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
                <Label htmlFor={mainValueName}>{label}{required ? " *" : ""}</Label>
                <Controller
                  name={mainValueName}
                  control={control}
                  rules={required ? { required: `${label} is required` } : {}}
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
                      {uploading[mainValueName] && <span className="text-blue-500 text-xs">Uploading...</span>}
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
                <Label htmlFor={mainValueName}>{label}{required ? " *" : ""}</Label>
                <Controller
                  name={mainValueName}
                  control={control}
                  rules={required ? { required: `${label} is required` } : {}}
                  render={({ field }) => (
                    <Input {...field} id={mainValueName} type="text" value={field.value ?? ""} />
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
              if (child.condition === "=") {
                const count = Number(mainFieldValue) || 0;
                for (let i = 0; i < count; i++) {
                  const childValueName = `eligibility[${idx}].child[${childIdx}].value`;
                  const childNameName = `eligibility[${idx}].child[${childIdx}].name`;
                  childInputs.push(
                    <div className="space-y-2" key={childValueName}>
                      <Controller
                        name={childNameName}
                        control={control}
                        defaultValue={child.field}
                        render={({ field }) => <input type="hidden" {...field} />}
                      />
                      <Label htmlFor={childValueName}>{child.field} (#{i + 1})</Label>
                      <Controller
                        name={childValueName}
                        control={control}
                        render={({ field }) => (
                          <Input {...field} id={childValueName} type="text" value={field.value ?? ""} />
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
                childInputs.push(
                  <div className="space-y-2" key={childValueName}>
                    <Controller
                      name={childNameName}
                      control={control}
                      defaultValue={child.field}
                      render={({ field }) => <input type="hidden" {...field} />}
                    />
                    <Label htmlFor={childValueName}>{child.field} ({child.condition})</Label>
                    <Controller
                      name={childValueName}
                      control={control}
                      render={({ field }) => (
                        <Input {...field} id={childValueName} type="text" value={field.value ?? ""} />
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