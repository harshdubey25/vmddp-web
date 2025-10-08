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

const steps = [
    { number: 1, title: "Basic Details" },
    { number: 2, title: "Eligibility" },
    { number: 3, title: "Component" },
    { number: 4, title: "Review" },
];

export default function Register() {
    const [currentStep, setCurrentStep] = useState(1);
    const [agreed, setAgreed] = useState(false);
    const [familyMemberCount, setFamilyMemberCount] = useState<number>(0);
    const { toast } = useToast();

    const handleNext = () => {
        if (currentStep < 4) {
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

    const handleSubmit = () => {
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
                        {/* ...existing code... */}
                        {/* The full multi-step form logic is preserved from the original file. */}
                        {/* ...existing code... */}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
