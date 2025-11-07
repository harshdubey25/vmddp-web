"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, FileText, Download, User, Users, MapPin, Leaf, Award } from "lucide-react";
import Link from "next/link";

type ApplicationData = {
    firstName: string;
    middleName: string;
    lastName: string;
    gender: string;
    category: string;
    mobile: string;
    aadhar_number: string;
    district: string;
    taluka: string;
    village: string;
    components: Array<{
        component_name: string;
        questions: Array<{
            question: string;
            type: string;
            options: string[] | null;
            value: string;
        }>;
    }>;
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    eligibility?: Array<{
        name: string;
        value: any;
        child?: Array<{
            name: string;
            value: any;
        }>;
    }>;
    applicationId: string;
    submittedAt: string;
};

export default function SuccessPage() {
    const [applicationId, setApplicationId] = useState<string>("");
    const [applicationData, setApplicationData] = useState<ApplicationData | null>(null);

    useEffect(() => {
        // Add basic print styles
        const style = document.createElement('style');
        style.textContent = `
            @media print {
                @page {
                    margin: 0.5in;
                    size: A4;
                }
                .print-hidden {
                    display: none !important;
                }
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            }
        `;
        document.head.appendChild(style);

        // Get application ID from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('applicationId');
        if (id) {
            setApplicationId(id);
        }

        // Get application data from localStorage
        const storedData = localStorage.getItem('submittedApplicationData');
        if (storedData) {
            try {
                const data = JSON.parse(storedData);
                setApplicationData(data);
                // Clear the data after reading it
                localStorage.removeItem('submittedApplicationData');
            } catch (error) {
                console.error('Error parsing application data:', error);
            }
        }

        return () => {
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        };
    }, []);

    const getFileName = (url: any) => {
        if (!url || typeof url !== 'string') return "Uploaded";
        try {
            return url.split('/').pop() || "File uploaded";
        } catch {
            return "File uploaded";
        }
    };

    const formatValue = (value: any) => {
        if (value === null || value === undefined) return "Not provided";
        if (value === "") return "Not provided";
        if (typeof value === 'string' && (value.startsWith('http') || value.includes('/files/'))) {
            return getFileName(value);
        }
        if (typeof value === 'boolean') {
            return value ? "Yes" : "No";
        }
        if (typeof value === 'number') {
            return value.toString();
        }
        if (Array.isArray(value)) {
            return value.length > 0 ? value.join(', ') : "Not provided";
        }
        return value.toString();
    };

    if (!applicationData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 sm:py-16">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Card className="shadow-xl border-0">
                        <CardContent className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Loading application details...</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 sm:py-16 print:bg-white print:py-4">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 print:px-2">
                <Card className="shadow-xl border-0 mb-8 print:shadow-none print:border">
                    <CardHeader className="text-center pb-8 print:pb-4">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 print:w-12 print:h-12">
                            <CheckCircle className="w-8 h-8 text-green-600 print:w-6 print:h-6" />
                        </div>
                        <CardTitle className="text-2xl sm:text-3xl font-display font-semibold text-green-800 mb-2 print:text-xl">
                            Application Submitted Successfully!
                        </CardTitle>
                        <p className="text-muted-foreground print:text-gray-800 print:text-sm">
                            Your VMDDP scheme application has been submitted and is being processed.
                        </p>
                    </CardHeader>

                    <CardContent className="space-y-6 print:space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 print:bg-gray-50 print:border-gray-300 print:p-2">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-5 h-5 text-blue-600 print:w-4 print:h-4 print:text-gray-600" />
                                <h3 className="font-semibold text-blue-800 print:text-gray-800 print:text-sm">Application Details</h3>
                            </div>
                            <p className="text-sm text-blue-700 print:text-gray-700 print:text-xs">
                                <strong>Application ID:</strong> <span className="font-mono">{applicationId || applicationData.applicationId}</span>
                            </p>
                            <p className="text-sm text-blue-700 print:text-gray-700 print:text-xs">
                                <strong>Submitted At:</strong> <span>{new Date(applicationData.submittedAt).toLocaleString()}</span>
                            </p>
                            <p className="text-xs text-blue-600 mt-2 print:text-gray-600">
                                Please save this ID for future reference. You will also receive an SMS with this ID.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Application Summary */}
                <Card className="shadow-xl border-0 mb-8 print:shadow-none print:border print:mb-4">
                    <CardHeader className="print:pb-2">
                        <CardTitle className="flex items-center gap-2 print:text-lg">
                            <FileText className="w-5 h-5 print:w-4 print:h-4" />
                            Application Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 print:space-y-3">
                        {/* Personal Information */}
                        <div>
                            <h3 className="font-semibold flex items-center gap-2 mb-3 print:text-sm print:mb-2">
                                <User className="w-4 h-4" />
                                Personal Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm print:gap-2 print:text-xs">
                                <div>
                                    <span className="text-muted-foreground">Full Name:</span>
                                    <p className="font-medium">{applicationData.firstName} {applicationData.middleName} {applicationData.lastName}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Gender:</span>
                                    <p className="font-medium">{applicationData.gender}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Category:</span>
                                    <p className="font-medium">{applicationData.category}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Mobile:</span>
                                    <p className="font-medium">{applicationData.mobile}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Aadhar Number:</span>
                                    <p className="font-medium font-mono">{applicationData.aadhar_number}</p>
                                </div>
                            </div>
                        </div>

                        {/* Location Details */}
                        <div>
                            <h3 className="font-semibold flex items-center gap-2 mb-3 print:text-sm print:mb-2">
                                <MapPin className="w-4 h-4" />
                                Location Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm print:gap-2 print:text-xs">
                                <div>
                                    <span className="text-muted-foreground">District:</span>
                                    <p className="font-medium">{applicationData.district}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Taluka:</span>
                                    <p className="font-medium">{applicationData.taluka}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Village:</span>
                                    <p className="font-medium">{applicationData.village}</p>
                                </div>
                            </div>
                        </div>

                        {/* Eligibility Criteria */}
                        {applicationData.eligibility && applicationData.eligibility.length > 0 && (
                            <div>
                                <h3 className="font-semibold flex items-center gap-2 mb-3 print:text-sm print:mb-2">
                                    <Leaf className="w-4 h-4" />
                                    Eligibility Criteria
                                </h3>
                                <div className="space-y-2 print:space-y-1">
                                    {applicationData.eligibility.map((item, idx) => (
                                        <div key={idx} className="text-sm print:text-xs">
                                            <span className="text-muted-foreground">{item.name}:</span>
                                            <p className="font-medium">{formatValue(item.value)}</p>
                                            {item.child && item.child.length > 0 && (
                                                <div className="ml-4 mt-1 space-y-1 print:ml-2 print:space-y-0">
                                                    {item.child.map((child, cidx) => (
                                                        <div key={cidx} className="text-xs">
                                                            <span className="text-muted-foreground">{child.name}:</span>
                                                            <span className="ml-1">{formatValue(child.value)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Selected Components */}
                        {applicationData.components && applicationData.components.length > 0 && (
                            <div>
                                <h3 className="font-semibold flex items-center gap-2 mb-3 print:text-sm print:mb-2">
                                    <Award className="w-4 h-4" />
                                    Selected Components
                                </h3>
                                <div className="space-y-3 print:space-y-2">
                                    {applicationData.components.map((comp, idx) => (
                                        <div key={idx} className="border rounded-lg p-3 bg-muted/50 print:p-2 print:bg-white print:border-gray-400">
                                            <p className="font-medium text-base mb-2 print:text-sm print:mb-1">{comp.component_name}</p>
                                            {comp.questions && comp.questions.length > 0 && (
                                                <div className="space-y-1 print:space-y-0">
                                                    {comp.questions.map((q, qIdx) => (
                                                        <div key={qIdx} className="text-sm print:text-xs">
                                                            <span className="text-muted-foreground">{q.question}:</span>
                                                            <span className="ml-2 font-medium">{q.value || "Not answered"}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Bank Details */}
                        <div>
                            <h3 className="font-semibold flex items-center gap-2 mb-3 print:text-sm print:mb-2">
                                <Users className="w-4 h-4" />
                                Bank Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm print:gap-2 print:text-xs">
                                <div>
                                    <span className="text-muted-foreground">Account Holder:</span>
                                    <p className="font-medium">{applicationData.accountHolderName}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Account Number:</span>
                                    <p className="font-medium font-mono">****{applicationData.accountNumber?.slice(-4)}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Bank Name:</span>
                                    <p className="font-medium">{applicationData.bankName}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">IFSC Code:</span>
                                    <p className="font-medium font-mono">{applicationData.ifscCode}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Next Steps and Actions */}
                <Card className="shadow-xl border-0 print:shadow-none print:border">
                    <CardContent className="space-y-6 pt-6 print:space-y-3 print:pt-3">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 print:bg-gray-50 print:border-gray-300 print:p-2">
                            <h3 className="font-semibold text-yellow-800 mb-2 print:text-gray-800 print:text-sm print:mb-1">What happens next?</h3>
                            <ul className="text-sm text-yellow-700 space-y-1 print:text-gray-700 print:text-xs print:space-y-0">
                                <li>• Your application will be reviewed by the sub-admin</li>
                                <li>• You will receive updates via SMS</li>
                                <li>• Processing may take 7-10 working days</li>
                                <li>• Keep your application ID safe for tracking</li>
                            </ul>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 print:p-2">
                            <h3 className="font-semibold text-gray-800 mb-2 print:text-sm print:mb-1">Important Information</h3>
                            <ul className="text-sm text-gray-700 space-y-1 print:text-xs print:space-y-0">
                                <li>• All information provided must be accurate</li>
                                <li>• False information may lead to application rejection</li>
                                <li>• Contact your local sub-admin for any queries</li>
                                <li>• Keep all submitted documents safe</li>
                            </ul>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-6 print-hidden">
                            <Button
                                onClick={() => window.print()}
                                variant="outline"
                                className="flex-1 gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Print Confirmation
                            </Button>
                            <Link href="/" className="flex-1">
                                <Button className="w-full gap-2">
                                    <Home className="w-4 h-4" />
                                    Back to Home
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}