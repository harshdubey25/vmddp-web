"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Upload, Calculator, User, Building2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function PurchaseEntryPage() {
  const [purchaseData, setPurchaseData] = useState({
    // Section 1: Purchase Details
    invoiceFile: null as File | null,
    purchaseDate: "",
    animalType: "",
    tagNumber: "",
    collarNumber: "",
    insuranceCompany: "",
    insuranceDuration: "",
    sumAssured: "",
    policyNumber: "",
    transportationDetails: "",
    
    // Costs
    animalCost: "",
    insuranceCost: "",
    collarCost: "",
    transportCost: "",
  });

  const [applicantDetails] = useState({
    name: "John Doe",
    applicationId: "VMDDP-2025-001",
    address: "Village ABC, District XYZ, State",
    bankName: "State Bank of India",
    accountNumber: "1234567890",
    ifscCode: "SBIN0001234",
    animalBreed: "Holstein Friesian",
  });

  // Calculate subsidy distribution (example percentages)
  const calculateSubsidy = () => {
    const animal = parseFloat(purchaseData.animalCost) || 0;
    const insurance = parseFloat(purchaseData.insuranceCost) || 0;
    const collar = parseFloat(purchaseData.collarCost) || 0;
    const transport = parseFloat(purchaseData.transportCost) || 0;
    
    const total = animal + insurance + collar + transport;
    const subsidyPercentage = 0.75; // 75% government subsidy
    const governmentShare = total * subsidyPercentage;
    const applicantShare = total - governmentShare;

    return {
      total,
      governmentShare,
      applicantShare,
      breakdown: {
        animal: { total: animal, govt: animal * subsidyPercentage, applicant: animal * (1 - subsidyPercentage) },
        insurance: { total: insurance, govt: insurance * subsidyPercentage, applicant: insurance * (1 - subsidyPercentage) },
        collar: { total: collar, govt: collar * subsidyPercentage, applicant: collar * (1 - subsidyPercentage) },
        transport: { total: transport, govt: transport * subsidyPercentage, applicant: transport * (1 - subsidyPercentage) },
      }
    };
  };

  const subsidy = calculateSubsidy();

  const handleSubmit = () => {
    console.log("Purchase Entry:", purchaseData);
    // API call to save purchase entry
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Purchase Entry</h1>
            <p className="text-muted-foreground">Record animal purchase details and cost distribution</p>
          </div>
        </div>

        {/* Section 1: Purchase Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Purchase Details
            </CardTitle>
            <CardDescription>Enter animal purchase and insurance information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Invoice Upload */}
            <div className="space-y-2">
              <Label htmlFor="invoice">Invoice of Animal *</Label>
              <Input
                id="invoice"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setPurchaseData({ ...purchaseData, invoiceFile: e.target.files?.[0] || null })}
              />
            </div>

            {/* Basic Purchase Info */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Date of Purchase *</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={purchaseData.purchaseDate}
                  onChange={(e) => setPurchaseData({ ...purchaseData, purchaseDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="animalType">Type of Animal *</Label>
                <Select value={purchaseData.animalType} onValueChange={(value) => setPurchaseData({ ...purchaseData, animalType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cow">Cow</SelectItem>
                    <SelectItem value="buffalo">Buffalo</SelectItem>
                    <SelectItem value="goat">Goat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagNumber">Milch Animal Tag No. *</Label>
                <Input
                  id="tagNumber"
                  placeholder="Enter tag number"
                  value={purchaseData.tagNumber}
                  onChange={(e) => setPurchaseData({ ...purchaseData, tagNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="collarNumber">Digital Collar Number *</Label>
              <Input
                id="collarNumber"
                placeholder="Enter collar number"
                value={purchaseData.collarNumber}
                onChange={(e) => setPurchaseData({ ...purchaseData, collarNumber: e.target.value })}
              />
            </div>

            <Separator />

            {/* Insurance Details */}
            <div>
              <h3 className="font-semibold mb-4">Insurance Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="insuranceCompany">Insurance Company Name *</Label>
                  <Input
                    id="insuranceCompany"
                    placeholder="Enter company name"
                    value={purchaseData.insuranceCompany}
                    onChange={(e) => setPurchaseData({ ...purchaseData, insuranceCompany: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration *</Label>
                  <Input
                    id="duration"
                    placeholder="e.g., 1 year"
                    value={purchaseData.insuranceDuration}
                    onChange={(e) => setPurchaseData({ ...purchaseData, insuranceDuration: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sumAssured">Sum Assured *</Label>
                  <Input
                    id="sumAssured"
                    type="number"
                    placeholder="Enter amount"
                    value={purchaseData.sumAssured}
                    onChange={(e) => setPurchaseData({ ...purchaseData, sumAssured: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="policyNumber">Policy Number *</Label>
                  <Input
                    id="policyNumber"
                    placeholder="Enter policy number"
                    value={purchaseData.policyNumber}
                    onChange={(e) => setPurchaseData({ ...purchaseData, policyNumber: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Transportation */}
            <div className="space-y-2">
              <Label htmlFor="transport">Transportation Details</Label>
              <Textarea
                id="transport"
                placeholder="Enter transportation details"
                value={purchaseData.transportationDetails}
                onChange={(e) => setPurchaseData({ ...purchaseData, transportationDetails: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Applicant Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Applicant Details
            </CardTitle>
            <CardDescription>Auto-fetched from application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Application ID</Label>
                <p className="font-semibold">{applicantDetails.applicationId}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p className="font-semibold">{applicantDetails.name}</p>
              </div>
              <div className="md:col-span-2">
                <Label className="text-muted-foreground">Address</Label>
                <p className="font-semibold">{applicantDetails.address}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Bank Name</Label>
                <p className="font-semibold flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {applicantDetails.bankName}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Account Number</Label>
                <p className="font-semibold">{applicantDetails.accountNumber}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">IFSC Code</Label>
                <p className="font-semibold">{applicantDetails.ifscCode}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Breed of Animal</Label>
                <Badge variant="secondary">{applicantDetails.animalBreed}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Cost Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Cost Distribution & Subsidy Allocation
            </CardTitle>
            <CardDescription>Enter costs and view automatic subsidy calculation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="animalCost">Animal Cost *</Label>
                <Input
                  id="animalCost"
                  type="number"
                  placeholder="₹ 0"
                  value={purchaseData.animalCost}
                  onChange={(e) => setPurchaseData({ ...purchaseData, animalCost: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insuranceCost">Insurance Cost *</Label>
                <Input
                  id="insuranceCost"
                  type="number"
                  placeholder="₹ 0"
                  value={purchaseData.insuranceCost}
                  onChange={(e) => setPurchaseData({ ...purchaseData, insuranceCost: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="collarCost">Digital Collar Cost *</Label>
                <Input
                  id="collarCost"
                  type="number"
                  placeholder="₹ 0"
                  value={purchaseData.collarCost}
                  onChange={(e) => setPurchaseData({ ...purchaseData, collarCost: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transportCost">Transportation Cost *</Label>
                <Input
                  id="transportCost"
                  type="number"
                  placeholder="₹ 0"
                  value={purchaseData.transportCost}
                  onChange={(e) => setPurchaseData({ ...purchaseData, transportCost: e.target.value })}
                />
              </div>
            </div>

            <Separator />

            {/* Cost Breakup Table */}
            <div>
              <h3 className="font-semibold mb-4">Cost Breakup & Subsidy Summary</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead className="text-right">Government Share (75%)</TableHead>
                    <TableHead className="text-right">Applicant Share (25%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Animal</TableCell>
                    <TableCell className="text-right">₹{subsidy.breakdown.animal.total.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600">₹{subsidy.breakdown.animal.govt.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-blue-600">₹{subsidy.breakdown.animal.applicant.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Insurance</TableCell>
                    <TableCell className="text-right">₹{subsidy.breakdown.insurance.total.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600">₹{subsidy.breakdown.insurance.govt.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-blue-600">₹{subsidy.breakdown.insurance.applicant.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Digital Collar</TableCell>
                    <TableCell className="text-right">₹{subsidy.breakdown.collar.total.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600">₹{subsidy.breakdown.collar.govt.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-blue-600">₹{subsidy.breakdown.collar.applicant.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Transportation</TableCell>
                    <TableCell className="text-right">₹{subsidy.breakdown.transport.total.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600">₹{subsidy.breakdown.transport.govt.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-blue-600">₹{subsidy.breakdown.transport.applicant.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">₹{subsidy.total.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600">₹{subsidy.governmentShare.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-blue-600">₹{subsidy.applicantShare.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <Separator />

            <div className="flex justify-end gap-4">
              <Button variant="outline">Cancel</Button>
              <Button onClick={handleSubmit}>
                <Upload className="w-4 h-4 mr-2" />
                Submit Purchase Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}