
import { useState, useEffect } from 'react';
import { IdeasGrid } from '@/components/ideas/IdeasGrid';
import { IdeasLoading } from '@/components/ideas/IdeasLoading';
import { EmptyIdeasState } from '@/components/ideas/EmptyIdeasState';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { useIdeaVotes } from '@/hooks/useIdeaVotes';
import { supabase } from '@/integrations/supabase/client';

const IdeasPage = () => {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userVotes, voteStats, handleVote, updateIdeas } = useIdeaVotes();
  const { isSyncing } = useSupabaseSync();

  // Fetch ideas on page load
  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('ideas').select('*').order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching ideas:', error);
          return;
        }
        
        // Update state using the updateIdeas function from useIdeaVotes
        updateIdeas(data || []);
        setIdeas(data || []);
      } catch (err) {
        console.error('Error in fetchIdeas:', err);
      } finally {
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
      <h1 className="text-3xl font-bold mb-6">Community Ideas</h1>
      <p className="text-muted-foreground mb-8">
        Vote on features and ideas for the app. The most popular ideas will be implemented next!
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
