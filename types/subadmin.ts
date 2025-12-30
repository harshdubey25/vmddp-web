
export interface MedicineEntry {
  id: string;
  date: Date | undefined;
  medicineName: string;
  batchNumber: string;
  expiryDate: Date | undefined;
  price: string;
}

export interface TreatmentFormData {
  firstName: string;
  middleName: string;
  surname: string;
  district: string;
  taluka: string;
  village: string;
  animalType: string;
  tagNumber: string;
  examinationDate: Date | undefined;
  veterinarianName: string;
  symptoms: string[];
  customSymptom: string;
  suggestedTreatment: string;
  treatmentGiven: string;
  treatmentDate: Date | undefined;
  primaryTreatment: string;
  actualTreatment: string;
  treatmentDays: string;
  treatmentGap: string;
  followUpNotes: string;
  medicines: MedicineEntry[];
}

export interface FarmerTrainingFormData {
  eventName: string;
  eventDate: Date | undefined;
  district: string;
  taluka: string;
  village: string;
  trainingVenueType: string;
  venueName: string;
  numberOfParticipants: string;
  participantListImages: File[];
  trainingMaterial: string;
  logistics: string;
  refreshment: string;
  totalAmount: string;
}

export interface FormData {
  eventName: string;
  eventDate: Date | undefined;
  district: string;
  taluka: string;
  village: string;
  trainingVenueType: string;
  venueName: string;
  numberOfParticipants: string;
  participantListImages: File[];
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
