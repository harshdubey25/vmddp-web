

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
    multiple_claims_allowed:boolean;
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
    creation: string;
    app_form: string;
    component: string;
    invoice_number: string;
    invoice_upload: string | null;
    purchase_date: string;
    quantity: number;
    total_amount: number;
    land_covered: number | null;
    subsidy_given: string | null;
    docstatus: number;
}

export interface PendingVendorPayment {
    component_allocation_id: string;
    type_of_animal: string;
    animal_cost: number;
    collar_cost: number;
    premium_paid: number;
    transportation_cost: number;
    vendor: string;
    date_of_purchase: string;
    tag_number: string;
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
    vendor_name: string;
    total_cost: number;
    beneficiary_name: string;
}