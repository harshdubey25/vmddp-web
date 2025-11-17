"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, FileText, FolderOpen, ShoppingCart, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";

export default function AccountantDashboard() {
  const workflowSteps = [
    { id: "dd", label: "DD Collection", icon: FileText, status: "pending", href: "/accountant/dd_collection", color: "text-blue-600", bgColor: "bg-blue-500/10" },
    { id: "purchase", label: "Purchase Entry", icon: ShoppingCart, status: "pending", href: "/accountant/purchase_entry", color: "text-green-600", bgColor: "bg-green-500/10" },
    { id: "documents", label: "Document Collection", icon: FolderOpen, status: "pending", href: "/accountant/document_collection", color: "text-orange-600", bgColor: "bg-orange-500/10" },
    { id: "claims", label: "Claims", icon: Receipt, status: "pending", href: "/accountant/claim", color: "text-purple-600", bgColor: "bg-purple-500/10" },
  ];

  const stats = [
    { label: "Pending DD Collections", value: 0, color: "text-blue-600" },
    { label: "Purchase Entries This Month", value: 0, color: "text-green-600" },
    { label: "Documents Pending", value: 0, color: "text-orange-600" },
    { label: "Active Claims", value: 0, color: "text-purple-600" },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accountant Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage DD collections, purchases, documents, and claims
          </p>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Workflow Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Application Processing Workflow
            </CardTitle>
            <CardDescription>Track the complete lifecycle from selection to disbursement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {workflowSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <Link key={step.id} href={step.href}>
                    <div className="relative group cursor-pointer">
                      <Card className="hover:shadow-md transition-all border-2 hover:border-primary/20">
                        <CardContent className="pt-6">
                          <div className="flex flex-col items-center text-center space-y-3">
                            <div className={`w-12 h-12 rounded-full ${step.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                              <Icon className={`w-6 h-6 ${step.color}`} />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{step.label}</p>
                              <Badge variant="outline" className="mt-1">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Workflow Description */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Overview</CardTitle>
            <CardDescription>Complete lifecycle from applicant selection to disbursement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">1. DD Collection</p>
                  <p>Search and collect demand drafts from selected applicants using Application ID, Mobile Number, or Aadhaar Number.</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">2. Purchase Entry</p>
                  <p>Record animal purchase details including insurance, digital collar, transportation, and automatic subsidy calculation.</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">3. Document Collection</p>
                  <p>Upload and verify mandatory documents: animal invoice, photo with owner, digital collar invoice, and insurance policy.</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <Receipt className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">4. Claim Management</p>
                  <p>Handle insurance claims in case of animal death and process repurchase for new animals.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
