
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Clock, 
  ExternalLink, 
  Info, 
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

interface Idea {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  countdown_timer: string;
  live_project_link: string | null;
  learn_more_link: string | null;
  created_at: string;
}

interface Vote {
  id: string;
  idea_id: string;
  vote_type: 'upvote' | 'downvote';
}

const IdeasPage = () => {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, Vote>>({});
  const [voteStats, setVoteStats] = useState<Record<string, {upvotes: number, downvotes: number}>>({});
  const [loading, setLoading] = useState(true);

  const fetchIdeas = async () => {
    try {
      const { data: ideasData, error: ideasError } = await supabase
        .from('ideas')
        .select('*')
        .order('countdown_timer', { ascending: true });
      
      if (ideasError) throw ideasError;
      
      setIdeas(ideasData || []);
      
      // Fetch vote statistics for each idea
      if (ideasData && ideasData.length > 0) {
        const ideasStats: Record<string, {upvotes: number, downvotes: number}> = {};
        
        for (const idea of ideasData) {
          const { data: upvotes, error: upvotesError } = await supabase
            .from('votes')
            .select('id')
            .eq('idea_id', idea.id)
            .eq('vote_type', 'upvote');
            
          const { data: downvotes, error: downvotesError } = await supabase
            .from('votes')
            .select('id')
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
      
      // If user is logged in, fetch their votes
      if (user) {
        const { data: votesData, error: votesError } = await supabase
          .from('votes')
          .select('*')
          .eq('user_id', user.id);
          
        if (votesError) throw votesError;
        
        const userVotesMap: Record<string, Vote> = {};
        if (votesData) {
          votesData.forEach((vote: Vote) => {
            userVotesMap[vote.idea_id] = vote;
          });
        }
        
        setUserVotes(userVotesMap);
      }
      
    } catch (error: any) {
      console.error('Error fetching ideas:', error.message);
      toast.error('Failed to load ideas');
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
      
      // If there's an existing vote of the same type, remove it (toggle off)
      if (existingVote && existingVote.vote_type === voteType) {
        await supabase
          .from('votes')
          .delete()
          .eq('id', existingVote.id);
          
        // Update local state
        const newUserVotes = { ...userVotes };
        delete newUserVotes[ideaId];
        setUserVotes(newUserVotes);
        
        // Update vote stats
        setVoteStats(prev => ({
          ...prev,
          [ideaId]: {
            ...prev[ideaId],
            [voteType === 'upvote' ? 'upvotes' : 'downvotes']: Math.max(0, prev[ideaId][voteType === 'upvote' ? 'upvotes' : 'downvotes'] - 1)
          }
        }));
        
        toast.success('Vote removed');
      } 
      // If there's an existing vote of different type, update it
      else if (existingVote) {
        await supabase
          .from('votes')
          .update({ vote_type: voteType })
          .eq('id', existingVote.id);
          
        // Update local state
        setUserVotes({
          ...userVotes,
          [ideaId]: {
            ...existingVote,
            vote_type: voteType
          }
        });
        
        // Update vote stats
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
      // If there's no existing vote, create a new one
      else {
        const { data, error } = await supabase
          .from('votes')
          .insert({
            idea_id: ideaId,
            user_id: user.id,
            vote_type: voteType
          })
          .select('*')
          .single();
          
        if (error) throw error;
        
        // Update local state
        setUserVotes({
          ...userVotes,
          [ideaId]: data
        });
        
        // Update vote stats
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

  const getTimeRemaining = (dateString: string) => {
    const targetDate = new Date(dateString);
    const now = new Date();
    
    if (targetDate <= now) {
      return "Expired";
    }
    
    return formatDistanceToNow(targetDate, { addSuffix: true });
  };
  
  const getStatusBadge = (dateString: string) => {
    const targetDate = new Date(dateString);
    const now = new Date();
    const remainingDays = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (remainingDays <= 0) {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (remainingDays <= 3) {
      return <Badge variant="destructive">Ending Soon</Badge>;
    } else if (remainingDays <= 7) {
      return <Badge className="bg-amber-500 hover:bg-amber-600">Closing Soon</Badge>;
    } else {
      return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
        <p className="mt-4 text-lg">Loading ideas...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Community Ideas
        </h1>
      </div>
      
      {ideas.length === 0 ? (
        <div className="bg-orange-50 p-8 rounded-lg border border-orange-100 text-center">
          <p className="text-lg text-gray-700">No ideas available at the moment.</p>
          <p className="text-sm text-gray-500 mt-2">Check back later for exciting new ideas!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map((idea) => (
            <Card key={idea.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="aspect-video w-full overflow-hidden bg-gray-100">
                {idea.image_url ? (
                  <img 
                    src={idea.image_url} 
                    alt={idea.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-orange-100">
                    <Info className="h-10 w-10 text-orange-300" />
                  </div>
                )}
              </div>
              
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-bold text-gray-800">{idea.name}</h2>
                  {getStatusBadge(idea.countdown_timer)}
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-3">{idea.description}</p>
                
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>
                    {getTimeRemaining(idea.countdown_timer)} · {format(new Date(idea.countdown_timer), 'MMM d, yyyy')}
                  </span>
                </div>
              </CardContent>
              
              <CardFooter className="border-t pt-4 flex flex-col gap-4">
                <div className="flex items-center justify-between w-full">
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className={userVotes[idea.id]?.vote_type === 'upvote' 
                        ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                        : ''}
                      onClick={() => handleVote(idea.id, 'upvote')}
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      <span>{voteStats[idea.id]?.upvotes || 0}</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className={userVotes[idea.id]?.vote_type === 'downvote' 
                        ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
                        : ''}
                      onClick={() => handleVote(idea.id, 'downvote')}
                    >
                      <ThumbsDown className="h-4 w-4 mr-1" />
                      <span>{voteStats[idea.id]?.downvotes || 0}</span>
                    </Button>
                  </div>
                
                  <div className="flex gap-2">
                    {idea.learn_more_link && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={idea.learn_more_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                          <Info className="h-4 w-4" />
                          <span className="sr-only md:not-sr-only md:inline-block">Details</span>
                        </a>
                      </Button>
                    )}
                  
                    {idea.live_project_link && (
                      <Button variant="default" size="sm" className="bg-orange-500 hover:bg-orange-600" asChild>
                        <a href={idea.live_project_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                          <ExternalLink className="h-4 w-4" />
                          <span className="sr-only md:not-sr-only md:inline-block">View</span>
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default IdeasPage;
