
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

  // Enhanced function to fetch ideas and properly process image URLs
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
      
      // Process the image URLs to ensure they're properly formatted
      const processedData = data?.map(idea => {
        // Only add the timestamp if it doesn't already have one
        if (!idea.image_url) return idea;
        
        // Parse the URL to see if it already has a timestamp or other query params
        try {
          const url = new URL(idea.image_url);
          // Add or update the timestamp parameter to force refresh
          url.searchParams.set('t', Date.now().toString());
          return { ...idea, image_url: url.toString() };
        } catch (e) {
          // If the URL is invalid, just append a timestamp
          const separator = idea.image_url.includes('?') ? '&' : '?';
          return { ...idea, image_url: `${idea.image_url}${separator}t=${Date.now()}` };
        }
      }) || [];
      
      setIdeas(processedData);
      
      if (processedData.length > 0) {
        const voteStats: Record<string, VoteSummary> = {};
        
        for (const idea of processedData) {
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

  // Improved function to create the storage bucket and ensure it's public
  const createBucketDirectly = async () => {
    try {      
      console.log('Ensuring storage bucket exists...');
      // Create the bucket and make it public
      const bucketCreated = await ensureStorageBucketExists('ideas', true);
      console.log('Bucket setup result:', bucketCreated);
      return bucketCreated;
    } catch (error) {
      console.error('Failed to create bucket directly:', error);
      // Try an alternative approach - direct SQL
      try {
        // Try to insert the bucket directly if the function failed
        const { error: bucketError } = await supabase.rpc('create_storage_bucket', {
          bucket_id: 'ideas',
          bucket_public: true
        });
        
        if (bucketError) {
          console.error('Failed direct bucket creation too:', bucketError);
          toast.error('Storage setup issues. Will try to continue anyway.');
        } else {
          console.log('Created bucket via direct SQL');
          return true;
        }
      } catch (sqlError) {
        console.error('SQL bucket creation failed:', sqlError);
      }
      
      // Return true to allow continuing anyway
      return true;
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
      
      let finalImageUrl = null;
      
      // Handle image URL
      if (imageFile) {
        try {
          const bucketName = 'ideas';
          
          console.log('About to ensure bucket exists...');
          
          const bucketCreated = await createBucketDirectly();
          console.log('Bucket creation result:', bucketCreated);
          
          // Continue even if bucket "creation" failed - it might already exist
          console.log('Proceeding with upload...');
          
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
          
          try {
            await makeFilePublic(bucketName, filePath);
          } catch (publicErr) {
            console.warn('Non-critical error making file public:', publicErr);
            // Continue anyway as this is not critical
          }
          
          const { data: { publicUrl } } = supabase
            .storage
            .from(bucketName)
            .getPublicUrl(filePath);
            
          console.log('Public URL:', publicUrl);
          
          // Ensure the URL has a timestamp to prevent caching
          const urlWithTimestamp = new URL(publicUrl);
          urlWithTimestamp.searchParams.set('t', Date.now().toString());
          finalImageUrl = urlWithTimestamp.toString();
        } catch (uploadErr: any) {
          console.error('Error during image upload:', uploadErr);
          toast.error('Failed to upload image: ' + (uploadErr.message || 'Unknown error'));
          // Continue without image rather than failing completely
          console.log('Continuing without image...');
        }
      } else if (imageUrl) {
        // Process existing URL to ensure it has a timestamp
        try {
          const url = new URL(imageUrl);
          // Update the timestamp or add it if it doesn't exist
          url.searchParams.set('t', Date.now().toString());
          finalImageUrl = url.toString();
        } catch (e) {
          // If the URL is invalid, just use it as is with a timestamp appended
          const separator = imageUrl.includes('?') ? '&' : '?';
          finalImageUrl = `${imageUrl}${separator}t=${Date.now()}`;
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
    // Process the image URL to ensure it has a fresh timestamp
    let updatedImageUrl = idea.image_url;
    if (updatedImageUrl) {
      try {
        const url = new URL(updatedImageUrl);
        url.searchParams.set('t', Date.now().toString());
        updatedImageUrl = url.toString();
      } catch (e) {
        const separator = updatedImageUrl.includes('?') ? '&' : '?';
        updatedImageUrl = `${updatedImageUrl}${separator}t=${Date.now()}`;
      }
    }
    
    setEditingIdea({
      ...idea,
      image_url: updatedImageUrl
    });
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
