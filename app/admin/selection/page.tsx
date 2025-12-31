"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { frappeBrowser } from "@/lib/frappe";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AdminSelectionClient from "./client";

interface ApplicationSelectionItem {
  id: string;
  realApplicationId: string;
  applicantName: string;
  mobile: string;
  village: string;
  district?: string;
  component: string;
  status: "Approved" | "Selected";
  submittedDate: string;
  aadharNumber?: string;
  taluka?: string;
  milkPouringPoint?: string;
  dairyAnimalData?: {
    [key: string]: any;
  };
}

export default function AdminSelection() {
  const searchParams = useSearchParams();

  const [applications, setApplications] = useState<ApplicationSelectionItem[]>([]);
  const [stats, setStats] = useState({ approved: 0, selected: 0, total: 0 });
  const [pagination, setPagination] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status') || 'all';
  const search = searchParams.get('search') || '';
  const district = searchParams.get('district') || '';
  const start_date = searchParams.get('start_date') || '';
  const end_date = searchParams.get('end_date') || '';

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch summary stats - using admin dashboard API
      const statsResponse = await frappeBrowser.call().get('vmddp_app.api.v1.dashboard.subadmin_dashboard_data');

      setStats({
        approved: statsResponse?.message?.approved_applications ?? 0,
        selected: statsResponse?.message?.selected_applications ?? 0,
        total: statsResponse?.message?.total_applications ?? 0
      });

      // Build API parameters
      const apiParams: any = {
        page: page.toString(),
        limit: limit.toString(),
      };

      // Apply status filter - default to showing both Approved and Selected
      if (status && status !== 'all') {
        apiParams.status = status.charAt(0).toUpperCase() + status.slice(1);
      } else {
        // When status is 'all', we want to show both Approved and Selected
        apiParams.status = '["Approved","Selected"]';
      }

      // Add search filter if provided
      if (search && search.trim()) {
        apiParams.search = search.trim();
      }

      // Add district filter if provided
      if (district && district !== 'all') {
        apiParams.district = district;
      }

      if (start_date) {
        apiParams.start_date = start_date;
      }

      if (end_date) {
        apiParams.end_date = end_date;
      }

      const response = await frappeBrowser.call().get('vmddp_app.api.api.get_applications_summary', apiParams);

      const mappedApplications: ApplicationSelectionItem[] = (response?.message?.applications || []).map((app: any): ApplicationSelectionItem => {
        const component_list = Array.isArray(app.component_list) ? app.component_list.join(', ') : 'N/A';
        const submittedDate = app.created_at || app.date || new Date().toISOString().split('T')[0];

        return {
          id: app.name,
          realApplicationId: app.name,
          applicantName: app.fullname,
          mobile: app.mobile_number ?? app.mobile_no ?? '',
          village: app.village || 'N/A',
          district: app.district || app.address_district || '',
          component: component_list,
          status: app.status as "Approved" | "Selected",
          submittedDate,
          aadharNumber: app.aadhar_number || '',
          taluka: app.taluka || '',
          milkPouringPoint: app.milk_pouring_point || '',
          dairyAnimalData: app.dairy_animal_data,
        };
      });

      console.log('applications', mappedApplications);
      setApplications(mappedApplications);
      setPagination(response?.message?.pagination);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, status, search, district, start_date, end_date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Skeleton */}
        <header className="flex h-14 sm:h-16 items-center justify-between border-b pl-12 pr-3 sm:pl-6 sm:pr-6 bg-background">
          <div>
            <Skeleton className="h-5 sm:h-6 w-48 mb-1" />
            <Skeleton className="h-3 sm:h-4 w-64 hidden sm:block" />
          </div>
          <Skeleton className="h-9 w-28" />
        </header>

        <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6 bg-muted/30">
          <div className="space-y-4 sm:space-y-6">
            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg" />
                    </div>
                    <div>
                      <Skeleton className="h-6 sm:h-7 lg:h-8 w-16 mb-1" />
                      <Skeleton className="h-3 sm:h-4 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Main Card Skeleton */}
            <Card>
              <CardHeader className="pb-4">
                {/* Filters Skeleton */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Skeleton className="h-10 flex-1" />
                    <div className="flex gap-2 flex-wrap">
                      <Skeleton className="h-10 w-[130px]" />
                      <Skeleton className="h-10 w-[130px]" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-10 w-[150px]" />
                    <Skeleton className="h-10 w-[150px]" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Table Header Skeleton */}
                <div className="hidden md:flex items-center gap-4 p-3 border-b bg-muted/50 rounded-t-lg">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32 flex-1" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                {/* Table Rows Skeleton */}
                <div className="space-y-0">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4 border-b"
                    >
                      <Skeleton className="h-4 w-4 hidden md:block" />
                      <Skeleton className="h-4 w-28" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-28 md:hidden" />
                      </div>
                      <Skeleton className="h-4 w-24 hidden md:block" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-4 w-24 hidden md:block" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ))}
                </div>
                {/* Pagination Skeleton */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <Skeleton className="h-4 w-40" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-9" />
                    <Skeleton className="h-9 w-9" />
                    <Skeleton className="h-9 w-9" />
                    <Skeleton className="h-9 w-9" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <AdminSelectionClient
      applications={applications}
      stats={stats}
      currentPage={page}
      pageSize={limit}
      initialFilters={{
        status: status || 'all',
        search: search || '',
        district: district || 'all',
        start_date: start_date || '',
        end_date: end_date || '',
      }}
      paginationData={pagination}
    />
  );
}
