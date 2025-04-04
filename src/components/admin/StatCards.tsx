
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UsageStats {
  totalSessions: number;
  averageSessionDuration: number;
  uniqueUsers: number;
  lastActive: string;
  transactionsCount: number;
  categoriesCount: number;
}

interface StatCardsProps {
  usageStats: UsageStats;
}

const StatCards: React.FC<StatCardsProps> = ({ usageStats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{usageStats.uniqueUsers}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Last active: {usageStats.lastActive}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{usageStats.totalSessions}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Avg. session: {usageStats.averageSessionDuration} minutes
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{usageStats.transactionsCount}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Across {usageStats.categoriesCount} categories
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatCards;
