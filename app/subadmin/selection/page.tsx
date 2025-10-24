import { getFrappeWithUserToken } from "@/lib/frappeHelper";
import SubAdminSelectionClient from "./client";
export const runtime = 'edge';

// Lightweight interface for selection list view
interface ApplicationSelectionItem {
  id: string;
  applicantName: string;
  mobile: string;
  village: string;
  component: string;
  status: "Approved" | "Selected";
  submittedDate: string;
}

export default async function SubAdminSelection({ searchParams }: {
  searchParams: {
    district?: string;
    taluka?: string;
    village?: string;
    component?: string;
  }
}) {
  const frappe = await getFrappeWithUserToken();

  // Build filters object with OR condition for status
  const filters: Record<string, any> = {
    status: ['in', ['Approved', 'Selected']]
  };

  if (searchParams.district) filters.district = searchParams.district;
  if (searchParams.taluka) filters.taluka = searchParams.taluka;
  if (searchParams.village) filters.village = searchParams.village;
  if (searchParams.component) filters.component = searchParams.component;

  // Fetch applications with Approved or Selected status
  const response = await frappe.call().get('vmddp_app.api.api.get_applications_summary', {
    page: '1',
    limit: '1000', // Get all approved/selected for selection process
    filters: JSON.stringify(filters)
  });

  // Map to lightweight selection items
  const applications: ApplicationSelectionItem[] = (response?.message?.applications || []).map((app: any): ApplicationSelectionItem => {
    const component_list = Array.isArray(app.component_list) ? app.component_list.map((comp: any) => comp).join(', ') : 'N/A';
    const submittedDate = app.creation ? new Date(app.creation).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    return {
      id: app.name,
      applicantName: app.fullname,
      mobile: app.mobile_no || '',
      village: app.village || 'N/A',
      component: component_list,
      status: app.status as "Approved" | "Selected",
      submittedDate,
    };
  });

  return <SubAdminSelectionClient applications={applications} />;
}
