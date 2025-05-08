import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Flag, UserPlus, ArrowLeft } from "lucide-react";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import SkillTag from "@/components/ui/skill-tag";

export default function UserProfile() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  
  // Get profile ID from URL
  const path = useLocation()[0];
  const userId = parseInt(path.split('/users/')[1]);
  
  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['/api/users/me'],
    queryFn: getQueryFn({ on401: "throw" })
  });
  
  // Fetch user profile data
  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [`/api/users/${userId}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !isNaN(userId)
  });
  
  // Find matching skills between current user and profile user
  const matchingTeachSkills = user && currentUser ? 
    user.teachSkills.filter(skill => currentUser.learnSkills.includes(skill)) : [];
    
  const matchingLearnSkills = user && currentUser ? 
    user.learnSkills.filter(skill => currentUser.teachSkills.includes(skill)) : [];
  
  // Mutation for sending pairing request
  const createPairingRequestMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/pairing-requests", {
        recipientId: userId,
        teachSkills: matchingLearnSkills,
        learnSkills: matchingTeachSkills,
        message: requestMessage || undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pairing-requests'] });
      setIsRequestModalOpen(false);
      setRequestMessage("");
      toast({
        title: "Request sent",
        description: `Your pairing request to ${user?.displayName || user?.fullname} has been sent.`,
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

  // Handle sending pairing request
  const handleSendRequest = () => {
    createPairingRequestMutation.mutate();
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

  // Handle going back
  const handleBack = () => {
    navigate('/matches');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-6"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        
        <div className="bg-white dark:bg-card shadow-md rounded-lg overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Skeleton className="h-32 w-32 rounded-full flex-shrink-0" />
              <div className="flex-grow space-y-4">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
            
            <Separator className="my-8" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="flex flex-wrap gap-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-24 rounded-full" />
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="flex flex-wrap gap-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-24 rounded-full" />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end space-x-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !user) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-6"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px]">
            <div className="text-red-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-12 w-12">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-2xl font-heading font-bold mb-2">User Not Found</h2>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
              The user profile you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={handleBack}>
              Return to Matches
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get display name or fallback to full name
  const displayName = user.displayName || user.fullname;
  
  // Calculate match strength if we have the current user
  const matchScore = matchingTeachSkills.length + matchingLearnSkills.length;
  const matchPercentage = currentUser ? Math.min(100, Math.round((matchScore / 6) * 100)) : 0;
  const hasMatch = matchScore > 0;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-6"
        onClick={handleBack}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>
      
      <div className="bg-white dark:bg-card shadow-md rounded-lg overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <Avatar className="h-32 w-32 md:flex-shrink-0">
              <AvatarImage src={user.avatar || ""} alt={displayName} />
              <AvatarFallback className="text-2xl">{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            
            <div className="flex-grow">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <h1 className="text-3xl font-heading font-bold text-primary dark:text-white">{displayName}</h1>
                
                {hasMatch && currentUser && (
                  <Badge variant="outline" className="bg-secondary/10 text-secondary dark:bg-light-blue/10 dark:text-light-blue md:ml-auto">
                    {matchPercentage}% Match
                  </Badge>
                )}
              </div>
              
              {user.bio && (
                <p className="mt-4 text-gray-600 dark:text-gray-300">
                  {user.bio}
                </p>
              )}
            </div>
          </div>
          
          <Separator className="my-8" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Teaching Skills */}
            <div>
              <h3 className="text-lg font-heading font-semibold text-primary dark:text-white mb-3">
                Teaching Skills
              </h3>
              
              {user.teachSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.teachSkills.map((skill) => (
                    <SkillTag 
                      key={skill} 
                      type="teach"
                      className={matchingTeachSkills.includes(skill) ? "ring-2 ring-green-500" : ""}
                    >
                      {skill}
                      {matchingTeachSkills.includes(skill) && currentUser && (
                        <Badge variant="outline" className="ml-1 text-[10px] py-0 h-4 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          Match
                        </Badge>
                      )}
                    </SkillTag>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">No teaching skills listed</p>
              )}
            </div>
            
            {/* Learning Skills */}
            <div>
              <h3 className="text-lg font-heading font-semibold text-primary dark:text-white mb-3">
                Learning Skills
              </h3>
              
              {user.learnSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.learnSkills.map((skill) => (
                    <SkillTag 
                      key={skill} 
                      type="learn"
                      className={matchingLearnSkills.includes(skill) ? "ring-2 ring-green-500" : ""}
                    >
                      {skill}
                      {matchingLearnSkills.includes(skill) && currentUser && (
                        <Badge variant="outline" className="ml-1 text-[10px] py-0 h-4 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          Match
                        </Badge>
                      )}
                    </SkillTag>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">No learning skills listed</p>
              )}
            </div>
          </div>
          
          {currentUser && currentUser.id !== user.id && (
            <div className="mt-8 flex justify-end space-x-4">
              <Button 
                variant="outline" 
                className="flex items-center"
                onClick={() => toast({
                  title: "Report feature",
                  description: "Reporting functionality will be implemented in a future update.",
                })}
              >
                <Flag className="h-4 w-4 mr-2" />
                Report
              </Button>
              
              <Button 
                className="flex items-center"
                onClick={() => setIsRequestModalOpen(true)}
                disabled={!hasMatch}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Request to Pair
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Request to Pair Modal */}
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
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg space-y-3">
                {matchingTeachSkills.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {displayName} can teach you:
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {matchingTeachSkills.map((skill) => (
                        <SkillTag key={skill} type="learn">{skill}</SkillTag>
                      ))}
                    </div>
                  </div>
                )}
                
                {matchingLearnSkills.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      You can teach {displayName}:
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {matchingLearnSkills.map((skill) => (
                        <SkillTag key={skill} type="teach">{skill}</SkillTag>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Add a message (optional)</h4>
              <Textarea
                placeholder={`Hi ${displayName}! I'm interested in exchanging skills with you...`}
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRequestModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSendRequest}
              disabled={createPairingRequestMutation.isPending}
            >
              {createPairingRequestMutation.isPending ? (
                <>Sending Request...</>
              ) : (
                <>Send Request</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}