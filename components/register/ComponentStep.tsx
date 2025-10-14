import { Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Props {
  control: any;
  errors: any;
  components?: any[];
}

type ComponentSelection = {
  component_name: string;
  questions: { question: string; value: string }[];
};



const ComponentStep = ({ control, errors, components = [] }: Props) => {
  const { toast } = useToast();
  return (
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
              {components.map((comp, idx) => {
                const isSelected = field.value?.some((c: ComponentSelection) => c.component_name === comp.component_name) || false;
                const isValid = comp.is_valid;
                const reason = comp.reason;
                const orComponent = comp.or;
                return (
                  <div key={comp.component_name || idx}>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={isSelected}
                        disabled={!isValid}
                        onCheckedChange={checked => {
                          let newValue = [...(field.value || [])];
                          if (checked) {
                            // Check if the component that has this as 'or' is selected
                            const conflictingComponent = components.find(c => c.or === comp.component_name);
                            if (conflictingComponent && newValue.some((c: ComponentSelection) => c.component_name === conflictingComponent.component_name)) {
                              toast({
                                title: "Selection Conflict",
                                description: `You cannot select both ${comp.component_name} and ${conflictingComponent.component_name} at the same time.`,
                                variant: "destructive"
                              });
                              return;
                            }
                            // Check if this component's 'or' is selected
                            if (orComponent && newValue.some((c: ComponentSelection) => c.component_name === orComponent)) {
                              toast({
                                title: "Selection Conflict",
                                description: `You cannot select both ${comp.component_name} and ${orComponent} at the same time.`,
                                variant: "destructive"
                              });
                              return;
                            }
                            newValue.push({
                              component_name: comp.component_name,
                              questions: (comp.questions || []).map((q: string) => ({ question: q, value: "" }))
                            });
                            if (orComponent) {
                              newValue = newValue.filter((c: ComponentSelection) => c.component_name !== orComponent);
                            }
                            // Also remove any component that has this as or
                            if (conflictingComponent) {
                              newValue = newValue.filter((c: ComponentSelection) => c.component_name !== conflictingComponent.component_name);
                            }
                          } else {
                            newValue = newValue.filter((c: ComponentSelection) => c.component_name !== comp.component_name);
                          }
                          field.onChange(newValue);
                        }}
                        id={`component-checkbox-${comp.component_name}`}
                        data-testid={`component-checkbox-${comp.component_name}`}
                      />
                      <span>{comp.component_name}</span>
                    </label>
                    {!isValid && reason && <p className="text-red-500 text-xs ml-6">{reason}</p>}
                    {isSelected && comp.questions && comp.questions.length > 0 && (
                      <div className="ml-6 mt-2 space-y-2">
                        {field.value.find((c: ComponentSelection) => c.component_name === comp.component_name)?.questions.map((q: { question: string; value: string }, qIdx: number) => (
                          <div key={qIdx}>
                            <Label className="text-sm">{q.question}</Label>
                            <Input
                              value={q.value}
                              onChange={e => {
                                const newValue = field.value.map((c: ComponentSelection) => {
                                  if (c.component_name === comp.component_name) {
                                    const newQuestions = [...c.questions];
                                    newQuestions[qIdx].value = e.target.value;
                                    return { ...c, questions: newQuestions };
                                  }
                                  return c;
                                });
                                field.onChange(newValue);
                              }}
                              placeholder={`Enter ${q.question.toLowerCase()}`}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
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
};


export default ComponentStep;