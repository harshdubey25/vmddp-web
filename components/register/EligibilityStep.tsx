import { Controller, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  control: any;
  errors: any;
}

const EligibilityStep = ({ control, errors }: Props) => {
  const dairyAnimalCount = useWatch({ control, name: "dairyAnimalCount" }) || 1;
  const count = Math.max(1, parseInt(dairyAnimalCount) || 1);

  return (
    <div className="space-y-6">
      <h2 className="font-display font-semibold text-xl mb-4">Eligibility Details</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dairyAnimalCount">Dairy Animal Count *</Label>
          <Controller name="dairyAnimalCount" control={control} rules={{ required: "Dairy Animal Count is required", min: { value: 1, message: "At least 1 required" } }} render={({ field }) => <Input {...field} id="dairyAnimalCount" type="number" min="1" data-testid="input-dairy-animal-count" />} />
          {errors.dairyAnimalCount && <span className="text-red-500 text-xs">{errors.dairyAnimalCount.message}</span>}
        </div>
        <div className="space-y-2">
          <Label>Registered Dairy Animal Tag No. *</Label>
          {/* Render array of tag number inputs */}
          {Array.from({ length: count }).map((_, idx) => (
            <Controller
              key={idx}
              name={`animalTagNumbers.${idx}`}
              control={control}
              rules={{ required: `Tag Number ${idx + 1} is required` }}
              render={({ field }) => (
                <Input
                  {...field}
                  id={`animalTagNumber-${idx}`}
                  data-testid={`input-animal-tag-number-${idx}`}
                  placeholder={`Tag Number ${idx + 1}`}
                  className="mb-2"
                />
              )}
            />
          ))}
          {/* Show error for any tag number */}
          {errors.animalTagNumbers && Array.isArray(errors.animalTagNumbers) && errors.animalTagNumbers.map((err: any, idx: number) => err && <span key={idx} className="text-red-500 text-xs">{err.message}</span>)}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="milkCertificate">Milk Procurement Certificate *</Label>
        <Controller
          name="milkCertificate"
          control={control}
          rules={{ required: "Milk Certificate is required" }}
          render={({ field }) => (
            <Input
              id="milkCertificate"
              type="file"
              accept="image/*"
              multiple
              data-testid="input-milk-certificate"
              onChange={e => field.onChange(e.target.files)}
            />
          )}
        />
        {errors.milkCertificate && <span className="text-red-500 text-xs">{errors.milkCertificate.message}</span>}
        <p className="text-sm text-muted-foreground">Upload image(s) of your Milk Procurement Certificate</p>
      </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="landHolding">Land Holding *</Label>
        <Controller name="landHolding" control={control} rules={{ required: "Land Holding is required" }} render={({ field }) => <Input {...field} id="landHolding" type="number" step="0.01" data-testid="input-land-holding" placeholder="In acres" />} />
        {errors.landHolding && <span className="text-red-500 text-xs">{errors.landHolding.message}</span>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="khasraNumber">Khasra Number *</Label>
        <Controller name="khasraNumber" control={control} rules={{ required: "Khasra Number is required" }} render={({ field }) => <Input {...field} id="khasraNumber" data-testid="input-khasra-number" />} />
        {errors.khasraNumber && <span className="text-red-500 text-xs">{errors.khasraNumber.message}</span>}
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="milkPouringPoint">Name of Milk Pouring Point *</Label>
        <Controller name="milkPouringPoint" control={control} rules={{ required: "Milk Pouring Point is required" }} render={({ field }) => <Input {...field} id="milkPouringPoint" data-testid="input-milk-pouring-point" />} />
        {errors.milkPouringPoint && <span className="text-red-500 text-xs">{errors.milkPouringPoint.message}</span>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="farmerPourerCode">Farmer Pourer Code *</Label>
        <Controller name="farmerPourerCode" control={control} rules={{ required: "Farmer Pourer Code is required" }} render={({ field }) => <Input {...field} id="farmerPourerCode" data-testid="input-farmer-pourer-code" />} />
        {errors.farmerPourerCode && <span className="text-red-500 text-xs">{errors.farmerPourerCode.message}</span>}
      </div>
    </div>
    <div className="flex items-start gap-3 p-4 border rounded-lg">
      <Controller name="schemeVerification" control={control} rules={{ required: "Scheme verification required" }} render={({ field }) => (
        <Checkbox id="schemeVerification" checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-scheme-verification" />
      )} />
      <Label htmlFor="schemeVerification" className="text-sm cursor-pointer">
        Not benefited from any similar other scheme *
      </Label>
      {errors.schemeVerification && <span className="text-red-500 text-xs ml-2">{errors.schemeVerification.message}</span>}
    </div>
    </div>
  );
};

export default EligibilityStep;