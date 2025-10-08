import BeneficiaryTable from '../BeneficiaryTable';

export default function BeneficiaryTableExample() {
  const mockData = [
    { district: "Nagpur", component: "Calved Cow", selected: 45, rejected: 5, inProgress: 12 },
    { district: "Amravati", component: "Pregnant Cow", selected: 38, rejected: 8, inProgress: 15 },
    { district: "Yavatmal", component: "Farm Equipment", selected: 52, rejected: 3, inProgress: 20 },
    { district: "Wardha", component: "Fodder Development", selected: 41, rejected: 6, inProgress: 18 },
  ];

  return (
    <div className="p-6">
      <BeneficiaryTable data={mockData} />
    </div>
  );
}
