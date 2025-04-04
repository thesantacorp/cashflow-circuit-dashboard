
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCrowdfunding } from '@/context/CrowdfundingContext';
import { useCurrency } from '@/context/CurrencyContext';
import { format, differenceInDays } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sprout, Calendar, ExternalLink, Users } from 'lucide-react';
import { ProjectStats } from '@/types/crowdfunding';

const GrowPage = () => {
  const { state: { projects, backers } } = useCrowdfunding();
  const { currencySymbol } = useCurrency();
  const navigate = useNavigate();
  const today = new Date();
  
  // Calculate project statistics
  const getProjectStats = (projectId: string, targetAmount: number, raisedAmount: number, endDate: string): ProjectStats => {
    const projectBackers = backers.filter(b => b.projectId === projectId);
    const daysLeft = Math.max(0, differenceInDays(new Date(endDate), today));
    const percentFunded = (raisedAmount / targetAmount) * 100;
    
    return {
      totalBackers: projectBackers.length,
      totalRaised: raisedAmount,
      percentFunded: Math.min(100, percentFunded),
      daysLeft
    };
  };

  const handleParticipateClick = (projectId: string) => {
    navigate(`/grow/${projectId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Sprout className="h-6 w-6 text-green-500 mr-2" />
        <h1 className="text-2xl font-bold">Grow Your Money</h1>
      </div>
      
      <p className="text-gray-600 mb-8">
        Explore vetted crowdfunding opportunities for verified businesses and startups. 
        Fund innovative projects and help them grow while potentially earning returns on your investment.
      </p>
      
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50 rounded-lg">
          <Sprout className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium mb-2">No opportunities available yet</h3>
          <p className="text-gray-500 max-w-md">
            Check back soon for exciting new investment opportunities and ventures to grow your money.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => {
            const stats = getProjectStats(
              project.id,
              project.targetAmount,
              project.raisedAmount,
              project.endDate
            );
            
            const isActive = !project.isFullyFunded && new Date(project.endDate) > today;
            
            return (
              <Card key={project.id} className="h-full flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{project.title}</CardTitle>
                    {project.isFullyFunded && (
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        Fully Funded
                      </span>
                    )}
                    {!project.isFullyFunded && stats.daysLeft === 0 && (
                      <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        Ended
                      </span>
                    )}
                  </div>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{currencySymbol}{project.raisedAmount.toLocaleString()}</span>
                      <span>{currencySymbol}{project.targetAmount.toLocaleString()}</span>
                    </div>
                    <Progress value={stats.percentFunded} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{stats.percentFunded.toFixed(0)}% funded</span>
                      {stats.daysLeft > 0 && !project.isFullyFunded ? (
                        <span>{stats.daysLeft} days left</span>
                      ) : (
                        <span>{project.isFullyFunded ? 'Goal reached' : 'Campaign ended'}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>
                        {format(new Date(project.startDate), 'MMM d')} - {format(new Date(project.endDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{stats.totalBackers} backers</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Button 
                    className="w-full" 
                    onClick={() => handleParticipateClick(project.id)}
                    disabled={!isActive}
                  >
                    {isActive ? 'Participate' : 'View Details'}
                  </Button>
                  
                  {project.externalLink && (
                    <Button variant="outline" className="w-full flex items-center" asChild>
                      <a href={project.externalLink} target="_blank" rel="noopener noreferrer">
                        Visit Project Website
                        <ExternalLink className="h-4 w-4 ml-1" />
                      </a>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GrowPage;
