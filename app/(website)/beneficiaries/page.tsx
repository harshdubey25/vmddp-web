"use client"
import { useState } from "react";
import BeneficiaryTable from "@/components/BeneficiaryTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useTranslation } from 'react-i18next';

export default function Beneficiaries() {
    const { t } = useTranslation('common');
    const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
    const [selectedComponent, setSelectedComponent] = useState<string>("all");

    const mockData = [
        { district: "Nagpur", component: "Animal Induction (Calved Cow)", selected: 45, rejected: 5, inProgress: 12 },
        { district: "Nagpur", component: "HGM (Pregnant Cow)", selected: 32, rejected: 7, inProgress: 18 },
        { district: "Nagpur", component: "Fertility Feed", selected: 28, rejected: 4, inProgress: 15 },
        { district: "Amravati", component: "Animal Induction (Calved Cow)", selected: 38, rejected: 8, inProgress: 15 },
        { district: "Amravati", component: "Supply Chaff Cutter", selected: 28, rejected: 4, inProgress: 22 },
        { district: "Amravati", component: "Farmer Training", selected: 52, rejected: 2, inProgress: 18 },
        { district: "Yavatmal", component: "Fodder Seed", selected: 52, rejected: 3, inProgress: 20 },
        { district: "Yavatmal", component: "SNF Enhancer", selected: 41, rejected: 6, inProgress: 18 },
        { district: "Yavatmal", component: "Supply Of Silage", selected: 35, rejected: 5, inProgress: 16 },
        { district: "Wardha", component: "Animal Induction (Calved Cow)", selected: 35, rejected: 9, inProgress: 14 },
        { district: "Wardha", component: "Treatment of Infertile Animal", selected: 42, rejected: 3, inProgress: 20 },
        { district: "Chandrapur", component: "HGM (Pregnant Cow)", selected: 48, rejected: 2, inProgress: 25 },
        { district: "Chandrapur", component: "Fertility Feed", selected: 36, rejected: 6, inProgress: 14 },
        { district: "Akola", component: "Fodder Seed", selected: 44, rejected: 4, inProgress: 19 },
        { district: "Akola", component: "Supply Chaff Cutter", selected: 31, rejected: 7, inProgress: 12 },
        { district: "Washim", component: "SNF Enhancer", selected: 29, rejected: 5, inProgress: 16 },
        { district: "Washim", component: "Farmer Training", selected: 55, rejected: 1, inProgress: 22 },
        { district: "Buldhana", component: "Animal Induction (Calved Cow)", selected: 40, rejected: 6, inProgress: 17 },
        { district: "Buldhana", component: "Supply Of Silage", selected: 33, rejected: 8, inProgress: 15 },
    ];

    const mappedData = mockData.map(item => ({
        district: item.district,
        component: item.component,
        pending: item.inProgress ?? 0,
        approved: Math.max(0, item.selected - item.rejected),
        selected: item.selected,
        rejected: item.rejected,
    }));

    const filteredData = mappedData.filter(item => {
        const districtMatch = selectedDistrict === "all" || item.district === selectedDistrict;
        const componentMatch = selectedComponent === "all" || item.component === selectedComponent;
        return districtMatch && componentMatch;
    });

    const districts = ["all", ...Array.from(new Set(mockData.map(item => item.district)))];
    const components = ["all", ...Array.from(new Set(mockData.map(item => item.component)))];

    return (
        <div className="min-h-[calc(100vh-16rem)] py-12 sm:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h1 className="font-display font-semibold text-2xl sm:text-3xl mb-3" data-testid="text-beneficiaries-title">
                        {t('beneficiaries_title')}
                    </h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        {t('beneficiaries_subtitle')}
                    </p>
                </div>

                <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    <div className="space-y-2">
                        <Label htmlFor="district-filter">{t('filter_by_district')}</Label>
                        <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                            <SelectTrigger id="district-filter" data-testid="select-district">
                                <SelectValue placeholder={t('select_district')} />
                            </SelectTrigger>
                            <SelectContent>
                                {districts.map(district => (
                                    <SelectItem key={district} value={district}>
                                        {district === "all" ? t('all_districts') : district}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="component-filter">{t('filter_by_component')}</Label>
                        <Select value={selectedComponent} onValueChange={setSelectedComponent}>
                            <SelectTrigger id="component-filter" data-testid="select-component">
                                <SelectValue placeholder={t('select_component')} />
                            </SelectTrigger>
                            <SelectContent>
                                {components.map(component => (
                                    <SelectItem key={component} value={component}>
                                        {component === "all" ? t('all_components') : component}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <BeneficiaryTable data={filteredData} />
            </div>
        </div>
    );
}
