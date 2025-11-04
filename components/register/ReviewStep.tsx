
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Users, MapPin, Leaf, Award, Printer } from "lucide-react";
import { useTranslation } from 'react-i18next';

type ComponentSelection = {
  component_name: string;
  questions: { question: string; type: string; options: string[] | null; value: string }[];
};

const COMPONENT_OPTIONS = [
  { value: "1", label: "Animal Induction", description: "Induction of new animals into the dairy system." },
  { value: "2", label: "HGM", description: "High Genetic Merit animal support." },
  { value: "3", label: "Fertility Feed", description: "Special feed to improve animal fertility." },
  { value: "4", label: "Fodder Seed", description: "Distribution of quality fodder seeds." },
  { value: "5", label: "SNF Enhancer", description: "Enhancer for Solids-Not-Fat in milk." },
  { value: "6", label: "Supply Chaff Cutter", description: "Provision of chaff cutters for fodder processing." },
  { value: "7", label: "Supply Of Silage", description: "Supply of silage for animal nutrition." },
  { value: "8", label: "Treatment of Infertile Animal", description: "Veterinary support for infertile animals." },
  { value: "9", label: "Farmer Training", description: "Training programs for dairy farmers." },
];

interface ReviewStepProps {
  values: any & {
    components?: ComponentSelection[];
  };
  familyMemberCount: number;
  agreed: boolean;
  onAgreedChange: (checked: boolean) => void;
  criteriaFields?: any[];
  components?: any[]; // Add original components data for translations
  onPrint?: () => void;
}

