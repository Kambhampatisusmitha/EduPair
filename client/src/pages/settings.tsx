import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import SkillTag from "@/components/ui/skill-tag";
import { 
  User, 
  Users,
  Settings as SettingsIcon, 
  Save, 
  Bell, 
  Shield, 
  Moon, 
  Sun, 
  Globe, 
  Lock, 
  Mail, 
  Key, 
  Trash2,
  PlusCircle,
  X,
  EyeOff
} from "lucide-react";
import { useTheme } from "@/contexts/theme-context";

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

// Define the settings interface
interface UserSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  darkMode: boolean;
  sessionReminders: boolean;
  profileVisibility: "public" | "private" | "connections";
  twoFactorAuth: boolean;
}

// Custom hook to fetch avatar blob and return a blob URL
function useUserAvatar() {
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  useEffect(() => {
    let revoked = false;
    fetch("http://localhost:5000/api/users/me/avatar", { credentials: "include" })
      .then(res => res.ok ? res.blob() : null)
      .then(blob => {
        if (blob && !revoked) {
          const url = URL.createObjectURL(blob);
          setAvatarUrl(url);
          return () => URL.revokeObjectURL(url);
        }
      });
    return () => { revoked = true; };
  }, []);
  return avatarUrl;
}

export default function SettingsPage() {
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  
  // State for skills
  const [newTeachSkill, setNewTeachSkill] = useState("");
  const [newLearnSkill, setNewLearnSkill] = useState("");
  const [popularSkills, setPopularSkills] = useState<string[]>([]);
  const [skillSearchQuery, setSkillSearchQuery] = useState("");
  const [filteredSkills, setFilteredSkills] = useState<string[]>([]);
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState("account");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Get the current location to check for URL parameters
  const [location] = useLocation();
  
  // Parse URL parameters to get the active tab
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['account', 'skills', 'notifications', 'privacy'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location]);
  
  // State for settings
  const [settings, setSettings] = useState<UserSettings>({
    emailNotifications: true,
    pushNotifications: true,
    darkMode: theme === "dark",
    sessionReminders: true,
    profileVisibility: "public",
    twoFactorAuth: false
  });
  
  // State for password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  // Fetch user profile data
  const {
    data: user,
    isLoading,
    error,
    isError
  } = useQuery({
    queryKey: ["/api/users/me"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  const avatarUrl = useUserAvatar();
  
  // Fetch popular skills for suggestions
  useEffect(() => {
    // In a real app, this would be an API call
    // For now, we'll use a static list
    setPopularSkills([
      "JavaScript", "Python", "React", "Node.js", "TypeScript",
      "HTML", "CSS", "SQL", "Data Science", "Machine Learning",
      "UI/UX Design", "Product Management", "Digital Marketing",
      "Content Writing", "Public Speaking", "Leadership",
      "Project Management", "Agile", "Scrum", "DevOps"
    ]);
  }, []);
  
  // Update filtered skills when search query changes
  useEffect(() => {
    if (skillSearchQuery) {
      const query = skillSearchQuery.toLowerCase();
      const filtered = popularSkills.filter(skill => 
        skill.toLowerCase().includes(query)
      );
      setFilteredSkills(filtered);
    } else {
      setFilteredSkills([]);
    }
  }, [skillSearchQuery, popularSkills]);
  
  // Update dark mode setting when theme changes
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      darkMode: theme === "dark"
    }));
  }, [theme]);

  // Mutation for updating settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (settingsData: Partial<UserSettings>) => {
      // This would be an actual API call in a real application
      // return apiRequest("PATCH", "/api/users/me/settings", settingsData);
      
      // For now, we'll just simulate success
      return new Promise(resolve => setTimeout(() => resolve(settingsData), 500));
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Your settings have been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update settings",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  });

  // Mutation for changing password
  const changePasswordMutation = useMutation({
    mutationFn: async (passwordData: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
      // This would be an actual API call in a real application
      // return apiRequest("POST", "/api/users/me/change-password", passwordData);
      
      // For now, we'll just simulate success
      return new Promise(resolve => setTimeout(() => resolve({}), 500));
    },
    onSuccess: () => {
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      toast({
        title: "Password changed",
        description: "Your password has been successfully changed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to change password",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  });

  // Mutation for adding a skill
  const addSkillMutation = useMutation({
    mutationFn: async ({ type, skill }: { type: 'teach' | 'learn', skill: string }) => {
      const endpoint = type === 'teach' ? '/api/users/me/teach-skills' : '/api/users/me/learn-skills';
      return apiRequest("POST", endpoint, { skill });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      if (variables.type === 'teach') {
        setNewTeachSkill("");
      } else {
        setNewLearnSkill("");
      }
      toast({
        title: "Skill added",
        description: `Your ${variables.type === 'teach' ? 'teaching' : 'learning'} skill has been added.`,
      });
    },
    onError: (error: any) => {
      // Handle specific error cases
      if (error.response?.status === 409) {
        toast({
          title: "Skill already exists",
          description: "This skill is already in your list.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to add skill",
          description: error.message || "Please try again later.",
          variant: "destructive",
        });
      }
    }
  });

  // Mutation for removing a skill
  const removeSkillMutation = useMutation({
    mutationFn: async ({ type, skill }: { type: 'teach' | 'learn', skill: string }) => {
      const endpoint = type === 'teach' ? '/api/users/me/teach-skills' : '/api/users/me/learn-skills';
      return apiRequest("DELETE", endpoint, { skill });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      toast({
        title: "Skill removed",
        description: `Your ${variables.type === 'teach' ? 'teaching' : 'learning'} skill has been removed.`,
      });
    },
    onError: (error: any) => {
      console.error("Error removing skill:", error);
      toast({
        title: "Failed to remove skill",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  });

  // Handle adding a skill
  const handleAddSkill = (type: 'teach' | 'learn') => {
    const skill = type === 'teach' ? newTeachSkill : newLearnSkill;
    if (skill.trim()) {
      // Check if skill already exists in the user's skills
      const userSkills = type === 'teach' ? user?.teachSkills || [] : user?.learnSkills || [];
      if (userSkills.includes(skill.trim())) {
        toast({
          title: "Skill already exists",
          description: "This skill is already in your list.",
          variant: "destructive",
        });
        return;
      }
      
      // Check if the skill exists in the opposite category
      const oppositeSkills = type === 'teach' ? user?.learnSkills || [] : user?.teachSkills || [];
      if (oppositeSkills.includes(skill.trim())) {
        toast({
          title: "Skill conflict",
          description: `You cannot add "${skill.trim()}" as a ${type === 'teach' ? 'teaching' : 'learning'} skill because it's already in your ${type === 'teach' ? 'learning' : 'teaching'} skills.`,
          variant: "destructive",
        });
        return;
      }
      
      // Check if user has reached the maximum number of skills (5)
      if (userSkills.length >= 5) {
        toast({
          title: "Maximum skills reached",
          description: `You can only have up to 5 ${type === 'teach' ? 'teaching' : 'learning'} skills.`,
          variant: "destructive",
        });
        return;
      }
      
      addSkillMutation.mutate({ type, skill: skill.trim() });
    }
  };
  
  // Handle selecting a skill from the dropdown
  const handleSelectSkill = (type: 'teach' | 'learn', skill: string) => {
    if (type === 'teach') {
      setNewTeachSkill(skill);
    } else {
      setNewLearnSkill(skill);
    }
    setShowSkillDropdown(false);
    setSkillSearchQuery("");
    setFilteredSkills([]);
  };
  
  // Handle file selection and upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 2MB in size.",
        variant: "destructive",
      });
      return;
    }
    
    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, etc.).",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    // Upload to backend
    const formData = new FormData();
    formData.append("avatar", file);
    
    try {
      // Use the API utility function for consistent error handling
      const res = await fetch("http://localhost:5000/api/users/me/avatar", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Upload failed");
      }
      
      // Force refresh avatar by invalidating queries
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      
      // Force refresh the avatar URL to show the new image
      setTimeout(() => {
        const timestamp = new Date().getTime();
        const refreshUrl = `http://localhost:5000/api/users/me/avatar?t=${timestamp}`;
        fetch(refreshUrl, { credentials: "include" })
          .then(res => res.ok ? res.blob() : null)
          .then(blob => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              // This will update the avatar in the UI
              window.location.reload();
            }
          });
      }, 500);
      
      toast({
        title: "Profile photo updated",
        description: "Your profile photo has been updated successfully.",
      });
    } catch (err: any) {
      console.error("Error uploading avatar:", err);
      toast({
        title: "Failed to upload photo",
        description: err.message || "There was an error uploading your profile photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle removing a skill
  const handleRemoveSkill = (type: 'teach' | 'learn', skill: string) => {
    removeSkillMutation.mutate({ type, skill });
  };

  // Handle settings change
  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    // Special handling for dark mode
    if (key === "darkMode") {
      setTheme(value ? "dark" : "light");
    }
    
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Update the setting in the backend
    updateSettingsMutation.mutate({ [key]: value });
  };

  // Handle password change
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation don't match.",
        variant: "destructive",
      });
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }
    
    changePasswordMutation.mutate(passwordData);
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

  // Loading state
  if (isLoading) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="bg-white dark:bg-card shadow-md rounded-lg p-6">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
            <div className="space-y-4">
              <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Error Loading Settings</CardTitle>
            <CardDescription>
              We couldn't load your settings. Please try refreshing the page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="flex items-center mb-6">
        <SettingsIcon className="h-6 w-6 mr-2 text-royal-purple dark:text-lavender" />
        <h1 className="text-2xl font-heading font-bold text-deep-indigo dark:text-white">Settings</h1>
      </div>
      
      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <TabsTrigger value="account" className="data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-royal-purple dark:data-[state=active]:text-lavender rounded-md transition-all">
            <User className="h-4 w-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="skills" className="data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-royal-purple dark:data-[state=active]:text-lavender rounded-md transition-all">
            <PlusCircle className="h-4 w-4 mr-2" />
            Skills
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-royal-purple dark:data-[state=active]:text-lavender rounded-md transition-all">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-royal-purple dark:data-[state=active]:text-lavender rounded-md transition-all">
            <Shield className="h-4 w-4 mr-2" />
            Privacy & Security
          </TabsTrigger>
        </TabsList>
        
        {/* Account Settings */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Update your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-4 border-white dark:border-deepIndigo shadow-lg">
                    <AvatarImage src={avatarUrl} alt={user?.displayName || user?.fullname || ""} />
                    <AvatarFallback className="text-xl bg-royal-purple/10 text-royal-purple dark:bg-royal-purple/20 dark:text-snow">
                      {getInitials(user?.displayName || user?.fullname || "")}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="absolute -bottom-2 -right-2 rounded-full p-1.5 bg-white dark:bg-card border border-gray-200 dark:border-gray-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <span className="sr-only">Change avatar</span>
                    {isUploading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-royal-purple border-t-transparent"></span>
                    ) : (
                      <PlusCircle className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input 
                        id="displayName" 
                        value={user?.displayName || user?.fullname || ""} 
                        disabled 
                        className="bg-gray-50 dark:bg-gray-800"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        You can change your display name in your profile
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        value={user?.email || ""} 
                        disabled 
                        className="bg-gray-50 dark:bg-gray-800"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Your email address is used for login and notifications
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="theme">Theme Preference</Label>
                      <div className="flex items-center space-x-2">
                        <Sun className="h-4 w-4 text-amber" />
                        <Switch 
                          id="theme"
                          checked={settings.darkMode}
                          onCheckedChange={(checked) => handleSettingChange("darkMode", checked)}
                        />
                        <Moon className="h-4 w-4 text-deep-indigo dark:text-lavender" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Choose between light and dark theme
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input 
                      id="currentPassword" 
                      type="password" 
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      required
                    />
                    <EyeOff className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input 
                      id="newPassword" 
                      type="password" 
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      required
                    />
                    <EyeOff className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Password must be at least 8 characters long
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      required
                    />
                    <EyeOff className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer" />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="bg-royal-purple hover:bg-royal-purple/90 text-white"
                  disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Skills Settings */}
        <TabsContent value="skills" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Teaching Skills</CardTitle>
              <CardDescription>
                Skills you can teach to others
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {user && user.teachSkills && user.teachSkills.length > 0 ? (
                  user.teachSkills.map((skill) => (
                    <SkillTag 
                      key={skill} 
                      type="teach"
                      onRemove={() => handleRemoveSkill('teach', skill)}
                    >
                      {skill}
                    </SkillTag>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You haven't added any teaching skills yet.
                  </p>
                )}
              </div>
              
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Add a new teaching skill..."
                      value={newTeachSkill}
                      onChange={(e) => {
                        setNewTeachSkill(e.target.value);
                        setSkillSearchQuery(e.target.value);
                        setShowSkillDropdown(true);
                      }}
                      className="flex-1"
                      onFocus={() => {
                        if (newTeachSkill) {
                          setSkillSearchQuery(newTeachSkill);
                          setShowSkillDropdown(true);
                        }
                      }}
                      onBlur={() => {
                        // Delay hiding dropdown to allow clicking on options
                        setTimeout(() => setShowSkillDropdown(false), 200);
                      }}
                    />
                    
                    {/* Skill suggestions dropdown */}
                    {showSkillDropdown && newTeachSkill && filteredSkills.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto">
                        {filteredSkills.map((skill) => (
                          <div
                            key={skill}
                            className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                            onMouseDown={(e) => {
                              e.preventDefault(); // Prevent input blur
                              handleSelectSkill('teach', skill);
                            }}
                          >
                            {skill}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button 
                    onClick={() => handleAddSkill('teach')}
                    disabled={!newTeachSkill.trim() || (user && user.teachSkills && user.teachSkills.length >= 5)}
                    className="bg-royal-purple hover:bg-royal-purple/90 text-white"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400">
                You can add up to 5 teaching skills to your profile
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Learning Skills</CardTitle>
              <CardDescription>
                Skills you want to learn from others
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {user && user.learnSkills && user.learnSkills.length > 0 ? (
                  user.learnSkills.map((skill) => (
                    <SkillTag 
                      key={skill} 
                      type="learn"
                      onRemove={() => handleRemoveSkill('learn', skill)}
                    >
                      {skill}
                    </SkillTag>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You haven't added any learning skills yet.
                  </p>
                )}
              </div>
              
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Add a new learning skill..."
                      value={newLearnSkill}
                      onChange={(e) => {
                        setNewLearnSkill(e.target.value);
                        setSkillSearchQuery(e.target.value);
                        setShowSkillDropdown(true);
                      }}
                      className="flex-1"
                      onFocus={() => {
                        if (newLearnSkill) {
                          setSkillSearchQuery(newLearnSkill);
                          setShowSkillDropdown(true);
                        }
                      }}
                      onBlur={() => {
                        // Delay hiding dropdown to allow clicking on options
                        setTimeout(() => setShowSkillDropdown(false), 200);
                      }}
                    />
                    
                    {/* Skill suggestions dropdown */}
                    {showSkillDropdown && newLearnSkill && filteredSkills.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto">
                        {filteredSkills.map((skill) => (
                          <div
                            key={skill}
                            className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                            onMouseDown={(e) => {
                              e.preventDefault(); // Prevent input blur
                              handleSelectSkill('learn', skill);
                            }}
                          >
                            {skill}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button 
                    onClick={() => handleAddSkill('learn')}
                    disabled={!newLearnSkill.trim() || (user && user.learnSkills && user.learnSkills.length >= 5)}
                    className="bg-teal hover:bg-teal/90 text-white"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400">
                You can add up to 5 learning skills to your profile
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how and when you want to be notified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Email Notifications</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch 
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Push Notifications</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Receive notifications in your browser
                    </p>
                  </div>
                  <Switch 
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => handleSettingChange("pushNotifications", checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Session Reminders</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Get reminders before your scheduled sessions
                    </p>
                  </div>
                  <Switch 
                    checked={settings.sessionReminders}
                    onCheckedChange={(checked) => handleSettingChange("sessionReminders", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Privacy & Security Settings */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control who can see your profile and information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Profile Visibility</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Button
                      variant={settings.profileVisibility === "public" ? "default" : "outline"}
                      className={settings.profileVisibility === "public" ? "bg-royal-purple text-white" : ""}
                      onClick={() => handleSettingChange("profileVisibility", "public")}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Public
                    </Button>
                    <Button
                      variant={settings.profileVisibility === "connections" ? "default" : "outline"}
                      className={settings.profileVisibility === "connections" ? "bg-royal-purple text-white" : ""}
                      onClick={() => handleSettingChange("profileVisibility", "connections")}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Connections Only
                    </Button>
                    <Button
                      variant={settings.profileVisibility === "private" ? "default" : "outline"}
                      className={settings.profileVisibility === "private" ? "bg-royal-purple text-white" : ""}
                      onClick={() => handleSettingChange("profileVisibility", "private")}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Private
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Choose who can view your profile and skills
                  </p>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Two-Factor Authentication</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch 
                    checked={settings.twoFactorAuth}
                    onCheckedChange={(checked) => handleSettingChange("twoFactorAuth", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions that affect your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/10">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
