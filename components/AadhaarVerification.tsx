import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAadhaarVerification } from '@/hooks/use-aadhaar-verification';
import { useTranslation } from 'react-i18next';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface AadhaarVerificationProps {
    aadhaar: string;
    onVerificationComplete: (verified: boolean, data?: any) => void;
    disabled?: boolean;
}

const AadhaarVerification: React.FC<AadhaarVerificationProps> = ({
    aadhaar,
    onVerificationComplete,
    disabled = false,
}) => {
    const [otp, setOtp] = useState('');
    const { t } = useTranslation('common');

    const {
        isLoading,
        isOtpSent,
        isVerified,
        error,
        verifiedData,
        sendOtp,
        verifyOtp,
        reset,
    } = useAadhaarVerification();
    const [otpVerified, setOtpVerified] = useState(false);

    const handleSendOtp = async () => {
        if (!aadhaar || aadhaar.length !== 12) {
            return;
        }

        const result = await sendOtp(aadhaar);
        if (result.success) {
            // Optionally show success message
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length !== 6) {
            return;
        }

        const result = await verifyOtp(otp);
        if (result.success) {
            setOtpVerified(true);
            onVerificationComplete(true, result.data);
        } else {
            setOtpVerified(false);
            onVerificationComplete(false);
        }
    };

    const handleReset = () => {
        reset();
        setOtp('');
        setOtpVerified(false);
        onVerificationComplete(false);
    };

    const isAadhaarValid = aadhaar && /^\d{12}$/.test(aadhaar);

    if (isVerified || otpVerified) {
        return (
            <div className="space-y-3">
                <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                        OTP verified successfully! You can move to the next step.
                        {verifiedData?.name && (
                            <div className="mt-2">
                                <strong>Name:</strong> {verifiedData.name}
                            </div>
                        )}
                    </AlertDescription>
                </Alert>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="w-full"
                >
                    Verify Different Aadhaar
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {error && (
                <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            {!isOtpSent ? (
                <Button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={!isAadhaarValid || isLoading || disabled}
                    className="w-full"
                    size="sm"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending OTP...
                        </>
                    ) : (
                        'Get OTP for Aadhaar Verification'
                    )}
                </Button>
            ) : (
                <div className="space-y-3">
                    <Alert className="border-blue-200 bg-blue-50">
                        <AlertDescription className="text-blue-800">
                            OTP has been sent to your registered mobile number. Please enter the 6-digit OTP below.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                        <Label htmlFor="aadhaar-otp">Enter OTP</Label>
                        <Input
                            id="aadhaar-otp"
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setOtp(value);
                            }}
                            maxLength={6}
                            inputMode="numeric"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            onClick={handleVerifyOtp}
                            disabled={otp.length !== 6 || isLoading}
                            className="flex-1"
                            size="sm"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                'Verify OTP'
                            )}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleReset}
                            disabled={isLoading}
                            size="sm"
                        >
                            Cancel
                        </Button>
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleSendOtp}
                        disabled={isLoading}
                        className="w-full"
                        size="sm"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Resending...
                            </>
                        ) : (
                            'Resend OTP'
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default AadhaarVerification;