
import { IdeaCard } from './IdeaCard';
import { Idea, Vote } from '@/integrations/supabase/customClient';

interface IdeasGridProps {
  ideas: Idea[];
  userVotes: Record<string, Vote>;
  voteStats: Record<string, {upvotes: number, downvotes: number}>;
  onVote: (ideaId: string, voteType: 'upvote' | 'downvote') => void;
}

export const IdeasGrid = ({ ideas, userVotes, voteStats, onVote }: IdeasGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {ideas.map((idea) => (
        <IdeaCard 
          key={idea.id} 
          idea={idea} 
          userVote={userVotes[idea.id]} 
          upvotes={voteStats[idea.id]?.upvotes || 0}
          downvotes={voteStats[idea.id]?.downvotes || 0}
          onVote={onVote}
        />
      ))}
    </div>
  );
};
