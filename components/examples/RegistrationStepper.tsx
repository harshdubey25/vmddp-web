import RegistrationStepper from '../RegistrationStepper';

export default function RegistrationStepperExample() {
  const steps = [
    { number: 1, title: "Personal Details" },
    { number: 2, title: "Address" },
    { number: 3, title: "Component" },
    { number: 4, title: "Eligibility" },
    { number: 5, title: "Review" },
  ];

  return (
    <div className="p-6">
      <RegistrationStepper currentStep={3} steps={steps} />
    </div>
  );
}
