
export interface VerificationData {
  code: string;
  email: string;
  expires: number;
}

export interface DataImportResult {
  success: boolean;
  transactions?: number;
  categories?: number;
  error?: string;
}
