"use client"
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import RegistrationStepper from "@/components/RegistrationStepper";
import { useToast } from "@/hooks/use-toast";
import { User, Users, MapPin, Leaf, Award, Printer } from "lucide-react";

import { useForm, Controller, FieldErrors } from "react-hook-form";
import BasicDetailsStep from "@/components/register/BasicDetailsStep";
import EligibilityStep from "@/components/register/EligibilityStep";
import ComponentStep from "@/components/register/ComponentStep";
import BankDetailsStep from "@/components/register/BankDetailsStep";
import ReviewStep from "@/components/register/ReviewStep";

type RegisterFormValues = {
    firstName: string;
    middleName: string;
    lastName: string;
    gender: string;
    caste: string;
    mobile: string;
    aadhaar: string;
    aadhaarImage: string;
    rationCardMembers: number;
    rationCardImage: string;
    district: string;
    taluka: string;
    village: string;
    dairyAnimalCount: string;
    animalTagNumber: string;
    milkCertificate: string;
    landHolding: string;
    khasraNumber: string;
    milkPouringPoint: string;
    farmerPourerCode: string;
    schemeVerification: boolean;
    component: string;
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    [key: `familyAadhaar${number}`]: string;
};

const steps = [
    { number: 1, title: "Basic Details" },
    { number: 2, title: "Eligibility" },
    { number: 3, title: "Component" },
    { number: 4, title: "Bank Details" },
    { number: 5, title: "Review" },
];

export default function Register() {
    const [currentStep, setCurrentStep] = useState(1);
    const [agreed, setAgreed] = useState(false);
    const [familyMemberCount, setFamilyMemberCount] = useState<number>(0);
    const { toast } = useToast();
    const {
        control,
        handleSubmit,
        formState: { errors },
        getValues,
    } = useForm<RegisterFormValues>({
        mode: "onTouched",
        defaultValues: {
            firstName: "",
            middleName: "",
            lastName: "",
            gender: "",
            caste: "",
            mobile: "",
            aadhaar: "",
            aadhaarImage: "",
            rationCardMembers: 0,
            rationCardImage: "",
            district: "",
            taluka: "",
            village: "",
            dairyAnimalCount: "",
            animalTagNumber: "",
            milkCertificate: "",
            landHolding: "",
            khasraNumber: "",
            milkPouringPoint: "",
            farmerPourerCode: "",
            schemeVerification: false,
            component: "",
            accountHolderName: "",
            accountNumber: "",
            bankName: "",
            ifscCode: ""
        },
    });

    const handleNext = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const onSubmit = () => {
        if (!agreed) {
            toast({
                title: "Declaration Required",
                description: "Please agree to the declaration to submit your application",
                variant: "destructive"
            });
            return;
        }

        toast({
            title: "Application Submitted",
            description: "Your application has been successfully submitted. You will receive an SMS with your application ID.",
        });
        console.log("Application submitted");
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-[calc(100vh-16rem)] py-12 sm:py-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="font-display font-semibold text-2xl sm:text-3xl mb-3" data-testid="text-register-title">
                        Scheme Registration
                    </h1>
                    <p className="text-muted-foreground">
                        Complete your application for VMDDP scheme benefits
                    </p>
                </div>

                <RegistrationStepper currentStep={currentStep} steps={steps} />

                <Card className="mt-16">
                    <CardContent className="p-6 sm:p-8">
                        {currentStep === 1 && (
                            <BasicDetailsStep
                                control={control}
                                errors={errors}
                                familyMemberCount={familyMemberCount}
                                setFamilyMemberCount={setFamilyMemberCount}
                            />
                        )}

                        {currentStep === 2 && (
                            <EligibilityStep control={control} errors={errors} />

                        )}

                        {currentStep === 3 && (
                            <ComponentStep control={control} errors={errors} />

                        )}

                        {currentStep === 4 && (
                            <BankDetailsStep control={control} errors={errors} />

                        )}
                        {currentStep === 5 && (
                            <ReviewStep
                                values={getValues()}
                                agreed={agreed}
                                onAgreedChange={setAgreed}
                                familyMemberCount={familyMemberCount}
                                onPrint={handlePrint}
                            />
                        )}

                        <div className="flex justify-between mt-8 pt-6 border-t print:hidden">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                disabled={currentStep === 1}
                                data-testid="button-back"
                            >
                                Back
                            </Button>
                            {currentStep < steps.length ? (
                                <Button onClick={handleNext} data-testid="button-next">
                                    Next
                                </Button>
                            ) : (
                                <Button onClick={onSubmit} data-testid="button-submit">
                                    Submit Application
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
