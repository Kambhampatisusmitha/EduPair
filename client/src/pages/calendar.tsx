import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getQueryFn } from "@/lib/queryClient";
import { format, parse, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isEqual, isSameMonth, isSameDay, addMonths, subMonths, parseISO, addHours, isBefore } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Video, MoreHorizontal, Plus, AlertTriangle, CalendarDays, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LearningSession } from "@/types/matching";
import SkillTag from "@/components/ui/skill-tag";
import { Skeleton } from "@/components/ui/skeleton";

// Helper function to get initials from a name
const getInitials = (name: string = "User") => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Monthly calendar view component
const MonthView = ({ 
  currentDate, 
  sessions, 
  isLoading, 
  onDateChange, 
  onSessionClick 
}: { 
  currentDate: Date; 
  sessions: LearningSession[];
  isLoading: boolean;
  onDateChange: (date: Date) => void;
  onSessionClick: (session: LearningSession) => void;
}) => {
  const today = new Date();
  
  // Get the first day of the month
  const firstDayOfMonth = startOfMonth(currentDate);
  
  // Get the last day of the month
  const lastDayOfMonth = endOfMonth(currentDate);
  
  // Get all days in the month including days from previous/next month to fill the calendar grid
  const startDate = startOfWeek(firstDayOfMonth);
  const endDate = endOfWeek(lastDayOfMonth);
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Group sessions by date for easy access
  const sessionsByDate: Record<string, LearningSession[]> = {};
  sessions.forEach(session => {
    const sessionDate = format(parseISO(session.scheduledDate), "yyyy-MM-dd");
    if (!sessionsByDate[sessionDate]) {
      sessionsByDate[sessionDate] = [];
    }
    sessionsByDate[sessionDate].push(session);
  });
  
  // Navigation handlers
  const handlePrevMonth = () => {
    onDateChange(subMonths(currentDate, 1));
  };
  
  const handleNextMonth = () => {
    onDateChange(addMonths(currentDate, 1));
  };
  
  return (
    <div className="w-full">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => onDateChange(today)}>
            <CalendarIcon className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
        {/* Week day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div 
            key={day} 
            className="bg-white dark:bg-card p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
          >
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {daysInMonth.map((day, dayIdx) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const daySessions = sessionsByDate[dateKey] || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          
          return (
            <div 
              key={dayIdx}
              className={cn(
                "min-h-[100px] bg-white dark:bg-card p-1 relative",
                !isCurrentMonth && "bg-gray-50 dark:bg-gray-800/50",
                isToday(day) && "border-2 border-primary dark:border-light-blue"
              )}
            >
              <div className="flex justify-between items-start">
                <span 
                  className={cn(
                    "text-sm font-semibold h-6 w-6 flex items-center justify-center rounded-full",
                    isToday(day) && "bg-primary text-white dark:bg-light-blue"
                  )}
                >
                  {format(day, "d")}
                </span>
                
                {isLoading && isCurrentMonth && (
                  <div className="pt-6 px-1">
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                )}
              </div>
              
              {/* Sessions for this day */}
              <div className="mt-1 space-y-1">
                {daySessions.slice(0, 3).map((session) => {
                  const isPast = isBefore(parseISO(session.scheduledDate), new Date());
                  const isTeaching = session.status === "scheduled";
                  
                  return (
                    <div 
                      key={session.id}
                      onClick={() => onSessionClick(session)}
                      className={cn(
                        "px-2 py-1 text-xs rounded truncate cursor-pointer",
                        isTeaching 
                          ? "bg-[#547792]/20 hover:bg-[#547792]/30 text-[#213448] dark:text-white"
                          : "bg-[#94B4C1]/20 hover:bg-[#94B4C1]/30 text-[#213448] dark:text-white",
                        isPast && "opacity-60"
                      )}
                    >
                      {format(parseISO(session.scheduledDate), "h:mm a")} - {session.participants[0]?.user.fullname}
                    </div>
                  );
                })}
                
                {/* Show indicator if there are more sessions */}
                {daySessions.length > 3 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                    +{daySessions.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Week calendar view component
const WeekView = ({ 
  currentDate, 
  sessions, 
  isLoading, 
  onDateChange, 
  onSessionClick 
}: { 
  currentDate: Date; 
  sessions: LearningSession[];
  isLoading: boolean;
  onDateChange: (date: Date) => void;
  onSessionClick: (session: LearningSession) => void;
}) => {
  const startOfCurrentWeek = startOfWeek(currentDate);
  const endOfCurrentWeek = endOfWeek(currentDate);
  const daysInWeek = eachDayOfInterval({ start: startOfCurrentWeek, end: endOfCurrentWeek });
  
  // Group sessions by date for easy access
  const sessionsByDate: Record<string, LearningSession[]> = {};
  sessions.forEach(session => {
    const sessionDate = format(parseISO(session.scheduledDate), "yyyy-MM-dd");
    if (!sessionsByDate[sessionDate]) {
      sessionsByDate[sessionDate] = [];
    }
    sessionsByDate[sessionDate].push(session);
  });
  
  // Navigation handlers
  const handlePrevWeek = () => {
    onDateChange(addHours(startOfCurrentWeek, -24));
  };
  
  const handleNextWeek = () => {
    onDateChange(addHours(endOfCurrentWeek, 24));
  };
  
  return (
    <div className="w-full">
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">
          {format(startOfCurrentWeek, "MMM d")} - {format(endOfCurrentWeek, "MMM d, yyyy")}
        </h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={handlePrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => onDateChange(new Date())}>
            <CalendarIcon className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Week view */}
      <div className="grid grid-cols-7 gap-4">
        {daysInWeek.map((day, index) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const daySessions = sessionsByDate[dateKey] || [];
          
          return (
            <div key={index} className="min-w-[100px]">
              <div className={cn(
                "text-center p-2 rounded-t-lg",
                isToday(day) 
                  ? "bg-primary text-white dark:bg-light-blue" 
                  : "bg-gray-100 dark:bg-gray-800"
              )}>
                <div className="font-semibold">{format(day, "EEE")}</div>
                <div className={isToday(day) ? "font-bold" : ""}>{format(day, "MMM d")}</div>
              </div>
              
              <div className="border border-t-0 rounded-b-lg p-2 h-[400px] overflow-y-auto space-y-2">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : daySessions.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
                      <Plus className="h-5 w-5 mx-auto mb-1" />
                      <span>No sessions</span>
                    </div>
                  </div>
                ) : (
                  daySessions.map((session) => {
                    const isPast = isBefore(parseISO(session.scheduledDate), new Date());
                    const isTeaching = session.status === "scheduled";
                    const otherUser = session.participants[0]?.user;
                    
                    return (
                      <div 
                        key={session.id}
                        onClick={() => onSessionClick(session)}
                        className={cn(
                          "p-2 rounded-lg cursor-pointer border",
                          isTeaching 
                            ? "bg-[#547792]/10 border-[#547792]/20 hover:bg-[#547792]/20" 
                            : "bg-[#94B4C1]/10 border-[#94B4C1]/20 hover:bg-[#94B4C1]/20",
                          isPast && "opacity-60"
                        )}
                      >
                        <div className="text-sm font-medium">{format(parseISO(session.scheduledDate), "h:mm a")}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={otherUser?.avatar || ""} />
                            <AvatarFallback className="text-[10px]">{getInitials(otherUser?.fullname)}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs truncate">{otherUser?.fullname}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {session.duration} mins · {session.location === "online" ? "Online" : "In Person"}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Day calendar view component
const DayView = ({ 
  currentDate, 
  sessions, 
  isLoading, 
  onDateChange,
  onSessionClick 
}: { 
  currentDate: Date; 
  sessions: LearningSession[];
  isLoading: boolean;
  onDateChange: (date: Date) => void;
  onSessionClick: (session: LearningSession) => void;
}) => {
  // Filter sessions for the current day
  const daySessionsRaw = sessions.filter(session => {
    const sessionDate = parseISO(session.scheduledDate);
    return isSameDay(sessionDate, currentDate);
  });
  
  // Sort sessions by time
  const daySessions = [...daySessionsRaw].sort((a, b) => {
    return parseISO(a.scheduledDate).getTime() - parseISO(b.scheduledDate).getTime();
  });
  
  // Navigation handlers
  const handlePrevDay = () => {
    const prevDay = new Date(currentDate);
    prevDay.setDate(prevDay.getDate() - 1);
    onDateChange(prevDay);
  };
  
  const handleNextDay = () => {
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    onDateChange(nextDay);
  };
  
  return (
    <div className="w-full">
      {/* Day navigation */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">
          {format(currentDate, "EEEE, MMMM d, yyyy")}
        </h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={handlePrevDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => onDateChange(new Date())}>
            <CalendarIcon className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Day schedule */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-100 dark:bg-gray-800 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {isToday(currentDate) ? "Today" : format(currentDate, "EEEE")}
          </div>
          <div className="text-lg font-semibold">
            {format(currentDate, "MMMM d, yyyy")}
          </div>
        </div>
        
        <div className="divide-y">
          {isLoading ? (
            <div className="space-y-4 p-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : daySessions.length === 0 ? (
            <div className="py-16">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <Calendar className="h-16 w-16 mx-auto mb-3 opacity-30" />
                <h3 className="text-lg font-medium mb-1">No Sessions Scheduled</h3>
                <p className="text-sm max-w-md mx-auto">
                  You don't have any learning sessions scheduled for this day.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.href = "/matches"}
                >
                  Find Learning Partners
                </Button>
              </div>
            </div>
          ) : (
            daySessions.map((session) => {
              const isPast = isBefore(parseISO(session.scheduledDate), new Date());
              const isTeaching = session.status === "scheduled";
              const otherUser = session.participants[0]?.user;
              
              return (
                <div 
                  key={session.id}
                  className={cn(
                    "p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer",
                    isTeaching 
                      ? "border-l-4 border-[#547792]" 
                      : "border-l-4 border-[#94B4C1]",
                    isPast && "opacity-60"
                  )}
                  onClick={() => onSessionClick(session)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={otherUser?.avatar || ""} />
                        <AvatarFallback>{getInitials(otherUser?.fullname)}</AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h3 className="font-medium">
                          Session with {otherUser?.fullname}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>
                            {format(parseISO(session.scheduledDate), "h:mm a")} · {session.duration} minutes
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <Badge className={cn(
                      isTeaching 
                        ? "bg-[#547792]/20 text-[#547792] dark:bg-[#547792]/30 dark:text-white"
                        : "bg-[#94B4C1]/20 text-[#94B4C1] dark:bg-[#94B4C1]/30 dark:text-white"
                    )}>
                      {isTeaching ? "Teaching" : "Learning"}
                    </Badge>
                  </div>
                  
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      {session.location === "online" ? (
                        <Video className="h-4 w-4 mr-1" />
                      ) : (
                        <MapPin className="h-4 w-4 mr-1" />
                      )}
                      <span>{session.location === "online" ? "Online Session" : "In-Person Meeting"}</span>
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// Session detail modal component
const SessionDetailModal = ({ 
  session, 
  isOpen, 
  onClose 
}: { 
  session: LearningSession | null; 
  isOpen: boolean; 
  onClose: () => void;
}) => {
  if (!session) return null;
  
  const otherUser = session.participants[0]?.user;
  const sessionDate = parseISO(session.scheduledDate);
  const isPast = isBefore(sessionDate, new Date());
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {isPast ? "Session Details" : "Upcoming Session"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isPast ? "Details of your past learning session" : "Details of your upcoming learning session"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {/* Session with who */}
          <div className="flex items-center gap-3 justify-center my-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={otherUser?.avatar || ""} />
              <AvatarFallback>{getInitials(otherUser?.fullname)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-lg">{otherUser?.fullname}</h3>
              <Badge className={cn(
                session.status === "scheduled" 
                  ? "bg-[#547792]/20 text-[#547792] dark:bg-[#547792]/30 dark:text-white"
                  : "bg-[#94B4C1]/20 text-[#94B4C1] dark:bg-[#94B4C1]/30 dark:text-white"
              )}>
                {session.status === "scheduled" ? "You are teaching" : "You are learning"}
              </Badge>
            </div>
          </div>
          
          {/* Session details */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary dark:text-light-blue" />
              <div>
                <div className="font-medium">Date & Time</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {format(sessionDate, "EEEE, MMMM d, yyyy")}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {format(sessionDate, "h:mm a")} • {session.duration} minutes
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              {session.location === "online" ? (
                <Video className="h-5 w-5 text-primary dark:text-light-blue" />
              ) : (
                <MapPin className="h-5 w-5 text-primary dark:text-light-blue" />
              )}
              <div>
                <div className="font-medium">Location</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {session.location === "online" ? "Online Session" : "In-Person Meeting"}
                </div>
              </div>
            </div>
            
            {session.notes && (
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-primary dark:text-light-blue" />
                <div>
                  <div className="font-medium">Session Notes</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {session.notes}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between">
          {isPast ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button>
                Schedule New Session
              </Button>
            </>
          ) : (
            <>
              <Button variant="destructive" onClick={onClose}>
                Cancel Session
              </Button>
              <Button onClick={onClose}>
                Add to Calendar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main calendar page component
export default function CalendarPage() {
  const [, navigate] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<"month" | "week" | "day">("month");
  const [selectedSession, setSelectedSession] = useState<LearningSession | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Fetch user sessions
  const { 
    data: sessions, 
    isLoading,
    isError
  } = useQuery({
    queryKey: ['/api/sessions'],
    queryFn: getQueryFn<LearningSession[]>({ on401: "throw" })
  });
  
  // Handle session click
  const handleSessionClick = (session: LearningSession) => {
    setSelectedSession(session);
    setIsDetailModalOpen(true);
  };
  
  // Close session detail modal
  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
  };
  
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary dark:text-white">Calendar</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Manage your scheduled learning sessions</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
          <Select value={viewType} onValueChange={(value: "month" | "week" | "day") => setViewType(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month View</SelectItem>
              <SelectItem value="week">Week View</SelectItem>
              <SelectItem value="day">Day View</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => navigate("/sessions")}>
            <CalendarDays className="h-4 w-4 mr-2" />
            Sessions List
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-6">
          {viewType === "month" && (
            <MonthView 
              currentDate={currentDate} 
              sessions={sessions || []} 
              isLoading={isLoading}
              onDateChange={setCurrentDate}
              onSessionClick={handleSessionClick}
            />
          )}
          
          {viewType === "week" && (
            <WeekView 
              currentDate={currentDate} 
              sessions={sessions || []} 
              isLoading={isLoading}
              onDateChange={setCurrentDate}
              onSessionClick={handleSessionClick}
            />
          )}
          
          {viewType === "day" && (
            <DayView 
              currentDate={currentDate} 
              sessions={sessions || []} 
              isLoading={isLoading}
              onDateChange={setCurrentDate}
              onSessionClick={handleSessionClick}
            />
          )}
          
          {isError && (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to load sessions</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                There was an error loading your sessions. Please try again.
              </p>
              <Button onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Session detail modal */}
      <SessionDetailModal 
        session={selectedSession} 
        isOpen={isDetailModalOpen} 
        onClose={handleCloseDetailModal} 
      />
    </div>
  );
}