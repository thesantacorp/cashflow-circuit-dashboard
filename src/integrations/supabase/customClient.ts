
import { supabase } from './client';

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

// Create a typed wrapper for the supabase client
export const customClient = {
  // Ideas table operations
  ideas: {
    select: () => supabase.from('ideas') as any,
    insert: (data: Partial<Idea> | Partial<Idea>[]) => supabase.from('ideas').insert(data as any) as any,
    update: (data: Partial<Idea>) => supabase.from('ideas').update(data as any) as any,
    delete: () => supabase.from('ideas').delete() as any,
  },
  // Votes table operations
  votes: {
    select: () => supabase.from('votes') as any,
    insert: (data: Partial<Vote> | Partial<Vote>[]) => supabase.from('votes').insert(data as any) as any,
    update: (data: Partial<Vote>) => supabase.from('votes').update(data as any) as any,
    delete: () => supabase.from('votes').delete() as any,
  }
};
