import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import SkillTag from "@/components/ui/skill-tag";
import { Filter, RefreshCw, UserPlus, ArrowRightLeft } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";
import UserMatchCard from "@/components/matching/user-match-card";
import RequestCard from "@/components/matching/request-card";
import { SuggestedMatch, PairingRequestWithUsers } from "@/types/matching";

export default function MatchesPage() {
  const [activeTab, setActiveTab] = useState("suggested");

  // Fetch suggested matches
  const { 
    data: suggestedMatches, 
    isLoading: isLoadingSuggested,
    isError: isErrorSuggested,
    refetch: refetchSuggested
  } = useQuery({
    queryKey: ['/api/matches/suggested'],
    queryFn: getQueryFn<SuggestedMatch[]>({ on401: "throw" })
  });

  // Fetch pairing requests
  const { 
    data: pairingRequests, 
    isLoading: isLoadingRequests,
    isError: isErrorRequests,
    refetch: refetchRequests
  } = useQuery({
    queryKey: ['/api/pairing-requests'],
    queryFn: getQueryFn<PairingRequestWithUsers[]>({ on401: "throw" })
  });

  // Separate incoming and outgoing requests
  const incomingRequests = pairingRequests?.filter(req => req.recipient.id === (user?.id)) || [];
  const outgoingRequests = pairingRequests?.filter(req => req.requester.id === (user?.id)) || [];
  
  // Get the current user (for filtering requests)
  const { data: user } = useQuery({
    queryKey: ['/api/users/me'],
    queryFn: getQueryFn({ on401: "throw" })
  });

  // Handle refetch of data
  const handleRefresh = () => {
    if (activeTab === "suggested") {
      refetchSuggested();
    } else {
      refetchRequests();
    }
  };
  
  // Calculate pending request counts for badges
  const pendingIncomingCount = incomingRequests.filter(req => req.status === "pending").length;
  const pendingOutgoingCount = outgoingRequests.filter(req => req.status === "pending").length;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary dark:text-white">Matching</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Find and connect with learning partners</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="suggested" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger 
            value="suggested" 
            className="flex items-center justify-center"
          >
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Suggested Matches
          </TabsTrigger>
          <TabsTrigger 
            value="requests" 
            className="flex items-center justify-center"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Requests
            {(pendingIncomingCount > 0 || pendingOutgoingCount > 0) && (
              <Badge variant="secondary" className="ml-2">
                {pendingIncomingCount + pendingOutgoingCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="suggested" className="mt-6">
          {isLoadingSuggested ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="ml-4">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24 mt-1" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                      <div className="mt-4 space-y-3">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : isErrorSuggested ? (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px]">
                <div className="text-red-500 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-10 w-10">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium mb-2">Failed to load matches</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                  There was an error loading your suggested matches. Please try again.
                </p>
                <Button onClick={() => refetchSuggested()}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : suggestedMatches?.length === 0 ? (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px]">
                <div className="text-gray-400 mb-2">
                  <ArrowRightLeft className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-medium mb-2">No matches found</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                  We couldn't find any matching users based on your skills.
                  Try updating your profile with more skills to find potential matches.
                </p>
                <Button>
                  Update Your Skills
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestedMatches.map((match) => (
                <UserMatchCard key={match.user.id} match={match} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="requests" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Incoming Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  Incoming Requests
                  {pendingIncomingCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {pendingIncomingCount}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Requests from others who want to learn with you
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRequests ? (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center mb-4">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="ml-4 flex-1">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24 mt-1" />
                          </div>
                          <Skeleton className="h-6 w-24" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <div className="mt-4 flex space-x-2">
                          <Skeleton className="h-9 w-20" />
                          <Skeleton className="h-9 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : isErrorRequests ? (
                  <div className="text-center py-6">
                    <p className="text-red-500">Failed to load requests</p>
                    <Button 
                      variant="outline" 
                      onClick={() => refetchRequests()} 
                      className="mt-2"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : incomingRequests.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <p>No incoming requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {incomingRequests.map((request) => (
                      <RequestCard 
                        key={request.id} 
                        request={request} 
                        type="incoming" 
                        onUpdate={() => refetchRequests()}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Outgoing Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  Outgoing Requests
                  {pendingOutgoingCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {pendingOutgoingCount}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Requests you've sent to potential learning partners
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRequests ? (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center mb-4">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="ml-4 flex-1">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24 mt-1" />
                          </div>
                          <Skeleton className="h-6 w-24" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <div className="mt-4">
                          <Skeleton className="h-9 w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : isErrorRequests ? (
                  <div className="text-center py-6">
                    <p className="text-red-500">Failed to load requests</p>
                    <Button 
                      variant="outline" 
                      onClick={() => refetchRequests()} 
                      className="mt-2"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : outgoingRequests.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <p>No outgoing requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {outgoingRequests.map((request) => (
                      <RequestCard 
                        key={request.id} 
                        request={request} 
                        type="outgoing" 
                        onUpdate={() => refetchRequests()}
                      />
                    ))}
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