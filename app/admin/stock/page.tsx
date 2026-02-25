"use client";

import { useState } from "react";
import { useFrappeGetDocList, useFrappeCreateDoc } from "frappe-react-sdk";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import { toast } from "@/hooks/use-toast";
import { Package, Plus, Loader2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface StockItem {
    name: string;
    item_name: string;
}

interface Stock {
    name: string;
    item: string;
    quantity: string;
    date: string;
}

export default function StockManagement() {
    const [isAddStockDialogOpen, setIsAddStockDialogOpen] = useState(false);

    // Stock Entry State
    const [selectedItem, setSelectedItem] = useState<string>("");
    const [quantity, setQuantity] = useState<string>("");
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const { data: stockItems, isLoading: loadingItems } = useFrappeGetDocList<StockItem>("Stock Item", {
        fields: ["name", "item_name"],
        limit: 100,
    });

    const { data: stockEntries, isLoading: loadingStock, mutate: mutateStock } = useFrappeGetDocList<Stock>("Stock", {
        fields: ["name", "item", "quantity", "date"],
        orderBy: { field: "creation", order: "desc" },
        limit: 100,
    });

    const { createDoc, loading: isCreating } = useFrappeCreateDoc();

    const handleAddStock = async () => {
        if (!selectedItem || !quantity || !date) {
            toast({
                title: "Validation Error",
                description: "Please select an item, enter a quantity, and select a date.",
                variant: "destructive",
            });
            return;
        }

        try {
            await createDoc("Stock", {
                item: selectedItem,
                quantity: quantity,
                date: date,
            });

            toast({
                title: "Success",
                description: "Stock entry added successfully.",
            });

            setIsAddStockDialogOpen(false);
            setSelectedItem("");
            setQuantity("");
            setDate(new Date().toISOString().split('T')[0]);
            mutateStock();
        } catch (error) {
            console.error("Error adding stock:", error);
            toast({
                title: "Error",
                description: "Failed to add stock entry. Please try again.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="p-6 space-y-6 w-full">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Stock Management</h1>
                    <p className="text-muted-foreground">
                        Manage stock entries.
                    </p>
                </div>
                <Button onClick={() => setIsAddStockDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Stock Entry
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Recent Stock Entries
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loadingStock ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : stockEntries && stockEntries.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Quantity</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stockEntries.map((entry) => (
                                    <TableRow key={entry.name}>
                                        <TableCell>{entry.date}</TableCell>
                                        <TableCell>{entry.item}</TableCell>
                                        <TableCell>{entry.quantity}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            No stock entries found.
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isAddStockDialogOpen} onOpenChange={setIsAddStockDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Stock Entry</DialogTitle>
                        <DialogDescription>
                            Record new stock for an item.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="item">Item</Label>
                            <Select
                                value={selectedItem}
                                onValueChange={setSelectedItem}
                                disabled={loadingItems}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an item" />
                                </SelectTrigger>
                                <SelectContent>
                                    {stockItems?.map((item) => (
                                        <SelectItem key={item.name} value={item.name}>
                                            {item.item_name || item.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input
                                id="quantity"
                                type="text"
                                placeholder="Enter quantity"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddStockDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddStock} disabled={isCreating}>
                            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Entry
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
