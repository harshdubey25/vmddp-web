"use client"

import { getComponentById } from "@/componentData/componentData";
import { notFound } from "next/navigation";
import Image from "next/image";
import { useTranslation } from "react-i18next";

export default function SchemeComponentPage({ params }: { params: { id: string } }) {
  const { t } = useTranslation('common');
  const componentId = Number(params.id);
  const component = getComponentById(componentId);

  if (!component) {
    return notFound();
  }

  return (
    <main className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="font-display text-3xl font-bold mb-4 text-primary">{t(`schemes.${component.id}.title`)}</h1>
      <div className="mb-6">
        <Image src={component.image} alt={t(`schemes.${component.id}.title`)} width={600} height={300} className="rounded-lg object-cover w-full h-64" />
      </div>
      <div className="mb-4">
        <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">{component.category}</span>
      </div>
      <p className="text-lg text-muted-foreground mb-6">{t(`schemes.${component.id}.fullDescription`)}</p>
      <section className="mb-8">
        <h2 className="font-semibold text-xl mb-2">{t('benefits')}</h2>
        <ul className="list-disc pl-6 space-y-1">
          {(t(`schemes.${component.id}.benefits`, { returnObjects: true }) as string[]).map((benefit: string, i: number) => (
            <li key={i}>{benefit}</li>
          ))}
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="font-semibold text-xl mb-2">{t('eligibility_criteria')}</h2>
        <ul className="list-disc pl-6 space-y-1">
          {(t(`schemes.${component.id}.eligibilityCriteria`, { returnObjects: true }) as string[]).map((criteria: string, i: number) => (
            <li key={i}>{criteria}</li>
          ))}
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="font-semibold text-xl mb-2">{t('subsidy_information')}</h2>
        <div className="bg-muted/10 p-4 rounded-lg">
          <p><strong>{t('amount')}:</strong> {(t(`schemes.${component.id}.subsidyInfo`, { returnObjects: true }) as any).amount}</p>
          {(t(`schemes.${component.id}.subsidyInfo`, { returnObjects: true }) as any).percentage && <p><strong>{t('percentage')}:</strong> {(t(`schemes.${component.id}.subsidyInfo`, { returnObjects: true }) as any).percentage}</p>}
          <p><strong>{t('details')}:</strong> {(t(`schemes.${component.id}.subsidyInfo`, { returnObjects: true }) as any).details}</p>
        </div>
      </section>
      {component.termsAndConditions && (
        <section className="mb-8">
          <h2 className="font-semibold text-xl mb-2">{t('terms_conditions')}</h2>
          <ul className="list-disc pl-6 space-y-1">
            {(t(`schemes.${component.id}.termsAndConditions`, { returnObjects: true }) as string[]).map((term: string, i: number) => (
              <li key={i}>{term}</li>
            ))}
          </ul>
        </section>
      )}
      <section className="mb-8">
        <h2 className="font-semibold text-xl mb-2">{t('required_documents')}</h2>
        <ul className="list-disc pl-6 space-y-1">
          {(t(`schemes.${component.id}.requiredDocuments`, { returnObjects: true }) as string[]).map((doc: string, i: number) => (
            <li key={i}>{doc}</li>
          ))}
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="font-semibold text-xl mb-2">{t('application_guidelines')}</h2>
        <ul className="list-disc pl-6 space-y-1">
          {(t(`schemes.${component.id}.applicationGuidelines`, { returnObjects: true }) as string[]).map((guide: string, i: number) => (
            <li key={i}>{guide}</li>
          ))}
        </ul>
      </section>
      {component.targetBeneficiaries && (
        <p className="mb-2"><strong>{t('target_beneficiaries')}:</strong> {t(`schemes.${component.id}.targetBeneficiaries`)}</p>
      )}
      {component.coverage && (
        <p className="mb-2"><strong>{t('coverage')}:</strong> {t(`schemes.${component.id}.coverage`)}</p>
      )}
    </main>
  );
} export const runtime = 'edge'
// import { notFound } from "next/navigation";
import { Milk, HeartPulse, Pill, Sprout, Sparkles, Scissors, Package, Stethoscope, GraduationCap } from "lucide-react";

