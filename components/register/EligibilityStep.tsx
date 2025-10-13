import { Controller, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { JSX } from "react";
interface Props {
  control: any;
  errors: any;
  criteriaFields: any[];
}

const EligibilityStep = ({ control, errors, criteriaFields }: Props) => {
  // Collect all mainFieldNames for useWatch
  const mainFieldNames = criteriaFields?.map((field, idx) => {
    const fieldKey = field.fieldname || field.name || `criteria_${idx}`;
    return `eligibility[${idx}].${fieldKey}`;
  }) || [];

  // Watch all mainFieldNames at once
  const mainFieldValues = useWatch({ control, name: mainFieldNames });

  return (
    <div className="space-y-6">
      <h2 className="font-display font-semibold text-xl mb-4">Eligibility Details</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {criteriaFields?.map((field, idx) => {
          // ...existing code...
          const fieldKey = field.fieldname || field.name || `criteria_${idx}`;
          const mainFieldName = `eligibility[${idx}].${fieldKey}`;
          const label = field.label || fieldKey;
          const type = field.type || "text";
          const required = field.required || false;

          // ...existing code for mainInput...
          let mainInput = null;
          if (type === "checkbox") {
            mainInput = (
              <div className="space-y-2" key={mainFieldName}>
                <Label htmlFor={mainFieldName}>{label}{required ? " *" : ""}</Label>
                <Controller
                  name={mainFieldName}
                  control={control}
                  rules={required ? { required: `${label} is required` } : {}}
                  render={({ field }) => (
                    <Checkbox id={mainFieldName} checked={!!field.value} onCheckedChange={field.onChange} />
                  )}
                />
                {errors?.eligibility?.[idx]?.[fieldKey] && <span className="text-red-500 text-xs">{errors.eligibility[idx][fieldKey].message}</span>}
              </div>
            );
          } else if (type === "number") {
            mainInput = (
              <div className="space-y-2" key={mainFieldName}>
                <Label htmlFor={mainFieldName}>{label}{required ? " *" : ""}</Label>
                <Controller
                  name={mainFieldName}
                  control={control}
                  rules={required ? { required: `${label} is required` } : {}}
                  render={({ field }) => (
                    <Input {...field} id={mainFieldName} type="number" value={field.value ?? ""} />
                  )}
                />
                {errors?.eligibility?.[idx]?.[fieldKey] && <span className="text-red-500 text-xs">{errors.eligibility[idx][fieldKey].message}</span>}
              </div>
            );
          } else if (type === "file") {
            mainInput = (
              <div className="space-y-2" key={mainFieldName}>
                <Label htmlFor={mainFieldName}>{label}{required ? " *" : ""}</Label>
                <Controller
                  name={mainFieldName}
                  control={control}
                  rules={required ? { required: `${label} is required` } : {}}
                  render={({ field }) => (
                    <Input id={mainFieldName} type="file" onChange={e => field.onChange(e.target.files)} />
                  )}
                />
                {errors?.eligibility?.[idx]?.[fieldKey] && <span className="text-red-500 text-xs">{errors.eligibility[idx][fieldKey].message}</span>}
              </div>
            );
          } else {
            mainInput = (
              <div className="space-y-2" key={mainFieldName}>
                <Label htmlFor={mainFieldName}>{label}{required ? " *" : ""}</Label>
                <Controller
                  name={mainFieldName}
                  control={control}
                  rules={required ? { required: `${label} is required` } : {}}
                  render={({ field }) => (
                    <Input {...field} id={mainFieldName} type="text" value={field.value ?? ""} />
                  )}
                />
                {errors?.eligibility?.[idx]?.[fieldKey] && <span className="text-red-500 text-xs">{errors.eligibility[idx][fieldKey].message}</span>}
              </div>
            );
          }

          // Render child table inputs if present
          const childInputs: JSX.Element[] = [];
          // Get watched value for this field from mainFieldValues
          const mainFieldValue = mainFieldValues?.[idx];
          if (Array.isArray(field.criteria_fields)) {
            field.criteria_fields.forEach((child: any, cidx: number) => {
              if (child.condition === "=") {
                const count = Number(mainFieldValue) || 0;
                for (let i = 0; i < count; i++) {
                  const repeatedChildFieldName = `eligibility[${idx}].child[${cidx}].${child.field}_${i}`;
                  childInputs.push(
                    <div className="space-y-2" key={repeatedChildFieldName}>
                      <Label htmlFor={repeatedChildFieldName}>{child.field} (#{i + 1})</Label>
                      <Controller
                        name={repeatedChildFieldName}
                        control={control}
                        render={({ field }) => (
                          <Input {...field} id={repeatedChildFieldName} type="text" value={field.value ?? ""} />
                        )}
                      />
                      {errors?.eligibility?.[idx]?.child?.[cidx]?.[`${child.field}_${i}`] && <span className="text-red-500 text-xs">{errors.eligibility[idx].child[cidx][`${child.field}_${i}`].message}</span>}
                    </div>
                  );
                }
              } else {
                const childFieldName = `eligibility[${idx}].child[${cidx}].${child.field}`;
                childInputs.push(
                  <div className="space-y-2" key={childFieldName}>
                    <Label htmlFor={childFieldName}>{child.field} ({child.condition})</Label>
                    <Controller
                      name={childFieldName}
                      control={control}
                      render={({ field }) => (
                        <Input {...field} id={childFieldName} type="text" value={field.value ?? ""} />
                      )}
                    />
                    {errors?.eligibility?.[idx]?.child?.[cidx]?.[child.field] && <span className="text-red-500 text-xs">{errors.eligibility[idx].child[cidx][child.field].message}</span>}
                  </div>
                );
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