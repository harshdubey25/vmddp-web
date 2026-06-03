"use client";

import { useState } from "react";
import Link from "next/link";
import { useFrappeGetDocList, useFrappeCreateDoc, useFrappeUpdateDoc, useFrappeDeleteDoc } from "frappe-react-sdk";
import { parseFrappeError } from "@/lib/frappe-error-parser";
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
import { Package, Plus, Loader2, Edit, Trash2 } from "lucide-react";
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
    docstatus?: number;
}

interface ItemGroup {
    name: string;
    group_name: string;
}

export default function StockManagement() {
    const [isAddStockDialogOpen, setIsAddStockDialogOpen] = useState(false);
    const [isEditStockDialogOpen, setIsEditStockDialogOpen] = useState(false);
    const [editingStockEntry, setEditingStockEntry] = useState<Stock | null>(null);
    const [editQuantity, setEditQuantity] = useState<string>("");

    const [isDeleteStockDialogOpen, setIsDeleteStockDialogOpen] = useState(false);
    const [deletingStockEntry, setDeletingStockEntry] = useState<Stock | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Stock Entry State
    const [selectedItemGroup, setSelectedItemGroup] = useState<string>("");
    const [selectedItem, setSelectedItem] = useState<string>("");
    const [quantity, setQuantity] = useState<string>("");
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
        fields: ["name", "item", "quantity", "date", "docstatus"],
        orderBy: { field: "creation", order: "desc" },
        limit: 100,
    });

    const { createDoc, loading: isCreating } = useFrappeCreateDoc();
    const { updateDoc, loading: isUpdating } = useFrappeUpdateDoc();
    const { deleteDoc } = useFrappeDeleteDoc();

    const selectedItemDetails = stockItems?.find((item) => item.name === selectedItem);
    const itemRate = selectedItemDetails?.rate ?? 0;
    const quantityNumber = parseFloat(quantity) || 0;
    const totalAmount = itemRate * quantityNumber;

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
                docstatus: 1, // Automatically submit the stock entry
            });

            toast({
                title: "Success",
                description: "Stock entry added and submitted successfully.",
            });

            setIsAddStockDialogOpen(false);
            setSelectedItem("");
            setSelectedItemGroup("");
            setQuantity("");
            setDate(new Date().toISOString().split('T')[0]);
            mutateStock();
        } catch (error) {
            console.error("Error adding stock:", error);
            const { title, message } = parseFrappeError(error, "Error", "Failed to add stock entry. Please try again.");
            toast({
                title,
                description: message,
                variant: "destructive",
            });
        }
    };

    const handleEditClick = (entry: Stock) => {
        setEditingStockEntry(entry);
        setEditQuantity(entry.quantity);
        setIsEditStockDialogOpen(true);
    };

    const handleUpdateStock = async () => {
        if (!editingStockEntry || !editQuantity) {
            toast({
                title: "Validation Error",
                description: "Please enter a quantity.",
                variant: "destructive",
            });
            return;
        }

        try {
            await updateDoc("Stock", editingStockEntry.name, {
                quantity: editQuantity,
            });

            toast({
                title: "Success",
                description: "Stock quantity updated successfully.",
            });

            setIsEditStockDialogOpen(false);
            setEditingStockEntry(null);
            setEditQuantity("");
            mutateStock();
        } catch (error) {
            console.error("Error updating stock:", error);
            const { title, message } = parseFrappeError(error, "Error", "Failed to update stock entry. Please try again.");
            toast({
                title,
                description: message,
                variant: "destructive",
            });
        }
    };

    const handleDeleteClick = (entry: Stock) => {
        setDeletingStockEntry(entry);
        setIsDeleteStockDialogOpen(true);
    };

    const handleDeleteStock = async () => {
        if (!deletingStockEntry) return;
        setIsDeleting(true);
        try {
            if (deletingStockEntry.docstatus === 1) {
                // Cancel the submitted entry first
                await updateDoc("Stock", deletingStockEntry.name, { docstatus: 2 });
            }
            await deleteDoc("Stock", deletingStockEntry.name);

            toast({
                title: "Success",
                description: "Stock entry deleted successfully.",
            });

            setIsDeleteStockDialogOpen(false);
            setDeletingStockEntry(null);
            mutateStock();
        } catch (error) {
            console.error("Error deleting stock:", error);
            const { title, message } = parseFrappeError(error, "Error", "Failed to delete stock entry. Please try again.");
            toast({
                title,
                description: message,
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
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
                                    <TableHead>Total Price</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
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
                                            <TableCell>₹{totalPrice.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/30"
                                                        onClick={() => handleEditClick(entry)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDeleteClick(entry)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
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

            <Dialog 
                open={isEditStockDialogOpen} 
                onOpenChange={(open) => {
                    setIsEditStockDialogOpen(open);
                    if (!open) {
                        setEditingStockEntry(null);
                        setEditQuantity("");
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Stock Quantity</DialogTitle>
                        <DialogDescription>
                            Update the quantity for the stock entry of {editingStockEntry?.item}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit_item">Item</Label>
                            <Input
                                id="edit_item"
                                value={editingStockEntry ? (stockItems?.find(i => i.name === editingStockEntry.item)?.item_name || editingStockEntry.item) : ""}
                                disabled
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit_quantity">Quantity</Label>
                            <Input
                                id="edit_quantity"
                                type="number"
                                step="any"
                                placeholder="Enter quantity"
                                value={editQuantity}
                                onChange={(e) => setEditQuantity(e.target.value)}
                            />
                        </div>
                        {editingStockEntry && editQuantity.trim() !== "" && (
                            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Item Price</span>
                                    <span className="font-medium">
                                        ₹{(stockItems?.find(i => i.name === editingStockEntry.item)?.rate || 0).toFixed(2)}
                                    </span>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-muted-foreground">Total Amount</span>
                                    <span className="font-semibold">
                                        ₹{((stockItems?.find(i => i.name === editingStockEntry.item)?.rate || 0) * (parseFloat(editQuantity) || 0)).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="edit_date">Date</Label>
                            <Input
                                id="edit_date"
                                type="date"
                                value={editingStockEntry?.date || ""}
                                disabled
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setIsEditStockDialogOpen(false);
                                setEditingStockEntry(null);
                                setEditQuantity("");
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateStock} disabled={isUpdating}>
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Entry
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog 
                open={isDeleteStockDialogOpen} 
                onOpenChange={(open) => {
                    setIsDeleteStockDialogOpen(open);
                    if (!open) {
                        setDeletingStockEntry(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete the stock entry for {deletingStockEntry ? (stockItems?.find(i => i.name === deletingStockEntry.item)?.item_name || deletingStockEntry.item) : ""}.
                            {deletingStockEntry?.docstatus === 1 && " Since this is a submitted document, it will be cancelled first and then deleted."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => {
                                e.preventDefault();
                                handleDeleteStock();
                            }}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
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
