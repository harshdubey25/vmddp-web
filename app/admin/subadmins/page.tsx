"use client"

import AdminSidebar from "@/components/AdminSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
    BarChart3,
    CheckCircle,
    Edit,
    Mail,
    MapPin,
    Phone,
    Search,
    Shield,
    UserPlus,
    Loader2,
} from "lucide-react";
import { useState } from "react";
import { useFrappeGetCall, useFrappeGetDocList, useFrappePostCall } from "frappe-react-sdk";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

interface DPO {
    dpo_id: string;
    user_id: string;
    name: string;
    email: string;
    district: string;
    mobile_number: string;
    enabled: boolean;
    user_type: string;
}

interface DPOApiResponse {
    message: {
        dpos: DPO[];
        total_count: number;
    };
    error?: string;
}

export default function AdminSubAdmins() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [selectedDPO, setSelectedDPO] = useState<DPO | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    // Fetch DPOs from API
    const { data: dpoResponse, isLoading, error, mutate: refetchDPOs } = useFrappeGetCall<DPOApiResponse>(
        'vmddp_app.api.v1.admin.get_all_dpos',
        undefined,
        'dpos-list'
    );

    // Fetch districts from Frappe
    const { data: frappeDistricts, isLoading: districtsLoading } = useFrappeGetDocList("District Master", {
        fields: ["name", "name1"],
        limit: 100,
    });

    console.log("dpoResponse:", dpoResponse);
    console.log("frappeDistricts:", frappeDistricts);
    const dpos = dpoResponse?.message?.dpos || [];
    const districts = frappeDistricts ? frappeDistricts.map((d: any) => d.name1) : [];

    // Hook for updating DPO
    const { call: updateDPO, loading: updateLoading } = useFrappePostCall('vmddp_app.api.v1.admin.update_dpo');

    // Hook for creating DPO
    const { call: createDPO, loading: createLoading } = useFrappePostCall('vmddp_app.api.v1.admin.create_dpo');

    // Hook for updating DPO password
    const { call: updateDPOPassword, loading: passwordLoading } = useFrappePostCall('vmddp_app.api.v1.admin.update_dpo_password'); const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        username: "",
        email: "",
        mobile: "",
        password: "",
        districts: [] as string[],
        talukas: [] as string[],
    });

    const filteredDPOs = dpos.filter((dpo) => {
        const matchesSearch =
            dpo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dpo.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dpo.dpo_id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" ||
            (statusFilter === "active" && dpo.enabled) ||
            (statusFilter === "inactive" && !dpo.enabled);
        return matchesSearch && matchesStatus;
    });

    const handleAddSubAdmin = async () => {
        if (!formData.first_name || !formData.last_name || !formData.email || !formData.mobile || !formData.password || formData.districts.length === 0) {
            toast({
                title: "Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }

        try {
            const createData = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                mobile_number: formData.mobile,
                password: formData.password,
                district: formData.districts[0], // Take the first selected district
            };

            console.log("Creating DPO with data:", createData);
            const response = await createDPO(createData);

            if (response?.message?.success) {
                toast({
                    title: "Success",
                    description: response.message.message || "DPO created successfully",
                });

                // Refresh the DPO list
                await refetchDPOs();

                // Close dialog and reset form
                setShowAddDialog(false);
                setFormData({
                    first_name: "",
                    last_name: "",
                    username: "",
                    email: "",
                    mobile: "",
                    password: "",
                    districts: [],
                    talukas: [],
                });
            } else {
                throw new Error(response?.error || "Creation failed");
            }

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create DPO",
                variant: "destructive",
            });
        }
    };

    const handleEditDPO = (dpo: DPO) => {
        setSelectedDPO(dpo);
        // Split the full name into first and last name
        const nameParts = dpo.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        setFormData({
            first_name: firstName,
            last_name: lastName,
            username: dpo.user_id,
            email: dpo.email,
            mobile: dpo.mobile_number,
            password: "",
            districts: [dpo.district],
            talukas: [],
        });
        setShowEditDialog(true);
    };

    const handleUpdateSubAdmin = async () => {
        if (!selectedDPO) return;

        setIsUpdating(true);
        try {
            // Prepare the update data
            const updateData: any = {
                dpo_id: selectedDPO.dpo_id,
            };

            // Split the original name to compare with current form data
            const originalNameParts = selectedDPO.name.split(' ');
            const originalFirstName = originalNameParts[0] || '';
            const originalLastName = originalNameParts.slice(1).join(' ') || '';

            // Only include fields that have changed
            if (formData.first_name !== originalFirstName) {
                updateData.first_name = formData.first_name;
            }
            if (formData.last_name !== originalLastName) {
                updateData.last_name = formData.last_name;
            }
            if (formData.email !== selectedDPO.email) {
                updateData.email = formData.email;
            }
            if (formData.mobile !== selectedDPO.mobile_number) {
                updateData.mobile_number = formData.mobile;
            }
            if (formData.districts.length > 0 && formData.districts[0] !== selectedDPO.district) {
                // Since autoname is set to "field:name1", both name and name1 will be the same
                const selectedDistrictName = formData.districts[0];
                console.log("Updating district from", selectedDPO.district, "to", selectedDistrictName);

                // Simply use the selected district name directly since name1 = name in District Master
                updateData.district = selectedDistrictName;
                console.log("Setting district in updateData:", updateData.district);
            }

            // Only proceed if there are changes to make
            if (Object.keys(updateData).length === 1) { // Only dpo_id is present
                toast({
                    title: "Info",
                    description: "No changes detected.",
                });
                setShowEditDialog(false);
                setSelectedDPO(null);
                setIsUpdating(false);
                return;
            }

            console.log("Final updateData being sent:", updateData);
            const response = await updateDPO(updateData);

            if (response?.message?.success) {
                toast({
                    title: "Success",
                    description: response.message.message || "DPO updated successfully",
                });

                // Refresh the DPO list without full page reload
                await refetchDPOs();

                // Close dialog and reset state
                setShowEditDialog(false);
                setSelectedDPO(null);
            } else {
                throw new Error(response?.error || "Update failed");
            }

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update DPO",
                variant: "destructive",
            });

            // Close dialog on error too
            setShowEditDialog(false);
            setSelectedDPO(null);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleOpenPasswordDialog = (dpo: DPO) => {
        setSelectedDPO(dpo);
        setNewPassword("");
        setShowPasswordDialog(true);
    };

    const handleUpdatePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            toast({
                title: "Error",
                description: "Password must be at least 6 characters long",
                variant: "destructive",
            });
            return;
        }

        if (!selectedDPO) {
            toast({
                title: "Error",
                description: "No DPO selected",
                variant: "destructive",
            });
            return;
        }

        try {
            const passwordData = {
                dpo_id: selectedDPO.dpo_id,
                new_password: newPassword,
            };

            console.log("Updating password for DPO:", selectedDPO.dpo_id);
            const response = await updateDPOPassword(passwordData);

            if (response?.message?.success) {
                toast({
                    title: "Success",
                    description: response.message.message || "Password updated successfully",
                });

                // Close dialog and reset state
                setShowPasswordDialog(false);
                setSelectedDPO(null);
                setNewPassword("");
            } else {
                throw new Error(response?.error || "Password update failed");
            }

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update password",
                variant: "destructive",
            });
        }
    };

    const handleDistrictToggle = (district: string) => {
        setFormData((prev) => ({
            ...prev,
            districts: prev.districts.includes(district)
                ? prev.districts.filter((d) => d !== district)
                : [...prev.districts, district],
        }));
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <AdminSidebar userRole="admin" />

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex h-16 items-center justify-between border-b px-6 bg-background">
                    <div>
                        <h1 className="font-display font-semibold text-xl" data-testid="text-subadmins-title">
                            Sub-Admin Management
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage District Programme Officers (DPOs)
                        </p>
                    </div>
                    <Button
                        className="gap-2"
                        onClick={() => setShowAddDialog(true)}
                        data-testid="button-add-subadmin"
                    >
                        <UserPlus className="w-4 h-4" />
                        Add Sub-Admin
                    </Button>
                </header>

                <main className="flex-1 overflow-auto p-6 bg-muted/30">
                    <div className="space-y-6 max-w-7xl">
                        {isLoading ? (
                            <div className="flex items-center justify-center p-8">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <span className="ml-2">Loading DPOs...</span>
                            </div>
                        ) : error ? (
                            <div className="text-center p-8 text-red-500">
                                Error loading DPOs: {error.message}
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">Total Sub-Admins</p>
                                                    <p className="font-display font-bold text-2xl">{dpos.length}</p>
                                                </div>
                                                <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                                                    <Shield className="w-5 h-5 text-chart-2" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">Active Users</p>
                                                    <p className="font-display font-bold text-2xl">
                                                        {dpos.filter((dpo) => dpo.enabled).length}
                                                    </p>
                                                </div>
                                                <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                                                    <CheckCircle className="w-5 h-5 text-chart-3" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">Districts Covered</p>
                                                    <p className="font-display font-bold text-2xl">
                                                        {new Set(dpos.map((dpo) => dpo.district).filter(Boolean)).size}
                                                    </p>
                                                </div>
                                                <div className="w-10 h-10 rounded-lg bg-chart-4/10 flex items-center justify-center">
                                                    <MapPin className="w-5 h-5 text-chart-4" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card>
                                    <CardHeader>
                                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                            <div>
                                                <CardTitle>All Sub-Administrators</CardTitle>
                                                <CardDescription>
                                                    {filteredDPOs.length} DPOs registered
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex gap-4">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search by name, username, or ID..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="pl-10"
                                                    data-testid="input-search"
                                                />
                                            </div>

                                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                                <SelectTrigger className="w-48" data-testid="select-status-filter">
                                                    <SelectValue placeholder="Filter by status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Status</SelectItem>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="inactive">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-4">
                                            {filteredDPOs.map((dpo, index) => (
                                                <Card
                                                    key={dpo.dpo_id}
                                                    className="hover-elevate transition-all"
                                                    data-testid={`subadmin-card-${index}`}
                                                >
                                                    <CardContent className="p-6">
                                                        <div className="flex flex-col lg:flex-row gap-6">
                                                            <div className="flex-1 space-y-4">
                                                                <div className="flex items-start justify-between">
                                                                    <div>
                                                                        <div className="flex items-center gap-3 mb-1">
                                                                            <h3 className="font-semibold text-lg">{dpo.name}</h3>
                                                                            <Badge
                                                                                variant={dpo.enabled ? "default" : "secondary"}
                                                                                className={dpo.enabled ? "bg-chart-3" : ""}
                                                                            >
                                                                                {dpo.enabled ? "active" : "inactive"}
                                                                            </Badge>
                                                                        </div>
                                                                        <p className="text-sm text-muted-foreground">
                                                                            ID: {dpo.dpo_id} • @{dpo.user_id}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => handleEditDPO(dpo)}
                                                                            data-testid={`button-edit-${index}`}
                                                                        >
                                                                            <Edit className="w-4 h-4 mr-1" />
                                                                            Edit
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => handleOpenPasswordDialog(dpo)}
                                                                            data-testid={`button-reset-password-${index}`}
                                                                        >
                                                                            <Shield className="w-4 h-4 mr-1" />
                                                                            Reset Password
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                                        <Mail className="w-4 h-4" />
                                                                        <span>{dpo.email}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                                        <Phone className="w-4 h-4" />
                                                                        <span>{dpo.mobile_number}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                                        <MapPin className="w-4 h-4" />
                                                                        <span>District: {dpo.district}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                                        <BarChart3 className="w-4 h-4" />
                                                                        <span>User Type: {dpo.user_type}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>
                </main>
            </div>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add New Sub-Administrator</DialogTitle>
                        <DialogDescription>
                            Create a new DPO account and assign zones
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first-name">First Name *</Label>
                                <Input
                                    id="first-name"
                                    placeholder="Enter first name"
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    data-testid="input-first-name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="last-name">Last Name *</Label>
                                <Input
                                    id="last-name"
                                    placeholder="Enter last name"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    data-testid="input-last-name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="username">Username *</Label>
                                <Input
                                    id="username"
                                    placeholder="Enter username"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    data-testid="input-username"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    data-testid="input-email"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mobile">Mobile Number *</Label>
                                <Input
                                    id="mobile"
                                    placeholder="Enter mobile number"
                                    value={formData.mobile}
                                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                    data-testid="input-mobile"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="password">Password *</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    data-testid="input-password"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Assign Districts *</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg max-h-48 overflow-y-auto">
                                {districtsLoading ? (
                                    <div className="col-span-full flex items-center justify-center p-4">
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        <span className="text-sm text-muted-foreground">Loading districts...</span>
                                    </div>
                                ) : districts.length > 0 ? (
                                    districts.map((district: string) => (
                                        <div key={district} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`district-${district}`}
                                                checked={formData.districts.includes(district)}
                                                onCheckedChange={() => handleDistrictToggle(district)}
                                                data-testid={`checkbox-district-${district}`}
                                            />
                                            <label
                                                htmlFor={`district-${district}`}
                                                className="text-sm cursor-pointer"
                                            >
                                                {district}
                                            </label>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center p-4 text-muted-foreground text-sm">
                                        No districts available
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowAddDialog(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleAddSubAdmin}
                                disabled={
                                    createLoading ||
                                    !formData.first_name ||
                                    !formData.last_name ||
                                    !formData.email ||
                                    !formData.mobile ||
                                    !formData.password ||
                                    formData.districts.length === 0
                                }
                                data-testid="button-submit-add"
                            >
                                {createLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Sub-Admin"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Sub-Administrator</DialogTitle>
                        <DialogDescription>
                            Update DPO information and zone assignments
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-first-name">First Name</Label>
                                <Input
                                    id="edit-first-name"
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    data-testid="input-edit-first-name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-last-name">Last Name</Label>
                                <Input
                                    id="edit-last-name"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    data-testid="input-edit-last-name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-email">Email Address</Label>
                                <Input
                                    id="edit-email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    data-testid="input-edit-email"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-mobile">Mobile Number</Label>
                                <Input
                                    id="edit-mobile"
                                    value={formData.mobile}
                                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                    data-testid="input-edit-mobile"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Assign Districts</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg max-h-48 overflow-y-auto">
                                {districtsLoading ? (
                                    <div className="col-span-full flex items-center justify-center p-4">
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        <span className="text-sm text-muted-foreground">Loading districts...</span>
                                    </div>
                                ) : districts.length > 0 ? (
                                    districts.map((district: string) => (
                                        <div key={district} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`edit-district-${district}`}
                                                checked={formData.districts.includes(district)}
                                                onCheckedChange={() => handleDistrictToggle(district)}
                                            />
                                            <label
                                                htmlFor={`edit-district-${district}`}
                                                className="text-sm cursor-pointer"
                                            >
                                                {district}
                                            </label>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center p-4 text-muted-foreground text-sm">
                                        No districts available
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowEditDialog(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleUpdateSubAdmin}
                                disabled={isUpdating || updateLoading}
                                data-testid="button-submit-update"
                            >
                                {(isUpdating || updateLoading) ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Update Sub-Admin"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                            Set a new password for {selectedDPO?.name} ({selectedDPO?.user_id})
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                placeholder="Enter new password (min 6 characters)"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                data-testid="input-new-password"
                            />
                            <p className="text-xs text-muted-foreground">
                                Password must be at least 6 characters long
                            </p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                    setShowPasswordDialog(false);
                                    setNewPassword("");
                                }}
                                data-testid="button-cancel-password"
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleUpdatePassword}
                                disabled={passwordLoading || !newPassword || newPassword.length < 6}
                                data-testid="button-submit-password"
                            >
                                {passwordLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Update Password"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <Toaster />
        </div>
    );
}
