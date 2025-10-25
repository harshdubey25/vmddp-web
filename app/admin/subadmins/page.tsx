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
} from "lucide-react";
import { useState } from "react";

interface SubAdmin {
    id: string;
    name: string;
    username: string;
    email: string;
    mobile: string;
    assignedDistricts: string[];
    assignedTalukas: string[];
    status: "active" | "inactive";
    totalApplications: number;
    pendingApplications: number;
    joinedDate: string;
}

const subAdmins: SubAdmin[] = [
    {
        id: "SA-001",
        name: "Dr. Rajesh Shinde",
        username: "rajesh.shinde",
        email: "rajesh.shinde@vmddp.gov.in",
        mobile: "9876543210",
        assignedDistricts: ["Nagpur"],
        assignedTalukas: ["Nagpur Rural", "Kamptee", "Hingna"],
        status: "active",
        totalApplications: 245,
        pendingApplications: 32,
        joinedDate: "2024-06-15",
    },
    {
        id: "SA-002",
        name: "Mrs. Sunita Deshmukh",
        username: "sunita.deshmukh",
        email: "sunita.deshmukh@vmddp.gov.in",
        mobile: "9876543211",
        assignedDistricts: ["Amravati"],
        assignedTalukas: ["Morshi", "Warud", "Daryapur"],
        status: "active",
        totalApplications: 189,
        pendingApplications: 28,
        joinedDate: "2024-07-01",
    },
    {
        id: "SA-003",
        name: "Mr. Prashant Kale",
        username: "prashant.kale",
        email: "prashant.kale@vmddp.gov.in",
        mobile: "9876543212",
        assignedDistricts: ["Akola", "Washim"],
        assignedTalukas: ["Akot", "Murtizapur", "Karanja"],
        status: "active",
        totalApplications: 312,
        pendingApplications: 45,
        joinedDate: "2024-06-20",
    },
    {
        id: "SA-004",
        name: "Dr. Vandana Patil",
        username: "vandana.patil",
        email: "vandana.patil@vmddp.gov.in",
        mobile: "9876543213",
        assignedDistricts: ["Yavatmal"],
        assignedTalukas: ["Pusad", "Digras", "Umarkhed"],
        status: "inactive",
        totalApplications: 156,
        pendingApplications: 0,
        joinedDate: "2024-05-10",
    },
];

const districts = [
    "Nagpur", "Amravati", "Akola", "Yavatmal", "Wardha",
    "Washim", "Buldhana", "Chandrapur", "Gadchiroli"
];

export default function AdminSubAdmins() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [selectedSubAdmin, setSelectedSubAdmin] = useState<SubAdmin | null>(null);
    const [newPassword, setNewPassword] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        username: "",
        email: "",
        mobile: "",
        password: "",
        districts: [] as string[],
        talukas: [] as string[],
    });

    const filteredSubAdmins = subAdmins.filter((sa) => {
        const matchesSearch =
            sa.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sa.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sa.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || sa.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleAddSubAdmin = () => {
        console.log("Adding sub-admin:", formData);
        setShowAddDialog(false);
        setFormData({
            name: "",
            username: "",
            email: "",
            mobile: "",
            password: "",
            districts: [],
            talukas: [],
        });
    };

    const handleEditSubAdmin = (subAdmin: SubAdmin) => {
        setSelectedSubAdmin(subAdmin);
        setFormData({
            name: subAdmin.name,
            username: subAdmin.username,
            email: subAdmin.email,
            mobile: subAdmin.mobile,
            password: "",
            districts: subAdmin.assignedDistricts,
            talukas: subAdmin.assignedTalukas,
        });
        setShowEditDialog(true);
    };

    const handleUpdateSubAdmin = () => {
        console.log("Updating sub-admin:", selectedSubAdmin?.id, formData);
        setShowEditDialog(false);
        setSelectedSubAdmin(null);
    };

    const handleOpenPasswordDialog = (subAdmin: SubAdmin) => {
        setSelectedSubAdmin(subAdmin);
        setNewPassword("");
        setShowPasswordDialog(true);
    };

    const handleUpdatePassword = () => {
        if (!newPassword || newPassword.length < 6) {
            alert("Password must be at least 6 characters long");
            return;
        }
        console.log("Updating password for:", selectedSubAdmin?.username, "New password:", newPassword);
        setShowPasswordDialog(false);
        setSelectedSubAdmin(null);
        setNewPassword("");
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Total Sub-Admins</p>
                                            <p className="font-display font-bold text-2xl">{subAdmins.length}</p>
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
                                                {subAdmins.filter((sa) => sa.status === "active").length}
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
                                                {new Set(subAdmins.flatMap((sa) => sa.assignedDistricts)).size}
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
                                            {filteredSubAdmins.length} DPOs registered
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
                                    {filteredSubAdmins.map((subAdmin, index) => (
                                        <Card
                                            key={subAdmin.id}
                                            className="hover-elevate transition-all"
                                            data-testid={`subadmin-card-${index}`}
                                        >
                                            <CardContent className="p-6">
                                                <div className="flex flex-col lg:flex-row gap-6">
                                                    <div className="flex-1 space-y-4">
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <div className="flex items-center gap-3 mb-1">
                                                                    <h3 className="font-semibold text-lg">{subAdmin.name}</h3>
                                                                    <Badge
                                                                        variant={subAdmin.status === "active" ? "default" : "secondary"}
                                                                        className={subAdmin.status === "active" ? "bg-chart-3" : ""}
                                                                    >
                                                                        {subAdmin.status}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-sm text-muted-foreground">
                                                                    ID: {subAdmin.id} • @{subAdmin.username}
                                                                </p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleEditSubAdmin(subAdmin)}
                                                                    data-testid={`button-edit-${index}`}
                                                                >
                                                                    <Edit className="w-4 h-4 mr-1" />
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleOpenPasswordDialog(subAdmin)}
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
                                                                <span>{subAdmin.email}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <Phone className="w-4 h-4" />
                                                                <span>{subAdmin.mobile}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <MapPin className="w-4 h-4" />
                                                                <span>Districts: {subAdmin.assignedDistricts.join(", ")}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <BarChart3 className="w-4 h-4" />
                                                                <span>
                                                                    {subAdmin.totalApplications} applications ({subAdmin.pendingApplications} pending)
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <p className="text-xs text-muted-foreground mb-2">Assigned Talukas:</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {subAdmin.assignedTalukas.map((taluka) => (
                                                                    <Badge key={taluka} variant="outline" className="text-xs">
                                                                        {taluka}
                                                                    </Badge>
                                                                ))}
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
                                <Label htmlFor="name">Full Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="Enter full name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    data-testid="input-name"
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
                                {districts.map((district) => (
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
                                ))}
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
                                    !formData.name ||
                                    !formData.username ||
                                    !formData.email ||
                                    !formData.mobile ||
                                    !formData.password ||
                                    formData.districts.length === 0
                                }
                                data-testid="button-submit-add"
                            >
                                Create Sub-Admin
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
                                <Label htmlFor="edit-name">Full Name</Label>
                                <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    data-testid="input-edit-name"
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
                                {districts.map((district) => (
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
                                ))}
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
                                data-testid="button-submit-update"
                            >
                                Update Sub-Admin
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
                            Set a new password for {selectedSubAdmin?.name} ({selectedSubAdmin?.username})
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
                                data-testid="button-submit-password"
                            >
                                Update Password
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
