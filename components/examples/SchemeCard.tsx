import SchemeCard from '../SchemeCard';
import { Milk } from 'lucide-react';

export default function SchemeCardExample() {
  return (
    <div className="p-6 max-w-sm">
      <SchemeCard
        icon={Milk}
        title="Calved Cow Component"
        description="Support for dairy farmers with recently calved cows"
        benefits={[
          "Financial assistance for purchasing calved cows",
          "Veterinary support and consultation",
          "Milk procurement linkage"
        ]}
        componentId={1}
      />
    </div>
  );
}
