
import React, { useMemo } from 'react';
import { useCrowdfunding } from '@/context/CrowdfundingContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#4CAF50', '#F44336', '#9C27B0'];

const CrowdfundingAnalytics: React.FC = () => {
  const { state } = useCrowdfunding();
  const { projects, backers } = state;
  const { currencySymbol } = useCurrency();

  // Calculate key metrics
  const totalRaised = useMemo(() => {
    return projects.reduce((sum, project) => sum + project.raisedAmount, 0);
  }, [projects]);

  const totalTargeted = useMemo(() => {
    return projects.reduce((sum, project) => sum + project.targetAmount, 0);
  }, [projects]);

  const projectCount = projects.length;
  const activeProjectCount = useMemo(() => {
    const now = new Date();
    return projects.filter(p => !p.isFullyFunded && new Date(p.endDate) > now).length;
  }, [projects]);

  const backerCount = backers.length;
  const averageDonation = backerCount > 0 ? totalRaised / backerCount : 0;

  // Prepare data for bar chart (project funding status)
  const fundingStatusData = useMemo(() => {
    return projects.map(project => {
      const percentFunded = project.targetAmount > 0 
        ? Math.min(100, (project.raisedAmount / project.targetAmount) * 100)
        : 0;
        
      return {
        name: project.title.length > 20 ? project.title.substring(0, 17) + '...' : project.title,
        raised: project.raisedAmount,
        target: project.targetAmount,
        percentFunded
      };
    }).sort((a, b) => b.raised - a.raised).slice(0, 6); // Top 6 projects
  }, [projects]);

  // Prepare data for pie chart (backers by project)
  const backersDistributionData = useMemo(() => {
    const projectBackerCounts: { [key: string]: number } = {};
    
    // Count backers for each project
    backers.forEach(backer => {
      if (!projectBackerCounts[backer.projectId]) {
        projectBackerCounts[backer.projectId] = 0;
      }
      projectBackerCounts[backer.projectId]++;
    });
    
    // Format data for the pie chart
    return Object.entries(projectBackerCounts).map(([projectId, count]) => {
      const project = projects.find(p => p.id === projectId);
      return {
        name: project ? project.title : 'Unknown Project',
        value: count
      };
    });
  }, [backers, projects]);

  // Prepare data for timeline chart (funding activity)
  const activityTimelineData = useMemo(() => {
    const timelineMap: { [key: string]: number } = {};
    
    backers.forEach(backer => {
      const date = format(new Date(backer.timestamp), 'MMM dd');
      if (!timelineMap[date]) {
        timelineMap[date] = 0;
      }
      timelineMap[date] += backer.amount;
    });
    
    // Convert to array and sort by date
    return Object.entries(timelineMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-14); // Last 14 days
  }, [backers]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencySymbol}{totalRaised.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {totalTargeted > 0 ? `${Math.round((totalRaised / totalTargeted) * 100)}% of total target` : 'No target set'}
            </div>
            <Progress 
              value={totalTargeted > 0 ? (totalRaised / totalTargeted) * 100 : 0} 
              className="h-1 mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectCount}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {activeProjectCount} active projects
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Backers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backerCount}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {projectCount > 0 ? `${(backerCount / projectCount).toFixed(1)} backers per project` : 'No projects'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Contribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencySymbol}{averageDonation.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Per backer
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Project Funding Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {fundingStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={fundingStatusData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={70} 
                      tick={{ fontSize: 12 }} 
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${currencySymbol}${Number(value).toLocaleString()}`, 'Amount']}
                    />
                    <Bar dataKey="raised" fill="#8884d8" name="Raised" />
                    <Bar dataKey="target" fill="#82ca9d" name="Target" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No project data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Backers Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {backersDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={backersDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {backersDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} backers`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No backer data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funding Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {activityTimelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={activityTimelineData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${currencySymbol}${Number(value).toLocaleString()}`, 'Amount']} />
                  <Bar dataKey="amount" fill="#ff9800" name="Funding Amount" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">No activity data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CrowdfundingAnalytics;
