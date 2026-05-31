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
import { parseFrappeError } from "@/lib/frappe-error-parser";
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

interface District {
    name: string;
}

interface DistrictStock {
    name: string;
    item: string;
    quantity: number;
    district: string;
    date: string;
}

interface ItemGroup {
    name: string;
    group_name: string;
}

export default function DistrictStockManagement() {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [selectedItemGroup, setSelectedItemGroup] = useState<string>("");
    const [selectedItem, setSelectedItem] = useState<string>("");
    const [selectedDistrict, setSelectedDistrict] = useState<string>("");
    const [quantity, setQuantity] = useState<string>("");
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const [filterDistrict, setFilterDistrict] = useState<string>("all");
    const [filterItem, setFilterItem] = useState<string>("all");

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

    const { data: districts, isLoading: loadingDistricts } = useFrappeGetDocList<District>("District Master", {
        fields: ["name"],
        limit: 100,
    });

    const filters: any = {};
    if (filterDistrict !== "all") filters.district = filterDistrict;
    if (filterItem !== "all") filters.item = filterItem;

    const { data: stockEntries, isLoading: loadingStock, mutate: mutateStock } = useFrappeGetDocList<DistrictStock>("District Stock", {
        fields: ["name", "item", "quantity", "district", "date"],
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        orderBy: { field: "creation", order: "desc" },
        limit: 100,
    });

    const { createDoc, loading: isCreating } = useFrappeCreateDoc();

    const selectedItemDetails = stockItems?.find(i => i.name === selectedItem);

    const handleAddStock = async () => {
        if (!selectedItem || !selectedDistrict || !quantity || !date) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields.",
                variant: "destructive",
            });
            return;
        }

        try {
            const docData: any = {
                item: selectedItem,
                district: selectedDistrict,
                quantity: parseFloat(quantity),
                date: date,
            };

            await createDoc("District Stock", docData);

            toast({
                title: "Success",
                description: "District stock entry added successfully.",
            });

            setIsAddDialogOpen(false);
            setSelectedItem("");
            setSelectedItemGroup("");
            setSelectedDistrict("");
            setQuantity("");
            setDate(new Date().toISOString().split('T')[0]);
            mutateStock();
        } catch (error: any) {
            console.error("Error adding district stock:", error);
            const { title, message } = parseFrappeError(
                error,
                "Error",
                "Failed to add district stock entry. Please try again."
            );
            toast({
                title,
                description: message.replace(/<[^>]+>/g, ""),
                variant: "destructive",
            });
        }
    };

    return (
        <div className="p-6 space-y-6 w-full">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">District Stock Management</h1>
                    <p className="text-muted-foreground">
                        Manage and track item stock levels per district.
                    </p>
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add District Stock
                </Button>
            </div>

            <div className="flex gap-4 items-center">
                <div className="w-64">
                    <Label htmlFor="filter-district" className="sr-only">Filter by District</Label>
                    <Select
                        value={filterDistrict}
                        onValueChange={setFilterDistrict}
                        disabled={loadingDistricts}
                    >
                        <SelectTrigger id="filter-district">
                            <SelectValue placeholder="All Districts" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Districts</SelectItem>
                            {districts?.map((district) => (
                                <SelectItem key={district.name} value={district.name}>
                                    {district.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-64">
                    <Label htmlFor="filter-item" className="sr-only">Filter by Item</Label>
                    <Select
                        value={filterItem}
                        onValueChange={setFilterItem}
                        disabled={loadingItems}
                    >
                        <SelectTrigger id="filter-item">
                            <SelectValue placeholder="All Items" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Items</SelectItem>
                            {stockItems?.map((item) => (
                                <SelectItem key={item.name} value={item.name}>
                                    {item.item_name || item.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card className="relative overflow-hidden border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-600/5">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
                <CardHeader className="relative">
                    <CardTitle className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <Package className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-blue-900 dark:text-blue-100">Recent District Stock Entries</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="relative bg-background/80 backdrop-blur-sm rounded-b-lg">
                    {loadingStock ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : stockEntries && stockEntries.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>District</TableHead>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Total Price</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stockEntries.map((entry) => {
                                    const itemDetails = stockItems?.find(i => i.name === entry.item);
                                    const rate = itemDetails?.rate || 0;
                                    const quantity = entry.quantity || 0;
                                    const totalPrice = rate * quantity;

                                    return (
                                        <TableRow key={entry.name}>
                                            <TableCell>{entry.date}</TableCell>
                                            <TableCell>{entry.district}</TableCell>
                                            <TableCell>{entry.item}</TableCell>
                                            <TableCell>{entry.quantity}</TableCell>
                                            <TableCell>₹{totalPrice.toFixed(2)}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            No district stock entries found.
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog 
                open={isAddDialogOpen} 
                onOpenChange={(open) => {
                    setIsAddDialogOpen(open);
                    if (!open) {
                        setSelectedItem("");
                        setSelectedItemGroup("");
                        setSelectedDistrict("");
                        setQuantity("");
                        setDate(new Date().toISOString().split('T')[0]);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add District Stock Entry</DialogTitle>
                        <DialogDescription>
                            Record new stock for an item in a specific district.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="district">District</Label>
                            <Select
                                value={selectedDistrict}
                                onValueChange={setSelectedDistrict}
                                disabled={loadingDistricts}
                            >
                                <SelectTrigger id="district">
                                    <SelectValue placeholder="Select a district" />
                                </SelectTrigger>
                                <SelectContent>
                                    {districts?.map((district) => (
                                        <SelectItem key={district.name} value={district.name}>
                                            {district.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
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
                                setIsAddDialogOpen(false);
                                setSelectedItem("");
                                setSelectedItemGroup("");
                                setSelectedDistrict("");
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
        </div>
    );
}
