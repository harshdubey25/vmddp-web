export interface BankDetails {
  BANK: string;
  IFSC: string;
  BRANCH: string;
  ADDRESS: string;
  CONTACT: string | null;
  CITY: string;
  RTGS: boolean;
  NEFT: boolean;
  MICR: string | null;
  UPI: boolean;
}

export interface IFSCApiResponse {
  BANK: string;
  IFSC: string;
  BRANCH: string;
  ADDRESS: string;
  CONTACT: string | null;
  CITY: string;
  RTGS: boolean;
  NEFT: boolean;
  MICR: string | null;
  UPI: boolean;
}

/**
 * Fetches bank details for a given IFSC code using the Razorpay IFSC API
 * @param ifscCode - The IFSC code to lookup
 * @returns Promise with bank details or null if not found
 */
export async function fetchBankDetailsByIFSC(
  ifscCode: string
): Promise<BankDetails | null> {
  try {
    // Remove spaces and convert to uppercase
    const cleanIFSC = ifscCode.replace(/\s/g, "").toUpperCase();

    // Validate IFSC format (11 characters: 4 letters + 7 alphanumeric)
    const ifscRegex = /^[A-Z]{4}[0-9A-Z]{7}$/;
    if (!ifscRegex.test(cleanIFSC)) {
      throw new Error("Invalid IFSC code format");
    }

    const response = await fetch(`https://ifsc.razorpay.com/${cleanIFSC}`);

    if (response.status === 404) {
      return null; // IFSC not found
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: IFSCApiResponse = await response.json();

    return {
      BANK: data.BANK,
      IFSC: data.IFSC,
      BRANCH: data.BRANCH,
      ADDRESS: data.ADDRESS,
      CONTACT: data.CONTACT,
      CITY: data.CITY,
      RTGS: data.RTGS,
      NEFT: data.NEFT,
      MICR: data.MICR,
      UPI: data.UPI,
    };
  } catch (error) {
    console.error("Error fetching bank details:", error);
    throw error;
  }
}

/**
 * Validates IFSC code format
 * @param ifscCode - The IFSC code to validate
 * @returns boolean indicating if the format is valid
 */
export function isValidIFSCFormat(ifscCode: string): boolean {
  const cleanIFSC = ifscCode.replace(/\s/g, "").toUpperCase();
  const ifscRegex = /^[A-Z]{4}[0-9A-Z]{7}$/;
  return ifscRegex.test(cleanIFSC);
}
