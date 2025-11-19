"use client"
import { useState, useRef } from "react";
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
import { frappePublic } from "../../../lib/frappe";
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
        type: string;
        child: Array<{
            name: string;
            value: any;
            type: string;
        }>;
    }>;
    components: { component_name: string; questions: { question: string; type: string; options: string[] | null; value: string }[] }[];
    [key: `familyAadhaar${number}`]: string;
};

export default function RegisterClient({ criteriaFields }: { criteriaFields: any[] }) {

    const [currentStep, setCurrentStep] = useState(1);
    const [agreed, setAgreed] = useState(false);
    const [familyMemberCount, setFamilyMemberCount] = useState<number>(0);
    const [components, setComponents] = useState<any[]>([]);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submittedApplicationId, setSubmittedApplicationId] = useState<string>("");
    const [isFormSubmitted, setIsFormSubmitted] = useState(false);
    const canSubmitRef = useRef(false);
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
            value: item.value || null,

        }));
    };


    const handleNext = async () => {
        // Validate current step before proceeding
        let fieldsToValidate: (keyof RegisterFormValues)[] = [];
        if (currentStep === 1) {
            // Check if Aadhaar is verified before proceeding
            // if (!isAadhaarVerified) {
            //     toast({
            //         title: t('aadhaar_not_verified'),
            //         description: t('aadhaar_verification_required'),
            //         variant: "destructive"
            //     });
            //     return;
            // }

            fieldsToValidate = ['firstName', 'lastName', 'gender', 'category', 'mobile', 'aadhar_number', 'aadhaarImage', 'rationCardMembers', 'rationCardImage', 'district', 'taluka', 'village'];
            // Add family aadhaar fields if applicable
            const rationCardMembers = getValues('rationCardMembers');
            if (rationCardMembers > 1) {
                for (let i = 1; i < rationCardMembers; i++) {
                    fieldsToValidate.push(`familyAadhaar${i}` as keyof RegisterFormValues);
                }
            }
        } else if (currentStep === 2) {
            // Eligibility fields - validate all eligibility fields and their children
            const eligibilityData = getValues('eligibility') || [];
            const eligibilityFieldsToValidate: string[] = [];

            // Check if all tag numbers are verified
            let hasUnverifiedTagNumber = false;
            const allFormValues = getValues();

            console.log('All form values:', JSON.stringify(allFormValues.eligibility, null, 2));

            // Loop through criteriaFields to find tag number fields
            criteriaFields?.forEach((field, idx) => {
                if (Array.isArray(field.criteria_fields)) {
                    const mainFieldValue = allFormValues?.eligibility?.[idx]?.value;
                    let childIdx = 0; // Track the actual child index as we iterate through ALL children

                    field.criteria_fields.forEach((child: any, cidx: number) => {
                        if (child.extra_validation === "Tag Number") {
                            const count = child.condition === "=" ? (Number(mainFieldValue) || 0) : 1;

                            for (let i = 0; i < count; i++) {
                                const currentChildIdx = childIdx + i;
                                const tagValue = allFormValues?.eligibility?.[idx]?.child?.[currentChildIdx]?.value;
                                const isVerified = (allFormValues as any)?.eligibility?.[idx]?.child?.[currentChildIdx]?.verified;
                                console.log(`Tag check - idx: ${idx}, childIdx: ${currentChildIdx}, tagValue: ${tagValue}, isVerified: ${isVerified}`);

                                if (tagValue && !isVerified) {
                                    hasUnverifiedTagNumber = true;
                                }
                            }
                        }

                        // Increment childIdx for ALL children (same logic as EligibilityStep)
                        if (child.condition === "=") {
                            childIdx += Number(mainFieldValue) || 0;
                        } else {
                            childIdx += 1;
                        }
                    });
                }
            });

            if (hasUnverifiedTagNumber) {
                toast({
                    title: t('tag_number_not_verified') || 'Tag Number Not Verified',
                    description: t('tag_number_verification_required') || 'Please validate all tag numbers before proceeding.',
                    variant: "destructive"
                });
                return;
            }

            eligibilityData.forEach((_, idx) => {
                // Validate main eligibility field
                eligibilityFieldsToValidate.push(`eligibility.${idx}.value`);

                // Validate child fields if they exist
                const childData = eligibilityData[idx]?.child;
                if (Array.isArray(childData)) {
                    childData.forEach((_, childIdx) => {
                        eligibilityFieldsToValidate.push(`eligibility.${idx}.child.${childIdx}.value`);
                    });
                }
            });

            fieldsToValidate = eligibilityFieldsToValidate as (keyof RegisterFormValues)[];
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
                variant: "default"
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
                    variant: "default"
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

    const onSubmit = async (formData: RegisterFormValues) => {
        // Only allow submission if explicitly triggered by submit button
        if (!canSubmitRef.current) {
            return;
        }
        canSubmitRef.current = false; // Reset the flag

        // Only allow submission on the final step (step 5)
        if (currentStep !== 5) {
            return;
        }
        if (!agreed) {
            return;
        }
        setSubmitLoading(true);

        try {
            let applicationId = submittedApplicationId;

            // Only submit the form if it hasn't been submitted yet
            if (!isFormSubmitted) {
                // Extract family member Aadhar numbers
                const familyAadharNumbers: string[] = [];
                const familyMemberCount = parseInt(String(formData.rationCardMembers)) || 0;

                if (familyMemberCount > 1) {
                    for (let i = 1; i < familyMemberCount; i++) {
                        const fieldName = `familyAadhaar${i}` as keyof RegisterFormValues;
                        const aadharValue = formData[fieldName];
                        if (aadharValue && typeof aadharValue === 'string' && aadharValue.trim()) {
                            familyAadharNumbers.push(aadharValue.trim());
                        }
                    }
                }

                const submissionData = {
                    ...formData,
                    family_member_aadhar_number: familyAadharNumbers.join(','),
                    components: formData.components
                };

                // Submit the form first
                const res = await frappePublic.call().post('vmddp_app.api.app_form.create_app_form', {
                    data: submissionData
                });

                applicationId = res?.message?.name || res?.data?.name || '';

                if (!applicationId) {
                    throw new Error('Application ID not received');
                }

                // Mark form as submitted and store application ID
                setIsFormSubmitted(true);
                setSubmittedApplicationId(applicationId);

                // toast({
                //     title: t('application_submitted'),
                //     description: t('application_submitted_desc'),
                // });

                // Store form data in localStorage
                localStorage.setItem('submittedApplicationData', JSON.stringify({
                    ...formData,
                    applicationId,
                    submittedAt: new Date().toISOString()
                }));
            }

            // Call DigiLocker API to get the verification URL
            // Create unique verification ID with timestamp
            const timestamp = Date.now();
            const uniqueVerificationId = `${applicationId}_${timestamp}`;

            const digilockerResponse = await fetch('/api/digilocker/create-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    verification_id: uniqueVerificationId,
                    document_requested: ['AADHAAR'],
                    redirect_url: `${window.location.origin}/success?applicationId=${applicationId}&verification_id=${uniqueVerificationId}`,
                    user_flow: 'signup',
                }),
            });

            const digilockerData = await digilockerResponse.json();

            if (!digilockerResponse.ok || !digilockerData.success) {
                throw new Error(digilockerData.error || 'Failed to create DigiLocker URL');
            }

            const digilockerUrl = digilockerData.data?.url;

            if (digilockerUrl) {
                // Redirect to DigiLocker external URL
                window.location.href = digilockerUrl;
            } else {
                throw new Error('DigiLocker URL not received');
            }
        } catch (err: any) {
            console.error('Submission error:', err);
            toast({
                title: t('submission_error'),
                description: err.message || t('submission_error_desc'),
                variant: "destructive"
            });
            setSubmitLoading(false);
        }
    }

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-[calc(100vh-8rem)] sm:min-h-[calc(100vh-16rem)] py-6 sm:py-12 md:py-16">
            <div className="max-w-4xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-6 sm:mb-8">
                    <h1 className="font-display font-semibold text-xl xs:text-2xl sm:text-3xl mb-2 sm:mb-3 px-2" data-testid="text-register-title">
                        {t('register_title')}
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base px-2">
                        {t('register_subtitle')}
                    </p>
                </div>

                <RegistrationStepper currentStep={currentStep} steps={steps} />

                <Card className="mt-6 sm:mt-12 md:mt-16 shadow-sm">
                    <CardContent className="p-4 xs:p-5 sm:p-6 md:p-8">
                        <form onSubmit={handleSubmit(onSubmit)} onKeyDown={(e) => {
                            // Prevent form submission on Enter key unless on final step
                            if (e.key === 'Enter' && currentStep !== steps.length) {
                                e.preventDefault();
                            }
                        }}>

                            {currentStep === 1 && (
                                <BasicDetailsStep
                                    setValue={setValue}
                                    control={control}
                                    errors={errors}
                                    familyMemberCount={familyMemberCount}
                                    setFamilyMemberCount={setFamilyMemberCount}
                                />
                            )}

                            {currentStep === 2 && (
                                <EligibilityStep control={control} errors={errors} criteriaFields={criteriaFields} values={getValues()} setValue={setValue} />

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

                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t print:hidden">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleBack}
                                    disabled={currentStep === 1}
                                    data-testid="button-back"
                                    className="w-full order-2 sm:order-1"
                                >
                                    {t('back')}
                                </Button>
                                {currentStep < steps.length ? (
                                    <Button type="button" onClick={handleNext} data-testid="button-next" className="w-full order-1 sm:order-2">
                                        {t('next')}
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        data-testid="button-submit"
                                        disabled={submitLoading}
                                        className="w-full order-1 sm:order-2"
                                        onClick={() => {
                                            canSubmitRef.current = true;
                                        }}
                                    >
                                        {submitLoading ? t('submitting') : t('verify_with_digilocker')}
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
