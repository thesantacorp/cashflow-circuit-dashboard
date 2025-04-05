
// Types for verification functionality
export interface VerificationResult {
  connected: boolean;
  tableExists: boolean;
  hasReadAccess: boolean;
  hasWriteAccess: boolean;
  details: string;
  hasRlsError?: boolean;
}

export interface SetupFixResult {
  success: boolean;
  message: string;
  details?: string;
}
