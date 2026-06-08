"use client"
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Target,
    Building2,
    Landmark,
    Package,
    Save,
    CheckCircle,
    AlertCircle,
    X,
    Receipt,
    Plus,
    IndianRupee,
    TrendingUp,
    Edit,
    Trash2,
    Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useFrappeGetDocList, useFrappeUpdateDoc, useFrappeCreateDoc, useFrappePostCall, useFrappeGetCall, useFrappeDeleteDoc, useFrappeGetDoc } from "frappe-react-sdk";
import { FrappeCustomApiResponse } from "@/types";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
interface Component {
    name: string;
}
interface TargetAllocation {
    component: string;
    physical_target: number | null;
    financial_target: number | null;
    district: string;
    name?: string;
    docstatus?: number;
}

interface AdminExpenseTarget {
    name?: string;
    date: string;
    amount: number | null;
    event_name?: string;
    allocater?: string;
    docstatus?: number;
}
const initialExpense: AdminExpenseTarget = {
    date: "",
    amount: null,
    event_name: "",
};

export default function TargetAllocation() {
    const [selectionType, setSelectionType] = useState<"district" | "headquarters" | null>('district');
    const [selectedDistrict, setSelectedDistrict] = useState<string>("");

    const [editingComponent, setEditingComponent] = useState<string | null>(null);
    const [draftAllocation, setDraftAllocation] = useState<TargetAllocation | null>(null);
    const [adminExpense, setAdminExpense] = useState<AdminExpenseTarget>(initialExpense);
    const [showExpenseForm, setShowExpenseForm] = useState<boolean>(false);
    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
    const [deletingExpense, setDeletingExpense] = useState<AdminExpenseTarget | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    // Mock data for totals - replace with actual API data
    const { toast } = useToast();
    const { data: districtList } = useFrappeGetDocList('District Master')
    const { data: ComponentList } = useFrappeGetDocList<Component>('Component')
    const { data: targetAllocationData, mutate } = useFrappeGetDocList<TargetAllocation>('Target Allocation', {
        filters: [
            ['district', '=', selectedDistrict]
        ],
        fields: ['component', 'physical_target', 'financial_target', 'district', 'name']
    })
    const { user } = useAuth();
    const { updateDoc, error: updateError, loading: updateDocLoading, isCompleted: isUpdateCompleted } = useFrappeUpdateDoc<TargetAllocation>();
    const { createDoc, error: createError, loading: createDocLoading, isCompleted: isCreateCompleted } = useFrappeCreateDoc<TargetAllocation>();

    const { createDoc: createAdminExpense, loading: createAdminExpenseLoading } = useFrappeCreateDoc<AdminExpenseTarget>()
    const { updateDoc: updateAdminExpense, loading: updateAdminExpenseLoading } = useFrappeUpdateDoc<AdminExpenseTarget>();
    const { deleteDoc: deleteAdminExpense, loading: deleteAdminExpenseLoading } = useFrappeDeleteDoc();

    const { data: singleTargetData } = useFrappeGetDoc<AdminExpenseTarget>(
        "Admin Expense Target",
        editingExpenseId || undefined,
        editingExpenseId ? undefined : null
    );

    useEffect(() => {
        if (editingExpenseId && singleTargetData) {
            setAdminExpense({
                date: singleTargetData.date || "",
                amount: singleTargetData.amount || null,
                event_name: singleTargetData.event_name || "",
                docstatus: 1
            });
        }
    }, [editingExpenseId, singleTargetData]);
    const handleExpenseChange = (field: keyof AdminExpenseTarget, value: string) => {
        setAdminExpense({ ...adminExpense, [field]: field === "amount" ? (value === "" ? null : Number(value)) : value });
    };
    const { data: targetList, mutate: mutateTargetList } = useFrappeGetDocList<AdminExpenseTarget>('Admin Expense Target', {
        fields: ['name', 'amount', 'date', 'event_name', 'allocater', 'docstatus'],
        filters: [['docstatus', '=', 1]],
        orderBy: { field: 'date', order: 'desc' }
    });
    const { data: adminExpensesData, mutate: mutateAdminExpenses } = useFrappeGetCall<FrappeCustomApiResponse<{ total_allocated: string, total_expenditure: string, targets_list: Array<{ name: string, amount: number, date: string, event_name: string, allocater: string }>, total_count: number }>>('vmddp_app.api.v1.admin.admin_expense_target')
    console.log("Admin Expenses Data:", adminExpensesData);
    const handleClearExpense = () => {
        setAdminExpense(initialExpense);
        setEditingExpenseId(null);
    };
    const handleEditExpenseClick = (item: AdminExpenseTarget) => {
        if (!item.name) return;
        setEditingExpenseId(item.name);
        setAdminExpense({
            date: item.date,
            amount: item.amount,
            event_name: item.event_name || "",
            docstatus: 1
        });
        setShowExpenseForm(true);
    };
    const handleDeleteExpense = async () => {
        if (!deletingExpense) return;
        setIsDeleting(true);
        try {
            await updateAdminExpense("Admin Expense Target", deletingExpense.name!, { docstatus: 2 });
            await deleteAdminExpense("Admin Expense Target", deletingExpense.name!);
            toast({
                title: "Success",
                description: "Expense target deleted successfully.",
            });
            mutateAdminExpenses();
            mutateTargetList();
            setDeletingExpense(null);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete expense target. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };
    useEffect(() => {

    }, [selectionType])
    const handleSubmitAdminExpense = async () => {
        if (!adminExpense.date || !adminExpense.amount || !adminExpense.event_name) {
            toast({
                title: "Validation Error",
                description: "Please enter Event Name, Date and Amount",
                variant: "destructive",
            });
            return;
        }
        try {
            if (editingExpenseId) {
                // Cancel existing target first
                await updateAdminExpense("Admin Expense Target", editingExpenseId, { docstatus: 2 });
                // Delete existing target
                await deleteAdminExpense("Admin Expense Target", editingExpenseId);
                // Create new target
                const doc = await createAdminExpense("Admin Expense Target", {
                    date: adminExpense.date,
                    amount: adminExpense.amount,
                    event_name: adminExpense.event_name,
                    allocater: user?.user,
                });
                await updateAdminExpense("Admin Expense Target", doc.name, {
                    allocater: user?.user,
                    docstatus: 1,
                });
                toast({
                    title: "Expense Target Updated",
                    description: `Event "${adminExpense.event_name}" target updated successfully.`,
                });
                setEditingExpenseId(null);
                setShowExpenseForm(false);
            } else {
                const doc = await createAdminExpense("Admin Expense Target", {
                    date: adminExpense.date,
                    amount: adminExpense.amount,
                    event_name: adminExpense.event_name,
                    allocater: user?.user,
                });
                await updateAdminExpense("Admin Expense Target", doc.name, {
                    allocater: user?.user,
                    docstatus: 1,
                });
                toast({
                    title: "Expense Registered",
                    description: `Event "${adminExpense.event_name}" expense of ${formatCurrency(adminExpense.amount)} submitted successfully.`,
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: `Failed to ${editingExpenseId ? "update" : "submit"} target. Please try again.`,
                variant: "destructive",
            });
            return;
        }
        setAdminExpense(initialExpense);
        mutateAdminExpenses();
        mutateTargetList();
    };

    const isAllocated = (componentName: string) => {
        console.log("Checking allocation for component:", componentName, "in", targetAllocationData);
        const newArr = (targetAllocationData?.map((ta) => ta.component) || []);
        console.log("Allocated components:", newArr);
        return (targetAllocationData?.map((ta) => ta.component) || []).includes(componentName);
    };
    const getPhysicalTarget = (componentName: string) => {
        const allocation = targetAllocationData?.find((ta: any) => ta.component === componentName);
        return allocation ? allocation.physical_target : null;
    }
    const getFinancialTarget = (componentName: string) => {
        const allocation = targetAllocationData?.find((ta: any) => ta.component === componentName);
        return allocation ? allocation.financial_target : null;
    }
    const handleStartEdit = (componentName: string) => {
        setEditingComponent(componentName);
        const existingAllocation = targetAllocationData?.find((ta: any) => ta.component === componentName);
        if (!existingAllocation) {
            setDraftAllocation({
                component: componentName,
                physical_target: null,
                financial_target: null,
                district: selectedDistrict,
            });
            return;
        }

        setDraftAllocation({
            component: componentName,
            physical_target: existingAllocation.physical_target,
            financial_target: existingAllocation.financial_target,
            district: existingAllocation.district,
            name: existingAllocation.name,
        })
    };

    const handleDraftChange = (field: keyof TargetAllocation, value: string) => {
        if (!draftAllocation) return;
        const numValue = value === "" ? null : Number(value);
        setDraftAllocation({ ...draftAllocation, [field]: numValue });
    };

    const handleUpdateAllocation = async () => {
        if (!draftAllocation || !draftAllocation.name) return;
        try {


            const doc = await updateDoc("Target Allocation", draftAllocation.name, { ...draftAllocation, docstatus: 1 })

            toast({
                title: "Success",
                description: "Allocation updated successfully.",
            });
            mutate()
            setEditingComponent(null);
            setDraftAllocation(null);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update allocation. Please try again.",
                variant: "destructive",
            });
        }
    };
    const handleCreateAllocation = async () => {
        if (!draftAllocation) return;
        try {


            const doc = await createDoc("Target Allocation", draftAllocation)
            await updateDoc("Target Allocation", doc.name!, { docstatus: 1 })
            toast({
                title: "Success",
                description: "Allocation created successfully.",
            });
            mutate()

            setEditingComponent(null);
            setDraftAllocation(null);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create allocation. Please try again.",
                variant: "destructive",
            });
        }

    }
    const handleCancelEdit = () => {
        setEditingComponent(null);
        setDraftAllocation(null);
    };

    const formatCurrency = (amount: number | null) => {
        if (amount === null) return "-";
        console.log(amount)
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="flex  bg-background w-full overflow-scroll">


            <div className="flex-1 flex flex-col">
                <header className="h-16 border-b flex items-center justify-between px-6 bg-card">
                    <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-primary" />
                        <h1 className="text-xl font-display font-semibold">Target Allocation</h1>
                    </div>
                </header>

                <main className="flex-1 p-6 ">
                    <div className="max-w-6xl mx-auto space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Select Allocation Level</CardTitle>
                                <CardDescription>
                                    Choose whether to allocate targets for a district or headquarters
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <RadioGroup
                                    value={selectionType || ""}
                                    onValueChange={(value) => {
                                        setSelectionType(value as "district" | "headquarters");
                                        setSelectedDistrict("");
                                    }}
                                    className="flex gap-6"
                                >
                                    <div className="flex items-center space-x-3">
                                        <RadioGroupItem value="district" id="district" data-testid="radio-district" />
                                        <Label htmlFor="district" className="flex items-center gap-2 cursor-pointer">
                                            <Building2 className="w-4 h-4" />
                                            District
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <RadioGroupItem value="headquarters" id="headquarters" data-testid="radio-headquarters" />
                                        <Label htmlFor="headquarters" className="flex items-center gap-2 cursor-pointer">
                                            <Landmark className="w-4 h-4" />
                                            Head Quarter
                                        </Label>
                                    </div>
                                </RadioGroup>

                                {selectionType === "district" && (
                                    <div className="space-y-3">
                                        <Label className="text-sm text-muted-foreground block">Select District</Label>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                                                    <SelectTrigger data-testid="select-district" className="flex-1">
                                                        <SelectValue placeholder="Search and choose a district" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {districtList?.map((district) => (
                                                            <SelectItem key={district.name} value={district.name} data-testid={`option-district-${district.name.toLowerCase()}`}>
                                                                {district.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setSelectedDistrict("")}
                                                disabled={!selectedDistrict}
                                                data-testid="button-clear-district"
                                                title="Clear selection"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {selectionType === "headquarters" && (
                                    <div className="space-y-4 mt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <Card>
                                                <CardContent className="pt-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-primary/10 rounded-lg">
                                                            <IndianRupee className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Total Allocated</p>
                                                            <p className="text-2xl font-semibold" data-testid="text-total-allocated">
                                                                {formatCurrency(parseFloat(adminExpensesData?.message.total_allocated || "0"))}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardContent className="pt-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-green-500/10 rounded-lg">
                                                            <TrendingUp className="w-5 h-5 text-green-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Total Expenditure</p>
                                                            <p className="text-2xl font-semibold" data-testid="text-total-expenditure">
                                                                {formatCurrency(parseFloat(adminExpensesData?.message.total_expenditure || "0"))}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <Button
                                            variant={showExpenseForm ? "secondary" : "default"}
                                            onClick={() => setShowExpenseForm(!showExpenseForm)}
                                            data-testid="button-add-expenses"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            {showExpenseForm ? "Hide Form" : "Add Targets"}
                                        </Button>

                                        {showExpenseForm && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-base flex items-center gap-2">
                                                        <Receipt className="w-4 h-4" />
                                                        {editingExpenseId ? "Edit Head Quarter Expense Target" : "Set Head Quarter Expense Target"}
                                                    </CardTitle>
                                                    <CardDescription>
                                                        {editingExpenseId ? "update expense targets for head quarter events" : "allocate expense targets for head quarter events"}
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div>
                                                            <Label className="text-sm">Event Name</Label>
                                                            <Input
                                                                type="text"
                                                                placeholder="Enter event name"
                                                                value={adminExpense.event_name ?? ""}
                                                                onChange={(e) => handleExpenseChange("event_name", e.target.value)}
                                                                className="mt-1"
                                                                data-testid="input-expense-event-name"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-sm">Date</Label>
                                                            <Input
                                                                type="date"
                                                                value={adminExpense.date}
                                                                onChange={(e) => handleExpenseChange("date", e.target.value)}
                                                                className="mt-1"
                                                                data-testid="input-expense-date"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-sm">Amount</Label>
                                                            <Input
                                                                type="number"
                                                                placeholder="Enter amount"
                                                                value={adminExpense.amount ?? ""}
                                                                onChange={(e) => handleExpenseChange("amount", e.target.value)}
                                                                className="mt-1"
                                                                data-testid="input-expense-amount"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={handleClearExpense}
                                                            data-testid="button-clear-expense"
                                                        >
                                                            {editingExpenseId ? "Cancel" : "Clear"}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={handleSubmitAdminExpense}
                                                            data-testid="button-submit-expense"
                                                            disabled={createAdminExpenseLoading || updateAdminExpenseLoading || deleteAdminExpenseLoading}
                                                        >
                                                            {createAdminExpenseLoading || updateAdminExpenseLoading || deleteAdminExpenseLoading ? (
                                                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                                            ) : (
                                                                <Save className="w-4 h-4 mr-1" />
                                                            )}
                                                            {editingExpenseId ? "Save Changes" : "Submit"}
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {/* Expense History List */}
                                        {targetList && targetList.length > 0 && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-base">Expense History</CardTitle>
                                                    <CardDescription>
                                                        {targetList.length} allocation(s) recorded
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-3">
                                                        {targetList.map((item) => (
                                                            <div
                                                                key={item.name}
                                                                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                                                data-testid={`expense-item-${item.name}`}
                                                            >
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-base font-semibold">{item.event_name}</span>
                                                                    <span className="text-xs text-muted-foreground font-mono">{item.name}</span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {new Date(item.date).toLocaleDateString('en-IN', {
                                                                            day: '2-digit',
                                                                            month: 'short',
                                                                            year: 'numeric'
                                                                        })}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        By: {item.allocater}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <div className="text-right">
                                                                        <span className="text-lg font-bold text-primary block">
                                                                            {formatCurrency(item.amount)}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex gap-1">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                            onClick={() => handleEditExpenseClick(item)}
                                                                            data-testid={`button-edit-expense-${item.name}`}
                                                                        >
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                            onClick={() => setDeletingExpense(item)}
                                                                            data-testid={`button-delete-expense-${item.name}`}
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {selectedDistrict && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold flex items-center gap-2">
                                        <Package className="w-5 h-5" />
                                        Component Allocations
                                        <Badge variant="outline" className="ml-2">{selectedDistrict}</Badge>
                                    </h2>
                                </div>

                                <div className="grid gap-4 grid-cols-2">
                                    {ComponentList?.map((component) => (
                                        <Card
                                            key={component.name}
                                            className={editingComponent === component.name ? "ring-2 ring-primary" : ""}
                                            data-testid={`card-component-${component.name}`}
                                        >
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex-1">
                                                        <CardTitle className="text-base">{component.name}</CardTitle>
                                                    </div>
                                                    <Badge
                                                        variant={isAllocated(component.name) ? "default" : "secondary"}
                                                        data-testid={`badge-status-${component.name}`}
                                                    >
                                                        {isAllocated(component.name) ? (
                                                            <span className="flex items-center gap-1">
                                                                <CheckCircle className="w-3 h-3" />
                                                                Allocated
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1">
                                                                <AlertCircle className="w-3 h-3" />
                                                                Unallocated
                                                            </span>
                                                        )}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                {editingComponent === component.name && draftAllocation ? (
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                            <div>
                                                                <Label className="text-xs text-muted-foreground">Physical Target</Label>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="Enter target"
                                                                    value={draftAllocation.physical_target ?? ""}
                                                                    onChange={(e) => handleDraftChange("physical_target", e.target.value)}
                                                                    className="mt-1"
                                                                    data-testid={`input-physical-target-${component.name}`}
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs text-muted-foreground">Financial Target (₹)</Label>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="Enter amount"
                                                                    value={draftAllocation.financial_target ?? ""}
                                                                    onChange={(e) => handleDraftChange("financial_target", e.target.value)}
                                                                    className="mt-1"
                                                                    data-testid={`input-financial-target-${component.name}`}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={handleCancelEdit}
                                                                data-testid={`button-cancel-${component.name}`}
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                onClick={isAllocated(component.name) ? handleUpdateAllocation : handleCreateAllocation}
                                                                data-testid={`button-save-${component.name}`}
                                                            >
                                                                <Save className="w-4 h-4 mr-1" />
                                                                Save
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                            <div>
                                                                <Label className="text-xs text-muted-foreground">Physical Target</Label>
                                                                <p className="font-medium mt-1" data-testid={`text-physical-target-${component.name}`}>
                                                                    {getPhysicalTarget(component.name) !== null ? getPhysicalTarget(component.name) : "-"}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs text-muted-foreground">Financial Target</Label>
                                                                <p className="font-medium mt-1" data-testid={`text-financial-target-${component.name}`}>
                                                                    {getFinancialTarget(component.name) !== null ? formatCurrency(getFinancialTarget(component.name)) : "-"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-end">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleStartEdit(component.name)}
                                                                data-testid={`button-edit-${component.name}`}
                                                            >
                                                                {isAllocated(component.name) ? "Edit Allocation" : "Set Allocation"}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
            <AlertDialog 
                open={!!deletingExpense} 
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingExpense(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete the expense target for &quot;{deletingExpense?.event_name}&quot;.
                            Since this is a submitted document, it will be cancelled first and then deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => {
                                e.preventDefault();
                                handleDeleteExpense();
                            }}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            data-testid="confirm-delete-expense"
                        >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

