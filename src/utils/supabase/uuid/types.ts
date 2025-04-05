
export interface UuidResponse {
  success: boolean;
  uuid?: string;
  error?: string;
}

export interface UuidVerificationResult {
  exists: boolean;
  email?: string;
  timestamp?: string;
}

export interface UuidRecord {
  id?: number;
  email: string;
  uuid: string;
  created_at?: string;
}
