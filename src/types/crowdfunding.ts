
export interface CrowdfundingProject {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  raisedAmount: number;
  startDate: string;
  endDate: string;
  projectDetails: string;
  isFullyFunded: boolean;
  externalLink?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Backer {
  id: string;
  projectId: string;
  firstName: string;
  email: string; // Will be used internally only, not displayed to users
  amount: number;
  paymentId: string;
  timestamp: string;
}

export interface PayPalPaymentResponse {
  id: string;
  status: string;
  payer: {
    name: {
      given_name: string;
    },
    email_address: string;
  };
  amount: {
    value: string;
  };
  create_time: string;
}

export interface ProjectStats {
  totalBackers: number;
  totalRaised: number;
  percentFunded: number;
  daysLeft: number;
}
