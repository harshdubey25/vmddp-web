export interface DBTCompletedClaim {
    dbt_claim_id: string;
    app_form: string;
    component: string;
    invoice_number: string;
    invoice_upload: string | null;
    purchase_date: string;
    quantity: number;
    total_amount: number;
    subsidy_given: number;        
    type_of_animal: string;
    number_of_animals_benefitted: number;
    land_covered?: number;
    creation: string;
    application_id: string;
    first_name: string;
    mid_name: string;
    last_name: string;
    aadhar_number: string;
    district: string;
}