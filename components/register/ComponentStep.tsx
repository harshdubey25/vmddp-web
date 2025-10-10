import { Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  control: any;
  errors: any;
}

const COMPONENT_OPTIONS = [
  { value: "1", label: "Animal Induction" },
  { value: "2", label: "HGM" },
  { value: "3", label: "Fertility Feed" },
  { value: "4", label: "Fodder Seed" },
  { value: "5", label: "SNF Enhancer" },
  { value: "6", label: "Supply Chaff Cutter" },
  { value: "7", label: "Supply Of Silage" },
  { value: "8", label: "Treatment of Infertile Animal" },
  { value: "9", label: "Farmer Training" },
];

const ComponentStep = ({ control, errors }: Props) => (
  <div className="space-y-6">
    <h2 className="font-display font-semibold text-xl mb-4">Component Selection</h2>
    <div className="space-y-2">
      <Label>Select Component(s) *</Label>
      <Controller
        name="components"
        control={control}
        rules={{ validate: v => (v && v.length > 0) || "At least one component must be selected" }}
        render={({ field }) => (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {COMPONENT_OPTIONS.map(option => (
              <label key={option.value} className="flex items-center gap-2">
                <Checkbox
                  checked={field.value?.includes(option.value) || false}
                  onCheckedChange={checked => {
                    if (checked) {
                      field.onChange([...(field.value || []), option.value]);
                    } else {
                      field.onChange((field.value || []).filter((v: string) => v !== option.value));
                    }
                  }}
                  id={`component-checkbox-${option.value}`}
                  data-testid={`component-checkbox-${option.value}`}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        )}
      />
      {errors.components && <span className="text-red-500 text-xs">{errors.components.message}</span>}
      <p className="text-sm text-muted-foreground mt-2">
        Select one or more dairy development components you wish to apply for
      </p>
    </div>
  </div>
);

export default ComponentStep;