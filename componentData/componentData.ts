import {
  Milk,
  HeartPulse,
  Pill,
  Sparkles,
  Sprout,
  Scissors,
  Package,
  Stethoscope,
  GraduationCap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const image = {
  fertility_feed_bf4e2f3c: "/stock_images/fertility_feed.png",
  dairy_cow_grazing_in_bb297871: "/stock_images/animal_induction.png",
  pregnant_heifer_cow__33614af7: "/stock_images/hgm.jpg",
  animal_feed_suppleme_bd677c66:
    "/stock_images/animal_feed_suppleme_bd677c66.jpg",
  fodder_crops_green_c_2328b89f:
    "/stock_images/fodder_crops_green_c_2328b89f.jpg",
  chaff_cutter_machine_b258d8e0:
    "/stock_images/chaff_cutter_machine_b258d8e0.jpg",
  silage_storage_farm__cdce1e08: "/stock_images/silage.png",
  veterinary_treatment_358caf0f: "/stock_images/treatment.png",
  farmer_training_agri_442883c8: "/stock_images/farmer.png",
  fodder_seed_field_3_8c6f2f4b: "/stock_images/fodder_seed.png",
  snf_enhancer_feed_5_2f3e4c6d: "/stock_images/enhancer.png",
  supply_chaff_cutter: "/chaffcutter.jpg",
};

export type ComponentCategory =
  | "Animal Purchase"
  | "Nutrition & Feed"
  | "Equipment & Infrastructure"
  | "Services & Training";

export interface ComponentDetail {
  id: number;
  icon: LucideIcon;
  title: string;
  shortDescription: string;
  fullDescription: string;
  image: string;
  category: ComponentCategory;
  benefits: string[];
  eligibilityCriteria: string[];
  subsidyInfo: {
    amount: string;
    percentage?: string;
    details: string;
  };
  termsAndConditions?: string[];
  requiredDocuments: string[];
  applicationGuidelines: string[];
  targetBeneficiaries?: string;
  coverage?: string;
}

export const componentData: ComponentDetail[] = [
  {
    id: 1,
    icon: Milk,
    title: "Animal Induction (Calved Cow)",
    shortDescription:
      "Financial assistance for purchasing high-yielding calved indigenous or crossbred dairy cows",
    fullDescription:
      "Under the Vidarbha and Marathwada Dairy Development Project, 13,400 high milk-yielding cows and buffaloes will be distributed over three years across 19 districts. Each beneficiary receives one cow or buffalo with minimum 8-10 litres daily milk production capacity.",
    image: image.dairy_cow_grazing_in_bb297871,
    category: "Animal Purchase",
    benefits: [
      "50% subsidy up to ₹50,000 per animal",
      "High milk-yielding animals (8-10 litres/day minimum)",
      "Digital tracking cow collar and geo-tagging included",
      "3-year mandatory insurance coverage",
      "Direct Benefit Transfer (DBT) to bank account",
    ],
    eligibilityCriteria: [
      "Must possess at least 2 milch animals",
      "Must have sold milk to private/cooperative for minimum 3 months in previous year",
      "Not availed government scheme benefits in past 3 years",
      "Only one member per family eligible",
      "Maximum 5 beneficiaries per village",
    ],
    subsidyInfo: {
      amount: "₹50,000",
      percentage: "50%",
      details:
        "50% subsidy of cost or ₹50,000 (whichever is less). Average cost per animal: ₹1,00,000 including digital tagging, transportation, and insurance.",
    },
    termsAndConditions: [
      "Animal cannot be sold for 3 years",
      "Ownership mortgaged with Project Director during project period",
      "Mandatory digital tracking collar and geo-tagging",
      "3-year insurance coverage compulsory",
      "In case of death, beneficiary must purchase replacement animal (no cash compensation)",
    ],
    requiredDocuments: [
      "Aadhar Card",
      "Ration Card",
      "Bank Passbook",
      "Milk sale proof (3 months minimum)",
      "Animal health certificate",
      "Purchase proof and invoice",
      "Insurance documents",
    ],
    applicationGuidelines: [
      "Purchase animals from NDDB or open market with high milk yield capacity",
      "Submit purchase proof and insurance documents for DBT",
      "Verification required in Bharat Pashudhan (Livestock) System",
      "District Deputy Commissioner maintains detailed records",
    ],
    targetBeneficiaries: "13,400 farmers",
    coverage: "19 districts of Vidarbha and Marathwada",
  },
  {
    id: 2,
    icon: HeartPulse,
    title: "HGM (Pregnant Heifer)",
    shortDescription:
      "High Genetic Merit pregnant heifer support through IVF embryo transfer for enhanced dairy productivity",
    fullDescription:
      "Embryo transfer using In-Vitro Fertilization (IVF) technology produces high-genetic-quality offspring, increasing future high-yielding cows and buffaloes. Pregnant heifers developed using IVF embryos from reputed institutions like MLDB, BAIF, Godrej Agrovet, and NDS.",
    image: image.pregnant_heifer_cow__33614af7,
    category: "Animal Purchase",
    benefits: [
      "75% subsidy up to ₹1,08,750 per heifer",
      "High-genetic quality offspring through IVF",
      "7-month pregnant heifers from reputed institutions",
      "Parentage certificate provided",
      "Enhanced future milk production potential",
    ],
    eligibilityCriteria: [
      "Must possess at least 5 milch animals",
      "Must have knowledge of scientific feeding practices",
      "Willing to carry out breeding only through artificial insemination",
      "Verification by project veterinary teams",
    ],
    subsidyInfo: {
      amount: "₹1,08,750",
      percentage: "75%",
      details:
        "75% subsidy or ₹1,08,750 (whichever is less). Average cost per heifer: ₹1,45,000 including IVF process, maintenance, and pregnancy.",
    },
    termsAndConditions: [
      "25% beneficiary contribution required upfront",
      "25% payment retained until post-delivery verification",
      "Parentage certificate and breed verification mandatory",
      "Compensation provisions if calf not of mentioned breed",
    ],
    requiredDocuments: [
      "Aadhar Card",
      "Proof of owning 5+ milch animals",
      "Bank details for DBT",
      "Scientific feeding knowledge certificate",
    ],
    applicationGuidelines: [
      "Pay 25% contribution to District Deputy Commissioner",
      "Project Director issues supply order to selected agency",
      "Supplier delivers pregnant heifer within stipulated time",
      "Final 25% released after calving and breed verification",
    ],
    targetBeneficiaries: "1,000 farmers",
    coverage: "Project areas in Vidarbha and Marathwada",
  },
  {
    id: 3,
    icon: Pill,
    title: "Fertility Feed",
    shortDescription:
      "Specialized NDDB fertility feed to improve reproductive health and reduce repeat breeding",
    fullDescription:
      "NDDB-developed Fertility Feed improves reproductive efficiency and reduces repeat breeding in cows and buffaloes. Feeding 5 kg daily from 60th to 120th day post-calving enhances fertility, milk yield, and milk quality.",
    image: image.fertility_feed_bf4e2f3c,
    category: "Nutrition & Feed",
    benefits: [
      "25% subsidy on fertility feed",
      "Improves conception rates significantly",
      "Enhances milk yield and quality",
      "Reduces repeat breeding issues",
      "NDDB quality assurance",
    ],
    eligibilityCriteria: [
      "Must own milch animals",
      "Animals in 60-120 day post-calving period",
      "Not availed similar benefits recently",
    ],
    subsidyInfo: {
      amount: "25% subsidy",
      percentage: "25%",
      details:
        "Cost: ₹9,600 per animal (₹32 per kg × 300 kg for 60 days). 25% subsidy provided via DBT after purchase proof submission.",
    },
    requiredDocuments: [
      "Aadhar Card",
      "Animal ownership proof",
      "Purchase invoice/receipt",
      "Bank account details",
    ],
    applicationGuidelines: [
      "Feed 5 kg per day for 60 days (60th to 120th day post-calving)",
      "Purchase from authorized NDDB dealers",
      "Submit purchase proof for DBT subsidy",
      "Maintain feeding records",
    ],
    targetBeneficiaries: "1,00,000 animals",
    coverage: "All project districts",
  },
  {
    id: 4,
    icon: Sprout,
    title: "Fodder Seed",
    shortDescription:
      "Quality fodder seed distribution for year-round feed availability and drought mitigation",
    fullDescription:
      "To mitigate fodder scarcity during drought, quality fodder seeds and cuttings provided for cultivation on 22,000 acres across 19 districts. 100% subsidy support for multi-purpose fodder crop cultivation.",
    image: image.fodder_seed_field_3_8c6f2f4b,
    category: "Nutrition & Feed",
    benefits: [
      "100% subsidy up to ₹6,000 per beneficiary",
      "Quality fodder seeds and cuttings",
      "Year-round feed availability",
      "Drought mitigation support",
      "Multi-purpose crop varieties",
    ],
    eligibilityCriteria: [
      "Must own at least 3-4 milch animals",
      "Minimum 1 acre land with irrigation facility",
      "Should not have availed free fodder seed under district schemes",
    ],
    subsidyInfo: {
      amount: "₹6,000",
      percentage: "100%",
      details:
        "100% subsidy up to ₹6,000 per beneficiary for quality fodder seeds and cuttings.",
    },
    requiredDocuments: [
      "Aadhar Card",
      "Land ownership documents (7/12)",
      "Proof of irrigation facility",
      "Animal ownership certificate",
    ],
    applicationGuidelines: [
      "Apply for 1 acre minimum cultivation",
      "Ensure irrigation facility available",
      "Receive seeds/cuttings from department",
      "Follow cultivation guidelines provided",
    ],
    targetBeneficiaries: "22,000 farmers",
    coverage: "22,000 acres across 19 districts",
  },
  {
    id: 5,
    icon: Sparkles,
    title: "SNF Enhancer",
    shortDescription:
      "NDDB supplements to improve Fat and SNF levels in milk for better pricing",
    fullDescription:
      "Specially developed supplements to improve Fat and SNF (Solids-Not-Fat) levels in milk, which determine acceptance and pricing at milk collection centres. Feed 250 grams per day per animal for 90 days after calving.",
    image: image.snf_enhancer_feed_5_2f3e4c6d,
    category: "Nutrition & Feed",
    benefits: [
      "25% subsidy on SNF enhancer feed",
      "Improves milk Fat and SNF content",
      "Better price realization at collection centres",
      "Enhanced milk quality and acceptance",
      "90-day supplementation program",
    ],
    eligibilityCriteria: [
      "Must own milch animals",
      "Animals in post-calving period",
      "Regular milk supplier to collection centres",
    ],
    subsidyInfo: {
      amount: "25% subsidy",
      percentage: "25%",
      details:
        "Cost: ₹4,500 per animal (₹200/kg × 22.5 kg for 90 days). 25% subsidy via DBT after purchase proof.",
    },
    requiredDocuments: [
      "Aadhar Card",
      "Milk collection centre registration",
      "Purchase invoice",
      "Bank account details",
    ],
    applicationGuidelines: [
      "Feed 250 grams per day for 90 days after calving",
      "Purchase from authorized NDDB suppliers",
      "Submit purchase proof for subsidy",
      "Monitor milk quality improvements",
    ],
    targetBeneficiaries: "33,000 animals",
    coverage: "All project areas",
  },
  {
    id: 6,
    icon: Scissors,
    title: "Supply Chaff Cutter",
    shortDescription:
      "Electrically operated chaff cutting machines to reduce fodder wastage and improve digestibility",
    fullDescription:
      "Distribution of 10,000 electric chaff cutters to reduce wastage of green fodder and improve digestibility. Mechanized equipment makes fodder processing efficient and reduces labor requirements.",
    image: image.supply_chaff_cutter,
    category: "Equipment & Infrastructure",
    benefits: [
      "50% subsidy up to ₹15,000 per unit",
      "Reduces green fodder wastage",
      "Improves fodder digestibility",
      "Saves labor and time",
      "ISI-marked quality equipment",
    ],
    eligibilityCriteria: [
      "Must own at least 3-4 milch animals",
      "Must have electric connection at own cost",
      "Should not have availed similar benefit in past 5 years",
      "Must purchase ISI-marked chaff cutter with minimum 2 HP motor",
    ],
    subsidyInfo: {
      amount: "₹15,000",
      percentage: "50%",
      details:
        "50% subsidy or ₹15,000 (whichever is less). Estimated cost per unit: ₹30,000. Subsidy via DBT after GST invoice submission.",
    },
    requiredDocuments: [
      "Aadhar Card",
      "Electric connection proof",
      "GST invoice of chaff cutter purchase",
      "ISI certification of equipment",
      "Bank account details",
    ],
    applicationGuidelines: [
      "Purchase ISI-marked chaff cutter (minimum 2 HP motor)",
      "Ensure electric connection available",
      "Submit GST invoice for subsidy claim",
      "Receive subsidy via DBT",
    ],
    targetBeneficiaries: "10,000 farmers",
    coverage: "All project districts",
  },
  {
    id: 7,
    icon: Package,
    title: "Supply Of Silage",
    shortDescription:
      "Preserved green fodder supply during scarcity to maintain continuous milk production",
    fullDescription:
      "During fodder shortage periods, silage (preserved green fodder) helps maintain continuous milk production. Project provides 5 kg silage per day per animal for one month with subsidy support.",
    image: image.silage_storage_farm__cdce1e08,
    category: "Equipment & Infrastructure",
    benefits: [
      "₹3 per kg subsidy on silage",
      "Ensures fodder during scarcity",
      "Maintains milk production continuity",
      "Nutritional quality assurance",
      "One month supply support",
    ],
    eligibilityCriteria: [
      "Must own milch animals",
      "Facing fodder shortage situation",
      "Not availed other district fodder schemes",
    ],
    subsidyInfo: {
      amount: "₹3 per kg",
      percentage: "Subsidy per kg",
      details:
        "₹3 per kg subsidy on silage. Supply of 5 kg per day per animal for one month. DBT transfer after purchase proof.",
    },
    requiredDocuments: [
      "Aadhar Card",
      "Animal ownership proof",
      "Silage purchase receipt",
      "Bank account details",
    ],
    applicationGuidelines: [
      "Purchase silage from authorized suppliers",
      "Feed 5 kg per animal daily for one month",
      "Submit purchase proof for subsidy",
      "Receive DBT transfer",
    ],
    targetBeneficiaries: "33,000 farmers",
    coverage: "Fodder scarcity affected areas",
  },
  {
    id: 8,
    icon: Stethoscope,
    title: "Treatment of Infertile Animal",
    shortDescription:
      "Comprehensive veterinary treatment program to restore productivity in infertile animals",
    fullDescription:
      "Based on 20th Livestock Census (2019), 30% of 35.62 lakh breedable cows and buffaloes in 19 districts face temporary infertility. Treatment provided through hormonal therapy and traditional methods at veterinary dispensaries.",
    image: image.veterinary_treatment_358caf0f,
    category: "Services & Training",
    benefits: [
      "Free hormonal therapy treatment",
      "Traditional treatment methods",
      "Veterinary dispensary services",
      "Government standard service fees",
      "Follow-up and monitoring",
    ],
    eligibilityCriteria: [
      "Must own infertile cow/buffalo",
      "Animal should be breedable age",
      "Registered with veterinary services",
    ],
    subsidyInfo: {
      amount: "As per govt. norms",
      details:
        "Service fees as per government norms. Treatment through veterinary dispensaries. Detailed records of treated animals and successful conceptions maintained.",
    },
    requiredDocuments: [
      "Animal ownership proof",
      "Veterinary registration",
      "Treatment history if any",
      "Identification documents",
    ],
    applicationGuidelines: [
      "Visit designated veterinary dispensary",
      "Register for treatment program",
      "Receive hormonal/traditional therapy",
      "Follow-up visits as prescribed",
      "Monthly reports submitted to Project Director",
    ],
    targetBeneficiaries: "2,00,000 animals",
    coverage: "All 19 project districts over 3 years",
  },
  {
    id: 9,
    icon: GraduationCap,
    title: "Farmer Training",
    shortDescription:
      "Two-day training programs on modern dairy management practices and best techniques",
    fullDescription:
      "Comprehensive capacity building programs for 36,000 farmers on modern dairy management, animal health, and best practices through recognized institutions like State Animal Husbandry Department, Veterinary Universities, and Krishi Vigyan Kendras (KVKs).",
    image: image.farmer_training_agri_442883c8,
    category: "Services & Training",
    benefits: [
      "Free two-day training sessions",
      "Modern dairy management techniques",
      "Animal health and welfare practices",
      "Hands-on practical demonstrations",
      "Certification and resource materials",
    ],
    eligibilityCriteria: [
      "Dairy farmer from project areas",
      "Willing to attend 2-day training",
      "Committed to implementing learnings",
    ],
    subsidyInfo: {
      amount: "Free training",
      details:
        "Completely free training programs organized through recognized institutions. No fees charged from participating farmers.",
    },
    requiredDocuments: [
      "Aadhar Card",
      "Proof of dairy farming",
      "Registration form",
    ],
    applicationGuidelines: [
      "Register through district offices",
      "Attend scheduled 2-day training",
      "Participate in practical demonstrations",
      "Receive certification and materials",
      "Implement modern practices learned",
    ],
    targetBeneficiaries: "36,000 farmers",
    coverage: "All project areas through recognized training institutions",
  },
];

// Helper function to get component by ID
export const getComponentById = (id: number): ComponentDetail | undefined => {
  return componentData.find((component) => component.id === id);
};

// Helper function to get all active components
export const getAllComponents = (): ComponentDetail[] => {
  return componentData;
};

// Helper function to get category translation key
export const getCategoryTranslationKey = (
  category: ComponentCategory
): string => {
  const categoryMap: Record<ComponentCategory, string> = {
    "Animal Purchase": "category_animal_purchase",
    "Nutrition & Feed": "category_nutrition_feed",
    "Equipment & Infrastructure": "category_equipment_infrastructure",
    "Services & Training": "category_services_training",
  };
  return categoryMap[category];
};
