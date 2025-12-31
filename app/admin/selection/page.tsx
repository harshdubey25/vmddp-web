"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { frappeBrowser } from "@/lib/frappe";
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
