// Server component for admin applications page
import AdminApplicationsClient from "./AdminApplicationsClient";

export interface Application {
    id: string;
    applicantName: string;
    fatherName: string;
    mobile: string;
    district: string;
    taluka: string;
    village: string;
    component: string;
    status: "pending" | "approved" | "rejected";
    submittedDate: string;
    animalCount?: number;
    approver?: string;
    gender: string;
    caste: string;
    aadharNumber: string;
    rationCardMembers: number;
    familyAadharNumbers: string[];
    animalTagNumber?: string;
    landHolding: number;
    khasraNumber: string;
    milkPouringPoint: string;
    farmerPourerCode: string;
    componentDetails: {
        benefits: string[];
        customQuestions: { label: string; answer: string }[];
    };
    documents: {
        name: string;
        uploaded: boolean;
        url?: string;
    }[];
}

const applications: Application[] = [
    {
        id: "APP-2025-001247",
        applicantName: "Ramesh Kumar Patil",
        fatherName: "Vishwanath Patil",
        mobile: "9876543210",
        district: "Nagpur",
        taluka: "Nagpur Rural",
        village: "Khapa",
        component: "Animal Induction (Calved Cow)",
        status: "pending",
        submittedDate: "2025-01-06",
        animalCount: 2,
        gender: "Male",
        caste: "OBC",
        aadharNumber: "1234-5678-9012",
        rationCardMembers: 4,
        familyAadharNumbers: ["2345-6789-0123", "3456-7890-1234", "4567-8901-2345"],
        animalTagNumber: "MH31A2345",
        landHolding: 2.5,
        khasraNumber: "123/4",
        milkPouringPoint: "Khapa Dairy Center",
        farmerPourerCode: "KDC-2345",
        componentDetails: {
            benefits: ["50% subsidy up to ₹30,000", "Quality breeding stock", "Veterinary support for 6 months"],
            customQuestions: [
                { label: "Select Breed Type", answer: "Cross Breed Cow" },
                { label: "Animal Tag Number", answer: "MH31A2345" }
            ]
        },
        documents: [
            { name: "Aadhar Card", uploaded: true, url: "https://example.com/documents/aadhar-1234.pdf" },
            { name: "Ration Card", uploaded: true, url: "https://example.com/documents/ration-1234.pdf" },
            { name: "Milk Procurement Certificate", uploaded: true, url: "https://example.com/documents/milk-cert-1234.pdf" }
        ]
    },
    {
        id: "APP-2025-001246",
        applicantName: "Sushila Devi Sharma",
        fatherName: "Raghunath Sharma",
        mobile: "9876543211",
        district: "Amravati",
        taluka: "Morshi",
        village: "Warud",
        component: "HGM Purchase",
        status: "approved",
        submittedDate: "2025-01-06",
        animalCount: 3,
        approver: "Dr. Suresh Deshmukh",
        gender: "Female",
        caste: "SC",
        aadharNumber: "2345-6789-0123",
        rationCardMembers: 5,
        familyAadharNumbers: ["3456-7890-1234", "4567-8901-2345", "5678-9012-3456", "6789-0123-4567"],
        animalTagNumber: "MH20B3456",
        landHolding: 1.5,
        khasraNumber: "234/5",
        milkPouringPoint: "Warud Milk Collection",
        farmerPourerCode: "WMC-3456",
        componentDetails: {
            benefits: ["Subsidy of ₹25,000 for HGM purchase", "Training on HGM usage"],
            customQuestions: [
                { label: "Type of Green Fodder", answer: "Maize" },
                { label: "Area for Cultivation (acres)", answer: "2" }
            ]
        },
        documents: [
            { name: "Aadhar Card", uploaded: true, url: "https://example.com/documents/aadhar-1234.pdf" },
            { name: "Ration Card", uploaded: true, url: "https://example.com/documents/ration-1234.pdf" },
            { name: "Milk Procurement Certificate", uploaded: true, url: "https://example.com/documents/milk-cert-1234.pdf" }
        ]
    },
    {
        id: "APP-2025-001245",
        applicantName: "Ganesh Rao Deshmukh",
        fatherName: "Shankar Deshmukh",
        mobile: "9876543212",
        district: "Akola",
        taluka: "Akot",
        village: "Murtizapur",
        component: "Fertility Feed",
        status: "pending",
        submittedDate: "2025-01-05",
        animalCount: 1,
        gender: "Male",
        caste: "General",
        aadharNumber: "3456-7890-1234",
        rationCardMembers: 3,
        familyAadharNumbers: ["4567-8901-2345", "5678-9012-3456"],
        animalTagNumber: "MH44C5678",
        landHolding: 3.0,
        khasraNumber: "345/6",
        milkPouringPoint: "Murtizapur Dairy",
        farmerPourerCode: "MD-5678",
        componentDetails: {
            benefits: ["Free fertility feed for 3 months", "Veterinary consultation"],
            customQuestions: [
                { label: "Animal Type", answer: "Buffalo" },
                { label: "Current Milk Yield (liters/day)", answer: "8" }
            ]
        },
        documents: [
            { name: "Aadhar Card", uploaded: true, url: "https://example.com/documents/aadhar-1234.pdf" },
            { name: "Ration Card", uploaded: true, url: "https://example.com/documents/ration-1234.pdf" },
            { name: "Milk Procurement Certificate", uploaded: true, url: "https://example.com/documents/milk-cert-1234.pdf" }
        ]
    },
    {
        id: "APP-2025-001244",
        applicantName: "Vandana Kale",
        fatherName: "Prakash Kale",
        mobile: "9876543213",
        district: "Yavatmal",
        taluka: "Pusad",
        village: "Digras",
        component: "Supply Chaff Cutter",
        status: "approved",
        submittedDate: "2025-01-05",
        approver: "Mrs. Anjali Patil",
        gender: "Female",
        caste: "OBC",
        aadharNumber: "4567-8901-2345",
        rationCardMembers: 4,
        familyAadharNumbers: ["5678-9012-3456", "6789-0123-4567", "7890-1234-5678"],
        landHolding: 1.0,
        khasraNumber: "456/7",
        milkPouringPoint: "Digras Collection Center",
        farmerPourerCode: "DCC-6789",
        componentDetails: {
            benefits: ["75% subsidy on chaff cutter", "Free installation"],
            customQuestions: [
                { label: "Chaff Cutter Type", answer: "Manual" },
                { label: "Daily Fodder Requirement (kg)", answer: "50" }
            ]
        },
        documents: [
            { name: "Aadhar Card", uploaded: true, url: "https://example.com/documents/aadhar-1234.pdf" },
            { name: "Ration Card", uploaded: true, url: "https://example.com/documents/ration-1234.pdf" },
            { name: "Milk Procurement Certificate", uploaded: true, url: "https://example.com/documents/milk-cert-1234.pdf" }
        ]
    },
    {
        id: "APP-2025-001243",
        applicantName: "Suresh Bhalerao",
        fatherName: "Dattatray Bhalerao",
        mobile: "9876543214",
        district: "Wardha",
        taluka: "Hinganghat",
        village: "Deoli",
        component: "SNF Enhancer",
        status: "rejected",
        submittedDate: "2025-01-04",
        animalCount: 2,
        approver: "Dr. Rajesh Kulkarni",
        gender: "Male",
        caste: "ST",
        aadharNumber: "5678-9012-3456",
        rationCardMembers: 6,
        familyAadharNumbers: ["6789-0123-4567", "7890-1234-5678", "8901-2345-6789", "9012-3456-7890", "0123-4567-8901"],
        animalTagNumber: "MH39D7890",
        landHolding: 0.5,
        khasraNumber: "567/8",
        milkPouringPoint: "Deoli Milk Point",
        farmerPourerCode: "DMP-7890",
        componentDetails: {
            benefits: ["SNF enhancer supply for 6 months", "Milk quality improvement training"],
            customQuestions: [
                { label: "Current SNF Level (%)", answer: "7.5" },
                { label: "Target SNF Level (%)", answer: "8.5" }
            ]
        },
        documents: [
            { name: "Aadhar Card", uploaded: true, url: "https://example.com/documents/aadhar-1234.pdf" },
            { name: "Ration Card", uploaded: true, url: "https://example.com/documents/ration-1234.pdf" },
            { name: "Milk Procurement Certificate", uploaded: true, url: "https://example.com/documents/milk-cert-1234.pdf" }
        ]
    }
];

export default function AdminApplicationsServer() {
    return <AdminApplicationsClient applications={applications} />;
}
