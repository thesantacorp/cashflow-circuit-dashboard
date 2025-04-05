
import React, { useState } from 'react';
import { useCrowdfunding } from '@/context/CrowdfundingContext';
import { Sprout, Trophy } from 'lucide-react';
import { ProjectStats } from '@/types/crowdfunding';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IdeasGrid from '@/components/grow/IdeasGrid';
import ProjectGrid from '@/components/grow/ProjectGrid';

const GrowPage = () => {
  const { 
    state: { ideas, votes, projects }, 
    addVote, 
    removeVote, 
    getVoteType 
  } = useCrowdfunding();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("ideas");
  
  // Calculate project statistics
  const getProjectStats = (ideaId: string): ProjectStats => {
    const idea = ideas.find(i => i.id === ideaId);
    
    if (!idea) {
      return {
        totalVotes: 0,
        upvotes: 0,
        downvotes: 0,
        score: 0
      };
    }
    
    return {
      totalVotes: idea.upvotes + idea.downvotes,
      upvotes: idea.upvotes,
      downvotes: idea.downvotes,
      score: idea.upvotes - idea.downvotes
    };
  };
  
  const handleVote = async (ideaId: string, isUpvote: boolean) => {
    try {
      const currentVoteType = getVoteType(ideaId);
      
      // If already voted the same way, remove the vote
      if (currentVoteType === isUpvote) {
        await removeVote(ideaId);
      } 
      // If voted differently or hasn't voted, add new vote
      else {
        await addVote(ideaId, isUpvote);
      }
    } catch (error) {
      toast.error('Failed to register vote');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Sprout className="h-6 w-6 text-green-500 mr-2" />
        <h1 className="text-2xl font-bold">Spark Innovation</h1>
      </div>
      
      <p className="text-gray-600 mb-8">
        Discover new Ideas and Projects. Explore a curated list of innovative ideas, back active projects, and vote on concepts you believe have potential.
      </p>

      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="ideas">Community Ideas</TabsTrigger>
          <TabsTrigger value="projects">Active Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="ideas">
          <IdeasGrid 
            ideas={ideas} 
            onVote={handleVote}
            getVoteType={getVoteType}
            getProjectStats={getProjectStats}
          />
        </TabsContent>

        <TabsContent value="projects">
          <ProjectGrid projects={projects} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GrowPage;
