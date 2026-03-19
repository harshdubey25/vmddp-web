'use client';

import { useEffect, useState, useMemo } from 'react';
import { useFrappeGetCall } from 'frappe-react-sdk';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ChevronDown } from 'lucide-react';
import { FrappeCustomApiResponse } from '@/types';

interface ReportData {
    component: string;
    component_name: string;
    total_quantity: number;
    total_animals_benefitted: number;
    physical_target: number;
    financial_target: number;
    total_amount: number;
    total_subsidy: number;
    total_land_covered?: number;
    total_applications: number;
    total_claims: number;
    physical_percentage: number;
    financial_percentage: number;
}

interface CostBreakdown {
    beneficiary_share: number;
    subsidy_share: number;
    total: number;
}

interface TotalExpenditure {
    benenficiary_share_total: number;
    subsidy_share_total: number;
    total: number;
}

interface Target {
    financial_target: number;
    physical_target: number;
}

interface Balance {
    financial_balance: number;
    physical_balance: number;
}

interface ComponentSummary {
    component: string;
    target_physical: number;
    target_financial: number;
    achieved_physical: number;
    achieved_financial: number;
    balance_physical: number;
    balance_financial: number;
}



interface AnimalInductionDistrictData {
    cow_count: number;
    crossbreed_count: number;
    buffalo_count: number;
    animal_cost: CostBreakdown;
    collar_cost: CostBreakdown;
    premium_paid: CostBreakdown;
    transportation_cost: CostBreakdown;
    total_expenditure: TotalExpenditure;
    target: Target;
    balance: Balance;
}

interface AnimalInductionMPRResponse {
    message: {
        progressive: {
            [districtName: string]: AnimalInductionDistrictData | number;
            total_cows: number;
            total_buffaloes: number;
            total_crossbreed: number;
        };
        current_month: {
            [districtName: string]: AnimalInductionDistrictData | number;
            total_cows: number;
            total_buffaloes: number;
            total_crossbreed: number;
        };
        filters: {
            month: number;
            year: number;
            financial_year_start: string;
            progressive_start_date: string;
            progressive_end_date: string;
            current_month_start_date: string;
            current_month_end_date: string;
        };
    };
}

interface HGMDistrictData {
    cow_count: number;
    buffalo_count: number;
    beneficiary_share: number;
    subsidy: number;
    total: number;
    financial_target: number;
    physical_target: number;
    financial_achievement: number;
    physical_achievement: number;
    financial_balance: number;
    physical_balance: number;
}

interface HGMTotals {
    total_cows: number;
    total_buffaloes: number;
    total_beneficiary_share: number;
    total_subsidy: number;
    grand_total: number;
    total_financial_target: number;
    total_physical_target: number;
    total_financial_achievement: number;
    total_physical_achievement: number;
    total_financial_balance: number;
    total_physical_balance: number;
}

interface HGMSection {
    districts: {
        [districtName: string]: HGMDistrictData;
    };
    totals: HGMTotals;
}

interface HGMMPRResponse {
    message: {
        progressive: HGMSection;
        current_month: HGMSection;
        filters: {
            month: number;
            year: number;
            financial_year_start: string;
            progressive_start_date: string;
            progressive_end_date: string;
            current_month_start_date: string;
            current_month_end_date: string;
        };
    };
}

