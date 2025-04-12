
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface ChartDataItem {
  name: string;
  expenses: number;
  income: number;
}

interface CategoryItem {
  name: string;
  value: number;
}

interface DashboardChartsProps {
  monthlyData: ChartDataItem[];
  categoryData: CategoryItem[];
  currencySymbol: string;
  onCategorySelect?: (category: string | null) => void;
  selectedCategory?: string | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#6BCB77'];

const DashboardCharts: React.FC<DashboardChartsProps> = ({ 
  monthlyData, 
  categoryData, 
  currencySymbol,
  onCategorySelect,
  selectedCategory
}) => {
  // Calculate income vs. expense stats for the trend chart
  const trendData = monthlyData.map(item => {
    const balance = item.income - item.expenses;
    return {
      name: item.name,
      balance,
      savingsRate: item.income > 0 ? Math.round((balance / item.income) * 100) : 0
    };
  });

  const handlePieClick = (data: any, index: number) => {
    if (onCategorySelect) {
      const category = data.name;
      onCategorySelect(category);
    }
  };

  const handleClearFilter = () => {
    if (onCategorySelect) {
      onCategorySelect(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Income vs Expenses Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Transaction Volume</CardTitle>
          <CardDescription>Income vs Expenses over last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={monthlyData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`${currencySymbol}${value.toFixed(2)}`, '']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <Bar 
                  dataKey="income" 
                  name="Income" 
                  fill="#4CAF50" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="expenses" 
                  name="Expenses" 
                  fill="#FF5722" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Category Distribution Chart */}
      <Card>
        <CardHeader>
          <div className="flex flex-row justify-between items-center">
            <div>
              <CardTitle>Top Spending Categories</CardTitle>
              <CardDescription>Distribution by transaction volume</CardDescription>
            </div>
            {selectedCategory && (
              <Badge 
                variant="outline" 
                className="flex items-center gap-1 px-3 py-1 cursor-pointer hover:bg-secondary"
                onClick={handleClearFilter}
              >
                {selectedCategory} <X className="h-3 w-3" />
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  onClick={handlePieClick}
                  style={{ cursor: 'pointer' }}
                >
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      stroke={selectedCategory === entry.name ? '#000' : undefined}
                      strokeWidth={selectedCategory === entry.name ? 2 : 1}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${currencySymbol}${value.toFixed(2)}`, 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Savings Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Balance Trend</CardTitle>
          <CardDescription>Net Income (Income - Expenses) over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trendData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [
                    typeof value === 'number' ? `${currencySymbol}${value.toFixed(2)}` : value,
                    'Net Income'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Savings Rate Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Savings Rate</CardTitle>
          <CardDescription>Percentage of income saved each month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" />
                <YAxis unit="%" domain={[0, 100]} />
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, 'Savings Rate']}
                />
                <Line 
                  type="monotone" 
                  dataKey="savingsRate" 
                  stroke="#2196F3" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCharts;
