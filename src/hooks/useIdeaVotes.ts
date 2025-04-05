import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { customClient, Idea, Vote } from '@/integrations/supabase/customClient';

type VoteStats = Record<string, {upvotes: number, downvotes: number}>;

export const useIdeaVotes = () => {
  const { user } = useAuth();
  const [userVotes, setUserVotes] = useState<Record<string, Vote>>({});
  const [voteStats, setVoteStats] = useState<VoteStats>({});
  const [loading, setLoading] = useState(true);
  const [ideas, setIdeas] = useState<Idea[]>([]);

  const fetchVoteStats = async () => {
    try {
      if (ideas && ideas.length > 0) {
        const ideasStats: VoteStats = {};
        
        for (const idea of ideas) {
          const { data: upvotes, error: upvotesError } = await customClient.votes
            .select()
            .eq('idea_id', idea.id)
            .eq('vote_type', 'upvote');
            
          const { data: downvotes, error: downvotesError } = await customClient.votes
            .select()
            .eq('idea_id', idea.id)
            .eq('vote_type', 'downvote');
            
          if (upvotesError) throw upvotesError;
          if (downvotesError) throw downvotesError;
          
          ideasStats[idea.id] = {
            upvotes: upvotes?.length || 0,
            downvotes: downvotes?.length || 0
          };
        }
        
        setVoteStats(ideasStats);
      }
      
      if (user) {
        const { data: votesData, error: votesError } = await customClient.votes
          .select()
          .eq('user_id', user.id);
          
        if (votesError) throw votesError;
        
        const userVotesMap: Record<string, Vote> = {};
        if (votesData) {
          votesData.forEach((vote: any) => {
            userVotesMap[vote.idea_id] = vote as Vote;
          });
        }
        
        setUserVotes(userVotesMap);
      }
      
    } catch (error: any) {
      console.error('Error fetching vote stats:', error.message);
      toast.error('Failed to load voting data');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (ideaId: string, voteType: 'upvote' | 'downvote') => {
    if (!user) {
      toast.error('Please sign in to vote');
      return;
    }
    
    try {
      const existingVote = userVotes[ideaId];
      
      if (existingVote && existingVote.vote_type === voteType) {
        await customClient.votes
          .delete()
          .eq('id', existingVote.id);
          
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
        await customClient.votes
          .update({ vote_type: voteType })
          .eq('id', existingVote.id);
          
        setUserVotes({
          ...userVotes,
          [ideaId]: {
            ...existingVote,
            vote_type: voteType
          }
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
        const { data, error } = await customClient.votes
          .insert({
            idea_id: ideaId,
            user_id: user.id,
            vote_type: voteType
          })
          .select('*')
          .single();
          
        if (error) throw error;
        
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

  const updateIdeas = (newIdeas: Idea[]) => {
    setIdeas(newIdeas);
  };

  useEffect(() => {
    if (ideas && ideas.length > 0) {
      fetchVoteStats();
    } else {
      setLoading(false);
    }
  }, [ideas, user?.id]);

  return { userVotes, voteStats, loading, handleVote, updateIdeas };
};
