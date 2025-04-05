
import { format } from 'date-fns';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@/components/ui/card';
import { Idea, VoteSummary } from '@/integrations/supabase/customClient';

interface AdminVotesStatsGridProps {
  ideas: Idea[];
  voteSummary: Record<string, VoteSummary>;
  loading: boolean;
}

export const AdminVotesStatsGrid = ({ ideas, voteSummary, loading }: AdminVotesStatsGridProps) => {
  if (loading || ideas.length === 0) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {ideas.map((idea) => {
        const votes = voteSummary[idea.id] || { upvotes: 0, downvotes: 0 };
        const totalVotes = votes.upvotes + votes.downvotes;
        const upvotePercentage = totalVotes > 0 ? Math.round((votes.upvotes / totalVotes) * 100) : 0;
        
        return (
          <Card key={idea.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{idea.name}</CardTitle>
              <CardDescription>{format(new Date(idea.countdown_timer), 'MMM d, yyyy')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span>Upvotes</span>
                    <span className="text-green-600 font-medium">{upvotePercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-500 h-2.5 rounded-full" 
                      style={{ width: `${upvotePercentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <ThumbsUp className="h-4 w-4 text-green-600 mr-1" />
                    <span>{votes.upvotes} upvotes</span>
                  </div>
                  <div className="flex items-center">
                    <ThumbsDown className="h-4 w-4 text-red-600 mr-1" />
                    <span>{votes.downvotes} downvotes</span>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Total: {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
