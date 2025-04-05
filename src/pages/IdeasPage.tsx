
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { customClient, Idea } from '@/integrations/supabase/customClient';
import { IdeasLoading } from '@/components/ideas/IdeasLoading';
import { EmptyIdeasState } from '@/components/ideas/EmptyIdeasState';
import { IdeasGrid } from '@/components/ideas/IdeasGrid';
import { useIdeaVotes } from '@/hooks/useIdeaVotes';

const IdeasPage = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const { userVotes, voteStats, handleVote } = useIdeaVotes(ideas);

  const fetchIdeas = async () => {
    try {
      const { data: ideasData, error: ideasError } = await customClient.ideas
        .select()
        .order('countdown_timer', { ascending: true });
      
      if (ideasError) throw ideasError;
      setIdeas(ideasData || []);
    } catch (error: any) {
      console.error('Error fetching ideas:', error.message);
      toast.error('Failed to load ideas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Community Ideas
        </h1>
      </div>
      
      {loading ? (
        <IdeasLoading />
      ) : ideas.length === 0 ? (
        <EmptyIdeasState />
      ) : (
        <IdeasGrid 
          ideas={ideas} 
          userVotes={userVotes} 
          voteStats={voteStats} 
          onVote={handleVote}
        />
      )}
    </div>
  );
};

export default IdeasPage;
