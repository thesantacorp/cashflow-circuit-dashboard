
import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import GrowProjectsList from "./GrowProjectsList";
import ProjectsLoadingState from "./ProjectsLoadingState";
import ProjectsEmptyState from "./ProjectsEmptyState";
import { Project } from "@/types/project";

interface GrowTabsContentProps {
  activeTab: string;
  isLoading: boolean;
  projects: Project[];
  error: string | null;
  onVote: (projectId: string, voteType: 1 | 0 | -1) => void;
}

const GrowTabsContent: React.FC<GrowTabsContentProps> = ({
  activeTab,
  isLoading,
  projects,
  error,
  onVote
}) => {
  // Helper function to filter projects based on active tab
  const getFilteredProjects = () => {
    switch (activeTab) {
      case "active":
        return projects.filter(p => !p.expiration_date || new Date(p.expiration_date) > new Date());
      case "expired":
        return projects.filter(p => p.expiration_date && new Date(p.expiration_date) <= new Date());
      default:
        return projects;
    }
  };

  const filteredProjects = getFilteredProjects();
  
  return (
    <TabsContent value={activeTab} className="mt-6">
      {isLoading ? (
        <ProjectsLoadingState />
      ) : filteredProjects.length === 0 ? (
        <ProjectsEmptyState 
          message={error 
            ? "No projects found. Try again later." 
            : activeTab === "expired" 
              ? "No expired ideas available."
              : undefined
          } 
        />
      ) : (
        <GrowProjectsList 
          projects={filteredProjects} 
          onVote={onVote} 
        />
      )}
    </TabsContent>
  );
};

export default GrowTabsContent;
