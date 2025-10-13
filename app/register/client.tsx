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
import { frappePublic, frappeServer } from "../lib/frappe";

type RegisterFormValues = {
    firstName: string;
    middleName: string;
    lastName: string;
    gender: string;
    category: string;
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
    eligibility?: Array<{
        mainField: any;
        children?: Array<{
            [key: string]: any;
            values?: any[];
        }>;
    }>;
    [key: `familyAadhaar${number}`]: string;
};

const steps = [
    { number: 1, title: "Basic Details" },
    { number: 2, title: "Eligibility" },
    { number: 3, title: "Component" },
    { number: 4, title: "Bank Details" },
    { number: 5, title: "Review" },
];

export default function RegisterClient({ criteriaFields }: { criteriaFields: any[] }) {

    const [currentStep, setCurrentStep] = useState(1);
    const [agreed, setAgreed] = useState(false);
    const [familyMemberCount, setFamilyMemberCount] = useState<number>(0);
    const [components, setComponents] = useState<any[]>([]);
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
            category: "",
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

    // Helper to build criteria payload from form values and criteriaFields
    const buildCriteriaPayload = () => {
        const values = getValues();
        const eligibilityArr = values.eligibility || [];
        return eligibilityArr.map((item: any, idx: number) => {
            const field = criteriaFields[idx];
            // Find the actual field key used in EligibilityStep
            const fieldKey = field?.fieldname || field?.name || `criteria_${idx}`;
            return {
                criteria: field?.name1 || fieldKey,
                value: item?.[fieldKey]
            };
        });
    };


    const handleNext = async () => {
        if (currentStep === 2) {
            // Moving from Eligibility to Component step, fetch components
            const payload = buildCriteriaPayload();
            try {
                const res = await frappePublic.call().get('vmddp_app.api.components.get_components_by_criteria', {
                    criteria_list: payload
                });
                setComponents(res.message || []);
            } catch (err) {
                toast({
                    title: "Component Fetch Error",
                    description: "Could not fetch components for selected criteria.",
                    variant: "destructive"
                });
            }
        }
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

    const onSubmit = (formData: RegisterFormValues) => {
        if (!agreed) {
            toast({
                title: "Declaration Required",
                description: "Please agree to the declaration to submit your application",
                variant: "destructive"
            });
            return;
        }

        frappePublic.call().post('vmddp_app.api.app_form.create_app_form', {
            data: {
                ...formData,
                components: components.map((c) => c.component || c)
            }
        })
            .then((res: any) => {
                toast({
                    title: "Application Submitted",
                    description: "Your application has been successfully submitted. You will receive an SMS with your application ID.",
                });
                console.log("Application submitted", res);
            })
            .catch((err: any) => {
                toast({
                    title: "Submission Error",
                    description: "There was an error submitting your application. Please try again.",
                    variant: "destructive"
                });
                console.error("Application submission error", err);
            });
    }

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
                        <form onSubmit={handleSubmit(onSubmit)} >

                            {currentStep === 1 && (
                                <BasicDetailsStep
                                    control={control}
                                    errors={errors}
                                    familyMemberCount={familyMemberCount}
                                    setFamilyMemberCount={setFamilyMemberCount}
                                />
                            )}

                            {currentStep === 2 && (
                                <EligibilityStep control={control} errors={errors} criteriaFields={criteriaFields} />

                            )}

                            {currentStep === 3 && (
                                <ComponentStep control={control} errors={errors} components={components} />
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
                                    criteriaFields={criteriaFields}
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
                                    <Button type="submit" data-testid="button-submit">
                                        Submit Application
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
