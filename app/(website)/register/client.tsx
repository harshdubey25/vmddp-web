"use client"
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RegistrationStepper from "@/components/RegistrationStepper";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import BasicDetailsStep from "@/components/register/BasicDetailsStep";
import EligibilityStep from "@/components/register/EligibilityStep";
import ComponentStep from "@/components/register/ComponentStep";
import BankDetailsStep from "@/components/register/BankDetailsStep";
import ReviewStep from "@/components/register/ReviewStep";
import { frappePublic, frappeServer } from "../../../lib/frappe";
import { useRouter } from "next/navigation";
import { useTranslation } from 'react-i18next';

type RegisterFormValues = {
    firstName: string;
    middleName: string;
    lastName: string;
    gender: string;
    category: string;
    mobile: string;
    aadhar_number: string;
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
        name: string;
        value: any;
        child: Array<{
            name: string;
            value: any;
        }>;
    }>;
    components: { component_name: string; questions: { question: string; type: string; options: string[] | null; value: string }[] }[];
    [key: `familyAadhaar${number}`]: string;
};

export default function RegisterClient({ criteriaFields }: { criteriaFields: any[] }) {

    const [currentStep, setCurrentStep] = useState(2);
    const [agreed, setAgreed] = useState(false);
    const [familyMemberCount, setFamilyMemberCount] = useState<number>(0);
    const [components, setComponents] = useState<any[]>([]);
    const [submitLoading, setSubmitLoading] = useState(false)
    const { toast } = useToast();
    const router = useRouter();
    const { t } = useTranslation('common');

    const steps = [
        { number: 1, title: t('step_basic_details') },
        { number: 2, title: t('step_eligibility') },
        { number: 3, title: t('step_component') },
        { number: 4, title: t('step_bank_details') },
        { number: 5, title: t('step_review') },
    ];
    const {
        control,
        handleSubmit,
        formState: { errors },
        getValues,
        trigger,
        reset,
        setValue,
    } = useForm<RegisterFormValues>({
        mode: "onTouched",
        defaultValues: {
            firstName: "",
            middleName: "",
            lastName: "",
            gender: "",
            category: "",
            mobile: "",
            aadhar_number: "",
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
            components: [],
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
        return eligibilityArr.map((item: any) => ({
            criteria: item.name,
            value: item.value || null
        }));
    };


    const handleNext = async () => {
        // Validate current step before proceeding
        let fieldsToValidate: (keyof RegisterFormValues)[] = [];
        if (currentStep === 1) {
            fieldsToValidate = ['firstName', 'lastName', 'gender', 'category', 'mobile', 'aadhar_number', 'aadhaarImage', 'rationCardMembers', 'rationCardImage', 'district', 'taluka', 'village'];
            // Add family aadhaar fields if applicable
            const rationCardMembers = getValues('rationCardMembers');
            if (rationCardMembers > 1) {
                for (let i = 1; i < rationCardMembers; i++) {
                    fieldsToValidate.push(`familyAadhaar${i}` as keyof RegisterFormValues);
                }
            }
        } else if (currentStep === 2) {
            // Eligibility fields - assuming eligibility is an array, but need to check specific criteria
            // For now, assume all eligibility fields are required if present
            fieldsToValidate = ['eligibility'];
        } else if (currentStep === 3) {
            fieldsToValidate = ['components'];
        } else if (currentStep === 4) {
            fieldsToValidate = ['accountHolderName', 'accountNumber', 'bankName', 'ifscCode'];
        }

        const isValid = await trigger(fieldsToValidate);
        if (!isValid) {
            toast({
                title: t('validation_error'),
                description: t('validation_error_desc'),
                variant: "destructive"
            });
            return;
        }

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
                    title: t('component_fetch_error'),
                    description: t('component_fetch_error_desc'),
                    variant: "destructive"
                });
                return; // Don't proceed if fetch fails
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
            // toast({
            //     title: "Declaration Required",
            //     description: "Please agree to the declaration to submit your application",
            //     variant: "destructive"
            // });
            return;
        }
        setSubmitLoading(true)
        frappePublic.call().post('vmddp_app.api.app_form.create_app_form', {
            data: {
                ...formData,
                components: formData.components
            }
        }).then((res: any) => {
            toast({
                title: t('application_submitted'),
                description: t('application_submitted_desc'),
            });
            console.log("Application submitted", res);

            // Extract application ID from response
            const applicationId = res?.message?.name || res?.data?.name || '';

            // Store form data in localStorage for success page
            localStorage.setItem('submittedApplicationData', JSON.stringify({
                ...formData,
                applicationId,
                submittedAt: new Date().toISOString()
            }));

            // Redirect to success page with application ID
            router.push(`/success?applicationId=${applicationId}`);
        }).catch((err: any) => {
            toast({
                title: t('submission_error'),
                description: t('submission_error_desc'),
                variant: "destructive"
            });
            console.error("Application submission error", err);
        }).finally(() => setSubmitLoading(false));
    }

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-[calc(100vh-16rem)] py-12 sm:py-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="font-display font-semibold text-2xl sm:text-3xl mb-3" data-testid="text-register-title">
                        {t('register_title')}
                    </h1>
                    <p className="text-muted-foreground">
                        {t('register_subtitle')}
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
                                <EligibilityStep control={control} errors={errors} criteriaFields={criteriaFields} values={getValues()} />

                            )}

                            {currentStep === 3 && (
                                <ComponentStep control={control} errors={errors} components={components} />
                            )}

                            {currentStep === 4 && (
                                <BankDetailsStep control={control} errors={errors} setValue={setValue} />

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
                                    {t('back')}
                                </Button>
                                {currentStep < steps.length ? (
                                    <Button onClick={handleNext} data-testid="button-next">
                                        {t('next')}
                                    </Button>
                                ) : (
                                    <Button type="submit" data-testid="button-submit" disabled={submitLoading} >
                                        {t('submit_application')}
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
