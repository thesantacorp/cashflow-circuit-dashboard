
import { useState } from 'react';
import { format } from 'date-fns';
import { 
  Edit,
  Trash2,
  Clock,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Idea } from '@/integrations/supabase/customClient';

interface AdminIdeasTableProps {
  ideas: Idea[];
  voteSummary: Record<string, {
    upvotes: number;
    downvotes: number;
  }>;
  onEditIdea: (idea: Idea) => void;
  onDeleteIdea: (id: string) => void;
  loading: boolean;
}

export const AdminIdeasTable = ({ 
  ideas,
  voteSummary,
  onEditIdea,
  onDeleteIdea,
  loading
}: AdminIdeasTableProps) => {
  if (loading || ideas.length === 0) return null;
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Countdown</TableHead>
            <TableHead>Votes</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ideas.map((idea) => {
            const votes = voteSummary[idea.id] || { upvotes: 0, downvotes: 0 };
            const countdown = new Date(idea.countdown_timer);
            const hasExpired = countdown < new Date();
            return (
              <TableRow key={idea.id}>
                <TableCell className="font-medium">{idea.name}</TableCell>
                <TableCell className={hasExpired ? 'text-red-500' : ''}>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {format(countdown, 'MMM d, yyyy')}
                    {hasExpired && ' (Expired)'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-green-600">
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      {votes.upvotes}
                    </div>
                    <div className="flex items-center text-red-600">
                      <ThumbsDown className="h-4 w-4 mr-1" />
                      {votes.downvotes}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(idea.created_at), 'MMM d, yyyy')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEditIdea(idea)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Idea</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{idea.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600"
                            onClick={() => onDeleteIdea(idea.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
