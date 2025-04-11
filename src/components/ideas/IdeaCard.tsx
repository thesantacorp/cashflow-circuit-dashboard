
import { format, formatDistanceToNow } from 'date-fns';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Clock, 
  ExternalLink, 
  Info,
  ChevronDown,
  ChevronUp 
} from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Idea, Vote } from '@/integrations/supabase/customClient';
import { useState } from 'react';

interface IdeaCardProps {
  idea: Idea;
  userVote?: Vote;
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
  const [showFullDescription, setShowFullDescription] = useState(false);
  
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

  const toggleDescription = () => {
    setShowFullDescription(!showFullDescription);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
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
        
        <div className="relative">
          <p className={`text-gray-600 mb-4 ${showFullDescription ? '' : 'line-clamp-3'}`}>
            {idea.description}
          </p>
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-0 h-6 text-sm flex items-center text-gray-500 hover:text-gray-700"
            onClick={toggleDescription}
          >
            {showFullDescription ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show more
              </>
            )}
          </Button>
        </div>
        
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
              className={userVote?.vote_type === 'upvote' 
                ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                : ''}
              onClick={() => onVote(idea.id, 'upvote')}
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              <span>{upvotes || 0}</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className={userVote?.vote_type === 'downvote' 
                ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
                : ''}
              onClick={() => onVote(idea.id, 'downvote')}
            >
              <ThumbsDown className="h-4 w-4 mr-1" />
              <span>{downvotes || 0}</span>
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
  );
};
