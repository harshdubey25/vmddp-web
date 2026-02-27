import { InventoryItem } from "@/types/subadmin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useFrappeGetDocList } from "frappe-react-sdk";

interface InventoryItemsTableProps {
  items: InventoryItem[];
  onChange: (items: InventoryItem[]) => void;
}

export const InventoryItemsTable: React.FC<InventoryItemsTableProps> = ({ items, onChange }) => {
  const handleItemChange = (index: number, field: keyof InventoryItem, value: string | number) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange(updated);
  };

  const handleStockItemSelect = (index: number, stockName: string) => {
    const stock = stockItems?.find((s: any) => s.name === stockName);
    const updated = items.map((item, i) =>
      i === index
        ? {
            ...item,
            inventory_item: stockName,
            rate: stock?.rate ?? ""
          }
        : item
    );
    onChange(updated);
  };

  const handleAdd = () => {
    onChange([...items, { inventory_item: "", quantity: 0, rate: "" }]);
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const { data: stockItems } = useFrappeGetDocList("Stock Item", {
    fields: ["name", "item_name", "unit_of_measure", "item_type"],
    filters: [["item_type", "=", "Book"]],
    limit: 1000,
  });

  return (
    <div>
      <table className="min-w-full border text-sm">
        <thead>
          <tr>
            <th className="border p-2">Item Name</th>
            <th className="border p-2">Quantity</th>
            <th className="border p-2">Rate</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const selectedStock = stockItems?.find((s: any) => s.name === item.inventory_item);
            return (
              <tr key={idx}>
                <td className="border p-2">
                  <Select
                    value={item.inventory_item}
                    onValueChange={value => handleStockItemSelect(idx, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {stockItems?.map((stock: any) => (
                        <SelectItem key={stock.name} value={stock.name}>
                          {stock.item_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="border p-2">
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={e => handleItemChange(idx, "quantity", Number(e.target.value))}
                    placeholder="Quantity"
                    hideSpinners
                  />
                </td>
                <td className="border p-2">
                  <Input
                    type="number"
                    value={item.rate ?? ""}
                    onChange={e => handleItemChange(idx, "rate", e.target.value)}
                    placeholder="Rate"
                    hideSpinners
                  />
                </td>
                <td className="border p-2">
                  <Button type="button" variant="destructive" size="sm" onClick={() => handleRemove(idx)}>
                    Remove
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Button type="button" className="mt-2" onClick={handleAdd}>
        Add Item
      </Button>
    </div>
  );
};
