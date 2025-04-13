
import { format, formatDistanceToNow } from 'date-fns';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Clock, 
  ExternalLink, 
  Info,
  ChevronDown,
  ChevronUp,
  ImageIcon
} from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Idea, Vote } from '@/integrations/supabase/customClient';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Reset image states and preload when idea changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    
    // Only try to preload if there's an image URL
    if (idea.image_url) {
      // Create a fresh URL with timestamp to avoid caching issues
      let imageUrlWithTimestamp;
      try {
        const url = new URL(idea.image_url);
        url.searchParams.set('t', Date.now().toString());
        imageUrlWithTimestamp = url.toString();
      } catch (e) {
        // If URL parsing fails, append a timestamp manually
        const separator = idea.image_url.includes('?') ? '&' : '?';
        imageUrlWithTimestamp = `${idea.image_url}${separator}t=${Date.now()}`;
      }
      
      const img = new Image();
      img.onload = () => {
        setImageLoaded(true);
        setImageError(false);
      };
      img.onerror = () => {
        console.error(`Failed to load image for idea: ${idea.id}, URL: ${imageUrlWithTimestamp}`);
        setImageError(true);
        setImageLoaded(false);
      };
      img.src = imageUrlWithTimestamp;
    }
  }, [idea.id, idea.image_url]);
  
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

  // Function to get a properly formatted image URL with timestamp
  const getImageUrlWithTimestamp = (url: string) => {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('t', Date.now().toString());
      return urlObj.toString();
    } catch (e) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}t=${Date.now()}`;
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="aspect-video w-full overflow-hidden bg-gray-100 relative">
        {idea.image_url && !imageError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                <Skeleton className="h-full w-full absolute" />
                <ImageIcon className="h-10 w-10 text-gray-300 z-20" />
              </div>
            )}
            <img 
              src={idea.image_url ? getImageUrlWithTimestamp(idea.image_url) : ''}
              alt={idea.name || 'Idea image'} 
              className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                console.error(`Failed to load image for idea: ${idea.id}, URL: ${idea.image_url}`);
                setImageError(true);
              }}
            />
          </>
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
