

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