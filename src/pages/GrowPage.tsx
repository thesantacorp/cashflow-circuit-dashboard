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
import { CircleX, AlertTriangle, Loader2 } from "lucide-react";

const GrowPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterState, setFilterState] = useState<"all" | "active" | "expired">("all");
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initAttempts, setInitAttempts] = useState(0);
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
      console.log(`Initializing Grow tables (attempt ${initAttempts + 1})...`);
      
      const tablesInitialized = await ensureGrowTablesExist();
      setInitAttempts(prev => prev + 1);
      setIsInitializing(false);
      
      if (!tablesInitialized) {
        console.error("Failed to initialize Grow tables");
        setError("Failed to initialize projects database");
        setProjects([]);
        setIsLoading(false);
        return;
      }
      
      // Tables are now initialized, fetch projects
      await fetchProjects();
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
          setError("Projects database needs initialization");
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
          <div className="flex items-center justify-center mb-2">
            <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
            <p className="text-orange-800 font-medium">{error}</p>
          </div>
          <p className="text-sm text-orange-700 mb-3">
            {initAttempts > 1 
              ? "Multiple initialization attempts failed. The database might not be available."
              : "We'll try to create the necessary database tables."}
          </p>
          <Button 
            variant="outline"
            onClick={() => checkTablesAndFetchProjects()}
            className="bg-white border-orange-300 hover:bg-orange-50"
            disabled={isInitializing}
          >
            {isInitializing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Initializing...
              </>
            ) : (
              'Initialize & Try Again'
            )}
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
