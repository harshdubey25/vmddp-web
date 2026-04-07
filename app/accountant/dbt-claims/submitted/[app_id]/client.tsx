"use client"
import Link from "next/link";
import { useFrappeGetCall } from "frappe-react-sdk";
import { ApplicationDetails, FrappeCustomApiResponse, DBTCompletedClaim } from "@/types";
import { ArrowLeft, User, Building2, MapPin, CreditCard, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRouter } from "next/navigation";

export default function SubmittedClaimDetails({
    appId
}: {
    appId: string;
}) {
    const router = useRouter();
    // Fetch beneficiary details (component is optional)
    const { data: beneficiaryData, isLoading: loading, error } = useFrappeGetCall<FrappeCustomApiResponse<ApplicationDetails[]>>(
        "vmddp_app.api.v1.accountant.get_application_details",
        { app_form: appId, for_component_allocation: 0 },
        undefined,
        { revalidateOnFocus: false }
    );

    // Fetch all completed claims for this applicant
    const { data: completedClaimsResponse, isLoading: claimsLoading } = useFrappeGetCall<FrappeCustomApiResponse<DBTCompletedClaim[]>>(
        "vmddp_app.api.v1.accountant.dbt_completed_list",
        { search_text: appId, limit_page_length: 100 },
        undefined,
        { revalidateOnFocus: false }
    );

    const beneficiary = beneficiaryData?.message?.[0];
    const completedClaims = completedClaimsResponse?.message || [];

    const getFullName = (b: ApplicationDetails) => {
        return [b.first_name, b.mid_name, b.last_name].filter(Boolean).join(" ");
    };

    // Loading state
    if (loading) {
        return (
            <div className="h-screen bg-background w-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Loading application details...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !beneficiary) {
        return (
            <div className="h-screen bg-background w-full">
                <div className="overflow-auto h-screen">
                    <div className="p-6">
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <p className="text-muted-foreground">
                                    {error ? "Failed to load application details" : "Application not found"}
                                </p>
                                <Link href="/accountant/dbt-claims">
                                    <Button className="mt-4">Back to DBT Claims</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-background w-full">
            <div className="overflow-auto h-screen">
                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} data-testid="button-back">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Applicant Details</h1>
                            <p className="text-muted-foreground">{appId}</p>
                        </div>
                    </div>

                    {/* Beneficiary Details Card */}
                    <Card data-testid="card-beneficiary-details">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Beneficiary Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Name</p>
                                    <p className="font-medium">{getFullName(beneficiary)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Aadhaar</p>
                                    <p className="font-medium">{beneficiary.aadhar_number}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Application ID</p>
                                    <p className="font-medium">{beneficiary.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                        {beneficiary.component_status}
                                    </Badge>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Location</p>
                                        <p className="font-medium">{beneficiary.village || "-"}</p>
                                        <p className="text-sm text-muted-foreground">{beneficiary.taluka}, {beneficiary.district}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Bank Account</p>
                                        <p className="font-medium">****{beneficiary.account_number?.slice(-4)}</p>
                                        <p className="text-sm text-muted-foreground">{beneficiary.ifsc_code}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Bank</p>
                                        <p className="font-medium">{beneficiary.bank_name}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Claims History */}
                    <Card data-testid="card-claims-history">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                Completed DBT Claims
                            </CardTitle>
                            <CardDescription>
                                All disbursed claims for this beneficiary across components
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {claimsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : completedClaims.length > 0 ? (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Claim ID</TableHead>
                                                    <TableHead>Component</TableHead>
                                                    <TableHead>Invoice</TableHead>
                                                    <TableHead>Purchase Date</TableHead>
                                                    <TableHead className="text-right">Qty</TableHead>
                                                    <TableHead className="text-right">Total Amount</TableHead>
                                                    <TableHead className="text-right">Subsidy Given</TableHead>
                                                    <TableHead>Invoice</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {completedClaims.map((claim) => (
                                                    <TableRow key={claim.dbt_claim_id} data-testid={`row-claim-${claim.dbt_claim_id}`}>
                                                        <TableCell>
                                                            <span className="font-mono text-xs">{claim.dbt_claim_id}</span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary">{claim.component}</Badge>
                                                        </TableCell>
                                                        <TableCell>{claim.invoice_number}</TableCell>
                                                        <TableCell>{claim.purchase_date}</TableCell>
                                                        <TableCell className="text-right">{claim.quantity}</TableCell>
                                                        <TableCell className="text-right">
                                                            ₹{claim.total_amount.toLocaleString("en-IN")}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <span className="font-medium text-green-600">
                                                                ₹{claim.subsidy_given.toLocaleString("en-IN")}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            {claim.invoice_upload ? (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => window.open(claim.invoice_upload!, "_blank")}
                                                                    data-testid={`button-view-invoice-${claim.dbt_claim_id}`}
                                                                >
                                                                    <ExternalLink className="h-4 w-4 mr-1" />
                                                                    View
                                                                </Button>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">N/A</span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">No completed claims found</p>
                            )}

                            {/* Summary */}
                            {completedClaims.length > 0 && (
                                <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Total Claims: </span>
                                        <span className="font-medium">{completedClaims.length}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Total Subsidy: </span>
                                        <span className="font-medium text-green-600">
                                            ₹{completedClaims.reduce((sum, c) => sum + c.subsidy_given, 0).toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Components: </span>
                                        <span className="font-medium">
                                            {new Set(completedClaims.map(c => c.component)).size}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
