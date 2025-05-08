import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  Users, 
  Calendar, 
  Compass, 
  BarChart2, 
  User, 
  Settings, 
  Bell, 
  LogOut,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Logo from "@/components/ui/logo";
import ThemeToggle from "@/components/theme-toggle";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(2);

  const navItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: Users, label: "Matches", path: "/matches" },
    { icon: Clock, label: "Sessions", path: "/sessions" },
    { icon: Calendar, label: "Calendar", path: "/calendar" },
    { icon: BarChart2, label: "Analytics", path: "/analytics" },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-card border-b border-border shadow-sm backdrop-blur-md bg-opacity-90 dark:bg-opacity-90 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Logo className="mr-8 transition-transform duration-300 hover:scale-105" />
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex space-x-1">
                {navItems.map((item) => (
                  <Link 
                    key={item.path} 
                    href={item.path}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
                      location === item.path
                        ? "text-primary dark:text-white bg-secondary/10 dark:bg-secondary/20 shadow-sm"
                        : "text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <item.icon className={`mr-1.5 h-5 w-5 transition-transform duration-300 ${location === item.path ? 'scale-110' : ''}`} />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="relative bg-gray-100/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-2 transition-all duration-300"
                  >
                    <Bell className="h-5 w-5" />
                    {notifications > 0 && (
                      <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center border-2 border-white dark:border-card animate-pulse shadow-sm">
                        {notifications}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg rounded-xl">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Notifications</h3>
                      <Button variant="ghost" size="sm" className="text-xs h-8 px-2">
                        Mark all as read
                      </Button>
                    </div>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    <div className="p-1">
                      <div className="relative text-sm p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer my-1 border-l-2 border-blue-500">
                        <div className="flex gap-3">
                          <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 h-10 w-10 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">New match found</div>
                            <div className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                              You have a new skill match with Sarah J.
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1.5">2 minutes ago</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="relative text-sm p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer my-1 border-l-2 border-green-500">
                        <div className="flex gap-3">
                          <div className="rounded-full bg-green-100 dark:bg-green-900/30 h-10 w-10 flex items-center justify-center flex-shrink-0 text-green-600 dark:text-green-400">
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">Session scheduled</div>
                            <div className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                              Your French lesson is confirmed for tomorrow at 3pm.
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1.5">1 hour ago</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 text-center">
                    <Button variant="ghost" size="sm" className="text-xs w-full">
                      View all notifications
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300">
                    <Avatar className="h-8 w-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                      <AvatarFallback className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-gray-100 font-medium">JD</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-0 overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg rounded-xl">
                  <div className="p-4 bg-gradient-to-br from-primary/10 to-transparent dark:from-primary/20 dark:to-transparent">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-white dark:border-gray-700 shadow-md">
                        <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                        <AvatarFallback className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-gray-100 font-medium">JD</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">John Doe</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">john@example.com</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-2">
                    <DropdownMenuItem asChild className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 py-2">
                      <Link href="/profile" className="flex items-center">
                        <div className="rounded-full bg-gray-100 dark:bg-gray-800 h-8 w-8 flex items-center justify-center mr-2 text-gray-600 dark:text-gray-400">
                          <User className="h-4 w-4" />
                        </div>
                        <span>My Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 py-2">
                      <Link href="/settings" className="flex items-center">
                        <div className="rounded-full bg-gray-100 dark:bg-gray-800 h-8 w-8 flex items-center justify-center mr-2 text-gray-600 dark:text-gray-400">
                          <Settings className="h-4 w-4" />
                        </div>
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                  </div>
                  
                  <div className="p-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="cursor-pointer flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/10 focus:bg-red-50 dark:focus:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200 py-2 rounded-lg"
                    >
                      <div className="rounded-full bg-red-100 dark:bg-red-900/30 h-8 w-8 flex items-center justify-center text-red-600 dark:text-red-400">
                        <LogOut className="h-4 w-4" />
                      </div>
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-card border-t border-border z-10 shadow-lg bg-opacity-90 dark:bg-opacity-90 backdrop-blur-md">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex flex-col items-center justify-center pt-2 pb-1 px-2 rounded-lg transition-colors duration-300 ${
                location === item.path
                  ? "text-primary dark:text-white"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              <div className={`relative ${location === item.path ? 'after:content-[""] after:absolute after:h-1 after:w-1 after:bg-primary dark:after:bg-white after:rounded-full after:-bottom-1 after:left-1/2 after:-translate-x-1/2' : ''}`}>
                <item.icon className={`h-6 w-6 transition-transform duration-300 ${location === item.path ? 'scale-110' : ''}`} />
              </div>
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Main content */}
      <main className="flex-grow pb-20 md:pb-6 transition-colors duration-300">
        {children}
      </main>
    </div>
  );
}
