
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
import { ensureStorageBucketExists } from '@/utils/supabase/client';

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
        // Try both initialization methods for better chances of success
        const result = await initializeStorage();
        const bucketResult = await ensureStorageBucketExists('ideas', true);
        
        setStorageInitialized(result || bucketResult);
        
        if (!result && !bucketResult) {
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
        
        // Process the data to ensure image URLs have timestamps for cache-busting
        const processedData = data?.map(idea => {
          if (!idea.image_url) return idea;
          
          try {
            const url = new URL(idea.image_url);
            url.searchParams.set('t', Date.now().toString());
            return { ...idea, image_url: url.toString() };
          } catch (e) {
            const separator = idea.image_url.includes('?') ? '&' : '?';
            return { ...idea, image_url: `${idea.image_url}${separator}t=${Date.now()}` };
          }
        }) || [];
        
        // Make sure both operations happen before setting loading to false
        if (processedData.length > 0) {
          updateIdeas(processedData as Idea[]);
          setIdeas(processedData as Idea[]);
          
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
