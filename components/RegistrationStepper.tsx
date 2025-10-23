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
    <div className="w-full py-8 sm:py-6">
      <div className="flex items-start justify-between gap-0 sm:gap-4 md:gap-8 px-1 sm:px-0">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-start flex-1">
            <div className="flex flex-col items-center relative w-full">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${step.number < currentStep
                    ? "bg-primary border-primary text-primary-foreground"
                    : step.number === currentStep
                      ? "border-primary text-primary bg-background"
                      : "border-border text-muted-foreground bg-background"
                  }`}
                data-testid={`step-circle-${step.number}`}
              >
                {step.number < currentStep ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <span className="font-semibold text-xs sm:text-base">{step.number}</span>
                )}
              </div>
              <p
                className={`text-[9px] leading-tight xs:text-[10px] sm:text-xs mt-2 sm:mt-2 text-center w-full px-0.5 break-words hyphens-auto ${step.number === currentStep ? "font-semibold text-foreground" : "text-muted-foreground"
                  }`}
              >
                {step.title}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 w-full max-w-[20px] xs:max-w-[30px] sm:max-w-none flex-1 mx-0.5 xs:mx-1 sm:mx-2 mt-4 sm:mt-5 shrink ${step.number < currentStep ? "bg-primary" : "bg-border"
                  }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
