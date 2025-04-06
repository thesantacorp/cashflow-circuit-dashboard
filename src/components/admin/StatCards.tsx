
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, Receipt, FolderTree } from "lucide-react";

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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Users className="h-4 w-4 mr-2 text-blue-500" />
            Total Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{usageStats.uniqueUsers}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Last active: {usageStats.lastActive}
          </p>
        </CardContent>
      </Card>
      
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Clock className="h-4 w-4 mr-2 text-green-500" />
            Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{usageStats.totalSessions}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Avg. {usageStats.averageSessionDuration} min/session
          </p>
        </CardContent>
      </Card>
      
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Receipt className="h-4 w-4 mr-2 text-orange-500" />
            Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{usageStats.transactionsCount}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {usageStats.uniqueUsers > 0 
              ? `${(usageStats.transactionsCount / usageStats.uniqueUsers).toFixed(1)} per user`
              : 'No active users'}
          </p>
        </CardContent>
      </Card>
      
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <FolderTree className="h-4 w-4 mr-2 text-purple-500" />
            Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{usageStats.categoriesCount}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Total spending categories
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatCards;
