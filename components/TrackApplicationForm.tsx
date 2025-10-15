"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search } from "lucide-react";

const TrackApplicationForm = () => {
  const router = useRouter();
  const [trackBy, setTrackBy] = useState<"mobile" | "applicationId">("mobile");
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    const params = trackBy === "mobile"
      ? `mobile=${encodeURIComponent(value)}`
      : `appId=${encodeURIComponent(value)}`;
    router.push(`/track-result?${params}`);
  };

  return (
    <Card className="max-w-2xl mx-auto" data-testid="card-track-application">
      <CardHeader>
        <CardTitle className="font-display">Track Your Application</CardTitle>
        <CardDescription>
          Check the status of your VMDDP scheme application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Label>Track application by</Label>
            <RadioGroup
              value={trackBy}
              onValueChange={(val) => setTrackBy(val as "mobile" | "applicationId")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mobile" id="mobile" data-testid="radio-mobile" />
                <Label htmlFor="mobile" className="font-normal cursor-pointer">
                  Mobile Number (Recommended)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="applicationId" id="applicationId" data-testid="radio-application-id" />
                <Label htmlFor="applicationId" className="font-normal cursor-pointer">
                  Application ID
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trackValue">
              {trackBy === "mobile" ? "Mobile Number" : "Application ID"}
            </Label>
            <Input
              id="trackValue"
              type={trackBy === "mobile" ? "tel" : "text"}
              placeholder={
                trackBy === "mobile"
                  ? "Enter your registered mobile number"
                  : "Enter your application ID"
              }
              value={value}
              onChange={(e) => setValue(e.target.value)}
              data-testid="input-track-value"
            />
          </div>

          <Button type="submit" className="w-full" data-testid="button-track-submit">
            <Search className="mr-2 w-4 h-4" />
            Track Application
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TrackApplicationForm;

