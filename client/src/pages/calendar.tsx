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
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Video, MoreHorizontal, Plus, AlertTriangle, CalendarDays, Calendar as CalendarIcon, Users } from "lucide-react";
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-primary dark:text-white">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handlePrevMonth}
            className="hover:bg-secondary/30 hover:text-primary dark:hover:bg-secondary/20 dark:hover:text-primary-foreground transition-all duration-200"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => onDateChange(today)}
            className="hover:bg-secondary/30 hover:text-primary dark:hover:bg-secondary/20 dark:hover:text-primary-foreground transition-all duration-200"
          >
            <CalendarIcon className="h-5 w-5" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleNextMonth}
            className="hover:bg-secondary/30 hover:text-primary dark:hover:bg-secondary/20 dark:hover:text-primary-foreground transition-all duration-200"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
        {/* Week day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div 
            key={day} 
            className="bg-white dark:bg-card p-3 text-center text-sm font-semibold text-primary/80 dark:text-white/80"
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
                "min-h-[110px] bg-white dark:bg-card p-2 relative transition-all duration-200",
                !isCurrentMonth && "bg-gray-50 dark:bg-gray-800/50 opacity-70",
                isToday(day) && "ring-2 ring-primary dark:ring-primary ring-offset-2 dark:ring-offset-1"
              )}
            >
              <div className="flex justify-between items-start">
                <span 
                  className={cn(
                    "text-sm font-semibold h-7 w-7 flex items-center justify-center rounded-full transition-colors duration-200",
                    isToday(day) && "bg-primary text-white dark:bg-primary shadow-sm"
                  )}
                >
                  {format(day, "d")}
                </span>
                
                {isLoading && isCurrentMonth && (
                  <div className="pt-6 px-1">
                    <Skeleton className="h-5 w-full mb-1" />
                    <Skeleton className="h-5 w-3/4" />
                  </div>
                )}
              </div>
              
              {/* Sessions for this day */}
              <div className="mt-2 space-y-1">
                {daySessions.slice(0, 3).map((session) => {
                  const isPast = isBefore(parseISO(session.scheduledDate), new Date());
                  const isTeaching = session.status === "scheduled";
                  
                  return (
                    <div 
                      key={session.id}
                      onClick={() => onSessionClick(session)}
                      className={cn(
                        "px-2 py-1.5 text-xs rounded-md truncate cursor-pointer border border-transparent transition-all duration-200",
                        isTeaching 
                          ? "bg-[#547792]/20 hover:bg-[#547792]/30 hover:border-[#547792]/50 text-[#213448] dark:text-white"
                          : "bg-[#94B4C1]/20 hover:bg-[#94B4C1]/30 hover:border-[#94B4C1]/50 text-[#213448] dark:text-white",
                        isPast && "opacity-60"
                      )}
                    >
                      <div className="flex items-center">
                        <span className={cn(
                          "h-2 w-2 rounded-full mr-1.5 flex-shrink-0",
                          isTeaching ? "bg-[#547792] dark:bg-[#547792]" : "bg-[#94B4C1] dark:bg-[#94B4C1]"
                        )}></span>
                        <span className="truncate">
                          {format(parseISO(session.scheduledDate), "h:mm a")} - {session.participants[0]?.user.fullname}
                        </span>
                      </div>
                    </div>
                  );
                })}
                
                {/* Show indicator if there are more sessions */}
                {daySessions.length > 3 && (
                  <div className="text-xs text-gray-600 dark:text-gray-300 px-2 py-1 bg-gray-50 dark:bg-gray-800/50 rounded-md text-center font-medium">
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-primary dark:text-white">
          {format(startOfCurrentWeek, "MMM d")} - {format(endOfCurrentWeek, "MMM d, yyyy")}
        </h2>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handlePrevWeek}
            className="hover:bg-secondary/30 hover:text-primary dark:hover:bg-secondary/20 dark:hover:text-primary-foreground transition-all duration-200"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => onDateChange(new Date())}
            className="hover:bg-secondary/30 hover:text-primary dark:hover:bg-secondary/20 dark:hover:text-primary-foreground transition-all duration-200"
          >
            <CalendarIcon className="h-5 w-5" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleNextWeek}
            className="hover:bg-secondary/30 hover:text-primary dark:hover:bg-secondary/20 dark:hover:text-primary-foreground transition-all duration-200"
          >
            <ChevronRight className="h-5 w-5" />
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
                "text-center p-3 rounded-t-lg transition-colors duration-200",
                isToday(day) 
                  ? "bg-primary text-white dark:bg-primary shadow-sm" 
                  : "bg-gray-100 dark:bg-gray-800 text-primary/80 dark:text-white/80"
              )}>
                <div className="font-semibold">{format(day, "EEE")}</div>
                <div className={cn(
                  "mt-1",
                  isToday(day) ? "font-bold" : ""
                )}>
                  {format(day, "MMM d")}
                </div>
              </div>
              
              <div className="border border-t-0 border-gray-200 dark:border-gray-700 rounded-b-lg p-3 h-[420px] overflow-y-auto space-y-3 bg-white dark:bg-card shadow-sm">
                {isLoading ? (
                  <div className="space-y-3 py-2">
                    <Skeleton className="h-[72px] w-full rounded-md" />
                    <Skeleton className="h-[72px] w-full rounded-md" />
                  </div>
                ) : daySessions.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
                      <Plus className="h-5 w-5 mx-auto mb-2 opacity-40" />
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
                          "p-3 rounded-lg cursor-pointer border transition-all duration-200",
                          isTeaching 
                            ? "bg-[#547792]/10 border-[#547792]/20 hover:bg-[#547792]/20 hover:border-[#547792]/50" 
                            : "bg-[#94B4C1]/10 border-[#94B4C1]/20 hover:bg-[#94B4C1]/20 hover:border-[#94B4C1]/50",
                          isPast && "opacity-60"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className={cn(
                            "text-sm font-medium px-2 py-0.5 rounded-full",
                            isTeaching 
                              ? "bg-[#547792]/20 text-[#213448] dark:text-white dark:bg-[#547792]/30" 
                              : "bg-[#94B4C1]/20 text-[#213448] dark:text-white dark:bg-[#94B4C1]/30"
                          )}>
                            {format(parseISO(session.scheduledDate), "h:mm a")}
                          </div>
                          <Badge variant="outline" className={cn(
                            "text-[10px] font-medium",
                            isTeaching ? "border-[#547792]/50" : "border-[#94B4C1]/50"
                          )}>
                            {session.duration} min
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Avatar className="h-6 w-6 border-2 border-white dark:border-gray-800">
                            <AvatarImage src={otherUser?.avatar || ""} />
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary dark:bg-primary/20 dark:text-white font-medium">
                              {getInitials(otherUser?.fullname)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium truncate text-gray-700 dark:text-gray-300">
                            {otherUser?.fullname}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {session.location === "online" ? (
                            <>
                              <Video className="h-3 w-3 mr-1" />
                              <span>Online</span>
                            </>
                          ) : (
                            <>
                              <MapPin className="h-3 w-3 mr-1" />
                              <span>In Person</span>
                            </>
                          )}
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-primary dark:text-white">
          {format(currentDate, "EEEE, MMMM d, yyyy")}
        </h2>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handlePrevDay}
            className="hover:bg-secondary/30 hover:text-primary dark:hover:bg-secondary/20 dark:hover:text-primary-foreground transition-all duration-200"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => onDateChange(new Date())}
            className="hover:bg-secondary/30 hover:text-primary dark:hover:bg-secondary/20 dark:hover:text-primary-foreground transition-all duration-200"
          >
            <CalendarIcon className="h-5 w-5" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleNextDay}
            className="hover:bg-secondary/30 hover:text-primary dark:hover:bg-secondary/20 dark:hover:text-primary-foreground transition-all duration-200"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Day schedule */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-gray-50 dark:bg-gray-800 p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center mr-4",
              isToday(currentDate)
                ? "bg-primary text-white" 
                : "bg-gray-100 dark:bg-gray-700 text-primary dark:text-white"
            )}>
              <span className="text-lg font-bold">{format(currentDate, "d")}</span>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {isToday(currentDate) ? "Today" : format(currentDate, "EEEE")}
              </div>
              <div className="text-xl font-semibold text-primary dark:text-white">
                {format(currentDate, "MMMM d, yyyy")}
              </div>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-card">
          {isLoading ? (
            <div className="space-y-6 p-6">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          ) : daySessions.length === 0 ? (
            <div className="py-20">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <div className="bg-gray-50 dark:bg-gray-800 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                </div>
                <h3 className="text-xl font-medium mb-2 text-primary dark:text-white">No Sessions Scheduled</h3>
                <p className="text-sm max-w-md mx-auto mb-6">
                  You don't have any learning sessions scheduled for this day.
                  Would you like to find learning partners?
                </p>
                <Button 
                  variant="default" 
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white"
                  onClick={() => window.location.href = "/matches"}
                >
                  <Users className="h-4 w-4 mr-2" />
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
                    "p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors duration-200",
                    isTeaching 
                      ? "border-l-4 border-[#547792]" 
                      : "border-l-4 border-[#94B4C1]",
                    isPast && "opacity-70"
                  )}
                  onClick={() => onSessionClick(session)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-white dark:border-gray-800 shadow-sm">
                        <AvatarImage src={otherUser?.avatar || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-white font-medium">
                          {getInitials(otherUser?.fullname)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h3 className="font-medium text-lg text-gray-800 dark:text-gray-100">
                          Session with {otherUser?.fullname}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <div className="flex items-center mr-3">
                            <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-500 dark:text-gray-400" />
                            <span className="font-medium">
                              {format(parseISO(session.scheduledDate), "h:mm a")}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-500 dark:text-gray-400" />
                            <span>
                              {session.duration} minutes
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Badge className={cn(
                      "px-3 py-1 text-xs font-medium",
                      isTeaching 
                        ? "bg-[#547792]/20 text-[#547792] border-[#547792]/30 dark:bg-[#547792]/30 dark:text-white dark:border-[#547792]/50"
                        : "bg-[#94B4C1]/20 text-[#94B4C1] border-[#94B4C1]/30 dark:bg-[#94B4C1]/30 dark:text-white dark:border-[#94B4C1]/50"
                    )}>
                      {isTeaching ? "Teaching" : "Learning"}
                    </Badge>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        {session.location === "online" ? (
                          <>
                            <Video className="h-4 w-4 mr-2 text-primary/70 dark:text-primary/50" />
                            <span>Online Session</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4 mr-2 text-primary/70 dark:text-primary/50" />
                            <span>In-Person Meeting</span>
                          </>
                        )}
                      </div>
                      
                      {session.notes && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                          <span>Has notes</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="h-8 px-2 text-xs border-gray-200 dark:border-gray-700">
                        Reschedule
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
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
          <DialogTitle className="text-center text-xl font-semibold text-primary dark:text-white">
            {isPast ? "Session Details" : "Upcoming Session"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isPast ? "Details of your past learning session" : "Details of your upcoming learning session"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5 py-2">
          {/* Session with who */}
          <div className="flex flex-col items-center gap-3 my-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-2 border-primary/20 dark:border-primary/30 shadow-md">
                <AvatarImage src={otherUser?.avatar || ""} />
                <AvatarFallback className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-white text-xl font-semibold">
                  {getInitials(otherUser?.fullname)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-white dark:bg-card p-1 rounded-full shadow-sm border border-gray-100 dark:border-gray-800">
                <div className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center",
                  session.status === "scheduled" 
                    ? "bg-[#547792] text-white" 
                    : "bg-[#94B4C1] text-white"
                )}>
                  {session.status === "scheduled" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 8-9.04 9.06a2.82 2.82 0 1 0 3.98 3.98L16 12"/><circle cx="17" cy="7" r="5"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8c-1.5 2.5-.5 5.5 2 8.5s6 5.5 8.5 4c2.5-1.5 3.5-4.5 1.5-8-2-3.5-5.5-6.5-8.5-5C5.5 9 5 11 5 14c0 3 1 6 4.5 7.5 3.5 1.5 7.5-.5 9.5-3"/></svg>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="font-semibold text-xl text-gray-800 dark:text-gray-100">{otherUser?.fullname}</h3>
              <Badge className={cn(
                "mt-1 px-3 py-1",
                session.status === "scheduled" 
                  ? "bg-[#547792]/20 text-[#547792] border-[#547792]/30 dark:bg-[#547792]/30 dark:text-white dark:border-[#547792]/50"
                  : "bg-[#94B4C1]/20 text-[#94B4C1] border-[#94B4C1]/30 dark:bg-[#94B4C1]/30 dark:text-white dark:border-[#94B4C1]/50"
              )}>
                {session.status === "scheduled" ? "You are teaching" : "You are learning"}
              </Badge>
            </div>
          </div>
          
          {/* Session details */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 space-y-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg flex-shrink-0">
                <Calendar className="h-5 w-5 text-primary dark:text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Date & Time</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {format(sessionDate, "EEEE, MMMM d, yyyy")}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center mt-0.5">
                  <span className="font-medium">{format(sessionDate, "h:mm a")}</span>
                  <span className="mx-1.5">•</span>
                  <span>{session.duration} minutes</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg flex-shrink-0">
                {session.location === "online" ? (
                  <Video className="h-5 w-5 text-primary dark:text-white" />
                ) : (
                  <MapPin className="h-5 w-5 text-primary dark:text-white" />
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Location</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {session.location === "online" ? (
                    <>
                      <div className="font-medium mb-0.5">Online Session</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        A meeting link will be shared before the session starts
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-medium mb-0.5">In-Person Meeting</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Location details will be shared privately
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {session.notes && (
              <div className="flex items-start gap-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-950/30 rounded-lg flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">Session Notes</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-line">
                    {session.notes}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Skills being exchanged */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Skills Being Exchanged</h4>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                  session.status === "scheduled" 
                    ? "bg-[#547792] text-white" 
                    : "bg-[#94B4C1] text-white"
                )}>
                  {session.status === "scheduled" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5V3"></path><path d="M14 5V3"></path><path d="M12 22v-1"></path><circle cx="9" cy="9" r="7"></circle><path d="m21.95 13.5-.975-.7A9.97 9.97 0 0 0 22 8c0-2.386-.834-4.58-2.227-6.3"></path><path d="M19 16.5h.028a9.93 9.93 0 0 0 3.4-1.2"></path><path d="m3.5 11-.975.7a9.97 9.97 0 0 0 1.05 4.8"></path><path d="M5 16.5H4.972a9.93 9.93 0 0 0 7.6 4.4"></path></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-5"></path><path d="M9 8V5c0-1.1.9-2 2-2h2a2 2 0 0 1 2 2v3"></path><path d="M15 9h.01"></path><path d="M9 9h.01"></path><path d="M12 12a3 3 0 0 0-2 5.2V20h4v-2.8A3 3 0 0 0 12 12Z"></path></svg>
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {session.status === "scheduled" ? "You will teach" : "You will learn"}
                  </div>
                  <div className="font-medium">
                    {session.status === "scheduled" ? 
                      session.teachSkills?.join(", ") || "Skills not specified" : 
                      session.learnSkills?.join(", ") || "Skills not specified"}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                  session.status === "scheduled" 
                    ? "bg-[#94B4C1] text-white" 
                    : "bg-[#547792] text-white"
                )}>
                  {session.status === "scheduled" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-5"></path><path d="M9 8V5c0-1.1.9-2 2-2h2a2 2 0 0 1 2 2v3"></path><path d="M15 9h.01"></path><path d="M9 9h.01"></path><path d="M12 12a3 3 0 0 0-2 5.2V20h4v-2.8A3 3 0 0 0 12 12Z"></path></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5V3"></path><path d="M14 5V3"></path><path d="M12 22v-1"></path><circle cx="9" cy="9" r="7"></circle><path d="m21.95 13.5-.975-.7A9.97 9.97 0 0 0 22 8c0-2.386-.834-4.58-2.227-6.3"></path><path d="M19 16.5h.028a9.93 9.93 0 0 0 3.4-1.2"></path><path d="m3.5 11-.975.7a9.97 9.97 0 0 0 1.05 4.8"></path><path d="M5 16.5H4.972a9.93 9.93 0 0 0 7.6 4.4"></path></svg>
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {session.status === "scheduled" ? "You will learn" : "You will teach"}
                  </div>
                  <div className="font-medium">
                    {session.status === "scheduled" ? 
                      session.learnSkills?.join(", ") || "Skills not specified" : 
                      session.teachSkills?.join(", ") || "Skills not specified"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-2">
          {isPast ? (
            <>
              <Button variant="outline" onClick={onClose} className="border-gray-200 dark:border-gray-700">
                Close
              </Button>
              <Button className="bg-primary hover:bg-primary/90 text-white">
                <CalendarDays className="h-4 w-4 mr-2" />
                Schedule New Session
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="icon" className="sm:hidden w-full flex items-center justify-center gap-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                <MoreHorizontal className="h-4 w-4" />
                <span>More Options</span>
              </Button>
              <div className="hidden sm:flex gap-2">
                <Button variant="outline" className="text-red-500 border-gray-200 dark:border-gray-700">
                  Cancel Session
                </Button>
                <Button variant="outline" className="border-gray-200 dark:border-gray-700">
                  Reschedule
                </Button>
              </div>
              <Button className="bg-primary hover:bg-primary/90 text-white">
                <CalendarDays className="h-4 w-4 mr-2" />
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
    data: sessionsRaw, 
    isLoading,
    isError
  } = useQuery({
    queryKey: ['/api/sessions'],
    queryFn: getQueryFn<LearningSession[]>({ on401: "throw" })
  });
  
  // Add mock skill data for visualization purposes (in a real app this would come from the API)
  const sessions = (sessionsRaw || []).map(session => ({
    ...session,
    teachSkills: session.teachSkills || ["JavaScript", "React", "UI Design"],
    learnSkills: session.learnSkills || ["Python", "Data Analysis", "UX Research"]
  }));
  
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