const ReviewStep = ({ values, familyMemberCount, agreed, onAgreedChange, onPrint, criteriaFields, components }: ReviewStepProps) => {
  const { t, i18n } = useTranslation('common');
  console.log("review step values", values);

  const getFileName = (url: any) => {
    if (!url || typeof url !== 'string') return t('not_uploaded');
    try {
      return url.split('/').pop() || t('unknown_file');
    } catch {
      return t('unknown_file');
    }
  };

  // Helper function to get localized criteria name
  const getCriteriaName = (criteriaName: string) => {
    if (i18n.language === 'mr' && criteriaFields) {
      const criteriaField = criteriaFields.find(field =>
        field.fieldname === criteriaName ||
        field.name === criteriaName ||
        field.name1 === criteriaName
      );
      if (criteriaField && criteriaField.name_in_local_language) {
        return criteriaField.name_in_local_language;
      }
    }
    return criteriaName;
  };

  // Helper function to get localized component name
  const getComponentName = (componentName: string) => {
    if (i18n.language === 'mr' && components) {
      const component = components.find(comp => comp.component_name === componentName);
      if (component && component.name_in_local_language) {
        return component.name_in_local_language;
      }
    }
    return componentName;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold text-xl mb-2">{t('review_submit_title')}</h2>
          <p className="text-sm text-muted-foreground">{t('review_submit_description')}</p>
        </div>
        {/* {onPrint && (
          <button
            type="button"
            onClick={onPrint}
            className="gap-2 print:hidden border rounded px-3 py-2 flex items-center"
            data-testid="button-print"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        )} */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <User className="w-4 h-4" />
            {t('personal_information')}
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <Label className="text-muted-foreground">{t('full_name')}</Label>
              <p className="font-medium">{values.firstName} {values.middleName} {values.lastName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('gender')}</Label>
              <p className="font-medium">{values.gender}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('caste_category')}</Label>
              <p className="font-medium">{values.category}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('mobile_number')}</Label>
              <p className="font-medium">{values.mobile}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('aadhar_number')}</Label>
              <p className="font-medium">{values.aadhar_number}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('aadhar_image')}</Label>
              <p className="font-medium">{getFileName(values.aadhaarImage)}</p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" />
            {t('family_details')}
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <Label className="text-muted-foreground">{t('ration_card_members')}</Label>
              <p className="font-medium">{values.rationCardMembers}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('self_ration_card_image')}</Label>
              <p className="font-medium">{getFileName(values.rationCardImage)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('family_ration_card_image')}</Label>
              <p className="font-medium">{getFileName(values.familyRationCardImage)}</p>
            </div>
            {familyMemberCount > 1 && (
              <div>
                <Label className="text-muted-foreground">{t('family_members_aadhar')}</Label>
                <div className="space-y-1 mt-1">
                  {Array.from({ length: familyMemberCount - 1 }).map((_, index) => (
                    <p key={index} className="font-medium text-xs font-mono">{values[`familyAadhaar${index + 1}`]}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {t('location_details')}
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <Label className="text-muted-foreground">{t('district')}</Label>
              <p className="font-medium">{values.district}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('taluka')}</Label>
              <p className="font-medium">{values.taluka}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('village')}</Label>
              <p className="font-medium">{values.village}</p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Leaf className="w-4 h-4" />
            {t('eligibility_criteria')}
          </h3>
          <div className="space-y-3 text-sm">
            {Array.isArray(values.eligibility) && values.eligibility.map((item: any, idx: number) => {
              // Display value based on type
              let displayValue = item.value;
              if (item.type === 'checkbox') {
                displayValue = item.value ? 'yes' : 'no';
              } else if (item.value && typeof item.value === 'string' && (item.value.startsWith('http') || item.value.includes('/files/'))) {
                displayValue = getFileName(item.value);
              }

              return (
                <div key={idx}>
                  <Label className="text-muted-foreground">{getCriteriaName(item.name)}</Label>
                  <p className="font-medium">{displayValue}</p>
                  {Array.isArray(item.child) && item.child.length > 0 && (
                    <div className="ml-4 space-y-1">
                      {item.child.map((child: any, cidx: number) => {
                        // Display child value based on type
                        let childDisplayValue = child.value;
                        if (child.type === 'checkbox') {
                          childDisplayValue = child.value ? 'yes' : 'no';
                        } else if (child.value && typeof child.value === 'string' && (child.value.startsWith('http') || child.value.includes('/files/'))) {
                          childDisplayValue = getFileName(child.value);
                        }

                        return (
                          <div key={cidx}>
                            <Label className="text-xs text-muted-foreground">{getCriteriaName(child.name)}</Label>
                            <p className="text-xs font-mono">{childDisplayValue}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Award className="w-4 h-4" />
          {t('component_details')}
        </h3>
        <div className="p-4 bg-primary/5 rounded-lg space-y-4">
          <div>
            <Label className="text-muted-foreground">{t('selected_components')}</Label>
            <div className="mt-1">
              {Array.isArray(values.components)
                ? values.components.map((comp: ComponentSelection, idx: number) => {
                  const option = COMPONENT_OPTIONS.find(o => o.label === comp.component_name);
                  const localizedComponentName = getComponentName(comp.component_name);
                  return (
                    <div key={idx} className="mb-4 p-3 bg-white rounded border">
                      <p className="font-medium text-base">{localizedComponentName}</p>
                      {option && <p className="text-sm text-muted-foreground mb-2">{option.description}</p>}
                      {comp.questions && comp.questions.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <Label className="text-sm font-medium">{t('questions')}:</Label>
                          {comp.questions.map((q, qIdx) => (
                            <div key={qIdx} className="text-sm">
                              <span className="font-medium">{q.question}:</span>
                              <span className="ml-2 text-muted-foreground">{q.value || t('not_answered')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
                : (() => {
                  const option = COMPONENT_OPTIONS.find(o => o.value === values.component);
                  const localizedComponentName = getComponentName(values.component);
                  return (
                    <div>
                      <p className="font-medium text-base">{option ? localizedComponentName : values.component}</p>
                      {option && <p className="text-sm text-muted-foreground">{option.description}</p>}
                    </div>
                  );
                })()}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-5 print:break-inside-avoid">
        <div className="flex items-start gap-4">
          <Checkbox
            id="declaration"
            checked={agreed}
            onCheckedChange={onAgreedChange}
            data-testid="checkbox-declaration"
            className="mt-1"
          />
          <div className="flex-1">
            <Label htmlFor="declaration" className="text-sm font-medium cursor-pointer block mb-1">
              {t('declaration')}
            </Label>
            <p className="text-sm text-muted-foreground cursor-pointer" onClick={() => onAgreedChange(!agreed)}>
              {t('declaration_text')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

};

export default ReviewStep;