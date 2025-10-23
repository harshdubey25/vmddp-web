
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Users, MapPin, Leaf, Award, Printer } from "lucide-react";

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
  onPrint?: () => void;
}

const ReviewStep = ({ values, familyMemberCount, agreed, onAgreedChange, onPrint, criteriaFields }: ReviewStepProps) => {
  console.log("review step values", values);

  const getFileName = (url: any) => {
    if (!url || typeof url !== 'string') return "Not uploaded";
    try {
      return url.split('/').pop() || "Unknown file";
    } catch {
      return "Unknown file";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold text-xl mb-2">Review & Submit</h2>
          <p className="text-sm text-muted-foreground">Please review all the information before submitting your application</p>
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
            Personal Information
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <Label className="text-muted-foreground">Full Name</Label>
              <p className="font-medium">{values.firstName} {values.middleName} {values.lastName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Gender</Label>
              <p className="font-medium">{values.gender}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Caste/Category</Label>
              <p className="font-medium">{values.category}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Mobile Number</Label>
              <p className="font-medium">{values.mobile}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Aadhar Number</Label>
              <p className="font-medium">{values.aadhaar}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Aadhar Image</Label>
              <p className="font-medium">{getFileName(values.aadhaarImage)}</p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" />
            Family Details
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <Label className="text-muted-foreground">Ration Card Members</Label>
              <p className="font-medium">{values.rationCardMembers}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Self Ration Card Image</Label>
              <p className="font-medium">{getFileName(values.rationCardImage)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Family Ration Card Image</Label>
              <p className="font-medium">{getFileName(values.familyRationCardImage)}</p>
            </div>
            {familyMemberCount > 1 && (
              <div>
                <Label className="text-muted-foreground">Family Members&apos; Aadhar Numbers</Label>
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
            Location Details
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <Label className="text-muted-foreground">District</Label>
              <p className="font-medium">{values.district}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Taluka</Label>
              <p className="font-medium">{values.taluka}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Village</Label>
              <p className="font-medium">{values.village}</p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Leaf className="w-4 h-4" />
            Eligibility & Criteria
          </h3>
          <div className="space-y-3 text-sm">
            {Array.isArray(values.eligibility) && values.eligibility.map((item: any, idx: number) => (
              <div key={idx}>
                <Label className="text-muted-foreground">{item.name}</Label>
                <p className="font-medium">{item.value && typeof item.value === 'string' && (item.value.startsWith('http') || item.value.includes('/files/')) ? getFileName(item.value) : item.value}</p>
                {Array.isArray(item.child) && item.child.length > 0 && (
                  <div className="ml-4 space-y-1">
                    {item.child.map((child: any, cidx: number) => (
                      <div key={cidx}>
                        <Label className="text-xs text-muted-foreground">{child.name}</Label>
                        <p className="text-xs font-mono">{child.value && typeof child.value === 'string' && (child.value.startsWith('http') || child.value.includes('/files/')) ? getFileName(child.value) : child.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Award className="w-4 h-4" />
          Component Details
        </h3>
        <div className="p-4 bg-primary/5 rounded-lg space-y-4">
          <div>
            <Label className="text-muted-foreground">Selected Component(s)</Label>
            <div className="mt-1">
              {Array.isArray(values.components)
                ? values.components.map((comp: ComponentSelection, idx: number) => {
                  const option = COMPONENT_OPTIONS.find(o => o.label === comp.component_name);
                  return (
                    <div key={idx} className="mb-4 p-3 bg-white rounded border">
                      <p className="font-medium text-base">{comp.component_name}</p>
                      {option && <p className="text-sm text-muted-foreground mb-2">{option.description}</p>}
                      {comp.questions && comp.questions.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <Label className="text-sm font-medium">Questions:</Label>
                          {comp.questions.map((q, qIdx) => (
                            <div key={qIdx} className="text-sm">
                              <span className="font-medium">{q.question}:</span>
                              <span className="ml-2 text-muted-foreground">{q.value || "Not answered"}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
                : (() => {
                  const option = COMPONENT_OPTIONS.find(o => o.value === values.component);
                  return (
                    <div>
                      <p className="font-medium text-base">{option ? option.label : values.component}</p>
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
              Declaration
            </Label>
            <p className="text-sm text-muted-foreground cursor-pointer" onClick={() => onAgreedChange(!agreed)}>
              I hereby declare that all the information provided by me is true and correct to the best of my knowledge. I understand that any false information may lead to rejection of my application and penal action as per law.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

};

export default ReviewStep;