export default function MPRPage() {
    const [reportData, setReportData] = useState<ReportData[]>([]);
    const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState<string>(String(currentDate.getMonth() + 1));
    const [selectedYear, setSelectedYear] = useState<string>(String(currentDate.getFullYear()));

    const { data: apiData, isLoading, error } = useFrappeGetCall<FrappeCustomApiResponse<any>>(
        'vmddp_app.api.v1.secretory.get_dbt_claims_summary'
    );

    const { data: animalInductionData, isLoading: animalInductionLoading } = useFrappeGetCall<AnimalInductionMPRResponse>(
        'vmddp_app.api.v1.accountant.animal_induction_mpr',
        {
            month: parseInt(selectedMonth),
            year: parseInt(selectedYear),
        },
        undefined,
        { revalidateOnFocus: false }
    );
    console.table(animalInductionData?.message);

    const { data: hgmData, isLoading: hgmLoading } = useFrappeGetCall<HGMMPRResponse>(
        'vmddp_app.api.v1.accountant.hgm_mpr',
        {
            month: parseInt(selectedMonth),
            year: parseInt(selectedYear),
        },
        undefined,
        { revalidateOnFocus: false }
    );
    const { data: farmerTrainingData, isLoading: farmerTrainingLoading } = useFrappeGetCall<{ message: ComponentSummary }>(
        'vmddp_app.api.v1.secretory.get_farmer_training_summary',
        { component: 'Farmer Training' },
        undefined,
        { revalidateOnFocus: false }
    );


    const { data: treatmentInfertileData, isLoading: treatmentInfertileLoading } = useFrappeGetCall<{ message: ComponentSummary }>(
        'vmddp_app.api.v1.secretory.get_treatment_infertile_animal_summary',
        { component: 'Treatment of Infertile Animal' },
        undefined,
        { revalidateOnFocus: false }
    );

    const animalInductionTotals = useMemo(() => {
        if (!animalInductionData?.message?.progressive) {
            return null;
        }
        const data = animalInductionData.message.progressive;
        const result = {
            cow_count: 0,
            buffalo_count: 0,
            crossbreed_count: 0,
            animal_cost: { beneficiary_share: 0, subsidy_share: 0, total: 0 },
            collar_cost: { beneficiary_share: 0, subsidy_share: 0, total: 0 },
            premium_paid: { beneficiary_share: 0, subsidy_share: 0, total: 0 },
            transportation_cost: { beneficiary_share: 0, subsidy_share: 0, total: 0 },
            total_expenditure: { benenficiary_share_total: 0, subsidy_share_total: 0, total: 0 },
            target: { financial_target: 0, physical_target: 0 },
            balance: { financial_balance: 0, physical_balance: 0 },
        };

        Object.entries(data).forEach(([key, value]: [string, any]) => {
            if (key !== 'total_cows' && key !== 'total_buffaloes' && key !== 'total_crossbreed' && typeof value === 'object' && value !== null) {
                result.cow_count += value.cow_count || 0;
                result.buffalo_count += value.buffalo_count || 0;
                result.crossbreed_count += value.crossbreed_count || 0;
                result.animal_cost.beneficiary_share += value.animal_cost?.beneficiary_share || 0;
                result.animal_cost.subsidy_share += value.animal_cost?.subsidy_share || 0;
                result.animal_cost.total += value.animal_cost?.total || 0;
                result.collar_cost.beneficiary_share += value.collar_cost?.beneficiary_share || 0;
                result.collar_cost.subsidy_share += value.collar_cost?.subsidy_share || 0;
                result.collar_cost.total += value.collar_cost?.total || 0;
                result.premium_paid.beneficiary_share += value.premium_paid?.beneficiary_share || 0;
                result.premium_paid.subsidy_share += value.premium_paid?.subsidy_share || 0;
                result.premium_paid.total += value.premium_paid?.total || 0;
                result.transportation_cost.beneficiary_share += value.transportation_cost?.beneficiary_share || 0;
                result.transportation_cost.subsidy_share += value.transportation_cost?.subsidy_share || 0;
                result.transportation_cost.total += value.transportation_cost?.total || 0;
                result.total_expenditure.benenficiary_share_total += value.total_expenditure?.benenficiary_share_total || 0;
                result.total_expenditure.subsidy_share_total += value.total_expenditure?.subsidy_share_total || 0;
                result.total_expenditure.total += value.total_expenditure?.total || 0;
                result.target.financial_target += value.target?.financial_target || 0;
                result.target.physical_target += value.target?.physical_target || 0;
                result.balance.financial_balance += value.balance?.financial_balance || 0;
                result.balance.physical_balance += value.balance?.physical_balance || 0;
            }
        });

        return result;
    }, [animalInductionData]);

    const hgmTotals = hgmData?.message?.progressive?.totals || null;

    useEffect(() => {
        if (apiData?.message) {
            const transformedData = transformApiData(apiData.message);
            setReportData(transformedData);
        }
    }, [apiData]);
    

    const transformApiData = (apiData: any): ReportData[] => {
        return Object.entries(apiData.dbt_claims_by_component || {}).map(([key, value]: [string, any]) => {
            const isFodderSeed = value.component_name === 'Fodder Seed';
            return {
                component: key,
                component_name: value.component_name || key,
                total_quantity: value.total_quantity || 0,
                total_animals_benefitted: value.total_animals_benefitted || 0,
                total_amount: value.total_amount || 0,
                physical_target: value.physical_target || 0,
                financial_target: value.financial_target || 0,
                total_subsidy: value.total_subsidy || 0,
                total_land_covered: isFodderSeed ? value.total_land_covered : undefined,
                total_applications: value.total_applications || 0,
                total_claims: value.total_claims || 0,
                physical_percentage: value.physical_percentage || 0,
                financial_percentage: value.financial_percentage || 0,
                };
        });
    };

    const formatCurrency = (value: number): string => {
        if (value === 0) return '0.00';
        const lakhs = value / 100000;
        return lakhs.toFixed(3);
    };

    const formatCurrencyRupees = (value: number): string => {
        if (value === 0) return '0';
        return new Intl.NumberFormat('en-IN').format(value);
    };

    const formatNumber = (value: number): string => {
        return value.toFixed(2);
    };

    const formatPercentage =(value: number): string =>{
        return `${value.toFixed(2)}%`;
    }


    const toggleComponent = (componentId: string) => {
        const newExpanded = new Set(expandedComponents);
        if (newExpanded.has(componentId)) {
            newExpanded.delete(componentId);
        } else {
            newExpanded.add(componentId);
        }
        setExpandedComponents(newExpanded);
    };

    const toggleSection = (sectionId: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(sectionId)) {
            newExpanded.delete(sectionId);
        } else {
            newExpanded.add(sectionId);
        }
        setExpandedSections(newExpanded);
    };

    if (isLoading || animalInductionLoading || hgmLoading || farmerTrainingLoading || treatmentInfertileLoading) {
        return (
            <div className="flex-1 overflow-auto">
                <div className="p-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Target & Achievement Report</CardTitle>
                            <CardDescription>Jun-25</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to load report data';

    return (
        <div className="flex-1 overflow-auto">
            <div className="p-8 space-y-8">
                {/* DBT Claims Section */}
                <Card className="relative overflow-hidden border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-600/5 hover:shadow-xl transition-all duration-300 group backdrop-blur-sm">
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/10 opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110" />
                    <CardHeader className="relative z-10">
                        <CardTitle className="text-xl font-bold text-blue-900 dark:text-blue-100">DBT Claims - Target & Achievement Report</CardTitle>
                        <CardDescription className="text-blue-700/80 dark:text-blue-300 font-medium">Jun-25</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{errorMessage}</AlertDescription>
                            </Alert>
                        )}

                        {reportData.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No data available for the selected period.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {reportData.map((report, idx) => {
                                    const isExpanded = expandedComponents.has(report.component);
                                    const hasLandCovered = report.total_land_covered !== undefined;
                                    
                                    return (
                                        <Card key={idx} className="overflow-hidden">
                                            <div
                                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                                onClick={() => toggleComponent(report.component)}
                                            >
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {report.component_name}
                                                </h3>
                                                <ChevronDown
                                                    className={`w-5 h-5 text-gray-600 transition-transform ${
                                                        isExpanded ? 'rotate-180' : ''
                                                    }`}
                                                />
                                            </div>

                                            {isExpanded && (
                                                <div className="border-t px-4 py-4">
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full border-collapse border border-gray-300">
                                                            <thead>
                                                                <tr>
                                                                    <th colSpan={4} className="bg-blue-100 border border-gray-300 text-center font-bold p-2">
                                                                        Physical Achievement
                                                                    </th>
                                                                    <th className="bg-white border-0"></th>
                                                                    <th colSpan={hasLandCovered ? 5 : 4} className="bg-green-100 border border-gray-300 text-center font-bold p-2">
                                                                        Financial Achievement
                                                                    </th>
                                                                </tr>
                                                                <tr>
                                                                    <th className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">PHYSICAL TARGET</th>
                                                                    <th className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">TOTAL QUANTITY</th>
                                                                    <th className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">TOTAL ANIMALS BENEFITTED</th>
                                                                    <th className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">PERCENTAGE</th>
                                                                    <th className="bg-white border-0"></th>
                                                                    <th className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">FINANCIAL TARGET</th>
                                                                    <th className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">TOTAL AMOUNT (In LAKH)</th>
                                                                    <th className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">TOTAL SUBSIDY</th>
                                                                    <th className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">PERCENTAGE</th>
                                                                    {hasLandCovered && (
                                                                        <th className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">TOTAL LAND COVERED</th>
                                                                    )}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr>
                                                                    <td className="border border-gray-300 p-2 text-center">{formatNumber(report.physical_target)}</td>
                                                                    <td className="border border-gray-300 p-2 text-center">{formatNumber(report.total_quantity)}</td>
                                                                    <td className="border border-gray-300 p-2 text-center">{formatNumber(report.total_animals_benefitted)}</td>
                                                                    <td className="border border-gray-300 p-2 text-center font-semibold text-blue-600">
                                                                        {formatPercentage(report.physical_percentage)}
                                                                    </td>
                                                                    <td className="bg-white border-0"></td>
                                                                    <td className="border border-gray-300 p-2 text-center">{formatCurrency(report.financial_target)}</td>
                                                                    <td className="border border-gray-300 p-2 text-center">{formatCurrency(report.total_amount)}</td>
                                                                    <td className="border border-gray-300 p-2 text-center">{formatCurrency(report.total_subsidy)}</td>
                                                                    <td className="border border-gray-300 p-2 text-center font-semibold text-green-600">
                                                                        {formatPercentage(report.financial_percentage)}
                                                                    </td>
                                                                    {hasLandCovered && (
                                                                        <td className="border border-gray-300 p-2 text-center">{formatNumber(report.total_land_covered!)}</td>
                                                                    )}
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Animal Induction Section */}
                {animalInductionTotals && (
                    <Card className="relative overflow-hidden border-2 border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-600/5 hover:shadow-xl transition-all duration-300 group backdrop-blur-sm">
                        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/10 opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110" />
                        <div
                            className="relative z-10 flex items-center justify-between p-4 cursor-pointer hover:bg-green-50/50 dark:hover:bg-green-900/20 transition-colors"
                            onClick={() => toggleSection('animalInduction')}
                        >
                            <div>
                                <CardTitle className="text-xl font-bold text-green-900 dark:text-green-100">Animal Induction MPR - Total Summary</CardTitle>
                                <CardDescription className="text-green-700/80 dark:text-green-300 font-medium">Induction of High Genetic Merit Dairy Animals</CardDescription>
                            </div>
                            <ChevronDown
                                className={`w-5 h-5 text-gray-600 transition-transform flex-shrink-0 ml-2 ${
                                    expandedSections.has('animalInduction') ? 'rotate-180' : ''
                                }`}
                            />
                        </div>
                        {expandedSections.has('animalInduction') && (
                            <CardContent>
                                <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-300">
                                    <thead>
                                        <tr>
                                            <th colSpan={5} className="bg-yellow-100 border border-gray-300 text-center font-bold p-2">
                                                Physical Achievement
                                            </th>
                                            <th colSpan={18} className="bg-green-100 border border-gray-300 text-center font-bold p-2">
                                                Financial Achievement
                                            </th>
                                        </tr>
                                        <tr>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">No. of Cow</th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">No. of Cross-breed</th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">No. of Buffalo</th>
                                            <th className="border border-gray-300 bg-yellow-50 p-2 text-center text-sm font-medium">Physical Target</th>
                                            <th className="border border-gray-300 bg-yellow-50 p-2 text-center text-sm font-medium">Physical Balance</th>
                                            <th colSpan={3} className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">Animal Cost (Rs.)</th>
                                            <th colSpan={3} className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">Digital Collar (Rs.)</th>
                                            <th colSpan={3} className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">Insurance (Rs.)</th>
                                            <th colSpan={3} className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">Transportation (Rs.)</th>
                                            <th colSpan={3} className="border border-gray-300 bg-green-50 p-2 text-center text-sm font-medium">Total Expenditure (Rs.)</th>
                                            <th className="border border-gray-300 bg-green-50 p-2 text-center text-sm font-medium">Financial Target (Rs.)</th>
                                            <th className="border border-gray-300 bg-green-50 p-2 text-center text-sm font-medium">Financial Balance (Rs.)</th>
                                        </tr>
                                        <tr>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-xs font-medium"></th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-xs font-medium"></th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-xs font-medium"></th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-xs font-medium"></th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-xs font-medium"></th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-xs font-medium">Beneficiary</th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-xs font-medium">Subsidy</th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-xs font-medium">Total</th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-xs font-medium">Beneficiary</th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-xs font-medium">Subsidy</th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-xs font-medium">Total</th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-xs font-medium">Beneficiary</th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-xs font-medium">Subsidy</th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-xs font-medium">Total</th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-xs font-medium">Beneficiary</th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-xs font-medium">Subsidy</th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-xs font-medium">Total</th>
                                            <th className="border border-gray-300 bg-green-50 p-2 text-center text-xs font-medium">Beneficiary</th>
                                            <th className="border border-gray-300 bg-green-50 p-2 text-center text-xs font-medium">Subsidy</th>
                                            <th className="border border-gray-300 bg-green-50 p-2 text-center text-xs font-medium">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-gray-300 p-2 text-center">{animalInductionTotals.cow_count}</td>
                                            <td className="border border-gray-300 p-2 text-center">{animalInductionTotals.crossbreed_count}</td>
                                            <td className="border border-gray-300 p-2 text-center">{animalInductionTotals.buffalo_count}</td>
                                            <td className="border border-gray-300 p-2 text-center bg-yellow-50 font-semibold">{animalInductionTotals.target.physical_target}</td>
                                            <td className="border border-gray-300 p-2 text-center bg-yellow-50 font-semibold text-orange-600">{animalInductionTotals.balance.physical_balance}</td>
                                            <td className="border border-gray-300 p-2 text-right">{formatCurrencyRupees(animalInductionTotals.animal_cost.beneficiary_share)}</td>
                                            <td className="border border-gray-300 p-2 text-right">{formatCurrencyRupees(animalInductionTotals.animal_cost.subsidy_share)}</td>
                                            <td className="border border-gray-300 p-2 text-right font-semibold">{formatCurrencyRupees(animalInductionTotals.animal_cost.total)}</td>
                                            <td className="border border-gray-300 p-2 text-right">{formatCurrencyRupees(animalInductionTotals.collar_cost.beneficiary_share)}</td>
                                            <td className="border border-gray-300 p-2 text-right">{formatCurrencyRupees(animalInductionTotals.collar_cost.subsidy_share)}</td>
                                            <td className="border border-gray-300 p-2 text-right font-semibold">{formatCurrencyRupees(animalInductionTotals.collar_cost.total)}</td>
                                            <td className="border border-gray-300 p-2 text-right">{formatCurrencyRupees(animalInductionTotals.premium_paid.beneficiary_share)}</td>
                                            <td className="border border-gray-300 p-2 text-right">{formatCurrencyRupees(animalInductionTotals.premium_paid.subsidy_share)}</td>
                                            <td className="border border-gray-300 p-2 text-right font-semibold">{formatCurrencyRupees(animalInductionTotals.premium_paid.total)}</td>
                                            <td className="border border-gray-300 p-2 text-right">{formatCurrencyRupees(animalInductionTotals.transportation_cost.beneficiary_share)}</td>
                                            <td className="border border-gray-300 p-2 text-right">{formatCurrencyRupees(animalInductionTotals.transportation_cost.subsidy_share)}</td>
                                            <td className="border border-gray-300 p-2 text-right font-semibold">{formatCurrencyRupees(animalInductionTotals.transportation_cost.total)}</td>
                                            <td className="border border-gray-300 p-2 text-right bg-green-50">{formatCurrencyRupees(animalInductionTotals.total_expenditure.benenficiary_share_total)}</td>
                                            <td className="border border-gray-300 p-2 text-right bg-green-50">{formatCurrencyRupees(animalInductionTotals.total_expenditure.subsidy_share_total)}</td>
                                            <td className="border border-gray-300 p-2 text-right font-semibold bg-green-50">{formatCurrencyRupees(animalInductionTotals.total_expenditure.total)}</td>
                                            <td className="border border-gray-300 p-2 text-right bg-green-50 font-semibold">{formatCurrencyRupees(animalInductionTotals.target.financial_target)}</td>
                                            <td className="border border-gray-300 p-2 text-right bg-green-50 font-semibold text-orange-600">{formatCurrencyRupees(animalInductionTotals.balance.financial_balance)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                )}

                {/* HGM MPR Section */}
                {hgmTotals && (
                    <Card className="relative overflow-hidden border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 hover:shadow-xl transition-all duration-300 group backdrop-blur-sm">
                        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110" />
                        <div
                            className="relative z-10 flex items-center justify-between p-4 cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors"
                            onClick={() => toggleSection('hgm')}
                        >
                            <div>
                                <CardTitle className="text-xl font-bold text-indigo-900 dark:text-indigo-100">HGM (Pregnant Cow) MPR - Total Summary</CardTitle>
                                <CardDescription className="text-indigo-700/80 dark:text-indigo-300 font-medium">Supply Of High Genetic Merit Pregnant Heifers (IVF/ETT)</CardDescription>
                            </div>
                            <ChevronDown
                                className={`w-5 h-5 text-gray-600 transition-transform flex-shrink-0 ml-2 ${
                                    expandedSections.has('hgm') ? 'rotate-180' : ''
                                }`}
                            />
                        </div>
                        {expandedSections.has('hgm') && (
                            <CardContent>
                                <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-300">
                                    <thead>
                                        <tr>
                                            <th colSpan={2} className="bg-blue-100 border border-gray-300 text-center font-bold p-2">
                                                Physical Achievement
                                            </th>
                                            <th colSpan={3} className="bg-green-100 border border-gray-300 text-center font-bold p-2">
                                                Financial Achievement
                                            </th>
                                        </tr>
                                        <tr>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">No. of Cow</th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">No. of Buffalo</th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">Beneficiary Share (Rs.)</th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">Subsidy (Rs.)</th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">Total (Rs.)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-gray-300 p-2 text-center">{hgmTotals.total_cows}</td>
                                            <td className="border border-gray-300 p-2 text-center">{hgmTotals.total_buffaloes}</td>
                                            <td className="border border-gray-300 p-2 text-right">{formatCurrencyRupees(hgmTotals.total_beneficiary_share)}</td>
                                            <td className="border border-gray-300 p-2 text-right">{formatCurrencyRupees(hgmTotals.total_subsidy)}</td>
                                            <td className="border border-gray-300 p-2 text-right font-semibold">{formatCurrencyRupees(hgmTotals.grand_total)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                )}

                {farmerTrainingData?.message && (
                    <Card className="relative overflow-hidden border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/5 hover:shadow-xl transition-all duration-300 group backdrop-blur-sm">
                        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110" />
                        <CardHeader className="relative z-10">
                            <CardTitle className="text-xl font-bold text-amber-900 dark:text-amber-100">Farmer Training - Target & Achievement Summary</CardTitle>
                            <CardDescription className="text-amber-700/80 dark:text-amber-300 font-medium">Training sessions completion status</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-300">
                                    <thead>
                                        <tr>
                                            <th colSpan={2} className="bg-blue-100 border border-gray-300 text-center font-bold p-2">
                                                Physical Achievement
                                            </th>
                                            <th colSpan={2} className="bg-green-100 border border-gray-300 text-center font-bold p-2">
                                                Financial Achievement
                                            </th>
                                            <th colSpan={2} className="bg-yellow-100 border border-gray-300 text-center font-bold p-2">
                                                Balance
                                            </th>
                                        </tr>
                                        <tr>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">Target</th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">Achieved</th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">Target (Rs.)</th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">Achieved (Rs.)</th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">Physical</th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">Financial (Rs.)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-gray-300 p-2 text-center">{farmerTrainingData.message.target_physical}</td>
                                            <td className="border border-gray-300 p-2 text-center font-semibold text-green-600">{farmerTrainingData.message.achieved_physical}</td>
                                            <td className="border border-gray-300 p-2 text-right">{formatCurrencyRupees(farmerTrainingData.message.target_financial)}</td>
                                            <td className="border border-gray-300 p-2 text-right font-semibold text-green-600">{formatCurrencyRupees(farmerTrainingData.message.achieved_financial)}</td>
                                            <td className="border border-gray-300 p-2 text-center bg-yellow-50 font-semibold">{farmerTrainingData.message.balance_physical}</td>
                                            <td className="border border-gray-300 p-2 text-right bg-yellow-50 font-semibold">{formatCurrencyRupees(farmerTrainingData.message.balance_financial)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {treatmentInfertileData?.message && (
                    <Card className="relative overflow-hidden border-2 border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-rose-600/5 hover:shadow-xl transition-all duration-300 group backdrop-blur-sm">
                        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-rose-500/20 to-rose-600/10 opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110" />
                        <CardHeader className="relative z-10">
                            <CardTitle className="text-xl font-bold text-rose-900 dark:text-rose-100">Treatment of Infertile Animal - Target & Achievement Summary</CardTitle>
                            <CardDescription className="text-rose-700/80 dark:text-rose-300 font-medium">Treatment applications completion status</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-300">
                                    <thead>
                                        <tr>
                                            <th colSpan={2} className="bg-blue-100 border border-gray-300 text-center font-bold p-2">
                                                Physical Achievement
                                            </th>
                                            <th colSpan={2} className="bg-green-100 border border-gray-300 text-center font-bold p-2">
                                                Financial Achievement
                                            </th>
                                            <th colSpan={2} className="bg-yellow-100 border border-gray-300 text-center font-bold p-2">
                                                Balance
                                            </th>
                                        </tr>
                                        <tr>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">Target</th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">Achieved</th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">Target (Rs.)</th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">Achieved (Rs.)</th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">Physical</th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-center text-sm font-medium">Financial (Rs.)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-gray-300 p-2 text-center">{treatmentInfertileData.message.target_physical}</td>
                                            <td className="border border-gray-300 p-2 text-center font-semibold text-green-600">{treatmentInfertileData.message.achieved_physical}</td>
                                            <td className="border border-gray-300 p-2 text-right">{formatCurrencyRupees(treatmentInfertileData.message.target_financial)}</td>
                                            <td className="border border-gray-300 p-2 text-right font-semibold text-green-600">{formatCurrencyRupees(treatmentInfertileData.message.achieved_financial)}</td>
                                            <td className="border border-gray-300 p-2 text-center bg-yellow-50 font-semibold">{treatmentInfertileData.message.balance_physical}</td>
                                            <td className="border border-gray-300 p-2 text-right bg-yellow-50 font-semibold">{formatCurrencyRupees(treatmentInfertileData.message.balance_financial)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
