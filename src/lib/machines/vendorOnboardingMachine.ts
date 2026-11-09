export type VendorOnboardingStep = 1 | 2 | 3;

export interface VendorOnboardingData {
  // Step 1
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  password?: string;
  // Step 2
  category: string;
  location: string;
  description?: string;
  logoUrl?: string;
  coverImage?: string;
  // Step 3
  bankName: string;
  accountNumber: string;
  accountName?: string;
}

export const VENDOR_ONBOARDING_STEPS_CONFIG = [
  {
    step: 1 as VendorOnboardingStep,
    id: "OWNER_DETAILS",
    title: "Store & Owner Profile",
    subtitle: "Basic contact and store name",
  },
  {
    step: 2 as VendorOnboardingStep,
    id: "STORE_LOGISTICS",
    title: "Campus Location & Category",
    subtitle: "Store outlet & goods category",
  },
  {
    step: 3 as VendorOnboardingStep,
    id: "BANK_SETTLEMENTS",
    title: "Bank & Paystack Payouts",
    subtitle: "Settlement account details",
  },
];

export function validateOnboardingStep(
  step: VendorOnboardingStep,
  data: Partial<VendorOnboardingData>
): { isValid: boolean; error?: string } {
  if (step === 1) {
    if (!data.storeName?.trim() || data.storeName.trim().length < 2) {
      return { isValid: false, error: "Please enter your store or business name (at least 2 characters)." };
    }
    if (!data.ownerName?.trim() || data.ownerName.trim().length < 2) {
      return { isValid: false, error: "Please enter the store owner's name." };
    }
    if (!data.email?.trim() || !data.email.includes("@")) {
      return { isValid: false, error: "Please provide a valid contact email address." };
    }
    if (!data.phone?.trim() || data.phone.trim().replace(/\D/g, "").length < 10) {
      return { isValid: false, error: "Please provide a valid 10+ digit phone number." };
    }
    if (data.password !== undefined && data.password.length > 0 && data.password.length < 6) {
      return { isValid: false, error: "Store password must be at least 6 characters." };
    }
    return { isValid: true };
  }

  if (step === 2) {
    if (!data.category?.trim()) {
      return { isValid: false, error: "Please select your primary store category." };
    }
    if (!data.location?.trim() || data.location.trim().length < 2) {
      return { isValid: false, error: "Please specify your campus store, outlet, or dispatch location." };
    }
    return { isValid: true };
  }

  if (step === 3) {
    const rawAccount = (data.accountNumber || "").replace(/\D/g, "");
    if (!rawAccount || rawAccount.length !== 10) {
      return { isValid: false, error: "Please enter a valid 10-digit NUBAN bank account number." };
    }
    if (!data.bankName?.trim()) {
      return { isValid: false, error: "Please select your payout bank." };
    }
    return { isValid: true };
  }

  return { isValid: true };
}

export function canProceedToStep(
  targetStep: VendorOnboardingStep,
  data: Partial<VendorOnboardingData>
): boolean {
  if (targetStep === 1) return true;
  if (targetStep === 2) return validateOnboardingStep(1, data).isValid;
  if (targetStep === 3) {
    return validateOnboardingStep(1, data).isValid && validateOnboardingStep(2, data).isValid;
  }
  return false;
}

