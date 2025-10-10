import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  control: any;
  errors: any;
}

const BankDetailsStep = ({ control, errors }: Props) => (
  <div className="space-y-6">
    <h2 className="font-display font-semibold text-xl mb-4">Bank Details</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="accountHolderName">Account Holder Name *</Label>
        <Controller
          name="accountHolderName"
          control={control}
          rules={{ required: "Account Holder Name is required" }}
          render={({ field }) => (
            <Input {...field} id="accountHolderName" data-testid="input-account-holder-name" />
          )}
        />
        {errors.accountHolderName && <span className="text-red-500 text-xs">{errors.accountHolderName.message}</span>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="accountNumber">Account Number *</Label>
        <Controller
          name="accountNumber"
          control={control}
          rules={{ required: "Account Number is required", pattern: { value: /^[0-9]+$/, message: "Account Number must be numeric" } }}
          render={({ field }) => (
            <Input {...field} id="accountNumber" data-testid="input-account-number" />
          )}
        />
        {errors.accountNumber && <span className="text-red-500 text-xs">{errors.accountNumber.message}</span>}
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="bankName">Bank Name *</Label>
        <Controller
          name="bankName"
          control={control}
          rules={{ required: "Bank Name is required" }}
          render={({ field }) => (
            <Input {...field} id="bankName" data-testid="input-bank-name" />
          )}
        />
        {errors.bankName && <span className="text-red-500 text-xs">{errors.bankName.message}</span>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="ifscCode">IFSC Code *</Label>
        <Controller
          name="ifscCode"
          control={control}
          rules={{ required: "IFSC Code is required" }}
          render={({ field }) => (
            <Input {...field} id="ifscCode" data-testid="input-ifsc-code" />
          )}
        />
        {errors.ifscCode && <span className="text-red-500 text-xs">{errors.ifscCode.message}</span>}
      </div>
    </div>
  </div>
);

export default BankDetailsStep;