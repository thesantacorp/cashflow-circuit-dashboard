
export interface ProductIdea {
  id: string;
  title: string;
  description: string;
  detailedDescription: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  updatedAt: string;
  externalLink?: string;
  category?: string;
  votedSessions: string[]; // Session IDs that have voted on this idea
  currency: string; // Currency for potential monetization/development costs
  currencySymbol: string; // Symbol for the currency
}

export interface Vote {
  ideaId: string;
  sessionId: string; 
  isUpvote: boolean;
  timestamp: string;
}

export interface ProjectStats {
  totalVotes: number;
  upvotes: number;
  downvotes: number;
  score: number; // Net score (upvotes - downvotes)
}

// For backward compatibility with CrowdfundingManager.tsx
export interface CrowdfundingProject {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  raisedAmount: number;
  startDate: string;
  endDate: string;
  projectDetails: string;
  externalLink?: string;
  isFullyFunded: boolean;
  createdAt: string;
  updatedAt: string;
  currency: string;
  currencySymbol: string;
}

export interface Backer {
  id: string;
  projectId: string;
  firstName: string;
  email: string;
  amount: number;
  timestamp: string;
}
