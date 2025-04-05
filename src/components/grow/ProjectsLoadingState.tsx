
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const ProjectsLoadingState: React.FC = () => {
  // Create an array of 6 elements for the skeleton cards
  const skeletonArray = Array(6).fill(0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {skeletonArray.map((_, index) => (
        <div key={index} className="border rounded-lg overflow-hidden">
          <Skeleton className="h-48 w-full" />
          <div className="p-4">
            <Skeleton className="h-7 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3 mb-4" />
            <div className="flex justify-between">
              <div className="flex gap-2">
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-9 w-16" />
              </div>
              <Skeleton className="h-9 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectsLoadingState;
