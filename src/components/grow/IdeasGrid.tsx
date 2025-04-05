
import React from 'react';
import { format } from 'date-fns';
import { ProductIdea, ProjectStats } from '@/types/crowdfunding';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ExternalLink, ThumbsUp, ThumbsDown, Sprout } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface IdeasGridProps {
  ideas: ProductIdea[];
  onVote: (ideaId: string, isUpvote: boolean) => void;
  getVoteType: (ideaId: string) => boolean | undefined;
  getProjectStats: (ideaId: string) => ProjectStats;
}

const IdeasGrid: React.FC<IdeasGridProps> = ({ 
  ideas, 
  onVote, 
  getVoteType, 
  getProjectStats 
}) => {
  const navigate = useNavigate();

  const handleViewDetails = (ideaId: string) => {
    navigate(`/grow/${ideaId}`);
  };

  if (ideas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50 rounded-lg">
        <Sprout className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-xl font-medium mb-2">No Ideas Available Yet</h3>
        <p className="text-gray-500 max-w-md">
          Check back soon for a collection of exciting new ideas.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {ideas.map(idea => {
        const stats = getProjectStats(idea.id);
        const userVoteType = getVoteType(idea.id);
        const currencySymbol = idea.currencySymbol || "$";
        
        return (
          <Card key={idea.id} className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl">{idea.title}</CardTitle>
              <CardDescription>{idea.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="flex-grow">
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Posted on {format(new Date(idea.createdAt), 'MMM d, yyyy')}</span>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md mt-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="font-medium mr-1">Score:</span> 
                      <span className={stats.score > 0 ? "text-green-600" : stats.score < 0 ? "text-red-600" : ""}>
                        {stats.score}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {stats.totalVotes} total votes
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-2">
              <div className="flex justify-between w-full mb-2">
                <Button 
                  variant={userVoteType === true ? "default" : "outline"} 
                  size="sm" 
                  className="flex-1 mr-1"
                  onClick={() => onVote(idea.id, true)}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  <span>{stats.upvotes}</span>
                </Button>
                <Button 
                  variant={userVoteType === false ? "default" : "outline"} 
                  size="sm" 
                  className="flex-1 ml-1"
                  onClick={() => onVote(idea.id, false)}
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  <span>{stats.downvotes}</span>
                </Button>
              </div>
              
              <Button 
                className="w-full" 
                onClick={() => handleViewDetails(idea.id)}
              >
                View Details
              </Button>
              
              {idea.externalLink && (
                <Button variant="outline" className="w-full flex items-center" asChild>
                  <a href={idea.externalLink} target="_blank" rel="noopener noreferrer">
                    Visit Project Website
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </a>
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};

export default IdeasGrid;
