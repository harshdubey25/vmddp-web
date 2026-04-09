"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search } from "lucide-react";

const TrackApplicationForm = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [trackBy, setTrackBy] = useState<"mobile" | "applicationId" | "aadhar_number">("mobile");
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    const params = trackBy === "mobile"
      ? `mobile=${encodeURIComponent(value)}`
      : trackBy === "applicationId"
      ? `appId=${encodeURIComponent(value)}`
      : `aadhar=${encodeURIComponent(value)}`;
    router.push(`/track-result?${params}`);
  };

  return (
    <Card className="max-w-2xl mx-auto" data-testid="card-track-application">
      <CardHeader>
        <CardTitle className="font-display">{t('track_title')}</CardTitle>
        <CardDescription>
          {t('track_application_status')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Label>{t('track_by')}</Label>
            <RadioGroup
              value={trackBy}
              onValueChange={(val) => setTrackBy(val as "mobile" | "applicationId" | "aadhar_number")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mobile" id="mobile" data-testid="radio-mobile" />
                <Label htmlFor="mobile" className="font-normal cursor-pointer">
                  {t('mobile_number_recommended')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="applicationId" id="applicationId" data-testid="radio-application-id" />
                <Label htmlFor="applicationId" className="font-normal cursor-pointer">
                  {t('application_id')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="aadhar_number" id="aadhar_number" data-testid="radio-aadhar-number" />
                <Label htmlFor="aadhar_number" className="font-normal cursor-pointer">
                  {t('aadhar_number')}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trackValue">
              {trackBy === "mobile" ? t('mobile_number') : trackBy === "applicationId" ? t('application_id') : t('aadhar_number')}
            </Label>
            <Input
              id="trackValue"
              type={trackBy === "mobile" ? "tel" : "text"}
              placeholder={
                trackBy === "mobile"
                  ? t('enter_mobile_number')
                  : trackBy === "applicationId"
                  ? t('enter_application_id')
                  : t('enter_aadhar_number')
              }
              value={value}
              onChange={(e) => setValue(e.target.value)}
              data-testid="input-track-value"
            />
          </div>

          <Button type="submit" className="w-full" data-testid="button-track-submit">
            <Search className="mr-2 w-4 h-4" />
            {t('track_application')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TrackApplicationForm;

