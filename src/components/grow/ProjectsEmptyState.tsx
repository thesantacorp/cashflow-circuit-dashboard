
import React from "react";

interface ProjectsEmptyStateProps {
  message?: string;
}

const ProjectsEmptyState: React.FC<ProjectsEmptyStateProps> = ({ 
  message = "No Ideas Available Yet\nCheck back soon for a collection of exciting new ideas."
}) => {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center mb-6">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="32" 
          height="32" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="text-orange-500"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 16v-4"></path>
          <path d="M12 8h.01"></path>
        </svg>
      </div>
      {message.split('\n').map((line, index) => (
        <p 
          key={index} 
          className={index === 0 ? "text-xl font-semibold text-gray-800 mb-2" : "text-gray-500"}
        >
          {line}
        </p>
      ))}
    </div>
  );
};

export default ProjectsEmptyState;
