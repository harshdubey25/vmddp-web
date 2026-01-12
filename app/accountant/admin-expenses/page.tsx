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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

export default function AdminExpenses() {
    const { data: expenses, isLoading, error } = useFrappeGetDocList<AdminExpense>("Admin Expense", {
        fields: ["name", "head", "amount", "date", "user", "reason", "docstatus"],
        orderBy: { field: "date", order: "desc" },
        limit: 100,
    });

    const totalExpenses = expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
    const submittedExpenses = expenses?.filter(exp => exp.docstatus === 1).reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
    const draftExpenses = expenses?.filter(exp => exp.docstatus === 0).reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;

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

    if (isLoading) {
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
        <div className="h-screen bg-background">
            <div className="overflow-auto h-screen">
                <div className="p-6 space-y-6">
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
                        <Card data-testid="card-total-expenses">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-blue-500/10">
                                        <IndianRupee className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Expenses</p>
                                        <p className="text-2xl font-bold">₹{totalExpenses.toLocaleString("en-IN")}</p>
                                        <p className="text-xs text-muted-foreground">{expenses?.length || 0} entries</p>
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
                                        <p className="text-sm text-muted-foreground">Submitted</p>
                                        <p className="text-2xl font-bold">₹{submittedExpenses.toLocaleString("en-IN")}</p>
                                        <p className="text-xs text-muted-foreground">{expenses?.filter(e => e.docstatus === 1).length || 0} entries</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card data-testid="card-draft-expenses">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-yellow-500/10">
                                        <IndianRupee className="h-5 w-5 text-yellow-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Draft</p>
                                        <p className="text-2xl font-bold">₹{draftExpenses.toLocaleString("en-IN")}</p>
                                        <p className="text-xs text-muted-foreground">{expenses?.filter(e => e.docstatus === 0).length || 0} entries</p>
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
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Head</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenses && expenses.length > 0 ? (
                                        expenses.map((expense) => (
                                            <TableRow key={expense.name} data-testid={`row-expense-${expense.name}`}>
                                                <TableCell className="font-mono text-sm">{expense.name}</TableCell>
                                                <TableCell className="font-mono text-sm">{expense.date}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{expense.head}</Badge>
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate">{expense.reason}</TableCell>
                                                <TableCell>{expense.user}</TableCell>
                                                <TableCell className="font-medium">₹{(expense.amount || 0).toLocaleString("en-IN")}</TableCell>
                                                <TableCell>{getStatusBadge(expense.docstatus)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                No expenses found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}