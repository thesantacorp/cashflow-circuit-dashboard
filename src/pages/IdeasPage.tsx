
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Ideas you can execute
        </h1>
        <p className="mt-2 font-semibold text-gray-600">
          at the snap of a finger
        </p>
        <p className="mt-4 text-gray-700 max-w-3xl">
          Discover and jump on ready made SAAS products and business ideas, build generational wealth
        </p>
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
