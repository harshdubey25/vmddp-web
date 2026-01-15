"use client";

import { useState } from "react";
import {
    IndianRupee,
    Search,
    Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export default function AdminExpensesReport() {
    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const { data: expenses, isLoading: loading } = useFrappeGetDocList<AdminExpense>("Admin Expense", {
        fields: ["name", "head", "amount", "date", "user", "reason", "docstatus"],
        orderBy: { field: "date", order: "desc" },
        limit: 500,
    });

    const filteredExpenses = (expenses || []).filter(expense => {
        const matchesSearch = searchText.length === 0 ||
            expense.name.toLowerCase().includes(searchText.toLowerCase()) ||
            expense.head.toLowerCase().includes(searchText.toLowerCase()) ||
            expense.reason.toLowerCase().includes(searchText.toLowerCase());

        const matchesStatus = statusFilter === "all" || expense.docstatus === parseInt(statusFilter);

        return matchesSearch && matchesStatus;
    });

    // Calculate stats
    const totalAmount = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const submittedAmount = filteredExpenses.filter(exp => exp.docstatus === 1).reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const draftAmount = filteredExpenses.filter(exp => exp.docstatus === 0).reduce((sum, exp) => sum + (exp.amount || 0), 0);

    const getStatusBadge = (docstatus: number) => {
        switch (docstatus) {
            case 1:
                return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">Submitted</Badge>;
            case 0:
                return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs">Draft</Badge>;
            case 2:
                return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-xs">Cancelled</Badge>;
            default:
                return <Badge variant="outline" className="text-xs">Unknown</Badge>;
        }
    };

    return (
        <div className="w-full bg-background min-h-screen overflow-y-auto">
            <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-xl sm:text-2xl font-display font-bold" data-testid="text-page-title">
                            Admin Expenses Report
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground">View and analyze all administrative expenses</p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <Card data-testid="card-total-expenses">
                        <CardContent className="pt-4 sm:pt-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="p-2 sm:p-3 rounded-lg bg-blue-500/10 flex-shrink-0">
                                    <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs sm:text-sm text-muted-foreground">Total Expenses</p>
                                    <p className="text-base sm:text-2xl font-bold truncate">₹{totalAmount.toLocaleString("en-IN")}</p>
                                    <p className="text-xs text-muted-foreground">{filteredExpenses.length} entries</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card data-testid="card-submitted-expenses">
                        <CardContent className="pt-4 sm:pt-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="p-2 sm:p-3 rounded-lg bg-green-500/10 flex-shrink-0">
                                    <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs sm:text-sm text-muted-foreground">Submitted</p>
                                    <p className="text-base sm:text-2xl font-bold truncate">₹{submittedAmount.toLocaleString("en-IN")}</p>
                                    <p className="text-xs text-muted-foreground">{filteredExpenses.filter(e => e.docstatus === 1).length} entries</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card data-testid="card-draft-expenses">
                        <CardContent className="pt-4 sm:pt-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="p-2 sm:p-3 rounded-lg bg-yellow-500/10 flex-shrink-0">
                                    <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs sm:text-sm text-muted-foreground">Draft</p>
                                    <p className="text-base sm:text-2xl font-bold truncate">₹{draftAmount.toLocaleString("en-IN")}</p>
                                    <p className="text-xs text-muted-foreground">{filteredExpenses.filter(e => e.docstatus === 0).length} entries</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Expenses List */}
                <Card data-testid="card-expenses-list">
                    <CardHeader>
                        <CardTitle className="text-base sm:text-lg">Expense Records</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">View and manage all administrative expenses</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Filters */}
                        <div className="flex flex-col gap-2 sm:gap-3">
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search ID, head, reason..."
                                    className="pl-9 w-full text-xs sm:text-sm"
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    data-testid="input-search"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full text-xs sm:text-sm" data-testid="select-status">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="1">Submitted</SelectItem>
                                    <SelectItem value="0">Draft</SelectItem>
                                    <SelectItem value="2">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Table */}
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredExpenses && filteredExpenses.length > 0 ? (
                            <div className="overflow-x-auto -mx-3 sm:mx-0 -mb-3 sm:mb-0 px-3 sm:px-0">
                                <Table className="text-xs sm:text-sm">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="min-w-14 sm:min-w-20">ID</TableHead>
                                            <TableHead className="min-w-18 sm:min-w-24">Date</TableHead>
                                            <TableHead className="min-w-18 sm:min-w-28">Head</TableHead>
                                            <TableHead className="min-w-24 sm:min-w-48">Reason</TableHead>
                                            <TableHead className="min-w-20 sm:min-w-28 text-right">Amount</TableHead>
                                            <TableHead className="min-w-16 sm:min-w-24">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredExpenses.map((expense) => (
                                            <TableRow key={expense.name} data-testid={`row-expense-${expense.name}`}>
                                                <TableCell className="font-mono text-xs sm:text-sm">{expense.name}</TableCell>
                                                <TableCell className="font-mono text-xs sm:text-sm">{expense.date}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-xs">{expense.head}</Badge>
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate text-xs sm:text-sm">{expense.reason}</TableCell>
                                                <TableCell className="font-medium text-right text-xs sm:text-sm">₹{(expense.amount || 0).toLocaleString("en-IN")}</TableCell>
                                                <TableCell className="text-xs sm:text-sm">{getStatusBadge(expense.docstatus)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-8 text-xs sm:text-sm">No expenses found</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
