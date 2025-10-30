import { Controller, UseFormSetValue, useWatch } from "react-hook-form";
import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { fetchBankDetailsByIFSC, isValidIFSCFormat } from "@/lib/ifsc";
import { Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

interface Props {
  control: any;
  errors: any;
  setValue?: UseFormSetValue<any>;
}

const BankDetailsStep = ({ control, errors, setValue }: Props) => {
  const [isLoadingBankDetails, setIsLoadingBankDetails] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation('common');

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
          title: t('bank_details_fetched_title'),
          description: t('bank_details_fetched_description', {
            bank: bankDetails.BANK,
            branch: bankDetails.BRANCH
          }),
        });
      } else {
        toast({
          title: t('ifsc_not_found_title'),
          description: t('ifsc_not_found_description'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching bank details:", error);
      toast({
        title: t('error'),
        description: t('bank_details_fetch_error'),
        variant: "destructive",
      });
    } finally {
      setIsLoadingBankDetails(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display font-semibold text-xl mb-4">{t('bank_details_title')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="accountHolderName">{t('account_holder_name')} *</Label>
          <Controller
            name="accountHolderName"
            control={control}
            rules={{ required: t('account_holder_name_required') }}
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
          <Label htmlFor="accountNumber">{t('account_number')} *</Label>
          <Controller
            name="accountNumber"
            control={control}
            rules={{
              required: t('account_number_required')
            }}
            render={({ field }) => (
              <Input
                {...field}
                id="accountNumber"
                data-testid="input-account-number"
                type="password"
                inputMode="numeric"
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  field.onChange(value);
                }}
                onCopy={e => e.preventDefault()}
                onPaste={e => e.preventDefault()}
                onCut={e => e.preventDefault()}
              />
            )}
          />
          {errors.accountNumber && <span className="text-red-500 text-xs">{errors.accountNumber.message}</span>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmAccountNumber">{t('confirm_account_number')} *</Label>
          <Controller
            name="confirmAccountNumber"
            control={control}
            rules={{
              required: t('confirm_account_number_required'),
              validate: (value, formValues) => {
                const accountNumber = control._formValues?.accountNumber;
                if (accountNumber && value !== accountNumber) {
                  return t('account_numbers_mismatch');
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
                  inputMode="numeric"
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    field.onChange(value);
                  }}
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
          <Label htmlFor="ifscCode">{t('ifsc_code')} *</Label>
          <div className="flex gap-2">
            <Controller
              name="ifscCode"
              control={control}
              rules={{
                required: t('ifsc_code_required'),
                validate: (value) => isValidIFSCFormat(value) || t('ifsc_code_invalid')
              }}
              render={({ field }) => (
                <Input
                  {...field}
                  id="ifscCode"
                  data-testid="input-ifsc-code"
                  placeholder={t('ifsc_code_placeholder')}
                  onChange={(e) => {
                    field.onChange(e.target.value.toUpperCase());
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
          <Label htmlFor="bankName">{t('bank_name')} *</Label>
          <Controller
            name="bankName"
            control={control}
            rules={{ required: t('bank_name_required') }}
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