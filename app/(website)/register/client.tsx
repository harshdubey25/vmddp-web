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

    const [currentStep, setCurrentStep] = useState(1);
    const [agreed, setAgreed] = useState(false);
    const [familyMemberCount, setFamilyMemberCount] = useState<number>(0);
    const [components, setComponents] = useState<any[]>([]);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [isAadhaarVerified, setIsAadhaarVerified] = useState(false);
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
            // Check if Aadhaar is verified before proceeding
            if (!isAadhaarVerified) {
                toast({
                    title: t('aadhaar_not_verified'),
                    description: t('aadhaar_verification_required'),
                    variant: "destructive"
                });
                return;
            }

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

            // Loop through criteriaFields to find tag number fields
            criteriaFields?.forEach((field, idx) => {
                if (Array.isArray(field.criteria_fields)) {
                    field.criteria_fields.forEach((child: any, cidx: number) => {
                        if (child.extra_validation === "Tag Number") {
                            const mainFieldValue = allFormValues?.eligibility?.[idx]?.value;
                            const count = child.condition === "=" ? (Number(mainFieldValue) || 0) : 1;

                            let childIdx = 0;
                            // Calculate the correct childIdx based on previous child fields
                            for (let prevCidx = 0; prevCidx < cidx; prevCidx++) {
                                const prevChild = field.criteria_fields[prevCidx];
                                if (prevChild.condition === "=") {
                                    childIdx += Number(mainFieldValue) || 0;
                                } else {
                                    childIdx += 1;
                                }
                            }

                            for (let i = 0; i < count; i++) {
                                const currentChildIdx = childIdx + i;
                                const tagValue = allFormValues?.eligibility?.[idx]?.child?.[currentChildIdx]?.value;
                                const isVerified = (allFormValues as any)?.eligibility?.[idx]?.child?.[currentChildIdx]?.verified;

                                if (tagValue && !isVerified) {
                                    hasUnverifiedTagNumber = true;
                                }
                            }
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

    const onSubmit = (formData: RegisterFormValues) => {
        if (!agreed) {
            return;
        }
        setSubmitLoading(true);

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


        frappePublic.call().post('vmddp_app.api.app_form.create_app_form', {
            data: submissionData
        }).then((res: any) => {
            toast({
                title: t('application_submitted'),
                description: t('application_submitted_desc'),
            });

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
        }).finally(() => setSubmitLoading(false));
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
                        <form onSubmit={handleSubmit(onSubmit)} >

                            {currentStep === 1 && (
                                <BasicDetailsStep
                                    control={control}
                                    errors={errors}
                                    familyMemberCount={familyMemberCount}
                                    setFamilyMemberCount={setFamilyMemberCount}
                                    isAadhaarVerified={isAadhaarVerified}
                                    setIsAadhaarVerified={setIsAadhaarVerified}
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

                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t print:hidden">
                                <Button
                                    variant="outline"
                                    onClick={handleBack}
                                    disabled={currentStep === 1}
                                    data-testid="button-back"
                                    className="w-full order-2 sm:order-1"
                                >
                                    {t('back')}
                                </Button>
                                {currentStep < steps.length ? (
                                    <Button onClick={handleNext} data-testid="button-next" className="w-full order-1 sm:order-2">
                                        {t('next')}
                                    </Button>
                                ) : (
                                    <Button type="submit" data-testid="button-submit" disabled={submitLoading} className="w-full order-1 sm:order-2">
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
