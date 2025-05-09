import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";

// Define interfaces for our analytics data
interface SkillTrend {
  name: string;
  count: number;
}

interface PairingStats {
  sent: number;
  accepted: number;
  declined: number;
  pending: number;
  mostMatchedSkill: string;
}

interface AnalyticsData {
  topLearnSkills: SkillTrend[];
  topTeachSkills: SkillTrend[];
  userPairingStats: PairingStats;
}

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch analytics data
  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
    queryFn: async () => {
      try {
        const response = await apiRequest<AnalyticsData>("GET", "/api/analytics");
        console.log("Analytics data response:", response);
        return response;
      } catch (error) {
        console.error("Error fetching analytics data:", error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 10 * 60 * 1000, // 10 minutes
    onError: (error) => {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data. Please try again later.",
        variant: "destructive"
      });
    }
  });

  // Format data for the pairing stats pie chart if data is available
  const pairingStatsData = data ? [
    { name: "Accepted", value: data.userPairingStats.accepted },
    { name: "Declined", value: data.userPairingStats.declined },
    { name: "Pending", value: data.userPairingStats.pending }
  ] : [];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-primary dark:text-white">
          Skill Trends & Analytics
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Discover platform-wide skill trends and your personal pairing statistics
        </p>
      </div>

      <Tabs defaultValue="platform" className="space-y-6">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="platform">Platform Trends</TabsTrigger>
          <TabsTrigger value="personal">Personal Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Learn Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Learning Skills</CardTitle>
                <CardDescription>Most in-demand skills users want to learn</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-[250px] w-full" />
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-red-500">Error loading data. Please try again later.</p>
                  </div>
                ) : !data || !data.topLearnSkills || data.topLearnSkills.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.topLearnSkills}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Top Teach Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Teaching Skills</CardTitle>
                <CardDescription>Most offered skills users can teach</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-[250px] w-full" />
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-red-500">Error loading data. Please try again later.</p>
                  </div>
                ) : !data || !data.topTeachSkills || data.topTeachSkills.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.topTeachSkills}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="personal" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pairing Request Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Your Pairing Requests</CardTitle>
                <CardDescription>Summary of your pairing activity</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-[250px] w-full" />
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <p className="text-red-500">Error loading data. Please try again later.</p>
                  </div>
                ) : !data || !data.userPairingStats ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <p className="text-gray-500">No pairing data available</p>
                  </div>
                ) : (
                  <div className="h-[300px]">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold">{data.userPairingStats.sent}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Total Sent</div>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold">{data.userPairingStats.accepted}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Accepted</div>
                      </div>
                    </div>
                    {pairingStatsData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="60%">
                        <PieChart>
                          <Pie
                            data={pairingStatsData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {pairingStatsData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[150px]">
                        <p className="text-gray-500">No pairing statistics to display</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Most Matched Skill */}
            <Card>
              <CardHeader>
                <CardTitle>Your Most Matched Skill</CardTitle>
                <CardDescription>The skill that appears most in your pairing requests</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-[250px] w-full" />
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <p className="text-red-500">Error loading data. Please try again later.</p>
                  </div>
                ) : !data || !data.userPairingStats || !data.userPairingStats.mostMatchedSkill ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <p className="text-gray-500">No skill match data available</p>
                  </div>
                ) : data.userPairingStats.mostMatchedSkill === "None" ? (
                  <div className="flex flex-col items-center justify-center h-[300px]">
                    <div className="text-6xl mb-4">-</div>
                    <p className="text-center text-gray-500 dark:text-gray-400 mb-2">
                      You don't have any matched skills yet
                    </p>
                    <p className="text-center text-gray-500 dark:text-gray-400">
                      Complete more pairing sessions to see your most matched skill
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px]">
                    <div className="text-8xl mb-4">
                      {data.userPairingStats.mostMatchedSkill === "JavaScript" ? "JS" :
                       data.userPairingStats.mostMatchedSkill === "Python" ? "Py" :
                       data.userPairingStats.mostMatchedSkill === "Machine Learning" ? "ML" :
                       data.userPairingStats.mostMatchedSkill.substring(0, 2)}
                    </div>
                    <Badge className="text-lg px-4 py-2 mb-2">{data.userPairingStats.mostMatchedSkill}</Badge>
                    <p className="text-center text-gray-500 dark:text-gray-400">
                      This skill appears most frequently in your successful pairings
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
