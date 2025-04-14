
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Idea, VoteSummary } from '@/integrations/supabase/customClient';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { typeSafeFrom } from '@/utils/supabase/client';

export const useIdeasManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [voteSummary, setVoteSummary] = useState<Record<string, VoteSummary>>({});
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const adminAuth = sessionStorage.getItem('adminAuthenticated');
      
      if (adminAuth !== 'true') {
        setIsAdmin(false);
        toast.error('Admin authentication required');
        navigate('/admin/dashboard');
        return;
      }
      
      setIsAdmin(true);
    };
    
    checkAdminStatus();
  }, [user, navigate]);

  const fetchIdeas = async () => {
    if (!isAdmin) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('ideas')
        .select()
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching ideas:', error);
        toast.error('Failed to fetch ideas: ' + error.message);
        setLoading(false);
        return;
      }
      
      setIdeas(data || []);
      
      if (data && data.length > 0) {
        const voteStats: Record<string, VoteSummary> = {};
        
        for (const idea of data) {
          try {
            const { data: upvotes, error: upvotesError } = await supabase
              .from('votes')
              .select()
              .eq('idea_id', idea.id)
              .eq('vote_type', 'upvote');
              
            const { data: downvotes, error: downvotesError } = await supabase
              .from('votes')
              .select()
              .eq('idea_id', idea.id)
              .eq('vote_type', 'downvote');
              
            if (upvotesError) {
              console.error('Error fetching upvotes:', upvotesError);
              continue;
            }
            if (downvotesError) {
              console.error('Error fetching downvotes:', downvotesError);
              continue;
            }
            
            voteStats[idea.id] = {
              idea_id: idea.id,
              upvotes: upvotes?.length || 0,
              downvotes: downvotes?.length || 0
            };
          } catch (err) {
            console.error(`Error processing votes for idea ${idea.id}:`, err);
          }
        }
        
        setVoteSummary(voteStats);
      }
      
    } catch (error: any) {
      console.error('Error fetching ideas:', error.message);
      toast.error('Failed to fetch ideas');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (isAdmin) {
      fetchIdeas();
    }
  }, [isAdmin]);

  const handleFormSubmit = async (formData: {
    name: string;
    description: string;
    countdownTimer: string;
    liveProjectLink: string;
    learnMoreLink: string;
  }) => {
    const { name, description, countdownTimer, liveProjectLink, learnMoreLink } = formData;
    
    if (!name || !description || !countdownTimer) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setIsUploading(true);
      
      const formattedDate = new Date(countdownTimer).toISOString();
      
      if (editingIdea) {
        const { data, error } = await supabase.from('ideas')
          .update({
            name,
            description,
            image_url: null, // Set to null to remove any existing image
            countdown_timer: formattedDate,
            live_project_link: liveProjectLink || null,
            learn_more_link: learnMoreLink || null
          })
          .eq('id', editingIdea.id)
          .select();
          
        if (error) {
          console.error('Error updating idea:', error);
          throw error;
        }
        
        toast.success('Idea updated successfully');
      } else {
        const { data, error } = await supabase.from('ideas')
          .insert({
            name,
            description,
            image_url: null, // No image
            countdown_timer: formattedDate,
            live_project_link: liveProjectLink || null,
            learn_more_link: learnMoreLink || null,
            created_by: user?.id
          })
          .select();
          
        if (error) {
          console.error('Error creating idea:', error);
          throw error;
        }
        
        toast.success('Idea created successfully');
      }
      
      setEditingIdea(null);
      setDialogOpen(false);
      fetchIdeas();
      
    } catch (error: any) {
      console.error('Error saving idea:', error.message);
      toast.error('Failed to save idea: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDeleteIdea = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('Error deleting idea:', error);
        throw error;
      }
      
      toast.success('Idea deleted successfully');
      fetchIdeas();
    } catch (error: any) {
      console.error('Error deleting idea:', error.message);
      toast.error('Failed to delete idea: ' + error.message);
    }
  };
  
  const handleEditIdea = (idea: Idea) => {
    setEditingIdea(idea);
    setDialogOpen(true);
  };
  
  const handleNewIdea = () => {
    setEditingIdea(null);
    setDialogOpen(true);
  };

  return {
    ideas,
    voteSummary,
    loading,
    isAdmin,
    dialogOpen,
    setDialogOpen,
    isUploading,
    editingIdea,
    handleFormSubmit,
    handleDeleteIdea,
    handleEditIdea,
    handleNewIdea
  };
};
