import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SkillTag from "@/components/ui/skill-tag";
import { ChevronRight, Calendar, UserPlus, MessageSquare, Loader2, BarChart2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// Define the User interface to match the API response
interface User {
  id: number;
  fullname?: string;
  displayName?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  teachSkills: string[];
  learnSkills: string[];
  completedSessions?: number;
  hoursTaught?: number;
  hoursLearned?: number;
  activeConnections?: number;
  rating?: number;
}

// Define the Session interface
interface Session {
  id: number;
  userId: number;
  partnerId: number;
  partnerName?: string;
  scheduledDate: string;
  duration: number;
  status: string;
  location: string;
  teachSkills?: string[];
  learnSkills?: string[];
  notes?: string;
  formattedDate?: string;
  title?: string;
  primarySkill?: string;
}

// Define the Match interface
interface Match {
  user: {
    id: number;
    fullname?: string;
    displayName?: string;
    avatar?: string;
    teachSkills?: string[];
    learnSkills?: string[];
    bio?: string;
  };
  matchingTeachSkills: string[]; // Skills they can teach you
  matchingLearnSkills: string[]; // Skills you can teach them
  matchScore: number;
}

// Helper function to get initials from a name
const getInitials = (name: string = "User") => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Helper function for fetching user data
const fetchUserData = async (): Promise<User> => {
  try {
    console.log('Dashboard: Fetching user data');
    const userData = await apiRequest<User>("GET", "/api/users/me");
    console.log('Dashboard: User data received:', userData);
    
    // Ensure skills arrays are initialized even if they're null or undefined
    if (!userData.teachSkills) userData.teachSkills = [];
    if (!userData.learnSkills) userData.learnSkills = [];
    
    return userData;
  } catch (error: any) {
    console.error('Dashboard: Error fetching user data:', error);
    if (error.message && error.message.includes('401')) {
      window.location.href = "/login";
    }
    throw error;
  }
};

export default function Dashboard() {
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  
  // Fetch user profile data including skills
  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
    refetch: refetchUserData
  } = useQuery<User>({
    queryKey: ["/api/users/me"],
    queryFn: fetchUserData,
    retry: 2,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch all sessions from API
  const {
    data: allSessions = [],
    isLoading: isLoadingUpcomingSessions,
    error: upcomingSessionsError,
    refetch: refetchUpcomingSessions
  } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
    queryFn: getQueryFn({ on401: "throw" }),
    retry: 2,
    retryDelay: 1000,
    staleTime: 2 * 60 * 1000, // 2 minutes
    onError: (error) => {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load your sessions. Please try again later.",
        variant: "destructive"
      });
    }
  });
  
  // Filter for upcoming sessions (sessions that haven't happened yet)
  const upcomingSessions = React.useMemo(() => {
    return allSessions
      .filter((session: Session) => {
        if (!session.scheduledDate) return false;
        try {
          const sessionDate = new Date(session.scheduledDate);
          return sessionDate > new Date(); // Only include future sessions
        } catch (e) {
          console.error('Error parsing session date:', e);
          return false;
        }
      })
      .sort((a, b) => {
        // Sort by date (earliest first)
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      })
      .slice(0, 5); // Limit to 5 upcoming sessions
  }, [allSessions]);
  
  // Fetch suggested matches from API
  const {
    data: potentialMatches = [],
    isLoading: isLoadingMatches,
    error: matchesError,
    refetch: refetchMatches
  } = useQuery<Match[]>({
    queryKey: ["/api/matches/suggested"],
    queryFn: async () => {
      try {
        const response = await apiRequest<Match[]>("GET", "/api/matches/suggested");
        console.log("Potential matches response:", response);
        return response;
      } catch (error) {
        console.error("Error fetching potential matches:", error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error) => {
      console.error('Error fetching matches:', error);
      toast({
        title: "Error",
        description: "Failed to load potential matches. Please try again later.",
        variant: "destructive"
      });
    }
  });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary dark:text-white">
            {`Welcome back, ${user?.displayName || user?.fullname || authUser?.displayName || authUser?.fullname || "Learner"}!`}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Here's a summary of your learning journey
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button asChild variant="outline" className="flex items-center gap-2">
            <Link href="/analytics">
              <BarChart2 className="h-4 w-4" />
              View Skill Analytics
            </Link>
          </Button>
        </div>
        <div className="mt-4 md:mt-0">
          <Link href="/matches">
            <Button className="bg-secondary hover:bg-secondary-dark dark:bg-light-blue dark:hover:bg-light-blue-dark text-white">
              Find New Partners
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content - left two-thirds */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-heading text-primary dark:text-white">Upcoming Sessions</CardTitle>
              <CardDescription>Your scheduled learning exchanges</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUpcomingSessions ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="w-full">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                      <div className="flex items-center">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-5 w-5 ml-2 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : upcomingSessionsError ? (
                <div className="text-center py-4 text-red-500">
                  <p>Failed to load upcoming sessions. Please try again.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      toast({
                        title: "Retrying",
                        description: "Attempting to reload your sessions...",
                      });
                      refetchUpcomingSessions();
                    }}
                    className="mt-2 w-full"
                  >
                    <Loader2 className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : upcomingSessions.length > 0 ? (
                <div className="space-y-4">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div>
                        <h3 className="font-medium">
                          {session.title || 
                           (session.teachSkills && session.teachSkills.length > 0 ? 
                             `${session.teachSkills[0]} Session` : 
                             "Learning Session")}
                        </h3>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <span>with {session.partnerName || 
                                (session.partnerId ? `Partner #${session.partnerId}` : 'Learning Partner')}</span>
                          <span className="mx-2">•</span>
                          <span>
                            {(() => {
                              try {
                                const date = new Date(session.scheduledDate);
                                return date.toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit'
                                });
                              } catch (e) {
                                return session.scheduledDate;
                              }
                            })()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Badge variant="secondary">
                          {session.primarySkill || 
                           (session.teachSkills && session.teachSkills.length > 0 ? session.teachSkills[0] : 
                            (session.learnSkills && session.learnSkills.length > 0 ? session.learnSkills[0] : 
                             'Learning Session'))}
                        </Badge>
                        <ChevronRight className="h-5 w-5 ml-2 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">No upcoming sessions</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    You don't have any scheduled sessions yet.
                  </p>
                  <Link href="/matches">
                    <Button className="w-full sm:w-auto">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Find Learning Partners
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Potential Matches */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-heading text-primary dark:text-white">Potential Matches</CardTitle>
              <CardDescription>People with complementary skills to yours</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMatches ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <Skeleton className="h-12 w-12 rounded-full mr-4" />
                          <div>
                            <Skeleton className="h-5 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2" />
                          </div>
                        </div>
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                      
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <Skeleton className="h-4 w-20 mb-2" />
                          <div className="flex flex-wrap gap-1">
                            <Skeleton className="h-6 w-16 rounded-full" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                          </div>
                        </div>
                        <div>
                          <Skeleton className="h-4 w-20 mb-2" />
                          <div className="flex flex-wrap gap-1">
                            <Skeleton className="h-6 w-16 rounded-full" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : matchesError ? (
                <div className="text-center py-4 text-red-500">
                  <p>Failed to load potential matches. Please try again.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      toast({
                        title: "Retrying",
                        description: "Attempting to reload potential matches...",
                      });
                      refetchMatches();
                    }}
                    className="mt-2 w-full"
                  >
                    <Loader2 className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : potentialMatches.length > 0 ? (
                <>
                  {potentialMatches.map((match) => (
                    <div key={match.user.id} className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <Avatar className="h-12 w-12 mr-4">
                            <AvatarImage src={match.user.avatar || ""} />
                            <AvatarFallback className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-white">
                              {match.user.fullname || match.user.displayName ? 
                                getInitials(match.user.fullname || match.user.displayName) : 
                                `U${match.user.id}`}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">
                              {match.user.fullname || match.user.displayName || `User ${match.user.id}`}
                            </h3>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Skills matched: {match.matchingTeachSkills.length + match.matchingLearnSkills.length}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="px-2 py-1">
                          {match.matchingTeachSkills.length + match.matchingLearnSkills.length} skills
                        </Badge>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Can teach you:</div>
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(match.matchingTeachSkills) && match.matchingTeachSkills.length > 0 ? (
                              match.matchingTeachSkills.map((skill: string) => (
                                <SkillTag key={skill} type="teach" size="sm">{skill}</SkillTag>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400">No skills listed</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Wants to learn:</div>
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(match.matchingLearnSkills) && match.matchingLearnSkills.length > 0 ? (
                              match.matchingLearnSkills.map((skill: string) => (
                                <SkillTag key={skill} type="learn" size="sm">{skill}</SkillTag>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400">No skills listed</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex justify-end">
                        <Button variant="outline" size="sm" className="mr-2">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                        <Button size="sm">
                          Request Session
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-4 text-center">
                    <Link href="/matches">
                      <Button className="w-full">
                        View All Matches
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <UserPlus className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">No matches found</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    We couldn't find any potential matches based on your skills.
                  </p>
                  <Link href="/settings?tab=skills">
                    <Button className="w-full sm:w-auto">
                      Update Your Skills
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar - right third */}
        <div className="space-y-8">
          {/* Your Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-heading text-primary dark:text-white">Your Skills</CardTitle>
              <CardDescription>What you teach and want to learn</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUser ? (
                <div className="flex justify-center items-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-gray-500">Loading your skills...</span>
                </div>
              ) : userError ? (
                <div className="text-center py-4 text-red-500">
                  <p>Failed to load skills. Please try again.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      toast({
                        title: "Retrying",
                        description: "Attempting to reload your skills...",
                      });
                      refetchUserData();
                    }}
                    className="mt-2 w-full"
                  >
                    <Loader2 className={`h-4 w-4 mr-2 ${isLoadingUser ? 'animate-spin' : ''}`} />
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Skills you teach:</h4>
                    <div className="flex flex-wrap gap-2 min-h-[32px]">
                      {user?.teachSkills && user.teachSkills.length > 0 ? (
                        user.teachSkills.map((skill) => (
                          <SkillTag key={skill} type="teach">{skill}</SkillTag>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400">You haven't added any teaching skills yet.</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Skills you want to learn:</h4>
                    <div className="flex flex-wrap gap-2 min-h-[32px]">
                      {user?.learnSkills && user.learnSkills.length > 0 ? (
                        user.learnSkills.map((skill) => (
                          <SkillTag key={skill} type="learn">{skill}</SkillTag>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400">You haven't added any learning skills yet.</p>
                      )}
                    </div>
                  </div>
                  <Link href="/settings?tab=skills">
                    <Button variant="outline" className="w-full mt-2">Edit Skills</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Learning Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-heading text-primary dark:text-white">Learning Stats</CardTitle>
              <CardDescription>Your progress summary</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUser ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex justify-between items-center">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  ))}
                  <Skeleton className="h-9 w-full mt-2" />
                </div>
              ) : userError ? (
                <div className="text-center py-4 text-red-500">
                  <p>Failed to load your stats. Please try again.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      toast({
                        title: "Retrying",
                        description: "Attempting to reload your stats...",
                      });
                      refetchUserData();
                    }}
                    className="mt-2 w-full"
                  >
                    <Loader2 className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Sessions completed</span>
                    <span className="font-medium">{user?.completedSessions || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Hours taught</span>
                    <span className="font-medium">{user?.hoursTaught || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Hours learned</span>
                    <span className="font-medium">{user?.hoursLearned || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Active connections</span>
                    <span className="font-medium">{user?.activeConnections || 0}</span>
                  </div>
                  <Link href="/stats">
                    <Button variant="outline" className="w-full mt-2">View Detailed Stats</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
