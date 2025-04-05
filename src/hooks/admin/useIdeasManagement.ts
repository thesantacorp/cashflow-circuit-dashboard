
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { customClient, Idea, VoteSummary } from '@/integrations/supabase/customClient';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

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

  // Verify user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        navigate('/');
        return;
      }
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', user.id)
          .single();
          
        // Simple admin check (replace with a proper role-based system in production)
        if (data && (data.email === 'SupErAdmIn@example.com' || data.full_name === 'SupErAdmIn')) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          navigate('/');
          toast.error('You do not have permission to access this page');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        navigate('/');
      }
    };
    
    checkAdminStatus();
  }, [user, navigate]);

  // Fetch ideas and vote summaries
  const fetchIdeas = async () => {
    if (!isAdmin) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await customClient.ideas
        .select()
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setIdeas(data || []);
      
      // Fetch vote summaries for each idea
      if (data && data.length > 0) {
        const voteStats: Record<string, VoteSummary> = {};
        
        for (const idea of data) {
          const { data: upvotes, error: upvotesError } = await customClient.votes
            .select()
            .eq('idea_id', idea.id)
            .eq('vote_type', 'upvote');
            
          const { data: downvotes, error: downvotesError } = await customClient.votes
            .select()
            .eq('idea_id', idea.id)
            .eq('vote_type', 'downvote');
            
          if (upvotesError) throw upvotesError;
          if (downvotesError) throw downvotesError;
          
          voteStats[idea.id] = {
            idea_id: idea.id,
            upvotes: upvotes?.length || 0,
            downvotes: downvotes?.length || 0
          };
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

  // Handle form submission
  const handleFormSubmit = async (formData: {
    name: string;
    description: string;
    imageFile: File | null;
    imageUrl: string | null;
    countdownTimer: string;
    liveProjectLink: string;
    learnMoreLink: string;
  }) => {
    const { name, description, imageFile, imageUrl, countdownTimer, liveProjectLink, learnMoreLink } = formData;
    
    if (!name || !description || !countdownTimer) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setIsUploading(true);
      
      let finalImageUrl = imageUrl;
      
      // If a new image file is selected, upload it
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `ideas/${fileName}`;
        
        // Get pre-signed URL for upload
        const { data, error: urlError } = await supabase
          .storage
          .from('ideas')
          .createSignedUploadUrl(filePath);
          
        if (urlError) throw urlError;
        
        // Upload file using signed URL
        const uploadResponse = await fetch(data.signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': imageFile.type },
          body: imageFile
        });
        
        if (!uploadResponse.ok) throw new Error('Failed to upload image');
        
        // Get public URL of uploaded image
        const { data: { publicUrl } } = supabase
          .storage
          .from('ideas')
          .getPublicUrl(filePath);
          
        finalImageUrl = publicUrl;
      }
      
      // Format the date
      const formattedDate = new Date(countdownTimer).toISOString();
      
      if (editingIdea) {
        // Update existing idea
        const { error } = await customClient.ideas
          .update({
            name,
            description,
            image_url: finalImageUrl,
            countdown_timer: formattedDate,
            live_project_link: liveProjectLink || null,
            learn_more_link: learnMoreLink || null
          })
          .eq('id', editingIdea.id);
          
        if (error) throw error;
        
        toast.success('Idea updated successfully');
      } else {
        // Create new idea
        const { error } = await customClient.ideas
          .insert({
            name,
            description,
            image_url: finalImageUrl,
            countdown_timer: formattedDate,
            live_project_link: liveProjectLink || null,
            learn_more_link: learnMoreLink || null,
            created_by: user?.id
          });
          
        if (error) throw error;
        
        toast.success('Idea created successfully');
      }
      
      // Reset form and fetch updated ideas
      setEditingIdea(null);
      setDialogOpen(false);
      fetchIdeas();
      
    } catch (error: any) {
      console.error('Error saving idea:', error.message);
      toast.error('Failed to save idea');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDeleteIdea = async (id: string) => {
    try {
      const { error } = await customClient.ideas
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success('Idea deleted successfully');
      fetchIdeas();
    } catch (error: any) {
      console.error('Error deleting idea:', error.message);
      toast.error('Failed to delete idea');
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
