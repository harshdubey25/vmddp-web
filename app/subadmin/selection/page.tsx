import { getFrappeWithUserToken } from "@/lib/frappeHelper";
import SubAdminSelectionClient from "./client";
export const runtime = 'edge';

interface ApplicationSelectionItem {
  id: string;
  realApplicationId: string;
  applicantName: string;
  mobile: string;
  village: string;
  component: string;
  status: "Approved" | "Selected";
  submittedDate: string;
}

export default async function SubAdminSelection({
  searchParams
}: {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
    search?: string;
    village?: string;
  }>
}) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '20');
  const status = params.status || 'all';
  const search = params.search || '';
  const village = params.village || '';

  const frappe = await getFrappeWithUserToken();

  // Fetch summary stats
  const statsResponse = await frappe.call().get('vmddp_app.api.v1.dashboard.subadmin_dashboard_data');
  const stats = {
    approved: statsResponse?.message?.approved_applications ?? 0,
    selected: statsResponse?.message?.selected_applications ?? 0,
    total: statsResponse?.message?.total_applications ?? 0
  };

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

  // Add village filter if provided
  if (village && village !== 'all') {
    apiParams.village = village;
  }

  const response = await frappe.call().get('vmddp_app.api.api.get_applications_summary', apiParams);

  const applications: ApplicationSelectionItem[] = (response?.message?.applications || []).map((app: any): ApplicationSelectionItem => {
    const component_list = Array.isArray(app.component_list) ? app.component_list.join(', ') : 'N/A';
    const submittedDate = app.created_at || app.date || new Date().toISOString().split('T')[0];

    return {
      id: app.name,
      realApplicationId: app.name,
      applicantName: app.fullname,
      mobile: app.mobile_number ?? app.mobile_no ?? '',
      village: app.village || 'N/A',
      component: component_list,
      status: app.status as "Approved" | "Selected",
      submittedDate,
    };
  });
  console.log('applications', applications);
  const pagination = response?.message?.pagination;

  return <SubAdminSelectionClient
    applications={applications}
    stats={stats}
    currentPage={page}
    pageSize={limit}
    initialFilters={{
      status: status || 'all',
      search: search || '',
      village: village || 'all',
    }}
    paginationData={pagination}
  />;
}
