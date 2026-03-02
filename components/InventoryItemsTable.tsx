import { InventoryItem } from "@/types/subadmin";
import { Button } from "@/components/ui/button";
import React from "react";
import { useFrappeGetDocList } from "frappe-react-sdk";

interface InventoryItemsTableProps {
  items: InventoryItem[];
  onChange: (items: InventoryItem[]) => void;
}

export const InventoryItemsTable: React.FC<InventoryItemsTableProps> = ({ items, onChange }) => {
  const handleStockItemSelect = (index: number, stockName: string) => {
    const updated = items.map((item, i) =>
      i === index ? { inventory_item: stockName } : item
    );
    onChange(updated);
  };

  const handleAdd = () => {
    onChange([...items, { inventory_item: "" }]);
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
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Item Name
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 w-48">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-sm text-gray-500">
                    No items added. Click "Add Item" to get started.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  return (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <select
                          value={item.inventory_item}
                          onChange={(e) => handleStockItemSelect(idx, e.target.value)}
                          className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary hover:border-gray-400 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select an item from the list</option>
                          {stockItems?.map((stock: any) => (
                            <option key={stock.name} value={stock.name}>
                              {stock.item_name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button 
                          type="button" 
                          variant="destructive" 
                          onClick={() => handleRemove(idx)}
                          className="h-11 px-6 shadow-sm hover:shadow transition-shadow"
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <Button 
        type="button" 
        onClick={handleAdd}
        className="h-11 px-6 shadow-sm hover:shadow-md transition-shadow"
        variant="outline"
      >
        <span className="text-lg mr-2">+</span>
        Add Item
      </Button>
    </div>
  );
};
