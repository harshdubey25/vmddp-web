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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useFrappeGetDocList, useFrappeUpdateDoc, useFrappeCreateDoc, useFrappePostCall, useFrappeGetCall } from "frappe-react-sdk";
import { FrappeCustomApiResponse } from "@/types";
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
    date: string;
    amount: number | null;
    allocater?: string;
    docstatus?: number;
}
const initialExpense: AdminExpenseTarget = {
    date: "",
    amount: null,
};

export default function TargetAllocation() {
    const [selectionType, setSelectionType] = useState<"district" | "headquarters" | null>('district');
    const [selectedDistrict, setSelectedDistrict] = useState<string>("");

    const [editingComponent, setEditingComponent] = useState<string | null>(null);
    const [draftAllocation, setDraftAllocation] = useState<TargetAllocation | null>(null);
    const [adminExpense, setAdminExpense] = useState<AdminExpenseTarget>(initialExpense);
    const [showExpenseForm, setShowExpenseForm] = useState<boolean>(false);

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
    const handleExpenseChange = (field: keyof AdminExpenseTarget, value: string) => {
        setAdminExpense({ ...adminExpense, [field]: field === "amount" ? (value === "" ? null : Number(value)) : value });
    };
    const { data: adminExpensesData, mutate: mutateAdminExpenses } = useFrappeGetCall<FrappeCustomApiResponse<{ total_allocated: string, total_expenditure: string, targets_list: Array<{ name: string, amount: number, date: string, allocater: string }>, total_count: number }>>('vmddp_app.api.v1.admin.admin_expense_target')
    console.log("Admin Expenses Data:", adminExpensesData);
    const handleClearExpense = () => {
        setAdminExpense(initialExpense);
    };
    useEffect(() => {

    }, [selectionType])
    const handleSubmitAdminExpense = async () => {
        if (!adminExpense.date || !adminExpense.amount) {
            toast({
                title: "Validation Error",
                description: "Please enter Date and Amount",
                variant: "destructive",
            });
            return;
        }
        try {
            const doc = await createAdminExpense("Admin Expense Target", {
                date: adminExpense.date,
                amount: adminExpense.amount,
                allocater: user?.user,
            })
            await updateAdminExpense("Admin Expense Target", doc.name, {
                allocater: user?.user,
                docstatus: 1,
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to submit expense. Please try again.",
                variant: "destructive",
            });
            return;
        }
        toast({
            title: "Expense Registered",
            description: `Event "${adminExpense.date}" expense of ${formatCurrency(adminExpense.amount)} submitted successfully.`,
        });
        setAdminExpense(initialExpense);
        mutateAdminExpenses();
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
                                                        Set Head Quarter Expense Target
                                                    </CardTitle>
                                                    <CardDescription>
                                                        allocate expense targets for head quarter events
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
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
                                                            Clear
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={handleSubmitAdminExpense}
                                                            data-testid="button-submit-expense"
                                                            disabled={createAdminExpenseLoading || updateAdminExpenseLoading}


                                                        >
                                                            <Save className="w-4 h-4 mr-1" />
                                                            Submit
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {/* Expense History List */}
                                        {adminExpensesData?.message?.targets_list && adminExpensesData.message.targets_list.length > 0 && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-base">Expense History</CardTitle>
                                                    <CardDescription>
                                                        {adminExpensesData.message.total_count} allocation(s) recorded
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-3">
                                                        {adminExpensesData.message.targets_list.map((item) => (
                                                            <div
                                                                key={item.name}
                                                                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                                                data-testid={`expense-item-${item.name}`}
                                                            >
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-sm font-medium">{item.name}</span>
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
                                                                <div className="text-right">
                                                                    <span className="text-base font-semibold text-primary">
                                                                        {formatCurrency(item.amount)}
                                                                    </span>
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
        </div>
    );
}

