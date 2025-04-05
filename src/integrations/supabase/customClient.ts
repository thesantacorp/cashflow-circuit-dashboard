
import { supabase } from './client';
import { PostgrestQueryBuilder } from '@supabase/supabase-js';

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

// Type assertion function to help with TypeScript type safety
function fromTable<T>(tableName: string): PostgrestQueryBuilder<any, any, any, any> {
  return supabase.from(tableName) as PostgrestQueryBuilder<any, any, any, any>;
}

// Create a typed wrapper for the supabase client
export const customClient = {
  // Ideas table operations
  ideas: {
    select: () => fromTable<Idea>('ideas'),
    insert: (data: Partial<Idea> | Partial<Idea>[]) => fromTable<Idea>('ideas').insert(data),
    update: (data: Partial<Idea>) => fromTable<Idea>('ideas').update(data),
    delete: () => fromTable<Idea>('ideas').delete(),
  },
  // Votes table operations
  votes: {
    select: () => fromTable<Vote>('votes'),
    insert: (data: Partial<Vote> | Partial<Vote>[]) => fromTable<Vote>('votes').insert(data),
    update: (data: Partial<Vote>) => fromTable<Vote>('votes').update(data),
    delete: () => fromTable<Vote>('votes').delete(),
  }
};