const schemeDetails = [
  {
    id: 1,
    icon: Milk,
    title: "Distribution of High Milk Yielding Cows and Buffaloes",
    description:
      "Under the Vidarbha and Marathwada Dairy Development Project, a total of 13,400 high milk-yielding cows and buffaloes will be distributed over a period of three years in 19 districts of Vidarbha and Marathwada.",
    terms: [
      "Each beneficiary shall be provided with one cow or buffalo having a minimum daily milk production capacity of 8 to 10 litres during the project period.",
      "All distributed animals shall be mandatorily fitted with a Digital Tracking Cow Collar and Geo-tagged.",
      "The distributed cow/buffalo shall not be sold for a period of three years.",
      "The ownership of the distributed animal shall remain mortgaged in the name of the Project Director, Vidarbha and Marathwada Dairy Development Project.",
      "At the time of purchase, insurance coverage for three years for the distributed animal shall be mandatory.",
      "In case of death of an insured animal, the beneficiary shall be required to purchase another milch animal, as cash compensation will not be provided."
    ],
    eligibility: [
      "The farmer/livestock owner must possess at least two milch animals.",
      "The milk producer must have sold milk to a private or cooperative milk collection centre for a minimum of three months during the previous year.",
      "Farmers/livestock owners who have already availed benefits under any government scheme during the first phase of this project or in the past three years shall not be eligible for benefits under the second phase.",
      "Only one member per family shall be eligible.",
      "In a single village, a maximum of five beneficiaries shall be eligible."
    ],
    subsidy: [
      "Beneficiaries may procure animals either through the National Dairy Development Board (NDDB) or directly from the open market, ensuring the animals have high milk yield capacity.",
      "The average cost per animal is estimated at Rs. 1.00 lakh, which includes digital tagging, transportation, and three-year insurance.",
      "A subsidy of 50% of the cost or Rs. 50,000 (whichever is less) shall be provided to each beneficiary.",
      "The subsidy amount shall be credited via DBT (Direct Benefit Transfer) to the beneficiary’s bank account after submission of purchase proof and insurance documents, and after verification in the Bharat Pashudhan (Livestock) System by the concerned District Deputy Commissioner (Animal Husbandry).",
      "The District Deputy Commissioner (Animal Husbandry) shall maintain a detailed record of all purchased and distributed animals under the project."
    ]
  },
  {
    id: 2,
    icon: HeartPulse,
    title: "Distribution of Pregnant Heifers through Embryo Transfer (IVF) of High-Genetic Embryos",
    description:
      "Embryo transfer using In-Vitro Fertilization (IVF) technology will be implemented to produce high-genetic-quality offspring, thereby increasing the number of high-yielding cows and buffaloes in the future.",
    details: [
      "Pregnant heifers developed using IVF embryos will be purchased and distributed to farmers. Proper scientific management of these heifers will be mandatory.",
      "Reputed institutions such as MLDB, BAIF, Godrej Agrovet, and NDS will supply 7-month pregnant heifers developed through IVF.",
      "The average cost per heifer (including IVF process, maintenance, and pregnancy) is estimated at Rs. 1,45,000/-.",
      "A total of 1,000 beneficiaries will be covered under this component.",
      "Beneficiaries will receive a subsidy of 75% or Rs. 1,08,750/- (whichever is less) per IVF pregnant heifer."
    ],
    procedure: [
      "Agreement with recognized agencies/companies engaged in IVF embryo transfer.",
      "Upon payment of 25% beneficiary contribution, supply order issued to selected agency/company.",
      "Supplier delivers pregnant heifer to farmer within stipulated time.",
      "25% of total payment retained until post-delivery verification.",
      "Upon calving and verification, remaining payment released to supplier.",
      "Compensation provisions if calf is not of mentioned breed."
    ],
    eligibility: [
      "The milk producer should possess at least five milch animals.",
      "The farmer must have knowledge of scientific feeding practices (to be verified by project veterinary teams).",
      "The farmer should be willing to carry out breeding only through artificial insemination."
    ],
    instructions: [
      "Project Director maintains records of distributed and calved heifers, health monitoring, and corrective measures.",
      "District Deputy Commissioner maintains records of calves born through embryo transfer.",
      "Measures to ensure calves attain optimal body weight and are prepared for milking."
    ]
  },
  {
    id: 3,
    icon: Pill,
    title: "Supply of Fertility Feed to Improve Conception Rates",
    description:
      "NDDB has developed Fertility Feed to improve reproductive efficiency and reduce repeat breeding in cows and buffaloes.",
    details: [
      "Feed Quantity per Animal: 5 kg per day for 60 days.",
      "Cost: Rs. 9,600/- per animal (at Rs. 32 per kg).",
      "Subsidy: 25% subsidy.",
      "Payment Mode: DBT transfer after submission of purchase proof.",
      "Coverage: 1,00,000 animals."
    ]
  },
  {
    id: 4,
    icon: Sparkles,
    title: "Supply of Fat and SNF Enhancing Feed Supplements",
    description:
      "To improve Fat and SNF (Solids-Not-Fat) levels in milk, NDDB has developed supplements to be fed 250 grams per day per animal for 90 days after calving.",
    details: [
      "Cost: Rs. 4,500/- per animal (at Rs. 200/kg).",
      "Subsidy: 25% subsidy.",
      "Payment: Through DBT after proof submission.",
      "Coverage: 33,000 animals."
    ]
  },
  {
    id: 5,
    icon: Sprout,
    title: "Subsidy for Multi-Purpose Fodder Crop Cultivation",
    description:
      "To mitigate fodder scarcity during drought, quality fodder seeds and cuttings will be supplied for 22,000 acres in 19 districts.",
    details: [
      "Subsidy: 100% subsidy up to Rs. 6,000 per beneficiary.",
      "Eligibility: Must own at least 3–4 milch animals, minimum 1 acre of land with irrigation, and not have availed free fodder seed distribution under any district-level scheme.",
      "Beneficiaries: 22,000 farmers."
    ]
  },
  {
    id: 6,
    icon: Scissors,
    title: "Distribution of Electrically Operated Chaff Cutters",
    description:
      "To reduce wastage of green fodder and improve digestibility, 10,000 farmers will be provided with electric chaff cutters.",
    details: [
      "Estimated Cost per Unit: Rs. 30,000/-.",
      "Subsidy: 50% or Rs. 15,000 (whichever is less).",
      "Eligibility: Must own at least 3–4 milch animals, have electric connection, not availed similar benefit in past 5 years, must purchase ISI-marked chaff cutter with minimum 2 HP motor.",
      "Payment: Subsidy via DBT after submission of GST invoice."
    ]
  },
  {
    id: 7,
    icon: Package,
    title: "Supply of Silage",
    description:
      "During fodder shortage, silage (preserved green fodder) helps maintain continuous milk production. 5 kg of silage per day per animal for one month will be provided with subsidy.",
    details: [
      "Subsidy: Rs. 3 per kg.",
      "Beneficiaries: 33,000 farmers.",
      "Payment: DBT transfer after proof of purchase.",
      "Note: Farmers who have availed other district schemes will not be eligible."
    ]
  },
  {
    id: 8,
    icon: Stethoscope,
    title: "Infertility Treatment Programme for Cows and Buffaloes",
    description:
      "Infertility among cows and buffaloes is a major issue. 2,00,000 cows/buffaloes will receive hormonal therapy and traditional treatment.",
    details: [
      "Physical targets set for each district for.",
      "Treatments provided through veterinary dispensaries.",
      "Service fees as per government norms will apply.",
      "Records of treated animals and successful conceptions maintained by District Deputy Commissioners.",
      "Monthly reports submitted to Project Director."
    ]
  },
  {
    id: 9,
    icon: GraduationCap,
    title: "Training for Farmers in Modern Dairy Practices",
    description:
      "To enhance profitability in dairy farming, 36,000 farmers will receive two-day training on modern dairy management practices through recognized institutions.",
    details: [
      "Project Director prepares training schedule and coordinates with approved institutions for implementation."
    ]
  }
];

