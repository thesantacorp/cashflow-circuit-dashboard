
import React from 'react';
import { format } from 'date-fns';
import { CrowdfundingProject } from '@/types/crowdfunding';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ExternalLink, Users, Trophy } from 'lucide-react';

interface ProjectGridProps {
  projects: CrowdfundingProject[];
}

const ProjectGrid: React.FC<ProjectGridProps> = ({ projects }) => {
  // Calculate percentage of funding for projects
  const getFundingPercentage = (project: CrowdfundingProject) => {
    return Math.min(100, Math.round((project.raisedAmount / project.targetAmount) * 100));
  };

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50 rounded-lg">
        <Trophy className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-xl font-medium mb-2">No Active Projects Yet</h3>
        <p className="text-gray-500 max-w-md">
          Check back soon for projects you can support and help grow.
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map(project => {
        const fundingPercentage = getFundingPercentage(project);
        
        return (
          <Card key={project.id} className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl">{project.title}</CardTitle>
              <CardDescription>{project.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="flex-grow">
              <div className="space-y-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Ends on {format(new Date(project.endDate), 'MMM d, yyyy')}</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Funding Progress</span>
                    <span className="font-medium">{fundingPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full" 
                      style={{ width: `${fundingPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="font-medium">
                      {project.currencySymbol}{project.raisedAmount.toLocaleString()}
                    </span>
                    <span className="text-gray-500">
                      of {project.currencySymbol}{project.targetAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-gray-600">
                    {Math.floor(Math.random() * 50) + 5} backers
                  </span>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-2">
              <Button 
                className="w-full" 
                variant={project.isFullyFunded ? "outline" : "default"}
                disabled={project.isFullyFunded}
              >
                {project.isFullyFunded ? "Fully Funded!" : "Support Project"}
              </Button>
              
              {project.externalLink && (
                <Button variant="outline" className="w-full flex items-center" asChild>
                  <a href={project.externalLink} target="_blank" rel="noopener noreferrer">
                    Visit Project Site
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </a>
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};

export default ProjectGrid;
