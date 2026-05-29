

export type { DBTCompletedClaim } from "./accountant";

export type Doctype = {
    name: string;
    owner: string;
    creation: string;
    modified: string;
    modified_by: string;
    docstatus: number;
    idx: number;
}

export type AppFormStatus = 'Pending' | 'Approved' | 'Selected' | 'Rejected';
export type ComponentStatus = 'Pending' | 'Approved' | 'Selected' | 'Rejected' | 'DD Completed' | 'Component Allocated';

export interface CriteriaCommonDetail extends Doctype {
    criteria: string;
    value?: string;
    type: 'checkbox' | 'Int' | 'file' | 'string';
    parent: string;
    parentfield: string;
    parenttype: string;
    doctype: 'Criteria Common Detail';
}

export interface ComponentList extends Doctype {
    component: string;
    component_status: ComponentStatus;
    for_component_allocation: number;
    dd?: string;
    parent: string;
    parentfield: string;
    parenttype: string;
    doctype: 'Component List';
}


export interface Component extends Doctype {
    unit: string;
    component_name: string;
    criteria_table: any[];
    questions: any[];
    or?: string;
    dont_show_in_website: number;
    name_in_local_language?: string;
    amount: number;
    send_selection_message: number;
    for_component_allocation: number;
    subsidy_percent: number;
    maximum_subsidy_amount: number;
    status: 'Active' | 'Inactive';
    amount_per_head: number;
    parantage_confirmation: number;
    max_quantity: number;
    rate_per_kg: number;
    multiple_claims_allowed: boolean;
}

export interface AppForm extends Doctype {
    first_name: string;
    mid_name: string;
    last_name: string;
    status: AppFormStatus;
    gender: string;
    category: string;
    mobile_no: string;
    aadhar_number: string;
    aadhar_image: string;
    number_of_members_in_ration_card: string;
    self_ration_card_image: string;
    district: string;
    taluka: string;
    village: string;
    account_holder_name: string;
    account_number: string;
    bank_name: string;
    ifsc_code: string;
    remarks: string;
    approver: string;
    rejection_message_sent: number;
    submission_message_sent: number;
    selection_message_sent: number;
    doctype: 'App Form';
    criteria: CriteriaCommonDetail[];
    components: ComponentList[];
}

export interface FrappeCustomApiResponse<T> {
    message: T;
}

export interface ApplicationDetails {
    name: string;
    first_name: string;
    last_name: string;
    mid_name: string;
    component_status: ComponentStatus;
    aadhar_number: string;
    component: string;
    component_name: string;
    amount: number;
    village: string;
    district: string;
    taluka: string;
    bank_name: string;
    account_number: string;
    ifsc_code: string;
    response?: Array<{
        question: string;
        type: string;
        options: string[] | null;
        value: string;
    }>;
}

export interface QuotaDetails {
    remaining_quantity: number;
    remaining_subsidy: number;
    used_quantity: number;
    used_amount: number;
    max_quantity: number;
    maximum_subsidy_amount: number;
    subsidy_percent: string;
    rate_per_kg: number;
}

export interface DBTClaim {
    name: string;
    dbt_claim_id: string;
    app_form: string;
    component: string;
    invoice_number: string;
    invoice_upload: string | null;
    purchase_date: string;
    quantity: number;
    total_amount: number;
    subsidy_given: string | null;
    type_of_animal: string | null;
    number_of_animals_benefitted: number;
    land_covered: number;
    fodder_seed_variety?: string;
    creation: string;
    application_id: string;
    first_name: string;
    mid_name: string | null;
    last_name: string;
    aadhar_number: string;
    district: string;
    docstatus: number;
    claim_source: string;
}

export interface PendingVendorPayment {
    component_allocation_id: string;
    type_of_animal: string;
    date_of_purchase: string;
    tag_number: string;
    selected_vendor: string;
    vendor_name: string;
    vendor_category: string;
    amount_to_pay: number;
    total_cost: number;
    application_id: string;
    first_name: string;
    mid_name: string;
    last_name: string;
    aadhar_number: string;
    district: string;
    taluka: string;
    village: string;
    component: string;
    component_name: string;
    is_hgm: number;
    beneficiary_name: string;
    vendor: string;
    // Category-specific cost fields (only one present per row)
    animal_cost?: number;
    collar_cost?: number;
    premium_paid?: number;
    transportation_cost?: number;
    collar_vendor?: string;
    insurance_vendor?: string;
    transportation_vendor?: string;
}

export interface PaginationData {
    total_items: number;
    total_pages: number;
    current_page: number;
    page_size: number;
    has_next_page: boolean;
    has_previous_page: boolean;
}

export interface PaginatedVendorPaymentResponse {
    data: PendingVendorPayment[];
    pagination: PaginationData;
}

export interface ParantageConfirmationEntry {
    parantage_confirmation_id?: string;
    calf_born?: string;
    calf_date_of_birth?: string;
    certficate?: string;
    certified_by_agency?: string;
    agency_name?: string;
    parantage_status?: string;
    reason?: string | null;
    application_id: string;
    first_name: string;
    mid_name: string;
    last_name: string;
    aadhar_number: string;
    district: string;
    taluka: string;
    village: string;
    vendor: string;
    vendor_name: string;
    component_allocation_id: string;
    component: string;
    type_of_animal: string;
    animal_cost: number;
    sum_assured: number;
    premium_paid: number;
    transportation_cost: number;
    is_paid?: number;
    paid_payment: number;
    pending_amount: number;
}
