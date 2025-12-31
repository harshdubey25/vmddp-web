"use client";
import { Components } from "@/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useFrappeCreateDoc, useFrappeGetDocCount, useFrappeGetDocList, useFrappeUpdateDoc } from "frappe-react-sdk";

import { Toaster } from "@/components/ui/toaster";
import {
    BarChart3,
    Edit,
    Package,
    Plus,
    Settings,

} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";



interface Component {
    name: string;
    component_name: string;
    criteria_table: string;
    or: string;
    dont_show_in_website: boolean;
    status: string;
    maximum_subsidy_amount?: string;
    subsidy_percent?: string;
    amount_per_head?: string;
}

export default function AdminComponents() {


    const [showSubsidyDialog, setShowSubsidyDialog] = useState(false);

    const [subsidyForm, setSubsidyForm] = useState<Component | null>(null);


    const { createDoc, loading: createLoading } = useFrappeCreateDoc();
    const { data: applicationCount } = useFrappeGetDocCount("App Form")
    const { data: componentCount } = useFrappeGetDocCount("Component")

    const { updateDoc } = useFrappeUpdateDoc()
    const { data: componentList, isLoading: loading, error, mutate } = useFrappeGetDocList<Component>('Component', {
        fields: ['name', 'component_name', 'criteria_table', 'or', 'dont_show_in_website', 'status', 'maximum_subsidy_amount', 'subsidy_percent', 'amount_per_head'],
    })
    const activeComponentCount = useMemo(() => {
        return componentList?.filter((c) => c.status === 'Active').length || 0
    }, [componentList])
    const handleOpenEditDialog = (component: Component) => {

        setSubsidyForm(component);
        setShowSubsidyDialog(true);
    };

    const handleUpdateComponent = async () => {


        if (!subsidyForm) return;
        try {
            await updateDoc('Component', subsidyForm?.name, subsidyForm)
            toast({
                title: "Success",
                description: "Component updated successfully.",
            });
            mutate()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update component. Please try again.",
                variant: "destructive",
            });
            return;
        } finally {
            setShowSubsidyDialog(false);
            setSubsidyForm(null)
        }


    };

    const handleAddComponent = () => {


    };



    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="flex h-14 sm:h-16 items-center justify-between border-b pl-12 pr-3 sm:pl-6 sm:pr-6 bg-background">
                <div>
                    <h1 className="font-display font-semibold text-base sm:text-xl" data-testid="text-components-title">
                        Component Management
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                        Manage scheme components and configurations
                    </p>
                </div>
                <Button className="gap-1 sm:gap-2 text-xs sm:text-sm" onClick={handleAddComponent} data-testid="button-add-component">
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Add Component</span>
                    <span className="sm:hidden">Add</span>
                </Button>
            </header>

            <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6 bg-muted/30">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Loading components...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <p className="text-red-600 mb-4">{error.message}</p>
                            <Button onClick={() => window.location.reload()}>
                                Retry
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 sm:space-y-6 max-w-7xl">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                            <Card>
                                <CardContent className="p-4 sm:p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Components</p>
                                            <p className="font-display font-bold text-xl sm:text-2xl">{componentCount}</p>
                                        </div>
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                                            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-chart-2" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4 sm:p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Active Schemes</p>
                                            <p className="font-display font-bold text-xl sm:text-2xl">
                                                {activeComponentCount}
                                            </p>
                                        </div>
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                                            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-chart-3" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4 sm:p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Applications</p>
                                            <p className="font-display font-bold text-xl sm:text-2xl">
                                                {applicationCount}
                                            </p>
                                        </div>
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-chart-4/10 flex items-center justify-center">
                                            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-chart-4" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            {componentList?.map((component, index) => (
                                <Card
                                    key={component.name}
                                    className="hover-elevate transition-all"
                                    data-testid={`component-card-${index}`}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                                <CardTitle className="text-base sm:text-lg">{component.name}</CardTitle>
                                                <Badge
                                                    variant={component.status === 'Active' ? 'default' : 'secondary'}
                                                >{component.status}</Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0 pb-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-muted/50 rounded-lg p-3">
                                                <p className="text-xs text-muted-foreground mb-1">Max Subsidy Amount</p>
                                                <p className="font-semibold text-lg text-primary">
                                                    {component.maximum_subsidy_amount
                                                        ? `₹${Number(component.maximum_subsidy_amount).toLocaleString('en-IN')}`
                                                        : '—'}
                                                </p>
                                            </div>
                                            <div className="bg-muted/50 rounded-lg p-3">
                                                <p className="text-xs text-muted-foreground mb-1">Subsidy Percentage</p>
                                                <p className="font-semibold text-lg text-primary">
                                                    {component.subsidy_percent
                                                        ? `${component.subsidy_percent}%`
                                                        : '—'}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-0 border-t">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full mt-3"
                                            onClick={() => handleOpenEditDialog(component)}
                                            data-testid={`button-edit-subsidy-${index}`}
                                        >
                                            <Edit className="w-4 h-4 mr-1" />
                                            Edit Component
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </main>




            {showSubsidyDialog && subsidyForm && (
                <Dialog
                    open={showSubsidyDialog}
                    onOpenChange={(open) => {
                        setShowSubsidyDialog(open);
                        if (!open) {
                            setSubsidyForm(null);
                        }
                    }}
                >
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Edit className="w-4 h-4" />
                                Edit Subsidy: {subsidyForm.name}
                            </DialogTitle>
                            <DialogDescription>
                                Set subsidy limits for this component.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={subsidyForm?.status === 'Active' ? 'default' : 'outline'}
                                        size="sm"
                                        className={subsidyForm?.status === 'Active' ? 'bg-green-600 hover:bg-green-700' : ''}
                                        onClick={() => subsidyForm && setSubsidyForm({ ...subsidyForm, status: 'Active' })}
                                        data-testid="button-status-active"
                                    >
                                        Active
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={subsidyForm?.status !== 'Active' ? 'default' : 'outline'}
                                        size="sm"
                                        className={subsidyForm?.status !== 'Active' ? 'bg-red-600 hover:bg-red-700' : ''}
                                        onClick={() => subsidyForm && setSubsidyForm({ ...subsidyForm, status: 'Inactive' })}
                                        data-testid="button-status-inactive"
                                    >
                                        Inactive
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Maximum Subsidy Amount</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    placeholder="e.g., 30000"
                                    value={subsidyForm?.maximum_subsidy_amount}
                                    onChange={(e) => subsidyForm && setSubsidyForm({ ...subsidyForm, maximum_subsidy_amount: e.target.value })}
                                    data-testid="input-max-subsidy"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Subsidy Percentage</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    placeholder="e.g., 50"
                                    value={subsidyForm?.subsidy_percent}
                                    onChange={(e) => subsidyForm && setSubsidyForm({ ...subsidyForm, subsidy_percent: e.target.value })}
                                    data-testid="input-subsidy-percentage"
                                />
                            </div>

                            {subsidyForm?.name === Components.FARMER_TRAINING && (
                                <div className="space-y-2">
                                    <Label>Amount Per Head</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        placeholder="e.g., 5000"
                                        value={subsidyForm?.amount_per_head}
                                        onChange={(e) => subsidyForm && setSubsidyForm({ ...subsidyForm, amount_per_head: e.target.value })}
                                        data-testid="input-amount-per-head"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 pt-4 border-t">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                    setShowSubsidyDialog(false);
                                    setSubsidyForm(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button className="flex-1" onClick={handleUpdateComponent} data-testid="button-save-subsidy">
                                Save
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
            <Toaster />
        </div>
    );
}
