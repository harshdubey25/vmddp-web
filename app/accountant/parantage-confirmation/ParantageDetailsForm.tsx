"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Loader2 } from "lucide-react";
import { useFrappeCreateDoc, useFrappeGetDocList } from "frappe-react-sdk";
import { useToast } from "@/hooks/use-toast";

interface ParantageDetailsFormProps {
    entryId: string;
    applicationId: string;
    onCancel?: () => void;
    onSuccess?: () => void;
}

export default function ParantageDetailsForm({ entryId, applicationId, onCancel, onSuccess }: ParantageDetailsFormProps) {
    const { toast } = useToast();
    const { createDoc, loading } = useFrappeCreateDoc();
    const { data: agencies } = useFrappeGetDocList<{ name: string; agency_name: string }>("Agency", {
        fields: ["name", "agency_name"],
    });

    const [calfBorn, setCalfBorn] = useState<string>("");
    const [certifiedByAgency, setCertifiedByAgency] = useState<string>("");

    const handleSubmit = async () => {
        if (!calfBorn || !certifiedByAgency) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }

        try {
            await createDoc("Parantage Confirmation", {
                app_form: applicationId,
                calf_born: calfBorn === "male" ? "Male" : "Female",
                certified_by_agency: certifiedByAgency,
                status: "Pending Approval",
            });

            toast({
                title: "Success",
                description: "Parantage confirmation created successfully",
            });

            onSuccess?.();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create parantage confirmation",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="p-4 space-y-4">
            <p className="font-medium text-sm">Parantage Details Entry</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                    <Label className="text-xs">Calf Born *</Label>
                    <Select value={calfBorn} onValueChange={setCalfBorn}>
                        <SelectTrigger data-testid={`select-calf-gender-${entryId}`}>
                            <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Certificate Upload</Label>
                    <Input
                        type="file"
                        accept=".pdf,.jpg,.png"
                        className="text-xs"
                        data-testid={`input-certificate-${entryId}`}
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Certified By Agency *</Label>
                    <Select value={certifiedByAgency} onValueChange={setCertifiedByAgency}>
                        <SelectTrigger data-testid={`select-agency-${entryId}`}>
                            <SelectValue placeholder="Select agency" />
                        </SelectTrigger>
                        <SelectContent>
                            {agencies?.map((agency) => (
                                <SelectItem key={agency.name} value={agency.name}>
                                    {agency.agency_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex gap-2 pt-2">
                <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={loading}
                    data-testid={`button-submit-${entryId}`}
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                        <Check className="h-4 w-4 mr-1" />
                    )}
                    Submit
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={onCancel}
                    disabled={loading}
                    data-testid={`button-cancel-${entryId}`}
                >
                    Cancel
                </Button>
            </div>
        </div>
    );
}
