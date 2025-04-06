
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Idea, Vote } from '@/integrations/supabase/customClient';

type VoteStats = Record<string, {upvotes: number, downvotes: number}>;

export const useIdeaVotes = () => {
  const { user } = useAuth();
  const [userVotes, setUserVotes] = useState<Record<string, Vote>>({});
  const [voteStats, setVoteStats] = useState<VoteStats>({});
  const [loading, setLoading] = useState(true);
  const [ideas, setIdeas] = useState<Idea[]>([]);

  const fetchVoteStats = useCallback(async () => {
    try {
      if (!ideas || ideas.length === 0) {
        setLoading(false);
        return;
      }
      
      const ideasStats: VoteStats = {};
      
      // Process all ideas in parallel for faster loading
      await Promise.all(ideas.map(async (idea) => {
        try {
          const [upvotesResponse, downvotesResponse] = await Promise.all([
            supabase
              .from('votes')
              .select('*')
              .eq('idea_id', idea.id)
              .eq('vote_type', 'upvote'),
            supabase
              .from('votes')
              .select('*')
              .eq('idea_id', idea.id)
              .eq('vote_type', 'downvote')
          ]);
          
          if (upvotesResponse.error) throw upvotesResponse.error;
          if (downvotesResponse.error) throw downvotesResponse.error;
          
          ideasStats[idea.id] = {
            upvotes: upvotesResponse.data?.length || 0,
            downvotes: downvotesResponse.data?.length || 0
          };
        } catch (error) {
          console.error(`Error fetching votes for idea ${idea.id}:`, error);
        }
      }));
      
      setVoteStats(ideasStats);
      
      if (user) {
        const { data: votesData, error: votesError } = await supabase
          .from('votes')
          .select('*')
          .eq('user_id', user.id);
          
        if (votesError) {
          console.error('Error fetching user votes:', votesError);
        } else {
          const userVotesMap: Record<string, Vote> = {};
          if (votesData) {
            votesData.forEach((vote: any) => {
              userVotesMap[vote.idea_id] = vote as Vote;
            });
          }
          
          setUserVotes(userVotesMap);
        }
      }
      
    } catch (error: any) {
      console.error('Error fetching vote stats:', error.message);
      toast.error('Failed to load voting data');
    } finally {
      setLoading(false);
    }
  }, [ideas, user]);

  const handleVote = async (ideaId: string, voteType: 'upvote' | 'downvote') => {
    if (!user) {
      toast.error('Please sign in to vote');
      return;
    }
    
    try {
      const existingVote = userVotes[ideaId];
      
      if (existingVote && existingVote.vote_type === voteType) {
        // Delete the vote if it's the same type
        const { error } = await supabase
          .from('votes')
          .delete()
          .eq('id', existingVote.id);
          
        if (error) throw error;
        
        // Update local state
        const newUserVotes = { ...userVotes };
        delete newUserVotes[ideaId];
        setUserVotes(newUserVotes);
        
        setVoteStats(prev => ({
          ...prev,
          [ideaId]: {
            ...prev[ideaId],
            [voteType === 'upvote' ? 'upvotes' : 'downvotes']: Math.max(0, prev[ideaId][voteType === 'upvote' ? 'upvotes' : 'downvotes'] - 1)
          }
        }));
        
        toast.success('Vote removed');
      } 
      else if (existingVote) {
        // Update the vote if it's a different type
        const { data, error } = await supabase
          .from('votes')
          .update({ vote_type: voteType })
          .eq('id', existingVote.id)
          .select()
          .single();
          
        if (error) throw error;
        
        // Update local state
        setUserVotes({
          ...userVotes,
          [ideaId]: data as Vote
        });
        
        setVoteStats(prev => ({
          ...prev,
          [ideaId]: {
            upvotes: voteType === 'upvote' 
              ? prev[ideaId].upvotes + 1 
              : Math.max(0, prev[ideaId].upvotes - 1),
            downvotes: voteType === 'downvote' 
              ? prev[ideaId].downvotes + 1 
              : Math.max(0, prev[ideaId].downvotes - 1)
          }
        }));
        
        toast.success(`${voteType === 'upvote' ? 'Upvoted' : 'Downvoted'} successfully`);
      } 
      else {
        // Create a new vote
        const { data, error } = await supabase
          .from('votes')
          .insert({
            idea_id: ideaId,
            user_id: user.id,
            vote_type: voteType
          })
          .select()
          .single();
          
        if (error) throw error;
        
        // Update local state
        setUserVotes(prev => ({
          ...prev,
          [ideaId]: data as Vote
        }));
        
        setVoteStats(prev => ({
          ...prev,
          [ideaId]: {
            ...prev[ideaId],
            [voteType === 'upvote' ? 'upvotes' : 'downvotes']: prev[ideaId][voteType === 'upvote' ? 'upvotes' : 'downvotes'] + 1
          }
        }));
        
        toast.success(`${voteType === 'upvote' ? 'Upvoted' : 'Downvoted'} successfully`);
      }
      
    } catch (error: any) {
      console.error('Error voting:', error.message);
      toast.error('Failed to register vote');
    }
  };

  const updateIdeas = useCallback((newIdeas: Idea[]) => {
    setIdeas(newIdeas);
  }, []);

  useEffect(() => {
    if (ideas && ideas.length > 0) {
      fetchVoteStats();
    }
  }, [ideas, user?.id, fetchVoteStats]);

  return { userVotes, voteStats, loading, handleVote, updateIdeas };
};
