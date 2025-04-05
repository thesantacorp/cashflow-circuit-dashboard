
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { IdeasGrid } from "@/components/ideas/IdeasGrid";
import { IdeasLoading } from "@/components/ideas/IdeasLoading";
import { useIdeaVotes } from "@/hooks/useIdeaVotes";
import { EmptyIdeasState } from "@/components/ideas/EmptyIdeasState";
import { customClient, Idea } from "@/integrations/supabase/customClient";
import { toast } from "sonner";

const IdeasPage = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { userVotes, voteStats, loading: votesLoading, handleVote, updateIdeas } = useIdeaVotes();

  // Fetch ideas on component mount
  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        const { data, error } = await customClient.ideas
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        setIdeas(data || []);
        // Update the ideas in useIdeaVotes hook
        updateIdeas(data || []);
      } catch (err) {
        console.error('Error fetching ideas:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch ideas'));
        toast.error('Failed to load ideas');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchIdeas();
  }, [updateIdeas]);

  const isPageLoading = isLoading || votesLoading;

  return (
    <div className="container py-8 max-w-7xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Ideas you can execute</h1>
        <p className="text-lg font-bold mb-2">at the snap of a finger</p>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover and jump on ready made SAAS products and business ideas, build generational wealth
        </p>
      </div>

      {isPageLoading ? (
        <IdeasLoading />
      ) : error ? (
        <Card className="w-full p-6">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600">Error loading ideas. Please try again later.</p>
            </div>
          </CardContent>
        </Card>
      ) : ideas.length === 0 ? (
        <EmptyIdeasState />
      ) : (
        <IdeasGrid 
          ideas={ideas} 
          userVotes={userVotes} 
          voteStats={voteStats} 
          onVote={handleVote} 
        />
      )}
    </div>
  );
};

export default IdeasPage;
