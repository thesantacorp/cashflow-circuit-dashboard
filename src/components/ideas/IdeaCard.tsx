
import { useState } from 'react';
import { Idea, Vote } from '@/integrations/supabase/customClient';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, ExternalLink, Info, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface IdeaCardProps {
  idea: Idea;
  userVote: Vote | undefined;
  upvotes: number;
  downvotes: number;
  onVote: (ideaId: string, voteType: 'upvote' | 'downvote') => void;
}

export const IdeaCard = ({ 
  idea, 
  userVote, 
  upvotes, 
  downvotes,
  onVote 
}: IdeaCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isImageError, setIsImageError] = useState(false);
  
  // Format the date for countdown display
  const formatCountdown = () => {
    if (!idea.countdown_timer) return 'TBA';
    
    const countdownDate = new Date(idea.countdown_timer);
    const now = new Date();
    
    // If date is in the past
    if (countdownDate < now) {
      return 'Released';
    }
    
    // Calculate remaining time
    const diffTime = Math.abs(countdownDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays < 30) {
      return `${diffDays} days`;
    } else {
      // Format as Month Day
      return countdownDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };
  
  const handleVote = (voteType: 'upvote' | 'downvote') => {
    if (!user) {
      toast.error('Please sign in to vote');
      navigate('/auth/login', { state: { from: '/ideas' } });
      return;
    }
    
    onVote(idea.id, voteType);
  };
  
  // Determine if user has voted for this idea
  const hasUpvoted = userVote?.vote_type === 'upvote';
  const hasDownvoted = userVote?.vote_type === 'downvote';
  
  // Calculate vote ratio for the progress bar (0-100)
  const totalVotes = upvotes + downvotes;
  const upvoteRatio = totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 50;
  
  return (
    <Card className="overflow-hidden flex flex-col h-full transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
              <Clock className="inline-block mr-1 h-3 w-3" />
              {formatCountdown()}
            </div>
          </div>
        </div>
        <CardTitle className="text-xl mt-2">{idea.name}</CardTitle>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <div className="min-h-[80px] bg-gradient-to-r from-orange-50 to-blue-50 rounded-lg p-4 mb-4">
          <p className="text-gray-700">{idea.description}</p>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3">
          {idea.live_project_link && (
            <a 
              href={idea.live_project_link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View Live
            </a>
          )}
          {idea.learn_more_link && (
            <a 
              href={idea.learn_more_link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs"
            >
              <Info className="h-3 w-3 mr-1" />
              Learn More
            </a>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2 pb-4 border-t">
        <div className="w-full">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-gray-500">
              {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
            </div>
            <div className="text-sm font-medium">
              {upvoteRatio}% positive
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
            <div 
              className="bg-green-500 h-1.5 rounded-full" 
              style={{ width: `${upvoteRatio}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "flex-1",
                hasUpvoted && "bg-green-100 border-green-300 text-green-800"
              )}
              onClick={() => handleVote('upvote')}
            >
              <ThumbsUp className={cn("h-4 w-4 mr-1", hasUpvoted && "fill-green-600")} />
              {upvotes}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "flex-1",
                hasDownvoted && "bg-red-100 border-red-300 text-red-800"
              )}
              onClick={() => handleVote('downvote')}
            >
              <ThumbsDown className={cn("h-4 w-4 mr-1", hasDownvoted && "fill-red-600")} />
              {downvotes}
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};
