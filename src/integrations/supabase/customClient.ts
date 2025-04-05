
import { supabase } from './client';
import type { Database } from './types';

// Define interfaces for our database table types
export interface Idea {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  countdown_timer: string;
  live_project_link: string | null;
  learn_more_link: string | null;
  created_at: string;
  created_by?: string;
}

export interface Vote {
  id: string;
  idea_id: string;
  user_id: string;
  vote_type: 'upvote' | 'downvote';
  created_at: string;
}

export interface VoteSummary {
  idea_id: string;
  upvotes: number;
  downvotes: number;
}

// Type definitions for insert operations that align with Supabase's expected types
type IdeaInsert = Omit<Database['public']['Tables']['ideas']['Insert'], 'id' | 'created_at'>;
type VoteInsert = Omit<Database['public']['Tables']['votes']['Insert'], 'id' | 'created_at'>;

// Type definitions for update operations
type IdeaUpdate = Database['public']['Tables']['ideas']['Update'];
type VoteUpdate = Database['public']['Tables']['votes']['Update'];

// Create a typed wrapper for the supabase client
export const customClient = {
  // Ideas table operations
  ideas: {
    select: () => supabase.from('ideas'),
    insert: (data: IdeaInsert | IdeaInsert[]) => supabase.from('ideas').insert(data),
    update: (data: IdeaUpdate) => supabase.from('ideas').update(data),
    delete: () => supabase.from('ideas').delete(),
  },
  // Votes table operations
  votes: {
    select: () => supabase.from('votes'),
    insert: (data: VoteInsert | VoteInsert[]) => supabase.from('votes').insert(data),
    update: (data: VoteUpdate) => supabase.from('votes').update(data),
    delete: () => supabase.from('votes').delete(),
  }
};
