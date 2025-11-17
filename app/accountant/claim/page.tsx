
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
import { Receipt, Upload, AlertTriangle, CheckCircle2, FileText, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";

export default function ClaimPage() {
  const [activeTab, setActiveTab] = useState<"new" | "repurchase">("new");
  const [claimData, setClaimData] = useState({
    applicationId: "",
    intimationLetter: null as File | null,
    postmortemCert: null as File | null,
    settlementCert: null as File | null,
    claimAmount: "",
    repurchasePercentage: "80", // 80% of claim for repurchase
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [claimApplication, setClaimApplication] = useState<any>(null);

  const handleSearchClaim = () => {
    // Simulated - replace with API call
    if (searchQuery) {
      setClaimApplication({
        applicationId: "VMDDP-2025-001",
        name: "John Doe",
        animalType: "Cow",
        tagNumber: "TAG-001",
        insuranceCompany: "National Insurance",
        policyNumber: "POL-12345",
        sumAssured: 100000,
        dateOfDeath: "2025-01-15",
      });
    }
  };

  const calculateRepurchaseAmount = () => {
    const claim = parseFloat(claimData.claimAmount) || 0;
    const percentage = parseFloat(claimData.repurchasePercentage) / 100;
    return claim * percentage;
  };

  const handleSubmitClaim = () => {
    console.log("Claim submitted:", claimData);
  };

  const handleRepurchase = () => {
    console.log("Repurchase initiated");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Claim Management</h1>
            <p className="text-muted-foreground">Handle insurance claims and repurchase processes</p>
          </div>
        </div>

        {/* Tab Selection */}
        <Card>
          <CardHeader>
            <div className="flex gap-4">
              <Button 
                variant={activeTab === "new" ? "default" : "outline"}
                onClick={() => setActiveTab("new")}
              >
                New Claim
              </Button>
              <Button 
                variant={activeTab === "repurchase" ? "default" : "outline"}
                onClick={() => setActiveTab("repurchase")}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Repurchase
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* New Claim Tab */}
        {activeTab === "new" && (
          <>
            {/* Search Application */}
            <Card>
              <CardHeader>
                <CardTitle>Search Application</CardTitle>
                <CardDescription>Enter Application ID to file a claim</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Input
                    placeholder="Enter Application ID"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearchClaim()}
                  />
                  <Button onClick={handleSearchClaim}>Search</Button>
                </div>
              </CardContent>
            </Card>

            {/* Claim Form */}
            {claimApplication && (
              <>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Animal Death Claim</AlertTitle>
                  <AlertDescription>
                    Processing insurance claim for animal death. Please upload all required documents.
                  </AlertDescription>
                </Alert>

                <Card>
                  <CardHeader>
                    <CardTitle>Application Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-muted-foreground">Application ID</Label>
                        <p className="font-semibold">{claimApplication.applicationId}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Applicant Name</Label>
                        <p className="font-semibold">{claimApplication.name}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Animal Type</Label>
                        <Badge>{claimApplication.animalType}</Badge>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Tag Number</Label>
                        <p className="font-semibold">{claimApplication.tagNumber}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Insurance Company</Label>
                        <p className="font-semibold">{claimApplication.insuranceCompany}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Policy Number</Label>
                        <p className="font-semibold">{claimApplication.policyNumber}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Sum Assured</Label>
                        <p className="font-semibold text-green-600">₹{claimApplication.sumAssured.toLocaleString()}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Date of Death</Label>
                        <p className="font-semibold">{claimApplication.dateOfDeath}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Claim Documents</CardTitle>
                    <CardDescription>Upload required documents for claim processing</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Document 1 */}
                    <div className="space-y-2">
                      <Label htmlFor="intimation">
                        Application for Intimation to Insurance Company *
                      </Label>
                      <Input
                        id="intimation"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setClaimData({ ...claimData, intimationLetter: e.target.files?.[0] || null })}
                      />
                      {claimData.intimationLetter && (
                        <Badge variant="secondary">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {claimData.intimationLetter.name}
                        </Badge>
                      )}
                    </div>

                    {/* Document 2 */}
                    <div className="space-y-2">
                      <Label htmlFor="postmortem">Postmortem Certificate *</Label>
                      <Input
                        id="postmortem"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setClaimData({ ...claimData, postmortemCert: e.target.files?.[0] || null })}
                      />
                      {claimData.postmortemCert && (
                        <Badge variant="secondary">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {claimData.postmortemCert.name}
                        </Badge>
                      )}
                    </div>

                    {/* Document 3 */}
                    <div className="space-y-2">
                      <Label htmlFor="settlement">Claim Settlement Certificate *</Label>
                      <Input
                        id="settlement"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setClaimData({ ...claimData, settlementCert: e.target.files?.[0] || null })}
                      />
                      {claimData.settlementCert && (
                        <Badge variant="secondary">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {claimData.settlementCert.name}
                        </Badge>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="claimAmount">Total Claim Amount Received *</Label>
                      <Input
                        id="claimAmount"
                        type="number"
                        placeholder="₹ 0"
                        value={claimData.claimAmount}
                        onChange={(e) => setClaimData({ ...claimData, claimAmount: e.target.value })}
                      />
                    </div>

                    <Separator />

                    <div className="flex justify-end gap-4">
                      <Button variant="outline" onClick={() => setClaimApplication(null)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSubmitClaim}>
                        <Upload className="w-4 h-4 mr-2" />
                        Submit Claim
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}

        {/* Repurchase Tab */}
        {activeTab === "repurchase" && (
          <>
            <Alert>
              <RefreshCw className="h-4 w-4" />
              <AlertTitle>Repurchase Process</AlertTitle>
              <AlertDescription>
                Process repurchase of new animal for dairy farmer after claim settlement.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Repurchase Calculation</CardTitle>
                <CardDescription>Calculate eligible amount for repurchase</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="claimReceived">Claim Amount Received *</Label>
                    <Input
                      id="claimReceived"
                      type="number"
                      placeholder="₹ 0"
                      value={claimData.claimAmount}
                      onChange={(e) => setClaimData({ ...claimData, claimAmount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="repurchasePercent">Repurchase Percentage *</Label>
                    <Select 
                      value={claimData.repurchasePercentage}
                      onValueChange={(value) => setClaimData({ ...claimData, repurchasePercentage: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="70">70%</SelectItem>
                        <SelectItem value="75">75%</SelectItem>
                        <SelectItem value="80">80%</SelectItem>
                        <SelectItem value="85">85%</SelectItem>
                        <SelectItem value="90">90%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Total Claim Received</TableCell>
                      <TableCell className="text-right text-lg">
                        ₹{(parseFloat(claimData.claimAmount) || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Repurchase Percentage</TableCell>
                      <TableCell className="text-right text-lg">{claimData.repurchasePercentage}%</TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-bold">Eligible Repurchase Amount</TableCell>
                      <TableCell className="text-right text-xl font-bold text-green-600">
                        ₹{calculateRepurchaseAmount().toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="notes">Repurchase Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Enter any additional notes for repurchase..."
                    rows={4}
                  />
                </div>

                <Alert>
                  <AlertDescription>
                    After confirming the repurchase amount, you will be redirected to the Purchase Entry page to record the new animal details.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end gap-4">
                  <Button variant="outline">Cancel</Button>
                  <Button onClick={handleRepurchase}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Proceed to Purchase Entry
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