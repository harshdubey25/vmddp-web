"use client";

import { useState } from "react";
import Link from "next/link";
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
    rate?: number;
    stock_item_group?: string;
}

interface Stock {
    name: string;
    item: string;
    quantity: string;
    date: string;
    expected_land_coverage?: number;
    expected_yield?: number;
}

interface ItemGroup {
    name: string;
    group_name: string;
}

export default function StockManagement() {
    const [isAddStockDialogOpen, setIsAddStockDialogOpen] = useState(false);

    // Stock Entry State
    const [selectedItemGroup, setSelectedItemGroup] = useState<string>("");
    const [selectedItem, setSelectedItem] = useState<string>("");
    const [quantity, setQuantity] = useState<string>("");
    const [expectedLandCoverage, setExpectedLandCoverage] = useState<string>("");
    const [expectedYield, setExpectedYield] = useState<string>("");
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const { data: itemGroups, isLoading: loadingItemGroups } = useFrappeGetDocList<ItemGroup>("Item Group", {
        fields: ["name", "group_name"],
        orderBy: { field: "group_name", order: "asc" },
        limit: 100,
    });

    const { data: stockItems, isLoading: loadingItems } = useFrappeGetDocList<StockItem>("Stock Item", {
        fields: ["name", "item_name", "rate", "stock_item_group"],
        limit: 100,
        filters: selectedItemGroup && selectedItemGroup !== "all"
            ? [["stock_item_group", "=", selectedItemGroup]]
            : undefined,
    });

    const { data: stockEntries, isLoading: loadingStock, mutate: mutateStock } = useFrappeGetDocList<Stock>("Stock", {
        fields: ["name", "item", "quantity", "date", "expected_land_coverage", "expected_yield"],
        orderBy: { field: "creation", order: "desc" },
        limit: 100,
    });

    const { createDoc, loading: isCreating } = useFrappeCreateDoc();

    const selectedItemDetails = stockItems?.find((item) => item.name === selectedItem);
    const itemRate = selectedItemDetails?.rate ?? 0;
    const quantityNumber = parseFloat(quantity) || 0;
    const totalAmount = itemRate * quantityNumber;
    const isFodderSeed = selectedItemGroup === "Fodder Seed" || (selectedItemDetails && selectedItemDetails.stock_item_group === "Fodder Seed");

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
            const docData: any = {
                item: selectedItem,
                quantity: quantity,
                date: date,
            };

            if (isFodderSeed) {
                if (expectedLandCoverage) docData.expected_land_coverage = parseFloat(expectedLandCoverage);
                if (expectedYield) docData.expected_yield = parseFloat(expectedYield);
            }

            await createDoc("Stock", docData);

            toast({
                title: "Success",
                description: "Stock entry added successfully.",
            });

            setIsAddStockDialogOpen(false);
            setSelectedItem("");
            setSelectedItemGroup("");
            setQuantity("");
            setExpectedLandCoverage("");
            setExpectedYield("");
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
                <div className="flex gap-2">
                    <Link href="/admin/stock-items">
                        <Button variant="outline">
                            <Package className="mr-2 h-4 w-4" /> Manage Items
                        </Button>
                    </Link>
                    <Button onClick={() => setIsAddStockDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Stock Entry
                    </Button>
                </div>
            </div>

            <Card className="relative overflow-hidden border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-600/5">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
                <CardHeader className="relative">
                    <CardTitle className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <Package className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-blue-900 dark:text-blue-100">Recent Stock Entries</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="relative">
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
                                    <TableHead>Expected Land Coverage</TableHead>
                                    <TableHead>Expected Yield</TableHead>
                                    <TableHead>Total Price</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stockEntries.map((entry) => {
                                    const itemDetails = stockItems?.find(i => i.name === entry.item);
                                    const rate = itemDetails?.rate || 0;
                                    const quantity = parseFloat(entry.quantity) || 0;
                                    const totalPrice = rate * quantity;

                                    return (
                                        <TableRow key={entry.name}>
                                            <TableCell>{entry.date}</TableCell>
                                            <TableCell>{entry.item}</TableCell>
                                            <TableCell>{entry.quantity}</TableCell>
                                            <TableCell>{entry.expected_land_coverage !== undefined && entry.expected_land_coverage !== null ? entry.expected_land_coverage : "-"}</TableCell>
                                            <TableCell>{entry.expected_yield !== undefined && entry.expected_yield !== null ? entry.expected_yield : "-"}</TableCell>
                                            <TableCell>₹{totalPrice.toFixed(2)}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            No stock entries found.
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog 
                open={isAddStockDialogOpen} 
                onOpenChange={(open) => {
                    setIsAddStockDialogOpen(open);
                    if (!open) {
                        setSelectedItem("");
                        setSelectedItemGroup("");
                        setQuantity("");
                        setExpectedLandCoverage("");
                        setExpectedYield("");
                        setDate(new Date().toISOString().split('T')[0]);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Stock Entry</DialogTitle>
                        <DialogDescription>
                            Record new stock for an item.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="item_group">Item Group</Label>
                            <Select
                                value={selectedItemGroup}
                                onValueChange={(val) => {
                                    setSelectedItemGroup(val);
                                    setSelectedItem("");
                                }}
                                disabled={loadingItemGroups}
                            >
                                <SelectTrigger id="item_group">
                                    <SelectValue placeholder="Select an item group" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Item Groups</SelectItem>
                                    {itemGroups?.map((group) => (
                                        <SelectItem key={group.name} value={group.name}>
                                            {group.group_name || group.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="item">Item</Label>
                            <Select
                                value={selectedItem}
                                onValueChange={setSelectedItem}
                                disabled={loadingItems}
                            >
                                <SelectTrigger id="item">
                                    <SelectValue placeholder="Select an item" />
                                </SelectTrigger>
                                <SelectContent>
                                    {stockItems && stockItems.length > 0 ? (
                                        stockItems.map((item) => (
                                            <SelectItem key={item.name} value={item.name}>
                                                {item.item_name || item.name}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="no_items" disabled>
                                            No items found
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input
                                id="quantity"
                                type="number"
                                step="any"
                                placeholder="Enter quantity"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                        </div>
                        {isFodderSeed && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="expected_land_coverage">Expected Land Coverage</Label>
                                    <Input
                                        id="expected_land_coverage"
                                        type="number"
                                        step="any"
                                        placeholder="Enter expected land coverage"
                                        value={expectedLandCoverage}
                                        onChange={(e) => setExpectedLandCoverage(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="expected_yield">Expected Yield</Label>
                                    <Input
                                        id="expected_yield"
                                        type="number"
                                        step="any"
                                        placeholder="Enter expected yield"
                                        value={expectedYield}
                                        onChange={(e) => setExpectedYield(e.target.value)}
                                    />
                                </div>
                            </>
                        )}
                        {selectedItem && quantity.trim() !== "" && (
                            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Item Price</span>
                                    <span className="font-medium">₹{itemRate.toFixed(2)}</span>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-muted-foreground">Total Amount</span>
                                    <span className="font-semibold">₹{totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        )}
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
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setIsAddStockDialogOpen(false);
                                setSelectedItem("");
                                setSelectedItemGroup("");
                                setQuantity("");
                                setExpectedLandCoverage("");
                                setExpectedYield("");
                                setDate(new Date().toISOString().split('T')[0]);
                            }}
                        >
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
