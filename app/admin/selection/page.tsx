import { getFrappeWithUserToken } from "@/lib/frappeHelper";
import AdminSelectionClient from "./client";
export const runtime = 'edge';

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

export default async function AdminSelection({
  searchParams
}: {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
    search?: string;
    district?: string;
  }>
}) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '20');
  const status = params.status || 'all';
  const search = params.search || '';
  const district = params.district || '';

  const frappe = await getFrappeWithUserToken();

  // Fetch summary stats - using admin dashboard API
  const statsResponse = await frappe.call().get('vmddp_app.api.v1.dashboard.subadmin_dashboard_data');
  
  const stats = {
    approved: statsResponse?.message?. approved_applications ?? 0,
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

  // Add district filter if provided
  if (district && district !== 'all') {
    apiParams.district = district;
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
  console.log('applications', applications);
  const pagination = response?.message?.pagination;

  return <AdminSelectionClient
    applications={applications}
    stats={stats}
    currentPage={page}
    pageSize={limit}
    initialFilters={{
      status: status || 'all',
      search: search || '',
      district: district || 'all',
    }}
    paginationData={pagination}
  />;
}
