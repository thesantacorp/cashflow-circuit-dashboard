
export interface Project {
  id: string;
  name: string;
  description?: string;
  image_url?: string | null;
  funding_goal?: number | null;
  live_link?: string | null;
  more_details?: string | null;
  expiration_date?: string | null; // ISO date string
  created_at: string; // ISO date string
  upvotes: number;
  downvotes: number;
  userVote?: number; // 1, 0 or -1, for client-side tracking
}
