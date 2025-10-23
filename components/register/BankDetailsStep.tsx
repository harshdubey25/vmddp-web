import { Controller, UseFormSetValue, useWatch } from "react-hook-form";
import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { fetchBankDetailsByIFSC, isValidIFSCFormat } from "@/lib/ifsc";
import { Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  control: any;
  errors: any;
  setValue?: UseFormSetValue<any>;
}

const BankDetailsStep = ({ control, errors, setValue }: Props) => {
  const [isLoadingBankDetails, setIsLoadingBankDetails] = useState(false);
  const { toast } = useToast();

  const watchedFirstName = useWatch({ control, name: 'firstName' });
  const watchedMiddleName = useWatch({ control, name: 'middleName' });
  const watchedLastName = useWatch({ control, name: 'lastName' });
  const accountHolderNameValue = [watchedFirstName, watchedMiddleName, watchedLastName]
    .filter(Boolean)
    .join(' ');

  useEffect(() => {
    if (setValue) {
      setValue('accountHolderName', accountHolderNameValue);
    }
  }, [accountHolderNameValue, setValue]);

  const handleIFSCLookup = async (ifscCode: string) => {
    if (!ifscCode || !isValidIFSCFormat(ifscCode)) {
      return;
    }

    setIsLoadingBankDetails(true);
    try {
      const bankDetails = await fetchBankDetailsByIFSC(ifscCode);
      if (bankDetails && setValue) {
        setValue('bankName', bankDetails.BANK);
        toast({
          title: "Bank Details Fetched",
          description: `Found ${bankDetails.BANK} - ${bankDetails.BRANCH}`,
        });
      } else {
        toast({
          title: "IFSC Not Found",
          description: "Could not find bank details for this IFSC code.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching bank details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch bank details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBankDetails(false);
    }
  };

  return (
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
              <Input
                {...field}
                id="accountHolderName"
                data-testid="input-account-holder-name"
                value={accountHolderNameValue}
                readOnly
              />
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
              <Input
                {...field}
                id="accountNumber"
                data-testid="input-account-number"
                type="password"
                onCopy={e => e.preventDefault()}
                onPaste={e => e.preventDefault()}
                onCut={e => e.preventDefault()}
              />
            )}
          />
          {errors.accountNumber && <span className="text-red-500 text-xs">{errors.accountNumber.message}</span>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmAccountNumber">Confirm Account Number *</Label>
          <Controller
            name="confirmAccountNumber"
            control={control}
            rules={{
              required: "Confirm Account Number is required",
              pattern: { value: /^[0-9]+$/, message: "Account Number must be numeric" },
              validate: (value, formValues) => {
                const accountNumber = control._formValues?.accountNumber;
                if (accountNumber && value !== accountNumber) {
                  return "Account numbers do not match";
                }
                return true;
              }
            }}
            render={({ field }) => {
              const accountNumber = control._formValues?.accountNumber;
              const isMismatch = field.value && accountNumber && field.value !== accountNumber;
              return (
                <Input
                  {...field}
                  id="confirmAccountNumber"
                  data-testid="input-confirm-account-number"
                  className={isMismatch ? "border-red-500 focus:border-red-500" : ""}
                  onCopy={e => e.preventDefault()}
                  onPaste={e => e.preventDefault()}
                  onCut={e => e.preventDefault()}
                />
              );
            }}
          />
          {errors.confirmAccountNumber && <span className="text-red-500 text-xs">{errors.confirmAccountNumber.message}</span>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ifscCode">IFSC Code *</Label>
          <div className="flex gap-2">
            <Controller
              name="ifscCode"
              control={control}
              rules={{
                required: "IFSC Code is required",
                validate: (value) => isValidIFSCFormat(value) || "Invalid IFSC code format"
              }}
              render={({ field }) => (
                <Input
                  {...field}
                  id="ifscCode"
                  data-testid="input-ifsc-code"
                  placeholder="e.g. SBIN0001234"
                  onChange={(e) => {
                    field.onChange(e);
                    const ifscCode = e.target.value;
                    if (isValidIFSCFormat(ifscCode)) {
                      handleIFSCLookup(ifscCode);
                    }
                  }}
                />
              )}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                const ifscCode = control._formValues?.ifscCode;
                if (ifscCode) {
                  handleIFSCLookup(ifscCode);
                }
              }}
              disabled={isLoadingBankDetails}
            >
              {isLoadingBankDetails ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          {errors.ifscCode && <span className="text-red-500 text-xs">{errors.ifscCode.message}</span>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="bankName">Bank Name *</Label>
          <Controller
            name="bankName"
            control={control}
            rules={{ required: "Bank Name is required" }}
            render={({ field }) => (
              <Input {...field} id="bankName" data-testid="input-bank-name" readOnly />
            )}
          />
          {errors.bankName && <span className="text-red-500 text-xs">{errors.bankName.message}</span>}
        </div>

      </div>
    </div>
  );
}

export default BankDetailsStep;