"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Check, Loader2, Upload, Plus } from "lucide-react";
import { useFrappeCreateDoc, useFrappeFileUpload, useFrappeGetDocList } from "frappe-react-sdk";
import { useToast } from "@/hooks/use-toast";

interface ParantageDetailsFormProps {
    entryId: string;
    applicationId: string;
    onCancel?: () => void;
    onSuccess?: () => void;
    component_allocation_id: string;
}

export default function ParantageDetailsForm({
    entryId,
    applicationId,
    onCancel,
    onSuccess,
    component_allocation_id,
}: ParantageDetailsFormProps) {
    const { toast } = useToast();
    const { createDoc, loading } = useFrappeCreateDoc();
    const { upload, loading: uploading, progress } = useFrappeFileUpload();
    const { data: agencies, mutate: mutateAgencies } = useFrappeGetDocList<{
        name: string;
        agency_name: string;
    }>("Agency", {
        fields: ["name", "agency_name"],
    });
    if (component_allocation_id == "")
        throw new Error("component allocation id is empty");
    const [calfBorn, setCalfBorn] = useState<string>("");
    const [calfDateOfBirth, setCalfDateOfBirth] = useState<string>("");
    const [certifiedByAgency, setCertifiedByAgency] = useState<string>("");
    const [certificateFile, setCertificateFile] = useState<File | null>(null);
    const [certificateUrl, setCertificateUrl] = useState<string>("");
    const [showNewAgencyDialog, setShowNewAgencyDialog] = useState(false);
    const [newAgencyName, setNewAgencyName] = useState("");
    const [creatingAgency, setCreatingAgency] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setCertificateFile(file);

        try {
            const response = await upload(file, {
                isPrivate: false,
                doctype: "Parantage Confirmation",
                fieldname: "certficate",
            });

            setCertificateUrl(response.file_url);
            toast({
                title: "Success",
                description: "Certificate uploaded successfully",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to upload certificate",
                variant: "destructive",
            });
            setCertificateFile(null);
        }
    };

    const handleCreateNewAgency = async () => {
        if (!newAgencyName.trim()) {
            toast({
                title: "Validation Error",
                description: "Please enter an agency name",
                variant: "destructive",
            });
            return;
        }

        setCreatingAgency(true);
        try {
            const newAgency = await createDoc("Agency", {
                agency_name: newAgencyName.trim(),
            });

            toast({
                title: "Success",
                description: "Agency created successfully",
            });

            await mutateAgencies();

            setCertifiedByAgency(newAgency.name);

            setShowNewAgencyDialog(false);
            setNewAgencyName("");
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.message || "Failed to create agency",
                variant: "destructive",
            });
        } finally {
            setCreatingAgency(false);
        }
    };

    const handleSubmit = async () => {
        if (!calfBorn || !calfDateOfBirth || !certifiedByAgency) {
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
                calf_date_of_birth: calfDateOfBirth,
                certified_by_agency: certifiedByAgency,
                status: "Pending Approval",
                component_allocation: component_allocation_id,
                certficate: certificateUrl,
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
                        <SelectTrigger
                            data-testid={`select-calf-gender-${entryId}`}
                        >
                            <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Calf Date of Birth *</Label>
                    <Input
                        type="date"
                        value={calfDateOfBirth}
                        onChange={(e) => setCalfDateOfBirth(e.target.value)}
                        data-testid={`input-dob-${entryId}`}
                        className="text-xs"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Certificate Upload</Label>
                    <div className="relative">
                        <Input
                            type="file"
                            accept=".pdf,.jpg,.png"
                            className="text-xs"
                            onChange={handleFileChange}
                            disabled={uploading}
                            data-testid={`input-certificate-${entryId}`}
                        />
                        {uploading && (
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Uploading... {Math.round(progress)}%</span>
                            </div>
                        )}
                        {certificateUrl && !uploading && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                                <Check className="h-3 w-3" />
                                <span>Uploaded</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Certified By Agency *</Label>
                    <Select
                        value={certifiedByAgency}
                        onValueChange={(value) => {
                            if (value === "add_new") {
                                setShowNewAgencyDialog(true);
                            } else {
                                setCertifiedByAgency(value);
                            }
                        }}
                    >
                        <SelectTrigger data-testid={`select-agency-${entryId}`}>
                            <SelectValue placeholder="Select agency" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="add_new" className="text-primary font-medium">
                                + Add New Agency
                            </SelectItem>
                            {agencies && agencies.length > 0 ? (
                                agencies.map((agency) => (
                                    <SelectItem
                                        key={agency.name}
                                        value={agency.name}
                                    >
                                        {agency.agency_name}
                                    </SelectItem>
                                ))
                            ) : (
                                <div className="p-2 text-xs text-muted-foreground">
                                    No agencies found
                                </div>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex gap-2 pt-2">
                <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={loading || uploading}
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

            {/* New Agency Dialog */}
            <Dialog open={showNewAgencyDialog} onOpenChange={setShowNewAgencyDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Agency</DialogTitle>
                        <DialogDescription>
                            Create a new agency to certify parantage confirmations
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="agency-name">Agency Name *</Label>
                            <Input
                                id="agency-name"
                                placeholder="Enter agency name"
                                value={newAgencyName}
                                onChange={(e) => setNewAgencyName(e.target.value)}
                                disabled={creatingAgency}
                                data-testid="input-new-agency-name"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleCreateNewAgency();
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowNewAgencyDialog(false);
                                setNewAgencyName("");
                            }}
                            disabled={creatingAgency}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateNewAgency}
                            disabled={creatingAgency || !newAgencyName.trim()}
                            data-testid="button-create-agency"
                        >
                            {creatingAgency ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Agency
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
