import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, RefreshCw, AlertTriangle, UserPlus, Check, X, Users } from "lucide-react";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { SuggestedMatch, PairingRequestWithUsers } from "@/types/matching";
import SkillTag from "@/components/ui/skill-tag";
import { cn } from "@/lib/utils";

// Request card component for displaying incoming and outgoing pairing requests
const RequestCard = ({ request, type, onUpdate }: { 
  request: PairingRequestWithUsers; 
  type: "incoming" | "outgoing";
  onUpdate: () => void;
}) => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  // Mutations for handling request actions
  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/pairing-requests/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pairing-requests'] });
      onUpdate();
      toast({
        title: "Request updated",
        description: "The pairing request has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update request",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  });

  // Mutations for creating learning sessions
  const createSessionMutation = useMutation({
    mutationFn: async ({ requestId }: { requestId: number }) => {
      // Create a session for an hour from now by default
      const scheduledDate = new Date();
      scheduledDate.setHours(scheduledDate.getHours() + 1);
      
      return apiRequest("POST", "/api/sessions", {
        requestId,
        scheduledDate: scheduledDate.toISOString(),
        duration: 60,
        location: "online",
        notes: "Let's discuss our learning goals in this first session."
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      navigate('/sessions');
      toast({
        title: "Session created",
        description: "A new learning session has been scheduled. You can manage it from the Sessions page.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create session",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  });
  
  // Handle accepting a request
  const handleAccept = () => {
    updateRequestMutation.mutate({ id: request.id, status: "accepted" });
    
    // Create a session after accepting
    createSessionMutation.mutate({ requestId: request.id });
  };
  
  // Handle declining a request
  const handleDecline = () => {
    updateRequestMutation.mutate({ id: request.id, status: "declined" });
  };
  
  // Handle cancelling a request
  const handleCancel = () => {
    updateRequestMutation.mutate({ id: request.id, status: "cancelled" });
  };
  
  // Get the other user (not the current user)
  const otherUser = type === "incoming" ? request.requester : request.recipient;
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 cursor-pointer" onClick={() => navigate(`/users/${otherUser.id}`)}>
              <AvatarImage src={otherUser.avatar || ""} alt={otherUser.displayName || otherUser.fullname} />
              <AvatarFallback>{getInitials(otherUser.displayName || otherUser.fullname)}</AvatarFallback>
            </Avatar>
            
            <div>
              <h3 
                className="text-lg font-semibold text-primary dark:text-white cursor-pointer hover:underline" 
                onClick={() => navigate(`/users/${otherUser.id}`)}
              >
                {otherUser.displayName || otherUser.fullname}
              </h3>
              
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {type === "incoming" ? "Sent you a request" : "Request sent"} • {formatDate(request.createdAt)}
              </p>
            </div>
          </div>
          
          <Badge className={cn(
            "text-xs",
            request.status === "pending" 
              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
              : request.status === "accepted" 
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
          )}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </Badge>
        </div>
        
        <div className="mt-4 space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Skills Exchange</h4>
            <div className="flex flex-wrap gap-2">
              {type === "incoming" ? (
                <>
                  {request.teachSkills.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">They teach:</span>
                      {request.teachSkills.map(skill => (
                        <SkillTag key={skill} type="teach">{skill}</SkillTag>
                      ))}
                    </div>
                  )}
                  {request.learnSkills.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">You teach:</span>
                      {request.learnSkills.map(skill => (
                        <SkillTag key={skill} type="learn">{skill}</SkillTag>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {request.teachSkills.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">You teach:</span>
                      {request.teachSkills.map(skill => (
                        <SkillTag key={skill} type="teach">{skill}</SkillTag>
                      ))}
                    </div>
                  )}
                  {request.learnSkills.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">They teach:</span>
                      {request.learnSkills.map(skill => (
                        <SkillTag key={skill} type="learn">{skill}</SkillTag>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          {request.message && (
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Message</h4>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md text-sm">
                {request.message}
              </div>
            </div>
          )}
        </div>
        
        {type === "incoming" && request.status === "pending" && (
          <div className="mt-4 flex space-x-2">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
              onClick={handleDecline}
              disabled={updateRequestMutation.isPending}
            >
              <X className="h-4 w-4 mr-1" />
              Decline
            </Button>
            <Button 
              className="w-full flex items-center justify-center"
              onClick={handleAccept}
              disabled={updateRequestMutation.isPending || createSessionMutation.isPending}
            >
              <Check className="h-4 w-4 mr-1" />
              Accept
            </Button>
          </div>
        )}
        
        {type === "outgoing" && request.status === "pending" && (
          <div className="mt-4">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
              onClick={handleCancel}
              disabled={updateRequestMutation.isPending}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel Request
            </Button>
          </div>
        )}
        
        {request.status === "accepted" && (
          <div className="mt-4">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center"
              onClick={() => navigate('/sessions')}
            >
              <ArrowRight className="h-4 w-4 mr-1" />
              View Sessions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Potential match card component for displaying suggested user matches
const UserMatchCard = ({ match }: { match: SuggestedMatch }) => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  
  // Get display name or fallback to full name
  const displayName = match.user.displayName || match.user.fullname;
  
  // Calculate match quality based on minSkillsExchanged with safe fallback
  const getMatchQuality = (minSkills: number | undefined) => {
    if (!minSkills) return "Good";
    if (minSkills >= 3) return "Excellent";
    if (minSkills >= 2) return "Strong";
    return "Good";
  };
  
  const matchQuality = getMatchQuality(match.minSkillsExchanged);
  
  // Get safe values for skills exchanged
  const minSkillsExchanged = match.minSkillsExchanged || 0;
  const totalSkillsExchanged = match.totalSkillsExchanged || 0;
  
  // Mutation for sending pairing requests
  const sendRequestMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/pairing-requests", {
        recipientId: match.user.id,
        teachSkills: match.matchingTeachSkills,
        learnSkills: match.matchingLearnSkills,
        message: message || undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pairing-requests'] });
      setIsRequestModalOpen(false);
      setMessage("");
      toast({
        title: "Request sent",
        description: `Your pairing request to ${displayName} has been sent.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send request",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  });
  
  // Handle viewing user profile
  const handleViewProfile = () => {
    navigate(`/users/${match.user.id}`);
  };
  
  // Handle sending request
  const handleSendRequest = () => {
    sendRequestMutation.mutate();
  };
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar className="h-16 w-16 cursor-pointer" onClick={handleViewProfile}>
                <AvatarImage src={match.user.avatar || ""} alt={displayName} />
                <AvatarFallback className="text-xl">{getInitials(displayName)}</AvatarFallback>
              </Avatar>
              
              <div className="flex-grow">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h3 
                    className="text-xl font-heading font-bold text-deep-indigo dark:text-white cursor-pointer hover:underline"
                    onClick={handleViewProfile}
                  >
                    {displayName}
                  </h3>
                  
                  <Badge className={cn(
                    "w-fit text-sm",
                    matchQuality === "Excellent" ? "bg-success/20 text-success dark:bg-success/30 dark:text-success" :
                    matchQuality === "Strong" ? "bg-amber/20 text-amber-700 dark:bg-amber/30 dark:text-amber-400" :
                    "bg-royal-purple/10 text-royal-purple dark:bg-royal-purple/20 dark:text-royal-purple"
                  )}>
                    {matchQuality} Match
                  </Badge>
                  
                  <Badge className="w-fit text-sm bg-success/20 text-success dark:bg-success/30 dark:text-success flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                    </svg>
                    Mutual Benefit: {minSkillsExchanged} Skills Each Way
                  </Badge>
                  
                  <Badge className="w-fit text-sm bg-info/20 text-info dark:bg-info/30 dark:text-info flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v20M2 12h20"></path>
                    </svg>
                    {totalSkillsExchanged} Total Skills Exchanged
                  </Badge>
                </div>
                
                {match.user.bio && (
                  <p className="text-charcoal dark:text-lavender/80 mt-2 text-sm">
                    {match.user.bio}
                  </p>
                )}
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* User can teach you - Mutual Benefit */}
              <div className="border border-success/20 rounded-md p-3 bg-success/5">
                <h4 className="text-sm font-medium text-success flex items-center gap-1 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                  {displayName} can teach you:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {match.matchingLearnSkills.length > 0 ? (
                    match.matchingLearnSkills.map((skill: string) => (
                      <SkillTag key={skill} type="learn">{skill}</SkillTag>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400 italic">No matching skills</span>
                  )}
                </div>
              </div>
              {/* You can teach user - Mutual Benefit */}
              <div className="border border-success/20 rounded-md p-3 bg-success/5">
                <h4 className="text-sm font-medium text-success flex items-center gap-1 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                  You can teach {displayName}:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {match.matchingTeachSkills.length > 0 ? (
                    match.matchingTeachSkills.map((skill: string) => (
                      <SkillTag key={skill} type="teach">{skill}</SkillTag>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400 italic">No matching skills</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-4 flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleViewProfile}
            >
              View Profile
            </Button>
            
            <Button 
              onClick={() => setIsRequestModalOpen(true)}
              disabled={match.matchingLearnSkills.length === 0 || match.matchingTeachSkills.length === 0}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Request to Pair
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Request Modal */}
      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Pairing Request</DialogTitle>
            <DialogDescription>
              Request to pair with {displayName} for skill exchange.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Skills Match</h4>
              <div className="bg-rich-cream dark:bg-charcoal p-4 rounded-lg space-y-4 border-2 border-amber/30">
                <div className="flex justify-center items-center mb-2">
                  <div className="bg-success/10 text-success px-3 py-1 rounded-full flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22v-5"/>
                      <path d="M9 8V2"/>
                      <path d="M15 8V2"/>
                      <path d="M12 8a4 4 0 0 0-4 4v2a4 4 0 0 0 8 0v-2a4 4 0 0 0-4-4Z"/>
                    </svg>
                    <span className="font-semibold">Mutual Knowledge Exchange</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {match.matchingTeachSkills.length > 0 && (
                    <div className="bg-white dark:bg-deep-indigo/20 p-3 rounded-lg border border-teal/30">
                      <h4 className="text-sm font-semibold mb-2 flex items-center text-teal">
                        <span className="inline-block w-3 h-3 rounded-full bg-teal mr-2"></span>
                        They can teach you:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {match.matchingTeachSkills.map((skill: string) => (
                          <SkillTag key={skill} type="teach" className="border-2 border-teal animate-pulse-slow">{skill}</SkillTag>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {match.matchingLearnSkills.length > 0 && (
                    <div className="bg-white dark:bg-deep-indigo/20 p-3 rounded-lg border border-royal-purple/30">
                      <h4 className="text-sm font-semibold mb-2 flex items-center text-royal-purple">
                        <span className="inline-block w-3 h-3 rounded-full bg-royal-purple mr-2"></span>
                        You can teach them:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {match.matchingLearnSkills.map((skill: string) => (
                          <SkillTag key={skill} type="learn" className="border-2 border-royal-purple animate-pulse-slow">{skill}</SkillTag>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Message (Optional)</h4>
              <Textarea
                placeholder="Add a personal message to your request..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRequestModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendRequest} disabled={sendRequestMutation.isPending}>
              {sendRequestMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Main Matches page component
export default function MatchesPage() {
  const { toast } = useToast();
  const { user } = useAuth(); // Get current user from auth context
  const [activeTab, setActiveTab] = useState<string>("potential");
  const [, setLocation] = useLocation();
  
  // Fetch suggested matches with client-side mutual benefit algorithm implementation
  const {
    data: suggestedMatches,
    isLoading: isLoadingSuggested,
    isError: isErrorSuggested,
    error: matchError,
    refetch: refetchSuggested
  } = useQuery({
    queryKey: ["/api/matches/suggested"],
    queryFn: getQueryFn<SuggestedMatch[]>({ on401: "throw" })
  });
  
  // Fetch incoming pairing requests
  const {
    data: incomingRequests = [],
    isLoading: isLoadingIncoming,
    isError: isErrorIncoming,
    refetch: refetchIncoming
  } = useQuery<PairingRequestWithUsers[]>({
    queryKey: ['/api/pairing-requests?type=received'],
    queryFn: getQueryFn({ on401: "throw" })
  });

  // Fetch outgoing pairing requests
  const {
    data: outgoingRequests = [],
    isLoading: isLoadingOutgoing,
    isError: isErrorOutgoing,
    refetch: refetchOutgoing
  } = useQuery<PairingRequestWithUsers[]>({
    queryKey: ['/api/pairing-requests?type=sent'],
    queryFn: getQueryFn({ on401: "throw" })
  });
  
  // Check if there are new incoming requests
  const hasNewIncomingRequests = incomingRequests.length > 0;
  
  // Set up polling for new requests
  useEffect(() => {
    // Poll for new requests every 30 seconds
    const interval = setInterval(() => {
      if (!isLoadingOutgoing) {
        refetchOutgoing();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [refetchOutgoing, isLoadingOutgoing]);
  
  // Handle data refresh
  const handleRefresh = () => {
    refetchSuggested();
    refetchIncoming();
    refetchOutgoing();
    toast({
      title: "Data refreshed",
      description: "The latest matching data has been loaded.",
    });
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setLocation(`/matches?tab=${value}`, { replace: true });
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-deep-indigo dark:text-white">Find Learning Partners</h1>
          <p className="text-charcoal dark:text-gray-300 mt-1">Discover users with complementary skills and manage pairing requests</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-amber/10 hover:bg-amber/20 text-deep-indigo border-amber flex items-center"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-rich-cream dark:bg-charcoal">
          <TabsTrigger 
            value="potential" 
            className="flex items-center data-[state=active]:bg-royal-purple data-[state=active]:text-white"
          >
            <Users className="h-4 w-4 mr-1" />
            Suggested Matches
            {Array.isArray(suggestedMatches) && suggestedMatches.length > 0 && (
              <Badge className="ml-2 bg-amber/20 text-deep-indigo dark:text-white">{suggestedMatches.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="incoming" 
            className={cn(
              "flex items-center data-[state=active]:bg-teal data-[state=active]:text-white",
              hasNewIncomingRequests && activeTab !== "incoming" && "animate-pulse"
            )}
            onClick={() => hasNewIncomingRequests && setActiveTab("incoming")}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Incoming Requests
            {incomingRequests.length > 0 && (
              <Badge className="ml-2 bg-success/20 text-success dark:bg-success/30 dark:text-success font-bold">{incomingRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="outgoing" 
            className="flex items-center data-[state=active]:bg-amber data-[state=active]:text-deep-indigo"
          >
            <ArrowRight className="h-4 w-4 mr-1" />
            Outgoing Requests
            {outgoingRequests.length > 0 && (
              <Badge className="ml-2 bg-deep-indigo/20 text-deep-indigo dark:text-white">{outgoingRequests.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="potential" className="mt-6">
          {isLoadingSuggested ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <div>
                        <Skeleton className="h-6 w-48 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-px w-full my-4" />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Skeleton className="h-4 w-32 mb-2" />
                        <div className="flex gap-2">
                          <Skeleton className="h-8 w-20 rounded-full" />
                          <Skeleton className="h-8 w-20 rounded-full" />
                        </div>
                      </div>
                      <div>
                        <Skeleton className="h-4 w-32 mb-2" />
                        <div className="flex gap-2">
                          <Skeleton className="h-8 w-20 rounded-full" />
                          <Skeleton className="h-8 w-20 rounded-full" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between">
                      <Skeleton className="h-10 w-24" />
                      <Skeleton className="h-10 w-36" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : isErrorSuggested ? (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px]">
                <div className="text-red-500 mb-2">
                  <AlertTriangle className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-medium mb-2">Failed to load matches</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                  There was an error loading your suggested matches. Please try again.
                </p>
                <Button onClick={handleRefresh}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : (Array.isArray(suggestedMatches) && suggestedMatches.length === 0) ? (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px]">
                <div className="text-gray-400 mb-2">
                  <Users className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-medium mb-2">No mutual benefit matches found</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                  We couldn't find any users with mutual skill exchange benefits.
                  Try adding more skills to your profile to increase your chances of finding matches.
                </p>
                <Button 
                  onClick={() => setLocation('/profile/edit')}
                  variant="outline"
                >
                  Update Skills
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="bg-royal-purple/10 dark:bg-royal-purple/20 border border-royal-purple/30 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-royal-purple">
                    <path d="M12 22v-5"/>
                    <path d="M9 8V2"/>
                    <path d="M15 8V2"/>
                    <path d="M12 8a4 4 0 0 0-4 4v2a4 4 0 0 0 8 0v-2a4 4 0 0 0-4-4Z"/>
                  </svg>
                  <h3 className="text-lg font-semibold text-deep-indigo dark:text-white">True Mutual Benefit Matches</h3>
                </div>
                <p className="text-sm text-charcoal dark:text-gray-300">
                  Our matching algorithm finds users where <span className="font-semibold">both of you benefit equally</span>. 
                  Every match shown here guarantees that each person can teach and learn at least one skill from the other.
                </p>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  <div className="bg-success/10 rounded-md p-2 border border-success/20">
                    <span className="font-semibold text-success">Excellent Match:</span> 3+ skills exchanged each way
                  </div>
                  <div className="bg-amber/10 rounded-md p-2 border border-amber/20">
                    <span className="font-semibold text-amber-700 dark:text-amber-400">Strong Match:</span> 2 skills exchanged each way
                  </div>
                  <div className="bg-royal-purple/10 rounded-md p-2 border border-royal-purple/20">
                    <span className="font-semibold text-royal-purple">Good Match:</span> At least 1 skill exchanged each way
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.isArray(suggestedMatches) && suggestedMatches.length > 0 ? (
                  suggestedMatches.map((match: SuggestedMatch) => (
                    <UserMatchCard key={match.user.id} match={match} />
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8">
                    <p className="text-muted-foreground">No matches found. Try adding more skills to your profile!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="incoming" className="mt-6">
          {isLoadingIncoming ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <Card key={i}><CardContent className="p-6"><div className="flex items-center gap-4"><Skeleton className="h-12 w-12 rounded-full" /><div><Skeleton className="h-6 w-32 mb-2" /><Skeleton className="h-4 w-20" /></div></div><Skeleton className="h-px w-full my-4" /><Skeleton className="h-8 w-32" /></CardContent></Card>
              ))}
            </div>
          ) : isErrorIncoming ? (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px]">
                <div className="text-red-500 mb-2">
                  <AlertTriangle className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-medium mb-2">Failed to load requests</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                  There was an error loading your pairing requests. Please try again.
                </p>
                <Button onClick={() => refetchIncoming()}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : incomingRequests.length === 0 ? (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px]">
                <div className="text-gray-400 mb-2">
                  <UserPlus className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-medium mb-2">No incoming requests</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                  You have no incoming pairing requests at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {incomingRequests.map(request => (
                <RequestCard 
                  key={request.id} 
                  request={request} 
                  type="incoming" 
                  onUpdate={refetchIncoming} 
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="outgoing" className="mt-6">
          {isLoadingOutgoing ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <Card key={i}><CardContent className="p-6"><div className="flex items-center gap-4"><Skeleton className="h-12 w-12 rounded-full" /><div><Skeleton className="h-6 w-32 mb-2" /><Skeleton className="h-4 w-20" /></div></div><Skeleton className="h-px w-full my-4" /><Skeleton className="h-8 w-32" /></CardContent></Card>
              ))}
            </div>
          ) : isErrorOutgoing ? (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px]">
                <div className="text-red-500 mb-2">
                  <AlertTriangle className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-medium mb-2">Failed to load requests</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                  There was an error loading your pairing requests. Please try again.
                </p>
                <Button onClick={() => refetchOutgoing()}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : outgoingRequests.length === 0 ? (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px]">
                <div className="text-gray-400 mb-2">
                  <ArrowRight className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-medium mb-2">No outgoing requests</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                  You have no outgoing pairing requests at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {outgoingRequests.map(request => (
                <RequestCard key={request.id} request={request} type="outgoing" onUpdate={refetchOutgoing} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}