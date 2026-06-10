"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFrappeGetDocList, useFrappeCreateDoc, useFrappeUpdateDoc } from "frappe-react-sdk";
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
import { Package, Plus, Loader2, Edit, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface StockItem {
    name: string;
    item_name: string;
    unit_of_measure: string;
    rate: number;
    stock_item_group: string;
    expected_land_coverage?: number;
    expected_yield?: number;
}

interface Unit {
    name: string;
}

interface ItemGroup {
    name: string;
    group_name: string;
}

export default function StockItemsManagement() {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [itemName, setItemName] = useState<string>("");
    const [unitOfMeasure, setUnitOfMeasure] = useState<string>("");
    const [rate, setRate] = useState<string>("");
    const [itemGroup, setItemGroup] = useState<string>("");
    const [expectedLandCoverage, setExpectedLandCoverage] = useState<string>("");
    const [expectedYield, setExpectedYield] = useState<string>("");
    const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
    const [editRate, setEditRate] = useState<string>("");
    const [editUnitOfMeasure, setEditUnitOfMeasure] = useState<string>("");
    const [editExpectedLandCoverage, setEditExpectedLandCoverage] = useState<string>("");
    const [editExpectedYield, setEditExpectedYield] = useState<string>("");
    const router = useRouter();
    const isFodderSeed = itemGroup === "Fodder Seed";
    const isEditFodderSeed = selectedItem?.stock_item_group === "Fodder Seed";

    // Pagination and search
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const PAGE_SIZE = 10;

    const { data: units, isLoading: loadingUnits } = useFrappeGetDocList<Unit>("Unit", {
        fields: ["name"],
        limit: 100,
    });

    const { data: itemGroups, isLoading: loadingItemGroups } = useFrappeGetDocList<ItemGroup>("Item Group", {
        fields: ["name", "group_name"],
        orderBy: { field: "group_name", order: "asc" },
        limit: 100,
    });

    const { data: stockItems, isLoading: loadingItems, mutate: mutateItems } = useFrappeGetDocList<StockItem>("Stock Item", {
        fields: ["name", "item_name", "unit_of_measure", "rate", "stock_item_group", "expected_land_coverage", "expected_yield"],
        orderBy: { field: "creation", order: "desc" },
        limit: PAGE_SIZE,
        limit_start: (page - 1) * PAGE_SIZE,
        ...(search
            ? { filters: [["item_name", "like", `%${search}%`]] }
            : {}),
    });

    const { createDoc, loading: isCreating } = useFrappeCreateDoc();
    const { updateDoc, loading: isUpdating } = useFrappeUpdateDoc();

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
            const docData: any = {
                item_name: itemName,
                unit_of_measure: unitOfMeasure,
                rate: parseFloat(rate),
                stock_item_group: itemGroup
            };

            if (isFodderSeed) {
                if (expectedLandCoverage) docData.expected_land_coverage = parseFloat(expectedLandCoverage);
                if (expectedYield) docData.expected_yield = parseFloat(expectedYield);
            }

            await createDoc("Stock Item", docData);

            toast({
                title: "Success",
                description: "Stock item added successfully.",
            });

            setIsAddDialogOpen(false);
            setItemName("");
            setUnitOfMeasure("");
            setRate("");
            setItemGroup("");
            setExpectedLandCoverage("");
            setExpectedYield("");
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

    const handleOpenEditItem = (item: StockItem) => {
        setSelectedItem(item);
        setEditRate(item.rate !== undefined && item.rate !== null ? String(item.rate) : "");
        setEditUnitOfMeasure(item.unit_of_measure || "");
        setEditExpectedLandCoverage(item.expected_land_coverage !== undefined && item.expected_land_coverage !== null ? String(item.expected_land_coverage) : "");
        setEditExpectedYield(item.expected_yield !== undefined && item.expected_yield !== null ? String(item.expected_yield) : "");
        setIsEditDialogOpen(true);
    };

    const handleUpdateItem = async () => {
        if (!selectedItem) return;

        const parsedRate = Number(editRate);
        if (!editUnitOfMeasure || editRate.trim() === "" || Number.isNaN(parsedRate)) {
            toast({
                title: "Validation Error",
                description: "Please select a unit of measure and enter a valid rate.",
                variant: "destructive",
            });
            return;
        }

        try {
            const updateData: any = {
                rate: parsedRate,
                unit_of_measure: editUnitOfMeasure,
            };

            if (selectedItem.stock_item_group === "Fodder Seed") {
                updateData.expected_land_coverage = editExpectedLandCoverage ? parseFloat(editExpectedLandCoverage) : null;
                updateData.expected_yield = editExpectedYield ? parseFloat(editExpectedYield) : null;
            }

            await updateDoc("Stock Item", selectedItem.name, updateData);
            toast({
                title: "Success",
                description: "Stock item updated successfully.",
            });
            mutateItems();
            setIsEditDialogOpen(false);
            setSelectedItem(null);
            setEditRate("");
            setEditUnitOfMeasure("");
            setEditExpectedLandCoverage("");
            setEditExpectedYield("");
        } catch (error) {
            console.error("Error updating stock item:", error);
            toast({
                title: "Error",
                description: "Failed to update stock item. Please try again.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="p-6 space-y-6 w-full">
            <div className="flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={() => router.push("/admin/stock")}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">Stock Items</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Manage stock items and their rates.
                    </p>
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Stock Item
                </Button>
            </div>

            {/* Search bar */}
            <div className="flex items-center gap-4 mb-2">
                <Input
                    type="text"
                    placeholder="Search by item name..."
                    value={search}
                    onChange={e => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    className="w-64"
                />
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
                        <>
                            <div className="border rounded-lg overflow-hidden">
                                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                                    <table className="w-full">
                                        <thead className="sticky top-0 z-10 bg-muted border-b">
                                            <tr>
                                                <th className="text-left p-3 text-sm font-medium">Item Name</th>
                                                <th className="text-left p-3 text-sm font-medium">Unit of Measure</th>
                                                <th className="text-left p-3 text-sm font-medium">Rate</th>
                                                <th className="text-left p-3 text-sm font-medium">Item Group</th>
                                                <th className="text-left p-3 text-sm font-medium">Expected Land Coverage</th>
                                                <th className="text-left p-3 text-sm font-medium">Expected Yield</th>
                                                <th className="text-right p-3 text-sm font-medium">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stockItems.map((item) => (
                                                <tr key={item.name} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                    <td className="p-3 text-sm">{item.item_name}</td>
                                                    <td className="p-3 text-sm">{item.unit_of_measure}</td>
                                                    <td className="p-3 text-sm">₹{item.rate}</td>
                                                    <td className="p-3 text-sm">{item.stock_item_group}</td>
                                                    <td className="p-3 text-sm">{item.expected_land_coverage !== undefined && item.expected_land_coverage !== null ? `${item.expected_land_coverage} Ha` : "-"}</td>
                                                    <td className="p-3 text-sm">{item.expected_yield !== undefined && item.expected_yield !== null ? `${item.expected_yield} M.Ton` : "-"}</td>
                                                    <td className="p-3 text-sm text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleOpenEditItem(item)}
                                                        >
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit Price
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            {/* Pagination controls */}
                            <div className="flex items-center justify-between mt-4 mb-8">
                                <p className="text-sm text-muted-foreground">
                                    Page {page} • Showing {stockItems.length} items
                                </p>
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (page > 1) setPage(page - 1);
                                                }}
                                                className={page === 1 || loadingItems ? "pointer-events-none opacity-50" : ""}
                                            >
                                                <ChevronLeft className="h-4 w-4 mr-1" />
                                                Previous
                                            </PaginationPrevious>
                                        </PaginationItem>
                                        <PaginationItem>
                                            <PaginationLink href="#" className="pointer-events-none">
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                        <PaginationItem>
                                            <PaginationNext
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (stockItems.length >= PAGE_SIZE) setPage(page + 1);
                                                }}
                                                className={stockItems.length < PAGE_SIZE || loadingItems ? "pointer-events-none opacity-50" : ""}
                                            >
                                                Next
                                                <ChevronRight className="h-4 w-4 ml-1" />
                                            </PaginationNext>
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            No stock items found.
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (!open) {
                    setItemName("");
                    setUnitOfMeasure("");
                    setRate("");
                    setItemGroup("");
                    setExpectedLandCoverage("");
                    setExpectedYield("");
                }
            }}>
                <DialogContent className="max-h-[85vh] overflow-y-auto">
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
                                onChange={(e) => {
                                    const sanitized = e.target.value.replace(/[<>]/g, "");
                                    setItemName(sanitized);
                                }}
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
                        <div className="space-y-2">
                            <Label htmlFor="item_group">Item Group</Label>
                            <Select
                                value={itemGroup}
                                onValueChange={setItemGroup}
                                disabled={loadingItemGroups}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select item group" />
                                </SelectTrigger>
                                <SelectContent>
                                    {itemGroups && itemGroups.length > 0 ? (
                                        itemGroups.map((group) => (
                                            <SelectItem key={group.name} value={group.name}>
                                                {group.group_name}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-2 text-xs text-muted-foreground">
                                            No item groups found
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
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
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setIsAddDialogOpen(false);
                            setItemName("");
                            setUnitOfMeasure("");
                            setRate("");
                            setItemGroup("");
                            setExpectedLandCoverage("");
                            setExpectedYield("");
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddStockItem} disabled={isCreating}>
                            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Item
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                setIsEditDialogOpen(open);
                if (!open) {
                    setSelectedItem(null);
                    setEditRate("");
                    setEditUnitOfMeasure("");
                    setEditExpectedLandCoverage("");
                    setEditExpectedYield("");
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Stock Item</DialogTitle>
                        <DialogDescription>
                            Update the unit of measure and rate for {selectedItem?.item_name || "this item"}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit_unit_of_measure">Unit of Measure</Label>
                            <Select
                                value={editUnitOfMeasure}
                                onValueChange={setEditUnitOfMeasure}
                                disabled={loadingUnits}
                            >
                                <SelectTrigger id="edit_unit_of_measure">
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
                            <Label htmlFor="edit_rate">Rate</Label>
                            <Input
                                id="edit_rate"
                                type="number"
                                step="any"
                                placeholder="Enter rate"
                                value={editRate}
                                onChange={(e) => setEditRate(e.target.value)}
                            />
                        </div>
                        {isEditFodderSeed && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="edit_expected_land_coverage">Expected Land Coverage</Label>
                                    <Input
                                        id="edit_expected_land_coverage"
                                        type="number"
                                        step="any"
                                        placeholder="Enter expected land coverage"
                                        value={editExpectedLandCoverage}
                                        onChange={(e) => setEditExpectedLandCoverage(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit_expected_yield">Expected Yield</Label>
                                    <Input
                                        id="edit_expected_yield"
                                        type="number"
                                        step="any"
                                        placeholder="Enter expected yield"
                                        value={editExpectedYield}
                                        onChange={(e) => setEditExpectedYield(e.target.value)}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsEditDialogOpen(false);
                                setSelectedItem(null);
                                setEditRate("");
                                setEditUnitOfMeasure("");
                                setEditExpectedLandCoverage("");
                                setEditExpectedYield("");
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateItem} disabled={isUpdating}>
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Item
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
