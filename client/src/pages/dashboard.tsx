import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SkillTag from "@/components/ui/skill-tag";
import { ChevronRight, Calendar, UserPlus, MessageSquare, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

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
  rating?: number;
}

// Helper function for fetching user data
const fetchUserData = async (): Promise<User> => {
  try {
    const response = await apiRequest("GET", "/api/users/me");
    const userData = await response.json();
    
    // Ensure skills arrays are initialized even if they're null or undefined
    if (!userData.teachSkills) userData.teachSkills = [];
    if (!userData.learnSkills) userData.learnSkills = [];
    
    return userData as User;
  } catch (error: any) {
    if (error.status === 401) {
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
    error: userError
  } = useQuery<User>({
    queryKey: ["/api/users/me"],
    queryFn: fetchUserData,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mock data for upcoming sessions (would be replaced with real API call)
  const upcomingSessions = [
    { id: 1, title: "French Conversation", with: "Thomas L.", date: "Today, 3:00 PM", skill: "French" },
    { id: 2, title: "JavaScript Basics", with: "Sarah J.", date: "Tomorrow, 5:00 PM", skill: "JavaScript" },
  ];
  
  // Mock data for potential matches (would be replaced with real API call)
  const potentialMatches = [
    { 
      id: 1, 
      name: "Alex W.", 
      teachSkills: ["Python", "Machine Learning"], 
      learnSkills: ["Spanish", "Public Speaking"],
      matchPercentage: 85,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    },
    { 
      id: 2, 
      name: "Maya R.", 
      teachSkills: ["Graphic Design", "Photography"], 
      learnSkills: ["Web Development", "Data Visualization"],
      matchPercentage: 78,
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    },
  ];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary dark:text-white">
            {`Welcome back, ${user?.displayName || user?.fullname || authUser?.displayName || authUser?.fullname || "Learner"}!`}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Here's what's happening with your learning journey.</p>
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
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-heading text-primary dark:text-white">Upcoming Sessions</CardTitle>
                <CardDescription>Your scheduled learning exchanges</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                View Calendar
              </Button>
            </CardHeader>
            <CardContent>
              {upcomingSessions.length > 0 ? (
                <div className="space-y-4">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <div className="font-medium">{session.title}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">with {session.with} • {session.date}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <SkillTag type="learn">{session.skill}</SkillTag>
                        <Button size="sm" variant="ghost" className="p-1 h-auto">
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 dark:text-gray-400">No upcoming sessions scheduled</p>
                  <Button variant="link" className="mt-2">Schedule a session</Button>
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
              {potentialMatches.map((match) => (
                <div key={match.id} className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <img 
                        src={match.avatar} 
                        alt={match.name} 
                        className="h-12 w-12 rounded-full object-cover mr-4" 
                      />
                      <div>
                        <h4 className="font-medium text-primary dark:text-white">{match.name}</h4>
                        <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                          {match.matchPercentage}% Match
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Message
                      </Button>
                      <Button size="sm" className="flex items-center">
                        <UserPlus className="h-4 w-4 mr-1" />
                        Connect
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Can teach you:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {match.teachSkills.map((skill) => (
                          <SkillTag key={skill} type="learn">{skill}</SkillTag>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Wants to learn:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {match.learnSkills.map((skill) => (
                          <SkillTag key={skill} type="teach">{skill}</SkillTag>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="text-center mt-4">
                <Button variant="link">View All Matches</Button>
              </div>
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
                    variant="link" 
                    onClick={() => window.location.reload()}
                    className="mt-2"
                  >
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
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Sessions completed</span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Hours taught</span>
                  <span className="font-medium">8.5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Hours learned</span>
                  <span className="font-medium">10.5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Active connections</span>
                  <span className="font-medium">4</span>
                </div>
                <Button variant="outline" className="w-full mt-2">View Detailed Stats</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
