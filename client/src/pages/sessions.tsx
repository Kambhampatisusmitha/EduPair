import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { format, isToday, isAfter, parseISO, isTomorrow } from "date-fns";
import { Calendar as CalendarIcon, Clock, MapPin, Video, Users, AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { LearningSession } from "@/types/matching";

export default function SessionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [sessionToModify, setSessionToModify] = useState<LearningSession | null>(null);
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [duration, setDuration] = useState<string>("60");
  const [location, setLocation] = useState<string>("online");
  const [notes, setNotes] = useState<string>("");

  // Fetch user sessions
  const { 
    data: sessions, 
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['/api/sessions'],
    queryFn: getQueryFn<LearningSession[]>({ on401: "throw" })
  });

  // Separate upcoming and past sessions
  const now = new Date();
  const upcomingSessions = sessions?.filter(session => 
    session.status === "scheduled" && isAfter(parseISO(session.scheduledDate), now)
  ) || [];
  
  const pastSessions = sessions?.filter(session => 
    session.status === "completed" || 
    (session.status === "scheduled" && !isAfter(parseISO(session.scheduledDate), now))
  ) || [];
  
  const cancelledSessions = sessions?.filter(session => 
    session.status === "cancelled"
  ) || [];

  // Mutation for updating a session (reschedule or cancel)
  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      console.log(`Updating session ${id} with data:`, data);
      try {
        const result = await apiRequest("PATCH", `/api/sessions/${id}`, data);
        console.log('Update session response:', result);
        return result;
      } catch (error) {
        console.error('Error updating session:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Session updated successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      setIsRescheduleModalOpen(false);
      setIsCancelModalOpen(false);
      setSessionToModify(null);
      setScheduledDate(undefined);
      setDuration("60");
      setLocation("online");
      setNotes("");
      toast({
        title: "Session updated",
        description: "Your learning session has been updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Session update error details:', error);
      toast({
        title: "Failed to update session",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  });

  // Get display name for a user
  const getDisplayName = (user: any) => {
    return user?.displayName || user?.fullname || "User";
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
  
  // Format time for session display
  const formatSessionTime = (dateString: string) => {
    const date = parseISO(dateString);
    
    if (isToday(date)) {
      return `Today, ${format(date, "h:mm a")}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow, ${format(date, "h:mm a")}`;
    } else {
      return format(date, "MMM d, yyyy 'at' h:mm a");
    }
  };
  
  // Get the other participant (not the current user)
  const getOtherParticipant = (session: LearningSession) => {
    // Get current user from any session's participants (assuming we're always a participant)
    const currentUserId = session.participants[0]?.userId;
    return session.participants.find(p => p.userId !== currentUserId)?.user;
  };
  
  // Handle rescheduling a session
  const handleOpenReschedule = (session: LearningSession) => {
    setSessionToModify(session);
    setScheduledDate(parseISO(session.scheduledDate));
    setDuration(session.duration.toString());
    setLocation(session.location);
    setNotes(session.notes || "");
    setIsRescheduleModalOpen(true);
  };
  
  // Handle cancelling a session
  const handleOpenCancel = (session: LearningSession) => {
    setSessionToModify(session);
    setIsCancelModalOpen(true);
  };
  
  // Submit reschedule request
  const handleReschedule = () => {
    if (!sessionToModify || !scheduledDate) {
      toast({
        title: "Missing information",
        description: "Please select a date for the rescheduled session.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Ensure the scheduledDate is valid
      const formattedDate = scheduledDate.toISOString();
      const durationValue = parseInt(duration);
      
      if (isNaN(durationValue)) {
        throw new Error("Invalid duration value");
      }
      
      // Prepare update data
      const updateData = {
        scheduledDate: formattedDate,
        duration: durationValue,
        location,
        notes: notes.trim() || undefined
      };
      
      console.log('Submitting session update with data:', updateData);
      
      // Send the update request
      updateSessionMutation.mutate({
        id: sessionToModify.id,
        data: updateData
      });
    } catch (error) {
      console.error('Error preparing session update:', error);
      toast({
        title: "Failed to prepare update",
        description: "There was an error with the session data. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Submit cancel request
  const handleCancel = () => {
    if (!sessionToModify) return;
    
    updateSessionMutation.mutate({
      id: sessionToModify.id,
      data: {
        status: "cancelled"
      }
    });
  };
  
  // Handle refresh data
  const handleRefresh = () => {
    refetch();
  };

  // Render session card
  const renderSessionCard = (session: LearningSession) => {
    const otherUser = getOtherParticipant(session);
    const sessionTime = formatSessionTime(session.scheduledDate);
    const isPast = !isAfter(parseISO(session.scheduledDate), now);
    const isCancelled = session.status === "cancelled";
    
    return (
      <Card key={session.id} className={isCancelled ? "opacity-75" : ""}>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <Avatar className="h-12 w-12">
                <AvatarImage src={otherUser?.avatar || ""} alt={getDisplayName(otherUser)} />
                <AvatarFallback>{getInitials(getDisplayName(otherUser))}</AvatarFallback>
              </Avatar>
              <div className="ml-4">
                <h3 className="font-medium text-lg text-primary dark:text-white">
                  {getDisplayName(otherUser)}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {sessionTime}
                </p>
              </div>
            </div>
            
            <Badge className={cn(
              "text-sm",
              isCancelled ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" :
              isPast ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" :
              "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            )}>
              {isCancelled ? "Cancelled" : isPast ? "Completed" : "Scheduled"}
            </Badge>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Clock className="h-4 w-4 mr-2" />
              <span>{session.duration} minutes</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              {session.location === "online" ? (
                <Video className="h-4 w-4 mr-2" />
              ) : (
                <MapPin className="h-4 w-4 mr-2" />
              )}
              <span>{session.location === "online" ? "Online Session" : "In-Person Meeting"}</span>
            </div>
            
            {session.notes && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm text-gray-600 dark:text-gray-300">
                {session.notes}
              </div>
            )}
          </div>
          
          {!isCancelled && !isPast && (
            <div className="mt-4 flex space-x-2">
              <Button 
                variant="outline" 
                className="flex-1 text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-950"
                onClick={() => handleOpenCancel(session)}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => handleOpenReschedule(session)}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Reschedule
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary dark:text-white">Learning Sessions</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Manage your scheduled skill exchange sessions</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger 
            value="upcoming" 
            className="flex items-center justify-center"
          >
            <Clock className="h-4 w-4 mr-2" />
            Upcoming
            {upcomingSessions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {upcomingSessions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="past" 
            className="flex items-center justify-center"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Past
          </TabsTrigger>
          <TabsTrigger 
            value="cancelled" 
            className="flex items-center justify-center"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancelled
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="ml-4">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-24 mt-1" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-24" />
                    </div>
                    <div className="mt-4 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-44" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : isError ? (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px]">
                <div className="text-red-500 mb-2">
                  <AlertTriangle className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-medium mb-2">Failed to load sessions</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                  There was an error loading your sessions. Please try again.
                </p>
                <Button onClick={handleRefresh}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : upcomingSessions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px]">
                <div className="text-gray-400 mb-2">
                  <Users className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-medium mb-2">No upcoming sessions</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                  You don't have any upcoming learning sessions scheduled.
                  Connect with other users to schedule sessions.
                </p>
                <Button onClick={() => window.location.href = "/matches"}>
                  Find Learning Partners
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {upcomingSessions.map(session => renderSessionCard(session))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="ml-4">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-24 mt-1" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-24" />
                    </div>
                    <div className="mt-4 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-44" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pastSessions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px]">
                <div className="text-gray-400 mb-2">
                  <Clock className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-medium mb-2">No past sessions</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  You haven't completed any learning sessions yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pastSessions.map(session => renderSessionCard(session))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="cancelled" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(1)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="ml-4">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-24 mt-1" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-24" />
                    </div>
                    <div className="mt-4 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-44" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : cancelledSessions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px]">
                <div className="text-gray-400 mb-2">
                  <XCircle className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-medium mb-2">No cancelled sessions</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  You don't have any cancelled learning sessions.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {cancelledSessions.map(session => renderSessionCard(session))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Reschedule Modal */}
      <Dialog open={isRescheduleModalOpen} onOpenChange={setIsRescheduleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Session</DialogTitle>
            <DialogDescription>
              Update the details for your learning session with{" "}
              {sessionToModify && getDisplayName(getOtherParticipant(sessionToModify))}.
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
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRescheduleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleReschedule}
              disabled={!scheduledDate || updateSessionMutation.isPending}
            >
              {updateSessionMutation.isPending ? 
                "Rescheduling..." : 
                "Reschedule Session"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Cancel Confirmation Modal */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your scheduled session with{" "}
              {sessionToModify && getDisplayName(getOtherParticipant(sessionToModify))}?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-gray-500 dark:text-gray-400">
              This action cannot be undone. The other participant will be notified of the cancellation.
            </p>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCancelModalOpen(false)}
            >
              No, Keep Session
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleCancel}
              disabled={updateSessionMutation.isPending}
            >
              {updateSessionMutation.isPending ? 
                "Cancelling..." : 
                "Yes, Cancel Session"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}