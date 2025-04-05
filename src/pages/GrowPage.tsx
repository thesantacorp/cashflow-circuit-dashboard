import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSupabaseClient } from "@/utils/supabase/client";
import GrowProjectsList from "@/components/grow/GrowProjectsList";
import GrowPageHeader from "@/components/grow/GrowPageHeader";
import { Project } from "@/types/project";
import ProjectsLoadingState from "@/components/grow/ProjectsLoadingState";
import ProjectsEmptyState from "@/components/grow/ProjectsEmptyState";
import { ensureGrowTablesExist } from "@/utils/supabase/grow";

const GrowPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterState, setFilterState] = useState<"all" | "active" | "expired">("all");
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    checkTablesAndFetchProjects();
  }, []);

  const checkTablesAndFetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First, check if the tables exist and create them if needed
      setIsInitializing(true);
      const tablesInitialized = await ensureGrowTablesExist();
      setIsInitializing(false);
      
      if (!tablesInitialized) {
        console.error("Failed to initialize Grow tables");
        setError("Failed to initialize projects database");
        setProjects([]);
        setIsLoading(false);
        return;
      }
      
      // Tables are now initialized, fetch projects
      fetchProjects();
    } catch (err) {
      console.error("Error checking/initializing tables:", err);
      setError("Failed to initialize projects database");
      setProjects([]);
      setIsLoading(false);
      setIsInitializing(false);
    }
  };

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = getSupabaseClient();
      
      // First, check if the projects table exists
      const { error: tableCheckError } = await supabase
        .from('projects')
        .select('id')
        .limit(1);
        
      if (tableCheckError && tableCheckError.code === '42P01') {
        // Table doesn't exist - try to initialize it again
        console.error("Projects table doesn't exist:", tableCheckError);
        const initialized = await ensureGrowTablesExist();
        
        if (!initialized) {
          setProjects([]);
          setError("Projects database needs initialization");
          setIsLoading(false);
          return;
        }
      }
      
      let query = supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filterState === "active") {
        const now = new Date().toISOString();
        query = query.or(`expiration_date.gt.${now},expiration_date.is.null`);
      } else if (filterState === "expired") {
        const now = new Date().toISOString();
        query = query.lt('expiration_date', now);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching projects:", error);
        toast.error("Failed to load innovation projects", { 
          description: error.message || "Database error" 
        });
        setError("Failed to load projects");
        setProjects([]);
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
          const voteDelta = newVote - numericCurrentVote;
          
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
  
  const filteredProjects = isLoading ? [] : projects;

  return (
    <div className="container mx-auto py-6 px-4">
      <GrowPageHeader />
      
      {error && (
        <div className="my-6 p-4 bg-orange-50 border border-orange-200 rounded-lg text-center">
          <p className="text-orange-800 mb-2">{error}</p>
          <Button 
            variant="outline"
            onClick={() => checkTablesAndFetchProjects()}
            className="bg-white border-orange-300 hover:bg-orange-50"
            disabled={isInitializing}
          >
            {isInitializing ? 'Initializing...' : 'Initialize & Try Again'}
          </Button>
        </div>
      )}
      
      <Tabs 
        defaultValue="all" 
        className="mt-6"
        onValueChange={(value) => {
          setFilterState(value as "all" | "active" | "expired");
          fetchProjects();
        }}
      >
        <TabsList>
          <TabsTrigger value="all">All Ideas</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <ProjectsLoadingState />
          ) : filteredProjects.length === 0 ? (
            <ProjectsEmptyState message={error ? "No projects found. Try again later." : undefined} />
          ) : (
            <GrowProjectsList projects={filteredProjects} onVote={handleVote} />
          )}
        </TabsContent>
        
        <TabsContent value="active" className="mt-6">
          {isLoading ? (
            <ProjectsLoadingState />
          ) : filteredProjects.filter(p => !p.expiration_date || new Date(p.expiration_date) > new Date()).length === 0 ? (
            <ProjectsEmptyState message={error ? "No active projects found. Try again later." : undefined} />
          ) : (
            <GrowProjectsList 
              projects={filteredProjects.filter(p => !p.expiration_date || new Date(p.expiration_date) > new Date())}
              onVote={handleVote} 
            />
          )}
        </TabsContent>
        
        <TabsContent value="expired" className="mt-6">
          {isLoading ? (
            <ProjectsLoadingState />
          ) : filteredProjects.filter(p => p.expiration_date && new Date(p.expiration_date) <= new Date()).length === 0 ? (
            <ProjectsEmptyState message={error ? "No expired projects found. Try again later." : "No expired ideas available."} />
          ) : (
            <GrowProjectsList 
              projects={filteredProjects.filter(p => p.expiration_date && new Date(p.expiration_date) <= new Date())}
              onVote={handleVote} 
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GrowPage;
