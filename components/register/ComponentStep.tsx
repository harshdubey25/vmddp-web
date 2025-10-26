import { Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

interface Props {
  control: any;
  errors: any;
  components?: any[];
}

type Question = {
  question: string;
  type: string;
  options: string[] | null;
  value: string;
};

type ComponentSelection = {
  component_name: string;
  questions: Question[];
};



const ComponentStep = ({ control, errors, components = [] }: Props) => {
  const { toast } = useToast();
  const { t, i18n } = useTranslation('common');
  return (
    <div className="space-y-6">
      <h2 className="font-display font-semibold text-xl mb-4">{t('component_selection_title')}</h2>
      <div className="space-y-2">
        <Label>{t('select_components')} *</Label>
        <Controller
          name="components"
          control={control}
          rules={{ validate: v => (v && v.length > 0) || t('component_selection_required') }}
          render={({ field }) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {components.map((comp, idx) => {
                const isSelected = field.value?.some((c: ComponentSelection) => c.component_name === comp.component_name) || false;
                const isValid = comp.is_valid;
                const reason = (i18n.language === 'mr' && comp.reason_marathi) ? comp.reason_marathi : comp.reason;
                const componentName = (i18n.language === 'mr' && comp.name_in_local_language) ? comp.name_in_local_language : comp.component_name;
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
                              const conflictingComponentName = (i18n.language === 'mr' && conflictingComponent.name_in_local_language)
                                ? conflictingComponent.name_in_local_language
                                : conflictingComponent.component_name;
                              toast({
                                title: t('selection_conflict_title'),
                                description: t('selection_conflict_description', {
                                  component1: componentName,
                                  component2: conflictingComponentName
                                }),
                                variant: "destructive"
                              });
                              return;
                            }
                            // Check if this component's 'or' is selected
                            if (orComponent && newValue.some((c: ComponentSelection) => c.component_name === orComponent)) {
                              const orComponentObj = components.find(c => c.component_name === orComponent);
                              const orComponentName = (i18n.language === 'mr' && orComponentObj?.name_in_local_language)
                                ? orComponentObj.name_in_local_language
                                : orComponent;
                              toast({
                                title: t('selection_conflict_title'),
                                description: t('selection_conflict_description', {
                                  component1: componentName,
                                  component2: orComponentName
                                }),
                                variant: "destructive"
                              });
                              return;
                            }
                            newValue.push({
                              component_name: comp.component_name,
                              questions: (comp.questions || []).map((q: any) => ({
                                question: q.question,
                                type: q.type,
                                options: q.options,
                                value: ""
                              }))
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
                      <span>{componentName}</span>
                    </label>
                    {!isValid && reason && <p className="text-red-500 text-xs ml-6">{reason}</p>}
                    {isSelected && comp.questions && comp.questions.length > 0 && (
                      <div className="ml-6 mt-2 space-y-2">
                        {field.value.find((c: ComponentSelection) => c.component_name === comp.component_name)?.questions.map((q: Question, qIdx: number) => (
                          <div key={qIdx}>
                            <Label className="text-sm">{q.question}</Label>
                            {q.type === "Select" && q.options ? (
                              <Select
                                value={q.value || ""}
                                onValueChange={value => {
                                  const newValue = field.value.map((c: ComponentSelection) => {
                                    if (c.component_name === comp.component_name) {
                                      const newQuestions = [...c.questions];
                                      newQuestions[qIdx].value = value;
                                      return { ...c, questions: newQuestions };
                                    }
                                    return c;
                                  });
                                  field.onChange(newValue);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={t('select_option', { option: q.question.toLowerCase() })} />
                                </SelectTrigger>
                                <SelectContent>
                                  {q.options.map((option, optIdx) => (
                                    <SelectItem key={optIdx} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                value={q.value || ""}
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
                                placeholder={t('enter_option', { option: q.question.toLowerCase() })}
                              />
                            )}
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
          {t('component_selection_description')}
        </p>
      </div>
    </div>
  );
};


export default ComponentStep;