export function SchemeDetailPage({ params }: { params: { id: string } }) {
  const scheme = schemeDetails.find(s => s.id === Number(params.id));
  if (!scheme) return notFound();

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="flex items-center gap-4 mb-6">
        <scheme.icon className="w-10 h-10 text-primary" />
        <h1 className="font-display text-2xl font-bold">{scheme.title}</h1>
      </div>
      <p className="mb-6 text-muted-foreground">{scheme.description}</p>
      {scheme.terms && (
        <div className="mb-6">
          <h2 className="font-semibold text-lg mb-2">Terms and Conditions</h2>
          <ul className="list-disc pl-6 space-y-1">
            {scheme.terms.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      )}
      {scheme.eligibility && (
        <div className="mb-6">
          <h2 className="font-semibold text-lg mb-2">Eligibility Criteria</h2>
          <ul className="list-disc pl-6 space-y-1">
            {scheme.eligibility.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      )}
      {scheme.subsidy && (
        <div className="mb-6">
          <h2 className="font-semibold text-lg mb-2">Subsidy & Distribution</h2>
          <ul className="list-disc pl-6 space-y-1">
            {scheme.subsidy.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      )}
      {scheme.details && (
        <div className="mb-6">
          <h2 className="font-semibold text-lg mb-2">Details</h2>
          <ul className="list-disc pl-6 space-y-1">
            {scheme.details.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      )}
      {scheme.procedure && (
        <div className="mb-6">
          <h2 className="font-semibold text-lg mb-2">Distribution Procedure</h2>
          <ul className="list-disc pl-6 space-y-1">
            {scheme.procedure.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      )}
      {scheme.instructions && (
        <div className="mb-6">
          <h2 className="font-semibold text-lg mb-2">General Instructions</h2>
          <ul className="list-disc pl-6 space-y-1">
            {scheme.instructions.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
