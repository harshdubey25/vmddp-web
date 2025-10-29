import { useState } from "react";

interface VerificationState {
  isLoading: boolean;
  isOtpSent: boolean;
  isVerified: boolean;
  verificationId: string | null;
  error: string | null;
  verifiedData: {
    name?: string;
    date_of_birth?: string;
    gender?: string;
    address?: string;
  } | null;
}

export const useAadhaarVerification = () => {
  const [state, setState] = useState<VerificationState>({
    isLoading: false,
    isOtpSent: false,
    isVerified: false,
    verificationId: null,
    error: null,
    verifiedData: null,
  });

  const sendOtp = async (aadhaar: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch("/api/cashfree/aadhaar-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ aadhaar }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }
      console.log("OTP sent response data:", data);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isOtpSent: true,
        verificationId: data.data.verification_id,
      }));

      return { success: true, message: data.data.message };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send OTP";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  const verifyOtp = async (otp: string) => {
    if (!state.verificationId) {
      throw new Error("No verification ID available");
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch("/api/cashfree/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          verification_id: state.verificationId,
          otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "OTP verification failed");
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        isVerified: data.verified,
        verifiedData: data.data,
      }));

      return {
        success: true,
        verified: data.verified,
        data: data.data,
        message: data.data.message,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "OTP verification failed";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  const reset = () => {
    setState({
      isLoading: false,
      isOtpSent: false,
      isVerified: false,
      verificationId: null,
      error: null,
      verifiedData: null,
    });
  };

  return {
    ...state,
    sendOtp,
    verifyOtp,
    reset,
  };
};
