import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import SkillTag from "@/components/ui/skill-tag";
import { SuggestedMatch } from "@/types/matching";
import { UserPlus, ChevronDown, ChevronUp } from "lucide-react";

interface UserMatchCardProps {
  match: SuggestedMatch;
}

export default function UserMatchCard({ match }: UserMatchCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");

  const { user, matchingTeachSkills, matchingLearnSkills, matchScore } = match;
  
  // Convert match score to percentage for display
  const matchPercentage = Math.min(100, Math.round((matchScore / 6) * 100));

  // Get display name or fallback to full name
  const displayName = user.displayName || user.fullname || "User";
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Mutation for sending pairing request
  const createPairingRequestMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/pairing-requests", {
        recipientId: user.id,
        teachSkills: matchingTeachSkills,
        learnSkills: matchingLearnSkills,
        message: requestMessage || undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pairing-requests'] });
      setIsRequestModalOpen(false);
      setRequestMessage("");
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

  const handleSendRequest = () => {
    createPairingRequestMutation.mutate();
  };

  return (
    <>
      <Card className="overflow-hidden h-full">
        <CardContent className="p-0">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar || ""} alt={displayName} />
                  <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                </Avatar>
                <div className="ml-4">
                  <h3 className="font-medium text-primary dark:text-white">{displayName}</h3>
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                    {matchPercentage}% Match
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="bg-secondary/10 text-secondary dark:bg-light-blue/10 dark:text-light-blue">
                {matchScore} shared {matchScore === 1 ? 'skill' : 'skills'}
              </Badge>
            </div>
            
            {/* Bio with expand/collapse toggle */}
            {user.bio && (
              <div className="mb-4">
                <p className={`text-sm text-gray-600 dark:text-gray-300 ${!isExpanded && 'line-clamp-2'}`}>
                  {user.bio}
                </p>
                {user.bio.length > 100 && (
                  <button 
                    className="text-xs text-secondary dark:text-light-blue flex items-center mt-1"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Show more
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
            
            {/* Matching skills */}
            <div className="space-y-3">
              {matchingTeachSkills.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Can teach you:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {matchingTeachSkills.map((skill) => (
                      <SkillTag key={skill} type="learn">{skill}</SkillTag>
                    ))}
                  </div>
                </div>
              )}
              
              {matchingLearnSkills.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Wants to learn:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {matchingLearnSkills.map((skill) => (
                      <SkillTag key={skill} type="teach">{skill}</SkillTag>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="mt-4">
              <Button 
                className="w-full flex items-center justify-center"
                onClick={() => setIsRequestModalOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Request to Pair
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
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
    </>
  );
}