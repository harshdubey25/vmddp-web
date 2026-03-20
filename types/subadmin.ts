
export interface MedicineEntry {
    unit:string;
    id: string;
    date: Date | undefined;
    medicineName: string;
    dose: string;
    schedule: string;
    routeOfAdministration: string;
    batchNumber: string;
    expiryDate: Date | undefined;
    price: string;
}

export interface TreatmentFormData {
    firstName: string;
    middleName: string;
    surname: string;
    aadharNumber: string;
    district: string;
    taluka: string;
    village: string;
    animalType: string;
    tagNumber: string;
    examinationDate: Date | undefined;
    veterinarianName: string;
    symptoms: string[];
    suggestedTreatment: string;
    treatmentGiven: string;
    treatmentDate: Date | undefined;
    primaryTreatment: string;
    actualTreatment: string;
    followUpNotes: string;
    medicines: MedicineEntry[];
    galleryImages: File[];
}

export interface FarmerTrainingFormData {
    eventName: string;
    eventDate: Date | undefined;
    district: string;
    taluka: string;
    village: string;
    venueType: string;
    venueName: string;
    numberOfParticipants: string;
    participantListImages: File[];
    numberOfMale: string;
    numberOfFemale: string;
    galleryImages: File[];
    trainingMaterial: string;
    logistics: string;
    refreshment: string;
    totalAmount: string;
}

export const PREDEFINED_SYMPTOMS = [
    "Anestrus",
    "Repeat Breeding",
    "Silent Heat",
    "Delayed Puberty",
    "Ovarian Cyst",
    "Uterine Infection",
    "Hormonal Imbalance",
    "Poor Body Condition",
    "Nutritional Deficiency",
] as const;

export const PREDEFINED_TREATMENTS = [
    "Hormonal Therapy (GnRH/PGF2α)",
    "Mineral Mixture Supplementation",
    "Antibiotic Treatment",
] as const;

export const PREDEFINED_MEDICINES = [
    "GnRH Injection",
    "Prostaglandin F2α",
    "Progesterone CIDR",
    "Vitamin E + Selenium",
    "Mineral Mixture",
    "Oxytetracycline",
    "Enrofloxacin",
] as const;

export const PREDEFINED_OBSERVATIONS = [
    "Animal responded well",
    "Requires follow-up treatment",
    "Heat signs observed",
    "No improvement",
    "Referred for advanced treatment",
] as const;

export const TRAINING_VENUE_OPTIONS = [
    "govt. institute",
    "private Farms",
    "progressive farmers",
] as const;

export const EXPENSE_PER_HEAD = 360;
export const MAX_TRAINING_IMAGES = 5;

export interface TargetData {
    physical: number;
    achieved: number;
}

export interface Application {
    name: string;
    event_name: string;
    event_date: string;
    district: string;
    taluka: string;
    village: string;
    venue_name: string;
    venue_type: string;
    number_of_participants: number;
    no_of_male: number;
    no_of_female: number;
    training_material: number;
    logistics: number;
    refreshment: number;
    total_budget: number;
    docstatus: number;
    creation: string;
}

export interface TreatmentDoc {
    name: string;
    first_name: string;
    middle_name?: string;
    surname: string;
    aadhar_number?: string;
    district: string;
    taluka: string;
    village: string;
    animal_type: string;
    tag_number: string;
    examination_date?: string;
    veterinarian_name?: string;
    treatment_date?: string;
    suggested_treatment?: string;
    treatment_given?: string;
    primary_treatment?: string;
    actual_treatment_outcome?: string;
    docstatus: number;
    creation: string;
    modified: string;
}

