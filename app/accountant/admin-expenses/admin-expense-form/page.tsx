"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    IndianRupee,
    Calendar,
    Save,
    Loader2,
    Receipt,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFrappeCreateDoc, useFrappeGetDocList } from "frappe-react-sdk";
import { useToast } from "@/hooks/use-toast";
import { parseFrappeError } from "@/lib/frappe-error-parser";

interface AdminExpenseHead {
    name: string;
}

export default function AdminExpenseForm() {
    const router = useRouter();
    const { toast } = useToast();
    const { createDoc, loading: isSubmitting, error: submitError } = useFrappeCreateDoc();

    const [formData, setFormData] = useState({
        head: "",
        amount: "",
        date: "",
        reason: "",
    });

    // Fetch expense heads from the linked doctype
    const { data: expenseHeads, isLoading: headsLoading } = useFrappeGetDocList<AdminExpenseHead>(
        "Admin Expense Head",
        {
            fields: ["name"],
            limit: 100,
        }
    );

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.head || !formData.amount || !formData.date) {
            toast({
                title: "Missing Fields",
                description: "Please fill all required fields",
                variant: "destructive",
            });
            return;
        }

        try {
            await createDoc("Admin Expense", {
                head: formData.head,
                amount: parseFloat(formData.amount),
                date: formData.date,
                reason: formData.reason,
            });

            toast({
                title: "Success",
                description: "Admin expense created successfully",
            });

            router.push("/accountant/admin-expenses");
        } catch (error: any) {
            const { title, message } = parseFrappeError(error, "Error", "Failed to create expense");
            toast({
                title,
                description: message,
                variant: "destructive",
            });
        }
    };

    return (
        <div className="h-screen bg-background w-full">
            <div className="overflow-auto h-screen">
                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <Link href="/accountant/admin-expenses">
                            <Button variant="ghost" size="icon" data-testid="button-back">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-display font-bold" data-testid="text-page-title">
                                Add Admin Expense
                            </h1>
                            <p className="text-muted-foreground">Create a new administrative expense entry</p>
                        </div>
                    </div>

                    {/* Form Card */}
                    <Card className="max-w-4xl mx-auto">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Receipt className="h-5 w-5" />
                                Expense Details
                            </CardTitle>
                            <CardDescription>
                                Enter the details of the administrative expense
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Head */}
                            <div className="space-y-2">
                                <Label>Expense Head *</Label>
                                <Select
                                    value={formData.head}
                                    onValueChange={(value) => handleInputChange("head", value)}
                                    disabled={headsLoading}
                                >
                                    <SelectTrigger data-testid="select-head">
                                        <SelectValue placeholder={headsLoading ? "Loading..." : "Select expense head"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {expenseHeads?.map((head) => (
                                            <SelectItem key={head.name} value={head.name}>
                                                {head.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Amount */}
                            <div className="space-y-2">
                                <Label>Amount *</Label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        placeholder="Enter amount"
                                        className="pl-9"
                                        value={formData.amount}
                                        onChange={(e) => handleInputChange("amount", e.target.value)}
                                        data-testid="input-amount"
                                    />
                                </div>
                            </div>

                            {/* Date */}
                            <div className="space-y-2">
                                <Label>Date *</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="date"
                                        className="pl-9"
                                        value={formData.date}
                                        onChange={(e) => handleInputChange("date", e.target.value)}
                                        data-testid="input-date"
                                    />
                                </div>
                            </div>

                            {/* Reason */}
                            <div className="space-y-2">
                                <Label>Reason</Label>
                                <Textarea
                                    placeholder="Enter reason for expense"
                                    rows={4}
                                    value={formData.reason}
                                    onChange={(e) => handleInputChange("reason", e.target.value)}
                                    data-testid="input-reason"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4 pt-4">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    data-testid="button-submit"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Save Expense
                                        </>
                                    )}
                                </Button>
                                <Link href="/accountant/admin-expenses">
                                    <Button variant="outline" data-testid="button-cancel">
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
