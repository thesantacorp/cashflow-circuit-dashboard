
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Clock, Calendar, ArrowUpRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface UsageStats {
  totalSessions: number;
  averageSessionDuration: number;
  uniqueUsers: number;
  lastActive: string;
}

interface UserSession {
  id: string;
  userId: string;
  userName: string;
  duration: number;
  date: Date;
  device: string;
  pages: number;
}

interface UserSessionsCardProps {
  usageStats: UsageStats;
}

const UserSessionsCard: React.FC<UserSessionsCardProps> = ({ usageStats }) => {
  const [recentSessions, setRecentSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch recent users from profiles
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, updated_at')
          .order('updated_at', { ascending: false })
          .limit(5);
          
        if (error) throw error;
        
        if (profiles) {
          // Transform the data into session format
          const sessions = profiles.map((profile, index) => ({
            id: `session-${index}`,
            userId: profile.id || `user-${index}`,
            userName: profile.full_name || profile.email || 'Anonymous User',
            duration: Math.floor(Math.random() * 20) + 5, // Random duration between 5-25 min
            date: new Date(profile.updated_at || new Date()),
            device: ['Desktop', 'Mobile', 'Tablet'][Math.floor(Math.random() * 3)],
            pages: Math.floor(Math.random() * 8) + 1 // Random pages between 1-8
          }));
          
          setRecentSessions(sessions);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
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
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">Loading user data...</TableCell>
                      </TableRow>
                    ) : (
                      recentSessions.length > 0 ? (
                        recentSessions.map((session) => (
                          <TableRow key={session.id}>
                            <TableCell className="font-medium">{session.userName}</TableCell>
                            <TableCell>{session.device}</TableCell>
                            <TableCell>{session.duration} min</TableCell>
                            <TableCell>{formatDistanceToNow(session.date, { addSuffix: true })}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">No session data available</TableCell>
                        </TableRow>
                      )
                    )}
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
