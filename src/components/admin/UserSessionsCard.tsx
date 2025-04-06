
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Clock, Calendar, ArrowUpRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface UsageStats {
  totalSessions: number;
  averageSessionDuration: number;
  uniqueUsers: number;
  lastActive: string;
}

interface UserSessionsCardProps {
  usageStats: UsageStats;
}

const UserSessionsCard: React.FC<UserSessionsCardProps> = ({ usageStats }) => {
  // Generate mock session data for visualization
  const generateMockSessions = () => {
    const sessions = [];
    const now = new Date();
    
    for (let i = 0; i < Math.min(5, usageStats.totalSessions); i++) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      sessions.push({
        id: `session-${i}`,
        userId: `user-${i % 3}`,
        duration: Math.floor(Math.random() * 30) + 5,
        date: date,
        device: ['Desktop', 'Mobile', 'Tablet'][Math.floor(Math.random() * 3)],
        pages: Math.floor(Math.random() * 10) + 1
      });
    }
    
    return sessions;
  };
  
  const recentSessions = generateMockSessions();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5 text-primary" />
          User Activity
        </CardTitle>
        <CardDescription>
          Session insights and engagement metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        {usageStats.totalSessions > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Total Sessions</h3>
                  <Calendar className="h-4 w-4 text-gray-500" />
                </div>
                <p className="text-2xl font-bold mt-1">{usageStats.totalSessions}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Average Duration</h3>
                  <Clock className="h-4 w-4 text-gray-500" />
                </div>
                <p className="text-2xl font-bold mt-1">{usageStats.averageSessionDuration} min</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Unique Users</h3>
                  <Users className="h-4 w-4 text-gray-500" />
                </div>
                <p className="text-2xl font-bold mt-1">{usageStats.uniqueUsers}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-sm mb-3">Recent Sessions</h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">User {session.userId.split('-')[1]}</TableCell>
                        <TableCell>{session.device}</TableCell>
                        <TableCell>{session.duration} min</TableCell>
                        <TableCell>{formatDistanceToNow(session.date, { addSuffix: true })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-4 text-sm text-muted-foreground flex items-center">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                Last activity: {usageStats.lastActive}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-muted-foreground">
              No session data available
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserSessionsCard;
