
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getSupabaseClient } from '@/utils/supabase/client';
import { Project } from '@/types/project';

export const useGrowProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<"all" | "active" | "expired">("all");

  const fetchProjects = async () => {
    setIsLoading(true);
    
    try {
      const supabase = getSupabaseClient();
      console.log('Fetching projects...');
      
      // Attempt to select projects with stronger error handling
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching projects:", error);
        
        // If table doesn't exist despite our initialization
        if (error.code === '42P01') {
          setError("Projects database needs setup");
          setProjects([]);
        } else {
          toast.error("Failed to load innovation projects", { 
            description: error.message || "Database error" 
          });
          setError("Failed to load projects");
          setProjects([]);
        }
      } else {
        // Process projects to add voting status from local storage
        const processedProjects = data.map(project => {
          const voteStatus = localStorage.getItem(`project_vote_${project.id}`);
          return {
            ...project,
            userVote: voteStatus ? parseInt(voteStatus) : 0
          };
        });
        setProjects(processedProjects);
        setError(null);
        
        console.log(`Successfully loaded ${processedProjects.length} projects`);
      }
    } catch (err) {
      console.error("Exception fetching projects:", err);
      toast.error("Failed to load innovation projects");
      setError("Failed to load projects");
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (projectId: string, voteType: 1 | 0 | -1) => {
    // Get current user vote from localStorage
    const currentVote = localStorage.getItem(`project_vote_${projectId}`);
    const numericCurrentVote = currentVote ? parseInt(currentVote) : 0;
    
    // If the user is clicking the same vote again, we'll reset it
    const newVote = numericCurrentVote === voteType ? 0 : voteType;
    
    // Update local storage right away (optimistic UI)
    localStorage.setItem(`project_vote_${projectId}`, newVote.toString());
    
    // Update local state for immediate UI feedback
    setProjects(prev => 
      prev.map(project => {
        if (project.id === projectId) {
          // Calculate vote count change
          return {
            ...project,
            userVote: newVote,
            upvotes: project.upvotes + (newVote === 1 ? 1 : 0) - (numericCurrentVote === 1 ? 1 : 0),
            downvotes: project.downvotes + (newVote === -1 ? 1 : 0) - (numericCurrentVote === -1 ? 1 : 0)
          };
        }
        return project;
      })
    );
    
    try {
      // Send vote to the server
      const supabase = getSupabaseClient();
      
      // Record the vote in the votes table
      const { error } = await supabase
        .from('project_votes')
        .upsert([{ 
          project_id: projectId, 
          user_uuid: localStorage.getItem('uuid') || 'anonymous',
          vote: newVote
        }], { 
          onConflict: 'project_id,user_uuid'
        });
      
      if (error) {
        console.error("Error recording vote:", error);
        toast.error("Failed to save your vote");
        // Rollback the optimistic update if server update fails
        localStorage.setItem(`project_vote_${projectId}`, currentVote || "0");
        fetchProjects(); // Refresh to get accurate data
      }
    } catch (err) {
      console.error("Exception recording vote:", err);
      toast.error("Failed to save your vote");
      localStorage.setItem(`project_vote_${projectId}`, currentVote || "0");
      fetchProjects();
    }
  };

  const getFilteredProjects = () => {
    if (isLoading) return [];
    
    switch (filterState) {
      case "active":
        return projects.filter(p => !p.expiration_date || new Date(p.expiration_date) > new Date());
      case "expired":
        return projects.filter(p => p.expiration_date && new Date(p.expiration_date) <= new Date());
      default:
        return projects;
    }
  };

  return {
    projects,
    isLoading,
    error,
    filterState,
    setFilterState,
    fetchProjects,
    handleVote,
    getFilteredProjects
  };
};
