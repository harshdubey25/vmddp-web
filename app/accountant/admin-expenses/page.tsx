"use client";

import Link from "next/link";
import {
    ArrowLeft,
    Plus,
    IndianRupee,
    Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useFrappeGetDocList } from "frappe-react-sdk";

interface AdminExpense {
    name: string;
    head: string;
    amount: number;
    date: string;
    user: string;
    reason: string;
    docstatus: number;
}

interface AdminExpenseTarget {
    name: string;
    amount: number;
    date: string;
    allocater: string;
    docstatus: number;
}

export default function AdminExpenses() {
    const { data: expenses, isLoading, error } = useFrappeGetDocList<AdminExpense>("Admin Expense", {
        fields: ["name", "head", "amount", "date", "user", "reason", "docstatus"],
        orderBy: { field: "date", order: "desc" },
        limit: 100,
    });

    const { data: targetData, isLoading: targetLoading } = useFrappeGetDocList<AdminExpenseTarget>("Admin Expense Target", {
        fields: ["name", "amount", "date", "allocater", "docstatus"],
        filters: [["docstatus", "=", 1]],
        orderBy: { field: "date", order: "desc" },
    });

    const totalTarget = targetData?.reduce((sum, target) => sum + (target.amount || 0), 0) || 0;
    
    const totalSubmittedExpenses = expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
    
    const balance = totalTarget - totalSubmittedExpenses;

    const getStatusBadge = (docstatus: number) => {
        switch (docstatus) {
            case 1:
                return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Submitted</Badge>;
            case 0:
                return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Draft</Badge>;
            case 2:
                return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Cancelled</Badge>;
            default:
                return <Badge variant="outline">Unknown</Badge>;
        }
    };

    if (isLoading || targetLoading) {
        return (
            <div className="h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen bg-background flex items-center justify-center">
                <p className="text-red-500">Error loading expenses: {error.message}</p>
            </div>
        );
    }

    return (
        <div className="h-screen bg-background w-full">
            <div className="overflow-auto h-screen w-full">
                <div className="p-6 space-y-6 max-w-full">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* <Link href="/accountant">
                                <Button variant="ghost" size="icon" data-testid="button-back">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link> */}
                            <div>
                                <h1 className="text-2xl font-display font-bold" data-testid="text-page-title">
                                    Admin Expenses
                                </h1>
                                <p className="text-muted-foreground">Manage and track administrative expenses</p>
                            </div>
                        </div>

                        {/* Add Expense Button */}
                        <Link href="/accountant/admin-expenses/admin-expense-form">
                            <Button data-testid="button-add-expense">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Admin Expense
                            </Button>
                        </Link>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card data-testid="card-total-target">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-blue-500/10">
                                        <IndianRupee className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Target</p>
                                        <p className="text-2xl font-bold">₹{totalTarget.toLocaleString("en-IN")}</p>
                                        <p className="text-xs text-muted-foreground">{targetData?.length || 0} allocations</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card data-testid="card-submitted-expenses">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-green-500/10">
                                        <IndianRupee className="h-5 w-5 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Submitted Expenses</p>
                                        <p className="text-2xl font-bold">₹{totalSubmittedExpenses.toLocaleString("en-IN")}</p>
                                        <p className="text-xs text-muted-foreground">{expenses?.length || 0} expenses</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card data-testid="card-balance">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-lg ${balance >= 0 ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
                                        <IndianRupee className={`h-5 w-5 ${balance >= 0 ? 'text-yellow-500' : 'text-red-500'}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Balance Remaining</p>
                                        <p className="text-2xl font-bold">₹{balance.toLocaleString("en-IN")}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {balance >= 0 ? 'Available' : 'Over budget'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Expenses List */}
                    <Card data-testid="card-expenses-list">
                        <CardHeader>
                            <CardTitle>Expense Records</CardTitle>
                            <CardDescription>View and manage all administrative expenses</CardDescription>
                        </CardHeader>
                        <CardContent>
                        <div className="border rounded-lg overflow-hidden flex flex-col">
                            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                                <table className="w-full min-w-[900px]">
                                    <thead className="bg-muted sticky top-0 z-30 border-b">
                                        <tr>
                                            <th className="text-left p-3 text-xs sm:text-sm font-medium">ID</th>
                                            <th className="text-left p-3 text-xs sm:text-sm font-medium">Date</th>
                                            <th className="text-left p-3 text-xs sm:text-sm font-medium">Head</th>
                                            <th className="text-left p-3 text-xs sm:text-sm font-medium">Reason</th>
                                            <th className="text-left p-3 text-xs sm:text-sm font-medium">Amount</th>
                                            <th className="text-left p-3 text-xs sm:text-sm font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expenses && expenses.length > 0 ? (
                                            expenses.map((expense) => (
                                                <tr key={expense.name} data-testid={`row-expense-${expense.name}`} className="border-b hover:bg-muted/30">
                                                    <td className="p-3 text-xs sm:text-sm font-mono">{expense.name}</td>
                                                    <td className="p-3 text-xs sm:text-sm font-mono">{expense.date}</td>
                                                    <td className="p-3 text-xs sm:text-sm">
                                                        <Badge variant="outline">{expense.head}</Badge>
                                                    </td>
                                                    <td className="p-3 text-xs sm:text-sm max-w-[200px] truncate">{expense.reason}</td>
                                                    <td className="p-3 text-xs sm:text-sm font-medium">₹{(expense.amount || 0).toLocaleString("en-IN")}</td>
                                                    <td className="p-3 text-xs sm:text-sm">{getStatusBadge(expense.docstatus)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="text-center py-8 text-muted-foreground p-3">
                                                    No expenses found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}