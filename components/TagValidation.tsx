import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { frappeServer } from '@/lib/frappe';

interface TagNumberVerificationProps {
    onVerificationComplete: (verified: boolean, data?: any) => void;
    disabled?: boolean;
    showLabel?: boolean;
}

const TagNumberVerification: React.FC<TagNumberVerificationProps> = ({
    onVerificationComplete,
    disabled = false,
    showLabel = true,
}) => {
    const [tagNumber, setTagNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [verifiedData, setVerifiedData] = useState<any>(null);

    const handleValidate = async () => {
        setIsLoading(true);
        setError(null);
        setIsVerified(false);
        try {
            // Call Frappe API using frappeServer
            const response = await frappeServer.call().post('vmddp_app.api.epashudhan.tag_number.validate_animal_tag', {
                tag_number: tagNumber,
            });
            const msg = response?.message;

            // Check if the response indicates success
            if (msg?.flg === true && msg?.data) {
                setIsVerified(true);
                setVerifiedData(msg.data);
                onVerificationComplete(true, msg.data);
            } else {
                // Handle error response - check for msg.msg.msgDesc first, then fallback
                const errorMessage = msg?.msg?.msgDesc || msg?.msgDesc || 'Invalid Tag Number';
                setError(errorMessage);
                onVerificationComplete(false);
            }
        } catch (err: any) {
            // Handle network or other errors
            let errorMessage = 'Validation failed';

            // Try to extract error from different possible error structures
            if (err?.response?.data?.message?.msg?.msgDesc) {
                errorMessage = err.response.data.message.msg.msgDesc;
            } else if (err?.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            onVerificationComplete(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setTagNumber('');
        setIsVerified(false);
        setError(null);
        setVerifiedData(null);
        onVerificationComplete(false);
    };

    return (
        <div className="space-y-3">
            {isVerified ? (
                <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                        Tag number verified successfully!
                        {verifiedData && (
                            <div className="mt-2 space-y-1">
                                <div><strong>Farmer Name:</strong> {verifiedData.farmerName}</div>
                                <div><strong>Farmer Mobile:</strong> {verifiedData.farmerMobileNo}</div>
                                <div><strong>Animal ID:</strong> {verifiedData.farmerAnimalDetailsResponse?.animalId}</div>
                                <div><strong>Species:</strong> {verifiedData.farmerAnimalDetailsResponse?.species}</div>
                                <div><strong>Breed Type:</strong> {verifiedData.farmerAnimalDetailsResponse?.breedType}</div>
                                <div><strong>Milking Status:</strong> {verifiedData.farmerAnimalDetailsResponse?.milkingStatus}</div>
                            </div>
                        )}
                    </AlertDescription>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        className="w-full mt-2"
                    >
                        Verify Another Tag
                    </Button>
                </Alert>
            ) : (
                <>
                    {error && (
                        <Alert className="border-red-200 bg-red-50">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">
                                {error}
                            </AlertDescription>
                        </Alert>
                    )}
                    {showLabel && <Label htmlFor="tag-number">Tag Number</Label>}
                    <Input
                        id="tag-number"
                        type="text"
                        placeholder="Enter Tag Number"
                        value={tagNumber}
                        onChange={(e) => setTagNumber(e.target.value)}
                        maxLength={14}
                        disabled={isLoading || disabled}
                    />
                    <Button
                        type="button"
                        onClick={handleValidate}
                        disabled={!tagNumber || isLoading || disabled}
                        className="w-full"
                        size="sm"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Validating...
                            </>
                        ) : (
                            'Validate Tag Number'
                        )}
                    </Button>
                </>
            )}
        </div>
    );
};

export default TagNumberVerification;