
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCrowdfunding } from '@/context/CrowdfundingContext';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, ExternalLink, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const ProjectDetailsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { 
    getIdeaById, 
    addVote, 
    removeVote, 
    getVoteType 
  } = useCrowdfunding();
  const navigate = useNavigate();
  
  const idea = projectId ? getIdeaById(projectId) : undefined;
  
  React.useEffect(() => {
    if (!idea) {
      navigate('/grow');
    }
  }, [idea, navigate]);
  
  if (!idea) {
    return <div>Loading...</div>;
  }
  
  const userVoteType = getVoteType(idea.id);
  const score = idea.upvotes - idea.downvotes;
  
  const handleBackClick = () => {
    navigate('/grow');
  };
  
  const handleVote = async (isUpvote: boolean) => {
    try {
      // If already voted the same way, remove the vote
      if (userVoteType === isUpvote) {
        await removeVote(idea.id);
      } 
      // If voted differently or hasn't voted, add new vote
      else {
        await addVote(idea.id, isUpvote);
      }
    } catch (error) {
      toast.error('Failed to register vote');
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        onClick={handleBackClick}
        className="mb-6 pl-0 flex items-center"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Ideas
      </Button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{idea.title}</h1>
            <p className="text-lg text-gray-600 mb-4">{idea.description}</p>
            
            <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Posted on {format(new Date(idea.createdAt), 'MMM d, yyyy')}</span>
              </div>
            </div>
            
            {idea.externalLink && (
              <Button variant="outline" className="flex items-center mb-6" asChild>
                <a href={idea.externalLink} target="_blank" rel="noopener noreferrer">
                  Visit Project Website
                  <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </Button>
            )}
          </div>
          
          <div className="prose max-w-none">
            <h2 className="text-xl font-bold mb-4">Idea Details</h2>
            <div className="whitespace-pre-wrap">{idea.detailedDescription}</div>
          </div>
        </div>
        
        <div>
          <Card className="sticky top-4">
            <CardContent className="pt-6">
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Current Score</h3>
                  <span className={`text-xl font-bold ${score > 0 ? "text-green-600" : score < 0 ? "text-red-600" : ""}`}>
                    {score}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{idea.upvotes} upvotes</span>
                  <span>{idea.downvotes} downvotes</span>
                </div>
              </div>
              
              <div className="flex gap-2 mb-6">
                <Button 
                  variant={userVoteType === true ? "default" : "outline"} 
                  className="flex-1"
                  onClick={() => handleVote(true)}
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Upvote
                </Button>
                <Button 
                  variant={userVoteType === false ? "destructive" : "outline"} 
                  className="flex-1"
                  onClick={() => handleVote(false)}
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Downvote
                </Button>
              </div>
              
              <div className="text-sm text-gray-500">
                <p className="mb-2">Your vote helps us identify the most promising ideas.</p>
                <p>This idea was posted using {idea.currency} ({idea.currencySymbol}) as its reference currency.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
