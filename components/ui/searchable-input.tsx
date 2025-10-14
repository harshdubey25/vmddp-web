import { cn } from "../../lib/utils";
import { Command as CommandPrimitive } from "cmdk";
import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "./command";
import { Input } from "./input";
import { Popover, PopoverAnchor, PopoverContent } from "./popover";
import { Skeleton } from "./skeleton";
import { useFrappeGetDocList } from "frappe-react-sdk";

type Props<T extends string> = {
    selectedValue: T;
    onSelectedValueChange: (value: T) => void;
    // searchValue: string;
    // onSearchValueChange: (value: string) => void;
    items?: { value: T; label: string }[];
    isLoading?: boolean;
    emptyMessage?: string;
    placeholder?: string;
    doctype: string;
    filters?: [string, string, any][];
};

export function AutoComplete<T extends string>({
    selectedValue,
    onSelectedValueChange,
    // searchValue,
    // onSearchValueChange,
    items,
    isLoading,
    emptyMessage = "No items.",
    placeholder = "Search...",
    doctype,
    filters
}: Props<T>) {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('')
    // const [selectedValue, onSelectedValueChange] = useState('' as T)
    const debouncedSearchTerm = useDebounce(searchValue, 500);
    const { data: docList, isLoading: doclistLoading } = useFrappeGetDocList(doctype, {
        fields: ["name"],
        filters: [['name', 'like', `%${debouncedSearchTerm}%`], ...(filters || [])] as any,
        limit: 5,
        limit_start: 0,

    })
    // const labels = useMemo(
    //     () =>
    //         items.reduce((acc, item) => {
    //             acc[item.value] = item.label;
    //             return acc;
    //         }, {} as Record<string, string>),
    //     [items]
    // );

    const reset = () => {
        onSelectedValueChange("" as T);
        setSearchValue("");
    };

    const onInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        if (
            !e.relatedTarget?.hasAttribute("cmdk-list") &&
            selectedValue !== searchValue
        ) {
            reset();
        }
    };

    const onSelectItem = (inputValue: string) => {
        if (inputValue === selectedValue) {
            reset();
        } else {
            onSelectedValueChange(inputValue as T);
            setSearchValue(inputValue ?? "");
        }
        setOpen(false);
    };

    return (
        <div className="flex items-center">
            <Popover open={open} onOpenChange={setOpen}>
                <Command shouldFilter={false}>
                    <PopoverAnchor asChild>
                        <CommandPrimitive.Input
                            asChild
                            value={searchValue}
                            onValueChange={setSearchValue}
                            onKeyDown={(e) => setOpen(e.key !== "Escape")}
                            onMouseDown={() => setOpen((open) => !!searchValue || !open)}
                            onFocus={() => setOpen(true)}
                            onBlur={onInputBlur}
                        >
                            <Input placeholder={placeholder} />
                        </CommandPrimitive.Input>
                    </PopoverAnchor>
                    {!open && <CommandList aria-hidden="true" className="hidden" />}
                    <PopoverContent
                        asChild
                        onOpenAutoFocus={(e) => e.preventDefault()}
                        onInteractOutside={(e) => {
                            if (
                                e.target instanceof Element &&
                                e.target.hasAttribute("cmdk-input")
                            ) {
                                e.preventDefault();
                            }
                        }}
                        className="w-[--radix-popover-trigger-width] p-0"
                    >
                        <CommandList>
                            {doclistLoading && (
                                <CommandPrimitive.Loading>
                                    <div className="p-1">
                                        <Skeleton className="h-6 w-full" />
                                    </div>
                                </CommandPrimitive.Loading>
                            )}
                            {docList && docList.length > 0 && !doclistLoading ? (
                                <CommandGroup>
                                    {docList.map((option) => (
                                        <CommandItem
                                            key={option.name}
                                            value={option.name}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onSelect={onSelectItem}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedValue === option.name
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                )}
                                            />
                                            {option.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            ) : null}
                            {/* {!doclistLoading ? (
                                <CommandEmpty>{emptyMessage ?? "No items."}</CommandEmpty>
                            ) : null} */}
                        </CommandList>
                    </PopoverContent>
                </Command>
            </Popover>
        </div>
    );
}
