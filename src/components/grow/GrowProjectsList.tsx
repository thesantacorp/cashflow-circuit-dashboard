
import React from "react";
import GrowProjectCard from "./GrowProjectCard";
import { Project } from "@/types";

interface GrowProjectsListProps {
  projects: Project[];
  onVote: (projectId: string, voteType: 1 | 0 | -1) => void;
}

const GrowProjectsList: React.FC<GrowProjectsListProps> = ({ projects, onVote }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <GrowProjectCard
          key={project.id}
          project={project}
          onVote={onVote}
        />
      ))}
    </div>
  );
};

export default GrowProjectsList;
