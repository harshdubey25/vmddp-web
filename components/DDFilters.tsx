"use client";

import { useState, useEffect } from "react";
import { Search, X, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useFrappeGetDocList } from "frappe-react-sdk";

interface DDFiltersProps {
    onFilterChange: (filters: {
        aadhaar: string;
        district: string;
        taluka: string;
        village: string;
        application_id?: string;
        search?: string;
    }) => void;
    initialFilters?: {
        aadhaar?: string;
        district?: string;
        taluka?: string;
        village?: string;
        application_id?: string;
        search?: string;
    };
    showApplicationIdFilter?: boolean;
    showSearchFilter?: boolean;
}

export default function DDFilters({ onFilterChange, initialFilters = {}, showApplicationIdFilter = false, showSearchFilter = false }: DDFiltersProps) {
    const [aadhaar, setAadhaar] = useState(initialFilters.aadhaar || "");
    const [district, setDistrict] = useState(initialFilters.district || "");
    const [taluka, setTaluka] = useState(initialFilters.taluka || "");
    const [village, setVillage] = useState(initialFilters.village || "");
    const [applicationId, setApplicationId] = useState(initialFilters.application_id || "");
    const [searchText, setSearchText] = useState(initialFilters.search || "");
    const [showFilters, setShowFilters] = useState(true);

    // Fetch districts
    const { data: districtData } = useFrappeGetDocList("District Master", {
        fields: ["name1"],
        filters: [["enabled", "=", 1]],
        orderBy: {
            field: "name1",
            order: "asc"
        }
    });

    // Fetch talukas based on selected district
    const { data: talukaData } = useFrappeGetDocList("Taluka Master", {
        fields: ["name1"],
        filters: district ? [["district", "=", district]] : undefined,
        orderBy: {
            field: "name1",
            order: "asc"
        }
    });

    // Fetch villages based on selected district and taluka
    const { data: villageData } = useFrappeGetDocList("Village Master", {
        fields: ["name1"],
        filters: district && taluka
            ? [["district", "=", district], ["taluka", "=", taluka]]
            : district
                ? [["district", "=", district]]
                : undefined,
        orderBy: {
            field: "name1",
            order: "asc"
        }
    });

    const hasActiveFilters = aadhaar || district || taluka || village || applicationId || searchText;

    // Reset dependent dropdowns when parent changes
    useEffect(() => {
        if (!district) {
            setTaluka("");
            setVillage("");
        }
    }, [district]);

    useEffect(() => {
        if (!taluka) {
            setVillage("");
        }
    }, [taluka]);

    const handleSearch = () => {
        onFilterChange({ aadhaar, district, taluka, village, application_id: applicationId, search: searchText });
    };

    const handleClear = () => {
        setAadhaar("");
        setDistrict("");
        setTaluka("");
        setVillage("");
        setApplicationId("");
        setSearchText("");
        onFilterChange({ aadhaar: "", district: "", taluka: "", village: "", application_id: "", search: "" });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    return (
        <Card className="mb-4">
            <CardContent className="pt-6">
                <div className="space-y-4">
                    {/* Header with toggle */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-semibold">Filters</h3>
                            {hasActiveFilters && (
                                <span className="text-xs text-muted-foreground">
                                    ({Object.values({ aadhaar, district, taluka, village, ...(showApplicationIdFilter ? { applicationId } : {}), ...(showSearchFilter ? { searchText } : {}) }).filter(Boolean).length} active)
                                </span>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            {showFilters ? "Hide" : "Show"} Filters
                        </Button>
                    </div>

                    {/* Filter inputs - always visible or collapsible */}
                    {showFilters && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Aadhaar Number */}
                                <div className="space-y-2">
                                    <Label htmlFor="aadhaar-filter">Aadhaar Number</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="aadhaar-filter"
                                            placeholder="Enter 12-digit Aadhaar"
                                            value={aadhaar}
                                            onChange={(e) =>
                                                setAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12))
                                            }
                                            onKeyDown={handleKeyPress}
                                            className="pl-9"
                                            data-testid="input-aadhaar-filter"
                                        />
                                    </div>
                                </div>

                                {/* District */}
                                <div className="space-y-2">
                                    <Label htmlFor="district-filter">District</Label>
                                    <Select value={district} onValueChange={setDistrict}>
                                        <SelectTrigger id="district-filter" data-testid="select-district-filter">
                                            <SelectValue placeholder="Select district" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {districtData?.map((dist: any) => (
                                                <SelectItem key={dist.name1} value={dist.name1}>
                                                    {dist.name1}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Taluka */}
                                <div className="space-y-2">
                                    <Label htmlFor="taluka-filter">Taluka</Label>
                                    <Select value={taluka} onValueChange={setTaluka} disabled={!district}>
                                        <SelectTrigger id="taluka-filter" data-testid="select-taluka-filter">
                                            <SelectValue placeholder={district ? "Select taluka" : "Select district first"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {talukaData?.map((tal: any) => (
                                                <SelectItem key={tal.name1} value={tal.name1}>
                                                    {tal.name1}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Village */}
                                <div className="space-y-2">
                                    <Label htmlFor="village-filter">Village</Label>
                                    <Select value={village} onValueChange={setVillage} disabled={!district}>
                                        <SelectTrigger id="village-filter" data-testid="select-village-filter">
                                            <SelectValue placeholder={district ? "Select village" : "Select district first"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {villageData?.map((vil: any) => (
                                                <SelectItem key={vil.name1} value={vil.name1}>
                                                    {vil.name1}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Application ID */}
                                {showApplicationIdFilter && (
                                    <div className="space-y-2">
                                        <Label htmlFor="application-id-filter">Application ID</Label>
                                        <Input
                                            id="application-id-filter"
                                            placeholder="Enter Application ID"
                                            value={applicationId}
                                            onChange={(e) => setApplicationId(e.target.value)}
                                            onKeyDown={handleKeyPress}
                                            data-testid="input-application-id-filter"
                                        />
                                    </div>
                                )}

                                {/* Search */}
                                {showSearchFilter && (
                                    <div className="space-y-2">
                                        <Label htmlFor="search-filter">Search</Label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="search-filter"
                                                placeholder="Search by name, etc."
                                                value={searchText}
                                                onChange={(e) => setSearchText(e.target.value)}
                                                onKeyDown={handleKeyPress}
                                                className="pl-9"
                                                data-testid="input-search-filter"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2">
                                <Button onClick={handleSearch} size="sm" data-testid="button-apply-filters">
                                    <Search className="h-4 w-4 mr-2" />
                                    Apply Filters
                                </Button>
                                {hasActiveFilters && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleClear}
                                        data-testid="button-clear-filters"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Clear All
                                    </Button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
