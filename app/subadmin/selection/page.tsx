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

  // Map to lightweight selection items - expand each application by individual components
  const applications: ApplicationSelectionItem[] = [];
  
  (response?.message?.applications || []).forEach((app: any) => {
    const submittedDate = app.creation ? new Date(app.creation).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    
    if (Array.isArray(app.component_list) && app.component_list.length > 0) {
      // Create separate entries for each component
      app.component_list.forEach((component: string) => {
        applications.push({
          id: `${app.name}-${component}`, // Unique ID for each component entry
          applicantName: app.fullname,
          mobile: app.mobile_no || '',
          village: app.village || 'N/A',
          component: component.trim(),
          status: app.status as "Approved" | "Selected",
          submittedDate,
        });
      });
    } else {
      // Fallback for applications without component list
      applications.push({
        id: app.name,
        applicantName: app.fullname,
        mobile: app.mobile_no || '',
        village: app.village || 'N/A',
        component: 'N/A',
        status: app.status as "Approved" | "Selected",
        submittedDate,
      });
    }
  });

  return <SubAdminSelectionClient applications={applications} />;
}
