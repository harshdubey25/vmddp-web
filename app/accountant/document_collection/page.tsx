"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Upload, CheckCircle2, Clock, FileText, Image, File } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Document {
  id: string;
  name: string;
  description: string;
  icon: any;
  required: boolean;
  status: "pending" | "uploaded";
  file: File | null;
}

export default function DocumentCollectionPage() {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "animal_invoice",
      name: "Animal Purchase Invoice",
      description: "Invoice/receipt of animal purchase",
      icon: FileText,
      required: true,
      status: "pending",
      file: null,
    },
    {
      id: "photo_with_owner",
      name: "Photo of Animal with Owner",
      description: "Clear photo showing animal and owner together",
      icon: Image,
      required: true,
      status: "pending",
      file: null,
    },
    {
      id: "collar_invoice",
      name: "Digital Collar Invoice",
      description: "Invoice/receipt of digital collar purchase",
      icon: FileText,
      required: true,
      status: "pending",
      file: null,
    },
    {
      id: "insurance_policy",
      name: "Insurance Policy Document",
      description: "Complete insurance policy documentation",
      icon: File,
      required: true,
      status: "pending",
      file: null,
    },
  ]);

  const handleFileUpload = (documentId: string, file: File | null) => {
    setDocuments(documents.map(doc => 
      doc.id === documentId 
        ? { ...doc, file, status: file ? "uploaded" : "pending" }
        : doc
    ));
  };

  const uploadedCount = documents.filter(doc => doc.status === "uploaded").length;
  const progress = (uploadedCount / documents.length) * 100;

  const handleSubmitAll = () => {
    console.log("Submitting documents:", documents);
    // API call to save documents
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Document Collection</h1>
            <p className="text-muted-foreground">Upload and verify mandatory documents</p>
          </div>
        </div>

        {/* Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Progress</CardTitle>
            <CardDescription>
              {uploadedCount} of {documents.length} documents uploaded
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {progress === 100 ? "All documents uploaded! Ready to submit." : "Please upload all required documents."}
            </p>
          </CardContent>
        </Card>

        {/* Document Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>Required Documents</CardTitle>
            <CardDescription>Upload all mandatory documents below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {documents.map((doc) => {
              const Icon = doc.icon;
              return (
                <Card key={doc.id} className={doc.status === "uploaded" ? "border-green-500/50 bg-green-50/50" : ""}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        doc.status === "uploaded" ? "bg-green-500/10" : "bg-muted"
                      }`}>
                        <Icon className={`w-6 h-6 ${
                          doc.status === "uploaded" ? "text-green-600" : "text-muted-foreground"
                        }`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{doc.name}</h3>
                            {doc.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                            {doc.status === "uploaded" && (
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Uploaded
                              </Badge>
                            )}
                            {doc.status === "pending" && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{doc.description}</p>
                        </div>

                        {/* File Input */}
                        <div className="flex items-center gap-4">
                          <Label htmlFor={doc.id} className="sr-only">{doc.name}</Label>
                          <Input
                            id={doc.id}
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileUpload(doc.id, e.target.files?.[0] || null)}
                            className="flex-1"
                          />
                          {doc.file && (
                            <div className="text-sm text-muted-foreground">
                              {doc.file.name}
                            </div>
                          )}
                        </div>

                        {/* Preview Button */}
                        {doc.file && (
                          <Button variant="outline" size="sm">
                            Preview Document
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Ready to submit?</p>
                <p className="text-sm text-muted-foreground">
                  Ensure all documents are uploaded before submitting
                </p>
              </div>
              <Button 
                onClick={handleSubmitAll} 
                disabled={progress < 100}
                size="lg"
              >
                <Upload className="w-4 h-4 mr-2" />
                Submit All Documents
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}