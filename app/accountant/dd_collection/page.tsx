"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Upload, CheckCircle2, User, Phone, CreditCard } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DDCollectionPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"application" | "mobile" | "aadhaar">("application");
  const [applicantData, setApplicantData] = useState<any>(null);
  const [ddDetails, setDDDetails] = useState({
    ddNumber: "",
    ddDate: "",
    bankName: "",
    amount: "",
    ddImage: null as File | null,
  });

  const handleSearch = async () => {
    // Simulated search - replace with actual API call
    if (searchQuery) {
      setApplicantData({
        applicationId: "VMDDP-2025-001",
        name: "John Doe",
        mobile: "9876543210",
        aadhaar: "XXXX-XXXX-1234",
        address: "Village ABC, District XYZ",
        selectedComponents: ["Milch Animal", "Digital Collar"],
        requiredAmount: 50000,
        status: "Selected - DD Pending",
      });
    }
  };

  const handleDDSubmit = () => {
    // Handle DD submission
    console.log("DD Details:", ddDetails);
    // API call to save DD details
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">DD Collection</h1>
            <p className="text-muted-foreground">Search and collect demand drafts from selected applicants</p>
          </div>
        </div>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Applicant
            </CardTitle>
            <CardDescription>
              Enter Application ID, Mobile Number, or Aadhaar Number
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Enter Application ID / Mobile Number / Aadhaar Number"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch}>
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Applicant Details */}
        {applicantData && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Applicant Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground">Application ID</Label>
                    <p className="font-semibold">{applicantData.applicationId}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-semibold">{applicantData.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Mobile Number</Label>
                    <p className="font-semibold flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {applicantData.mobile}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Aadhaar Number</Label>
                    <p className="font-semibold flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      {applicantData.aadhaar}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground">Address</Label>
                    <p className="font-semibold">{applicantData.address}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-muted-foreground mb-2 block">Selected Components</Label>
                  <div className="flex gap-2 flex-wrap">
                    {applicantData.selectedComponents.map((component: string) => (
                      <Badge key={component} variant="secondary">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {component}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Alert>
                  <AlertDescription className="flex items-center justify-between">
                    <span>Required DD Amount:</span>
                    <span className="text-xl font-bold">₹{applicantData.requiredAmount.toLocaleString()}</span>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* DD Submission Form */}
            <Card>
              <CardHeader>
                <CardTitle>DD Submission Form</CardTitle>
                <CardDescription>Enter demand draft details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ddNumber">DD Number *</Label>
                    <Input
                      id="ddNumber"
                      placeholder="Enter DD Number"
                      value={ddDetails.ddNumber}
                      onChange={(e) => setDDDetails({ ...ddDetails, ddNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ddDate">DD Date *</Label>
                    <Input
                      id="ddDate"
                      type="date"
                      value={ddDetails.ddDate}
                      onChange={(e) => setDDDetails({ ...ddDetails, ddDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name *</Label>
                    <Input
                      id="bankName"
                      placeholder="Enter Bank Name"
                      value={ddDetails.bankName}
                      onChange={(e) => setDDDetails({ ...ddDetails, bankName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter Amount"
                      value={ddDetails.amount}
                      onChange={(e) => setDDDetails({ ...ddDetails, amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="ddImage">Upload DD Image *</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="ddImage"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setDDDetails({ ...ddDetails, ddImage: e.target.files?.[0] || null })}
                      />
                      {ddDetails.ddImage && (
                        <Badge variant="secondary">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          File Selected
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end gap-4">
                  <Button variant="outline" onClick={() => setApplicantData(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleDDSubmit}>
                    <Upload className="w-4 h-4 mr-2" />
                    Submit DD Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}