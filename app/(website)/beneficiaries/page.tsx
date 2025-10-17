"use client"
import { useEffect, useState } from "react";
import axios from "axios";
import { useFrappeGetDocList } from "frappe-react-sdk";
import BeneficiaryTable from "@/components/BeneficiaryTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useTranslation } from 'react-i18next';

export const runtime = 'edge';

export default function Beneficiaries() {
    const { t } = useTranslation('common');
    const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
    const [selectedComponent, setSelectedComponent] = useState<string>("all");
    const [liveData, setLiveData] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchLiveData = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_FRAPPE_BASE_URL}/api/method/vmddp_app.vmddp.doctype.app_form.app_form.get_applications_by_district_component?district=${selectedDistrict}&component=${selectedComponent}`, {
                    withCredentials: true
                });
                setLiveData(res.data.message);
            } catch (err) {
                setLiveData(null);
            } finally {
                setLoading(false);
            }
        };
        fetchLiveData();
    }, [selectedDistrict, selectedComponent]);

    const { data: frappeDistricts, isLoading: districtsLoading } = useFrappeGetDocList("District Master", {
        fields: ["name1"],
        limit: 100,
    });
    const { data: frappeComponents, isLoading: componentsLoading } = useFrappeGetDocList("Component", {
        fields: ["component_name"],
        limit: 100,
    });
    const districts = ["all", ...(frappeDistricts ? frappeDistricts.map((d: any) => d.name1) : [])];
    const components = ["all", ...(frappeComponents ? frappeComponents.map((c: any) => c.component_name) : [])];

    // Format liveData for BeneficiaryTable
    const tableData = liveData && typeof liveData === 'object' && 'submitted' in liveData
        ? [{
            district: selectedDistrict === 'all' ? 'All' : selectedDistrict,
            component: selectedComponent === 'all' ? 'All' : selectedComponent,
            pending: (liveData.total ?? 0) - (liveData.approved ?? 0) - (liveData.rejected ?? 0),
            approved: liveData.approved ?? 0,
            selected: liveData.submitted ?? 0,
            rejected: liveData.rejected ?? 0,
        }]
        : [];

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
                                {districtsLoading ? (
                                    <SelectItem value="all">Loading...</SelectItem>
                                ) : (
                                    districts.map(district => (
                                        <SelectItem key={district} value={district}>
                                            {district === "all" ? "All Districts" : district}
                                        </SelectItem>
                                    ))
                                )}
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
                                {componentsLoading ? (
                                    <SelectItem value="all">Loading...</SelectItem>
                                ) : (
                                    components.map(component => (
                                        <SelectItem key={component} value={component}>
                                            {component === "all" ? "All Components" : component}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <BeneficiaryTable data={loading ? [] : tableData} />
            </div>
        </div>
    );
}
