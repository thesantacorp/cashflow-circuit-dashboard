
export interface ImportStats {
  transactions: number;
  categories: number;
}

export interface VerificationData {
  code: string;
  email: string;
  expires: number;
}

export interface DataRestorationContextType {
  email: string;
  setEmail: (email: string) => void;
  isImporting: boolean;
  isVerifying: boolean;
  importError: string | null;
  importSuccess: boolean;
  importStats: ImportStats | null;
  verificationSent: boolean;
  handleSendVerification: () => Promise<void>;
  handleVerifyAndImport: (verificationCode: string) => Promise<void>;
  handleImport: () => Promise<void>;
}
