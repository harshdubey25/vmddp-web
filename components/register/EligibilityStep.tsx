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
  return (
    <div className="space-y-6">
      <h2 className="font-display font-semibold text-xl mb-4">Eligibility Details</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {criteriaFields?.map((field, idx) => {
          const name = field.fieldname || field.name || `criteria_${idx}`;
          const label = field.label || name;
          const type = field.type || "text";
          const required = field.required || false;
          // Render main field input
          let mainInput = null;
          if (type === "checkbox") {
            mainInput = (
              <div className="space-y-2" key={name}>
                <Label htmlFor={name}>{label}{required ? " *" : ""}</Label>
                <Controller
                  name={name}
                  control={control}
                  rules={required ? { required: `${label} is required` } : {}}
                  render={({ field }) => (
                    <Checkbox id={name} checked={!!field.value} onCheckedChange={field.onChange} />
                  )}
                />
                {errors[name] && <span className="text-red-500 text-xs">{errors[name].message}</span>}
              </div>
            );
          } else if (type === "number") {
            mainInput = (
              <div className="space-y-2" key={name}>
                <Label htmlFor={name}>{label}{required ? " *" : ""}</Label>
                <Controller
                  name={name}
                  control={control}
                  rules={required ? { required: `${label} is required` } : {}}
                  render={({ field }) => (
                    <Input {...field} id={name} type="number" value={field.value ?? ""} />
                  )}
                />
                {errors[name] && <span className="text-red-500 text-xs">{errors[name].message}</span>}
              </div>
            );
          } else if (type === "file") {
            mainInput = (
              <div className="space-y-2" key={name}>
                <Label htmlFor={name}>{label}{required ? " *" : ""}</Label>
                <Controller
                  name={name}
                  control={control}
                  rules={required ? { required: `${label} is required` } : {}}
                  render={({ field }) => (
                    <Input id={name} type="file" onChange={e => field.onChange(e.target.files)} />
                  )}
                />
                {errors[name] && <span className="text-red-500 text-xs">{errors[name].message}</span>}
              </div>
            );
          } else {
            mainInput = (
              <div className="space-y-2" key={name}>
                <Label htmlFor={name}>{label}{required ? " *" : ""}</Label>
                <Controller
                  name={name}
                  control={control}
                  rules={required ? { required: `${label} is required` } : {}}
                  render={({ field }) => (
                    <Input {...field} id={name} type="text" value={field.value ?? ""} />
                  )}
                />
                {errors[name] && <span className="text-red-500 text-xs">{errors[name].message}</span>}
              </div>
            );
          }

          // Render child table inputs if present
          let childInputs: JSX.Element[] = [];
          if (Array.isArray(field.criteria_fields)) {
            // Get main field value from form
            // Use useWatch to get the value for this field
            const mainFieldValue = useWatch({ control, name });
            field.criteria_fields.forEach((child: any, cidx: number) => {
              if (child.condition === "=") {
                // Render N inputs where N = mainFieldValue (if number)
                const count = Number(mainFieldValue) || 0;
                for (let i = 0; i < count; i++) {
                  childInputs.push(
                    <div className="space-y-2" key={`${name}_child_${cidx}_${i}`}>
                      <Label htmlFor={`${name}_child_${cidx}_${i}`}>{child.field} (#{i + 1})</Label>
                      <Controller
                        name={`${name}_child_${cidx}_${i}`}
                        control={control}
                        render={({ field }) => (
                          <Input {...field} id={`${name}_child_${cidx}_${i}`} type="text" value={field.value ?? ""} />
                        )}
                      />
                      {errors[`${name}_child_${cidx}_${i}`] && <span className="text-red-500 text-xs">{errors[`${name}_child_${cidx}_${i}`].message}</span>}
                    </div>
                  );
                }
              } else {
                // Render single input for other conditions
                childInputs.push(
                  <div className="space-y-2" key={`${name}_child_${cidx}`}>
                    <Label htmlFor={`${name}_child_${cidx}`}>{child.field} ({child.condition})</Label>
                    <Controller
                      name={`${name}_child_${cidx}`}
                      control={control}
                      render={({ field }) => (
                        <Input {...field} id={`${name}_child_${cidx}`} type="text" value={field.value ?? ""} />
                      )}
                    />
                    {errors[`${name}_child_${cidx}`] && <span className="text-red-500 text-xs">{errors[`${name}_child_${cidx}`].message}</span>}
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