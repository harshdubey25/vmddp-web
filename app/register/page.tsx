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
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <h2 className="font-display font-semibold text-xl mb-4">Basic Details</h2>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name *</Label>
                                        <Input id="firstName" data-testid="input-first-name" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="middleName">Mid Name</Label>
                                        <Input id="middleName" data-testid="input-middle-name" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name *</Label>
                                        <Input id="lastName" data-testid="input-last-name" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="gender">Gender *</Label>
                                        <Select>
                                            <SelectTrigger id="gender" data-testid="select-gender">
                                                <SelectValue placeholder="Select Gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="caste">Caste *</Label>
                                        <Select>
                                            <SelectTrigger id="caste" data-testid="select-caste">
                                                <SelectValue placeholder="Select Caste" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="general">General</SelectItem>
                                                <SelectItem value="sc">SC</SelectItem>
                                                <SelectItem value="st">ST</SelectItem>
                                                <SelectItem value="obc">OBC</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="mobile">Mobile No. *</Label>
                                    <Input id="mobile" type="tel" data-testid="input-mobile" />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="aadhaar">Aadhar Number *</Label>
                                        <Input id="aadhaar" data-testid="input-aadhaar" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="aadhaarImage">Aadhar Image *</Label>
                                        <Input id="aadhaarImage" type="file" accept="image/*" data-testid="input-aadhaar-image" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="rationCardMembers">Number of members in Ration Card *</Label>
                                        <Input
                                            id="rationCardMembers"
                                            type="number"
                                            min="1"
                                            value={familyMemberCount || ''}
                                            onChange={(e) => setFamilyMemberCount(parseInt(e.target.value) || 0)}
                                            data-testid="input-ration-card-members"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="rationCardImage">Ration Card Image *</Label>
                                        <Input id="rationCardImage" type="file" accept="image/*" data-testid="input-ration-card-image" />
                                    </div>
                                </div>

                                {familyMemberCount > 1 && (
                                    <div className="space-y-4">
                                        <h3 className="font-medium text-sm">Family Members' Aadhar Numbers ({familyMemberCount - 1} members)</h3>
                                        {Array.from({ length: familyMemberCount - 1 }).map((_, index) => (
                                            <div key={index} className="space-y-2">
                                                <Label htmlFor={`familyAadhaar${index + 1}`}>Family Member {index + 1} Aadhar Number *</Label>
                                                <Input
                                                    id={`familyAadhaar${index + 1}`}
                                                    data-testid={`input-family-aadhaar-${index + 1}`}
                                                    placeholder="Enter 12-digit Aadhar number"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="district">District *</Label>
                                        <Select>
                                            <SelectTrigger id="district" data-testid="select-district">
                                                <SelectValue placeholder="Select District" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="nagpur">Nagpur</SelectItem>
                                                <SelectItem value="amravati">Amravati</SelectItem>
                                                <SelectItem value="yavatmal">Yavatmal</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="taluka">Taluka *</Label>
                                        <Select>
                                            <SelectTrigger id="taluka" data-testid="select-taluka">
                                                <SelectValue placeholder="Select Taluka" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="taluka1">Taluka 1</SelectItem>
                                                <SelectItem value="taluka2">Taluka 2</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="village">Village *</Label>
                                        <Select>
                                            <SelectTrigger id="village" data-testid="select-village">
                                                <SelectValue placeholder="Select Village" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="village1">Village 1</SelectItem>
                                                <SelectItem value="village2">Village 2</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <h2 className="font-display font-semibold text-xl mb-4">Eligibility Details</h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="dairyAnimalCount">Dairy Animal Count *</Label>
                                        <Input id="dairyAnimalCount" type="number" min="1" data-testid="input-dairy-animal-count" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="animalTagNumber">Registered Dairy Animal Tag No. *</Label>
                                        <Input id="animalTagNumber" data-testid="input-animal-tag-number" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="milkCertificate">Milk Procurement Certificate *</Label>
                                    <Input id="milkCertificate" type="file" accept="image/*" data-testid="input-milk-certificate" />
                                    <p className="text-sm text-muted-foreground">Upload image of your Milk Procurement Certificate</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="landHolding">Land Holding *</Label>
                                        <Input id="landHolding" type="number" step="0.01" data-testid="input-land-holding" placeholder="In acres" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="khasraNumber">Khasra Number *</Label>
                                        <Input id="khasraNumber" data-testid="input-khasra-number" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="milkPouringPoint">Name of Milk Pouring Point *</Label>
                                        <Input id="milkPouringPoint" data-testid="input-milk-pouring-point" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="farmerPourerCode">Farmer Pourer Code *</Label>
                                        <Input id="farmerPourerCode" data-testid="input-farmer-pourer-code" />
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-4 border rounded-lg">
                                    <Checkbox
                                        id="schemeVerification"
                                        data-testid="checkbox-scheme-verification"
                                    />
                                    <Label htmlFor="schemeVerification" className="text-sm cursor-pointer">
                                        Not benefited from any similar other scheme *
                                    </Label>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <h2 className="font-display font-semibold text-xl mb-4">Component Selection</h2>
                                <div className="space-y-2">
                                    <Label htmlFor="component">Select Component *</Label>
                                    <Select>
                                        <SelectTrigger id="component" data-testid="select-component">
                                            <SelectValue placeholder="Select Component" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Animal Induction</SelectItem>
                                            <SelectItem value="2">HGM</SelectItem>
                                            <SelectItem value="3">Fertility Feed</SelectItem>
                                            <SelectItem value="4">Fodder Seed</SelectItem>
                                            <SelectItem value="5">SNF Enhancer</SelectItem>
                                            <SelectItem value="6">Supply Chaff Cutter</SelectItem>
                                            <SelectItem value="7">Supply Of Silage</SelectItem>
                                            <SelectItem value="8">Treatment of Infertile Animal</SelectItem>
                                            <SelectItem value="9">Farmer Training</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Select the dairy development component you wish to apply for
                                    </p>
                                </div>
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="font-display font-semibold text-xl mb-2">Review & Submit</h2>
                                        <p className="text-sm text-muted-foreground">Please review all the information before submitting your application</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={handlePrint}
                                        className="gap-2 print:hidden"
                                        data-testid="button-print"
                                    >
                                        <Printer className="w-4 h-4" />
                                        Print
                                    </Button>
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
                                                <p className="font-medium">—</p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground">Gender</Label>
                                                <p className="font-medium">—</p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground">Caste/Category</Label>
                                                <p className="font-medium">—</p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground">Mobile Number</Label>
                                                <p className="font-medium">—</p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground">Aadhar Number</Label>
                                                <p className="font-medium">—</p>
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
                                                <p className="font-medium">—</p>
                                            </div>
                                            {familyMemberCount > 1 && (
                                                <div>
                                                    <Label className="text-muted-foreground">Family Members' Aadhar Numbers</Label>
                                                    <div className="space-y-1 mt-1">
                                                        {Array.from({ length: familyMemberCount - 1 }).map((_, index) => (
                                                            <p key={index} className="font-medium text-xs font-mono">—</p>
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
                                                <p className="font-medium">—</p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground">Taluka</Label>
                                                <p className="font-medium">—</p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground">Village</Label>
                                                <p className="font-medium">—</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <Leaf className="w-4 h-4" />
                                            Eligibility & Livestock
                                        </h3>
                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <Label className="text-muted-foreground">Dairy Animal Count</Label>
                                                <p className="font-medium">—</p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground">Animal Tag Number</Label>
                                                <p className="font-medium font-mono">—</p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground">Land Holding (acres)</Label>
                                                <p className="font-medium">—</p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground">Khasra Number</Label>
                                                <p className="font-medium">—</p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground">Milk Pouring Point</Label>
                                                <p className="font-medium">—</p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground">Farmer Pourer Code</Label>
                                                <p className="font-medium font-mono">—</p>
                                            </div>
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
                                            <Label className="text-muted-foreground">Selected Component</Label>
                                            <p className="font-medium text-base mt-1">—</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-5 print:break-inside-avoid">
                                    <div className="flex items-start gap-4">
                                        <Checkbox
                                            id="declaration"
                                            checked={agreed}
                                            onCheckedChange={(checked) => setAgreed(checked as boolean)}
                                            data-testid="checkbox-declaration"
                                            className="mt-1"
                                        />
                                        <div className="flex-1">
                                            <Label htmlFor="declaration" className="text-sm font-medium cursor-pointer block mb-1">
                                                Declaration
                                            </Label>
                                            <p className="text-sm text-muted-foreground cursor-pointer" onClick={() => setAgreed(!agreed)}>
                                                I hereby declare that all the information provided by me is true and correct to the best of my knowledge. I understand that any false information may lead to rejection of my application and penal action as per law.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                            {currentStep < 4 ? (
                                <Button onClick={handleNext} data-testid="button-next">
                                    Next
                                </Button>
                            ) : (
                                <Button onClick={handleSubmit} data-testid="button-submit">
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
