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
    unit_of_measure: string;
    rate: number;
}

interface Unit {
    name: string;
}

export default function StockItemsManagement() {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [itemName, setItemName] = useState<string>("");
    const [unitOfMeasure, setUnitOfMeasure] = useState<string>("");
    const [rate, setRate] = useState<string>("");

    const { data: units, isLoading: loadingUnits } = useFrappeGetDocList<Unit>("Unit", {
        fields: ["name"],
        limit: 100,
    });

    const { data: stockItems, isLoading: loadingItems, mutate: mutateItems } = useFrappeGetDocList<StockItem>("Stock Item", {
        fields: ["name", "item_name", "unit_of_measure", "rate"],
        orderBy: { field: "creation", order: "desc" },
        limit: 100,
    });

    const { createDoc, loading: isCreating } = useFrappeCreateDoc();

    const handleAddStockItem = async () => {
        if (!itemName || !unitOfMeasure || !rate) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields.",
                variant: "destructive",
            });
            return;
        }

        try {
            await createDoc("Stock Item", {
                item_name: itemName,
                unit_of_measure: unitOfMeasure,
                rate: parseFloat(rate),
            });

            toast({
                title: "Success",
                description: "Stock item added successfully.",
            });

            setIsAddDialogOpen(false);
            setItemName("");
            setUnitOfMeasure("");
            setRate("");
            mutateItems();
        } catch (error) {
            console.error("Error adding stock item:", error);
            toast({
                title: "Error",
                description: "Failed to add stock item. Please try again.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="p-6 space-y-6 w-full">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Stock Items</h1>
                    <p className="text-muted-foreground">
                        Manage stock items and their rates.
                    </p>
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Stock Item
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Stock Items List
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loadingItems ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : stockItems && stockItems.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item Name</TableHead>
                                    <TableHead>Unit of Measure</TableHead>
                                    <TableHead>Rate</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stockItems.map((item) => (
                                    <TableRow key={item.name}>
                                        <TableCell>{item.item_name}</TableCell>
                                        <TableCell>{item.unit_of_measure}</TableCell>
                                        <TableCell>₹{item.rate}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            No stock items found.
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Stock Item</DialogTitle>
                        <DialogDescription>
                            Create a new stock item.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="item_name">Item Name</Label>
                            <Input
                                id="item_name"
                                placeholder="Enter item name"
                                value={itemName}
                                onChange={(e) => setItemName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="unit_of_measure">Unit of Measure</Label>
                            <Select
                                value={unitOfMeasure}
                                onValueChange={setUnitOfMeasure}
                                disabled={loadingUnits}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    {units?.map((unit) => (
                                        <SelectItem key={unit.name} value={unit.name}>
                                            {unit.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rate">Rate</Label>
                            <Input
                                id="rate"
                                type="number"
                                step="any"
                                placeholder="Enter rate"
                                value={rate}
                                onChange={(e) => setRate(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddStockItem} disabled={isCreating}>
                            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Item
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}