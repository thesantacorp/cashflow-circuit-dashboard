
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Sessions</CardTitle>
        <CardDescription>
          Activity patterns and engagement
        </CardDescription>
      </CardHeader>
      <CardContent>
        {usageStats.totalSessions > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 border-b">
              <div>
                <h3 className="font-medium">Session Statistics</h3>
                <p className="text-sm text-muted-foreground">
                  {usageStats.totalSessions} total sessions from {usageStats.uniqueUsers} unique users
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <div className="flex justify-between items-center p-3 border-b">
              <div>
                <h3 className="font-medium">Average Session Duration</h3>
                <p className="text-sm text-muted-foreground">
                  {usageStats.averageSessionDuration} minutes per session
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <div className="flex justify-between items-center p-3">
              <div>
                <h3 className="font-medium">Latest Activity</h3>
                <p className="text-sm text-muted-foreground">
                  Last active: {usageStats.lastActive}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        ) : (
          <p className="text-center py-8 text-muted-foreground">
            No session data available.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default UserSessionsCard;
