import { Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  control: any;
  errors: any;
  components?: any[];
}



const ComponentStep = ({ control, errors, components = [] }: Props) => (
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
            {components.map((comp, idx) => (
              <label key={comp.component_name || idx} className="flex items-center gap-2">
                <Checkbox
                  checked={field.value?.includes(comp.component_name) || false}
                  onCheckedChange={checked => {
                    if (checked) {
                      field.onChange([...(field.value || []), comp.component_name]);
                    } else {
                      field.onChange((field.value || []).filter((v: string) => v !== comp.component_name));
                    }
                  }}
                  id={`component-checkbox-${comp.component_name}`}
                  data-testid={`component-checkbox-${comp.component_name}`}
                />
                <span>{comp.component_name}</span>
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