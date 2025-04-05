
import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Clock, ExternalLink } from "lucide-react";
import { Project } from "@/types";
import ProjectCountdown from "./ProjectCountdown";
import { useCurrency } from "@/context/CurrencyContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface GrowProjectCardProps {
  project: Project;
  onVote: (projectId: string, voteType: 1 | 0 | -1) => void;
}

const GrowProjectCard: React.FC<GrowProjectCardProps> = ({ project, onVote }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { currencySymbol } = useCurrency();
  
  // Check if project is expired
  const isExpired = project.expiration_date && new Date(project.expiration_date) <= new Date();
  
  // Check if project is about to expire (within 24 hours)
  const isNearExpiry = project.expiration_date && 
    new Date(project.expiration_date).getTime() - new Date().getTime() < 86400000 && 
    !isExpired;

  return (
    <Card className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${
      isExpired ? 'opacity-70' : ''
    } ${isNearExpiry ? 'border-orange-400' : ''}`}>
      {project.image_url ? (
        <div className="h-48 w-full overflow-hidden">
          <img 
            src={project.image_url} 
            alt={project.name} 
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
          <p className="text-orange-400 text-lg font-medium">No image provided</p>
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold text-gray-800">{project.name}</h3>
          {project.expiration_date && (
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 mr-1 text-orange-600" />
              <ProjectCountdown expirationDate={project.expiration_date} />
            </div>
          )}
        </div>
        {project.funding_goal && (
          <p className="text-sm font-medium text-green-600">
            Funding Goal: {currencySymbol}{project.funding_goal.toLocaleString()}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="pb-3">
        <p className="text-gray-600 line-clamp-3">{project.description}</p>
        
        <Collapsible 
          open={isExpanded}
          onOpenChange={setIsExpanded}
          className="mt-2"
        >
          {project.more_details && (
            <>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-0 text-orange-600 hover:text-orange-700 hover:bg-transparent"
                >
                  {isExpanded ? "Show less" : "More details"}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 text-sm text-gray-600 animate-accordion-down">
                {project.more_details}
              </CollapsibleContent>
            </>
          )}
        </Collapsible>
      </CardContent>
      
      <CardFooter className="pt-0 flex flex-col gap-2">
        <div className="flex justify-between w-full">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className={`flex items-center gap-1 ${
                project.userVote === 1 
                  ? 'bg-green-50 text-green-600 border-green-200'
                  : 'text-gray-600'
              }`}
              onClick={() => onVote(project.id, project.userVote === 1 ? 0 : 1)}
              disabled={isExpired}
            >
              <ThumbsUp className="h-4 w-4" />
              <span>{project.upvotes || 0}</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className={`flex items-center gap-1 ${
                project.userVote === -1 
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'text-gray-600'
              }`}
              onClick={() => onVote(project.id, project.userVote === -1 ? 0 : -1)}
              disabled={isExpired}
            >
              <ThumbsDown className="h-4 w-4" />
              <span>{project.downvotes || 0}</span>
            </Button>
          </div>
          
          {project.live_link && (
            <Button 
              variant="default" 
              size="sm" 
              className="bg-orange-500 hover:bg-orange-600"
              asChild
            >
              <a href={project.live_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                <ExternalLink className="h-4 w-4" />
                <span>View</span>
              </a>
            </Button>
          )}
        </div>
        
        {isNearExpiry && !isExpired && (
          <p className="text-xs italic text-orange-600 mt-2">
            This project is ending soon! Vote now before it expires.
          </p>
        )}
        
        {isExpired && (
          <p className="text-xs italic text-gray-500 mt-2">
            This project has expired and is no longer accepting votes.
          </p>
        )}
      </CardFooter>
    </Card>
  );
};

export default GrowProjectCard;
