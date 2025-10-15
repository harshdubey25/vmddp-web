import { Check } from "lucide-react";

interface Step {
  number: number;
  title: string;
}

interface RegistrationStepperProps {
  currentStep: number;
  steps: Step[];
}

export default function RegistrationStepper({ currentStep, steps }: RegistrationStepperProps) {
  return (
    <div className="w-full py-6">
  <div className="flex items-center justify-start gap-8 ml-20">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center relative">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  step.number < currentStep
                    ? "bg-primary border-primary text-primary-foreground"
                    : step.number === currentStep
                    ? "border-primary text-primary bg-background"
                    : "border-border text-muted-foreground bg-background"
                }`}
                data-testid={`step-circle-${step.number}`}
              >
                {step.number < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="font-semibold">{step.number}</span>
                )}
              </div>
              <p
                className={`text-xs mt-2 absolute top-12 whitespace-nowrap ${
                  step.number === currentStep ? "font-semibold text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.title}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  step.number < currentStep ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
