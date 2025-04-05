
import React from 'react';
import { useCrowdfunding } from '@/context/CrowdfundingContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

const ProductIdeasOverview: React.FC = () => {
  const { state, deleteIdea } = useCrowdfunding();
  const { ideas } = state;
  const isMobile = useIsMobile();
  
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this idea?')) {
      deleteIdea(id);
    }
  };

  return (
    <Card className={isMobile ? "mx-0 px-0" : ""}>
      <CardHeader className={isMobile ? "px-3" : ""}>
        <CardTitle>Product Ideas Management</CardTitle>
      </CardHeader>
      <CardContent className={isMobile ? "px-3" : ""}>
        {ideas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No product ideas have been submitted yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {ideas.map(idea => (
              <Card key={idea.id} className="overflow-hidden">
                <div className={`p-3 sm:p-6`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold line-clamp-2">{idea.title}</h3>
                    <div className="flex gap-2 ml-2 shrink-0">
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="h-8 w-8" 
                        onClick={() => handleDelete(idea.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-muted-foreground text-sm mb-4 line-clamp-3">{idea.description}</div>
                  
                  <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between'} items-start sm:items-center`}>
                    <div className="flex gap-4 mb-2 sm:mb-0">
                      <div className="flex items-center">
                        <ThumbsUp className="h-4 w-4 mr-1 text-green-500" />
                        <span>{idea.upvotes}</span>
                      </div>
                      <div className="flex items-center">
                        <ThumbsDown className="h-4 w-4 mr-1 text-red-500" />
                        <span>{idea.downvotes}</span>
                      </div>
                    </div>
                    
                    <Badge variant="outline" className="text-xs">
                      Posted {format(new Date(idea.createdAt), 'MMM d, yyyy')}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductIdeasOverview;
