
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Idea, VoteSummary } from '@/integrations/supabase/customClient';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ensureStorageBucketExists, makeFilePublic } from '@/utils/supabase/client';

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

  const createBucketDirectly = async () => {
    try {
      // Create bucket directly using SQL or RPC
      console.log('Attempting to create ideas bucket directly via RPC...');
      
      // First try the RPC method
      const { error: rpcError } = await supabase.rpc('create_ideas_bucket_if_not_exists');
      
      if (rpcError) {
        console.error('RPC call failed:', rpcError);
        
        // Try direct SQL approach as fallback
        const { error: sqlError } = await supabase.query(`
          INSERT INTO storage.buckets (id, name, public)
          VALUES ('ideas', 'ideas', true)
          ON CONFLICT (id) DO NOTHING;
        `);
        
        if (sqlError) {
          console.error('Direct SQL approach failed:', sqlError);
          return false;
        }
        console.log('Direct SQL approach succeeded');
        return true;
      }
      
      console.log('RPC approach succeeded');
      return true;
    } catch (error) {
      console.error('Failed to create bucket directly:', error);
      return false;
    }
  };

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
      
      if (imageFile) {
        try {
          const bucketName = 'ideas';
          
          console.log('About to ensure bucket exists...');
          
          // First attempt: Create bucket directly via RPC/SQL
          const bucketCreatedDirectly = await createBucketDirectly();
          console.log('Direct bucket creation result:', bucketCreatedDirectly);
          
          // Second attempt: Use client-side approach as fallback
          if (!bucketCreatedDirectly) {
            console.log('Falling back to client-side bucket creation...');
            const bucketExists = await ensureStorageBucketExists(bucketName);
            
            if (!bucketExists) {
              console.error('Failed to ensure bucket exists - aborting upload');
              toast.error('Failed to save idea. Storage setup issue. Please try again or contact support.');
              setIsUploading(false);
              return;
            }
          }
          
          console.log('Bucket should exist now, proceeding with upload...');
          
          const fileExt = imageFile.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
          const filePath = `${fileName}`;
          
          console.log(`Uploading file to ${bucketName}/${filePath}`);
          
          const { data, error: uploadError } = await supabase
            .storage
            .from(bucketName)
            .upload(filePath, imageFile, {
              cacheControl: '3600',
              upsert: true
            });
            
          if (uploadError) {
            console.error('Error uploading image:', uploadError);
            throw uploadError;
          }
          
          console.log('File uploaded successfully:', data);
          
          await makeFilePublic(bucketName, filePath);
          
          const { data: { publicUrl } } = supabase
            .storage
            .from(bucketName)
            .getPublicUrl(filePath);
            
          console.log('Public URL:', publicUrl);
          finalImageUrl = publicUrl;
        } catch (uploadErr: any) {
          console.error('Error during image upload:', uploadErr);
          toast.error('Failed to upload image: ' + (uploadErr.message || 'Unknown error'));
          // Continue with idea creation even if image upload fails
        }
      }
      
      const formattedDate = new Date(countdownTimer).toISOString();
      
      if (editingIdea) {
        const { data, error } = await supabase
          .from('ideas')
          .update({
            name,
            description,
            image_url: finalImageUrl,
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
        const { data, error } = await supabase
          .from('ideas')
          .insert({
            name,
            description,
            image_url: finalImageUrl,
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
