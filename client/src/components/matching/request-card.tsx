import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Calendar as CalendarIcon, XCircle, CheckCircle, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import SkillTag from "@/components/ui/skill-tag";
import { PairingRequestWithUsers } from "@/types/matching";

interface RequestCardProps {
  request: PairingRequestWithUsers;
  type: "incoming" | "outgoing";
  onUpdate: () => void;
}

export default function RequestCard({ request, type, onUpdate }: RequestCardProps) {
  const { toast } = useToast();
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [duration, setDuration] = useState<string>("60");
  const [location, setLocation] = useState<string>("online");
  const [notes, setNotes] = useState<string>("");
  
  // Get the other user (the one who is not the current user) based on request type
  const otherUser = type === "incoming" ? request.requester : request.recipient;
  
  // Get display name or fallback to full name
  const displayName = otherUser.displayName || otherUser.fullname || "User";
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Format request timestamp
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy");
  };
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "accepted":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "declined":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "cancelled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  // Mutation for accepting/declining request
  const updateRequestMutation = useMutation({
    mutationFn: async (status: string) => {
      return apiRequest("PATCH", `/api/pairing-requests/${request.id}`, { status });
    },
    onSuccess: () => {
      onUpdate();
      setIsAcceptModalOpen(false);
      setIsDeclineModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update request",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation for creating a session
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      if (!scheduledDate) throw new Error("Scheduled date is required");
      
      return apiRequest("POST", "/api/sessions", {
        requestId: request.id,
        scheduledDate: scheduledDate.toISOString(),
        duration: parseInt(duration),
        location,
        notes: notes || undefined
      });
    },
    onSuccess: () => {
      toast({
        title: "Session scheduled",
        description: `Your learning session with ${displayName} has been scheduled.`,
      });
      setIsAcceptModalOpen(false);
      updateRequestMutation.mutate("accepted");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to schedule session",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  });

  const handleAccept = () => {
    if (scheduledDate) {
      createSessionMutation.mutate();
    } else {
      updateRequestMutation.mutate("accepted");
    }
  };

  const handleDecline = () => {
    updateRequestMutation.mutate("declined");
  };

  const handleCancel = () => {
    updateRequestMutation.mutate("cancelled");
  };

  // Render for both incoming and outgoing requests
  return (
    <>
      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser.avatar || ""} alt={displayName} />
              <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <h4 className="font-medium text-primary dark:text-white">{displayName}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(request.createdAt)}
              </p>
            </div>
          </div>
          <Badge className={cn("text-xs", getStatusColor(request.status))}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </Badge>
        </div>
        
        {/* Skills to exchange */}
        <div className="mb-4 space-y-2">
          {request.teachSkills.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {type === "incoming" ? `${displayName} can teach you:` : `You can teach ${displayName}:`}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {request.teachSkills.map((skill) => (
                  <SkillTag key={skill} type="learn">{skill}</SkillTag>
                ))}
              </div>
            </div>
          )}
          
          {request.learnSkills.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {type === "incoming" ? `You can teach ${displayName}:` : `${displayName} can teach you:`}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {request.learnSkills.map((skill) => (
                  <SkillTag key={skill} type="teach">{skill}</SkillTag>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Message if any */}
        {request.message && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{request.message}"</p>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="mt-4 flex space-x-2">
          {/* Incoming request actions */}
          {type === "incoming" && request.status === "pending" && (
            <>
              <Button 
                variant="default" 
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setIsAcceptModalOpen(true)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Accept
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-950"
                onClick={() => setIsDeclineModalOpen(true)}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Decline
              </Button>
            </>
          )}
          
          {/* Outgoing request actions */}
          {type === "outgoing" && request.status === "pending" && (
            <Button 
              variant="outline" 
              size="sm"
              className="text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-950"
              onClick={handleCancel}
            >
              Cancel Request
            </Button>
          )}
        </div>
      </div>
      
      {/* Accept Modal with scheduling */}
      <Dialog open={isAcceptModalOpen} onOpenChange={setIsAcceptModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Pairing Request</DialogTitle>
            <DialogDescription>
              Schedule a learning session with {displayName} to exchange skills.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Date picker */}
            <div className="space-y-2">
              <Label>Session Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !scheduledDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? format(scheduledDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                    initialFocus
                    disabled={date => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Duration selector */}
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Location selector */}
            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="in-person">In Person</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Additional notes */}
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional details or links to meeting rooms"
              />
            </div>
          </div>
          
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAcceptModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAccept}
              disabled={!scheduledDate || createSessionMutation.isPending}
            >
              {createSessionMutation.isPending ? 
                "Scheduling..." : 
                "Schedule Session"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Decline Confirmation Modal */}
      <Dialog open={isDeclineModalOpen} onOpenChange={setIsDeclineModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Pairing Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to decline the pairing request from {displayName}?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeclineModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDecline}
              disabled={updateRequestMutation.isPending}
            >
              {updateRequestMutation.isPending ? 
                "Declining..." : 
                "Decline Request"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}