
import { useState, useEffect } from 'react';
import { IdeasGrid } from '@/components/ideas/IdeasGrid';
import { IdeasLoading } from '@/components/ideas/IdeasLoading';
import { EmptyIdeasState } from '@/components/ideas/EmptyIdeasState';
import { useAuth } from '@/context/AuthContext';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { useIdeaVotes } from '@/hooks/useIdeaVotes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Idea } from '@/integrations/supabase/customClient';
import { initializeStorage } from '@/utils/initializeStorage';

const IdeasPage = () => {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const { userVotes, voteStats, handleVote, updateIdeas } = useIdeaVotes();
  const { isSyncing } = useSupabaseSync();
  const [storageInitialized, setStorageInitialized] = useState(false);

  // Initialize storage when the component mounts
  useEffect(() => {
    const initStorage = async () => {
      try {
        const result = await initializeStorage();
        setStorageInitialized(result);
        
        if (!result) {
          console.warn('Storage initialization failed, but continuing...');
        }
      } catch (err) {
        console.error('Error initializing storage:', err);
      }
    };
    
    initStorage();
  }, []);

  // Fetch ideas on page load
  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('ideas')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching ideas:', error);
          toast.error('Failed to load ideas. Please try again.');
          setLoading(false);
          return;
        }
        
        // Make sure both operations happen before setting loading to false
        if (data && Array.isArray(data)) {
          // Filter out expired ideas
          const now = new Date();
          const activeIdeas = (data as Idea[]).filter(idea => {
            const countdownDate = new Date(idea.countdown_timer);
            return countdownDate > now;
          });
          
          updateIdeas(activeIdeas);
          setIdeas(activeIdeas);
          
          // Delay setting loading to false to ensure votes are fetched
          setTimeout(() => {
            setLoading(false);
          }, 500);
        } else {
          setIdeas([]);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error in fetchIdeas:', err);
        toast.error('An unexpected error occurred while loading ideas');
        setLoading(false);
      }
    };

    fetchIdeas();
  }, [updateIdeas]);

  if (loading) {
    return <IdeasLoading />;
  }

  if (!ideas || ideas.length === 0) {
    return <EmptyIdeasState />;
  }

  return (
    <div className="container max-w-6xl py-8">
      <h1 className="text-3xl font-bold mb-2">Discover ideas you can deploy</h1>
      <p className="text-muted-foreground mb-8">
        Start stacking up
      </p>
      <IdeasGrid 
        ideas={ideas}
        userVotes={userVotes}
        voteStats={voteStats}
        onVote={handleVote}
      />
    </div>
  );
};

export default IdeasPage;
