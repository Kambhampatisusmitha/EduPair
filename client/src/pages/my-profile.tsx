import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import SkillTag from "@/components/ui/skill-tag";

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
import { 
  User, 
  Edit, 
  Save, 
  X, 
  PlusCircle, 
  Trash2, 
  Camera, 
  Award, 
  BookOpen,
  History,
  Settings,
  Shield
} from "lucide-react";

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

export default function MyProfile() {
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Form states
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [newTeachSkill, setNewTeachSkill] = useState("");
  const [newLearnSkill, setNewLearnSkill] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Fetch user profile data
  const {
    data: user,
    isLoading,
    isError,
  } = useQuery<User>({
    queryKey: ['/api/users/me'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Update form states when user data is loaded
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.fullname || "");
      setBio(user.bio || "");
    }
  }, [user]);

  const avatarUrl = useUserAvatar();

  // Mutation for updating profile
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      return apiRequest("POST", "/api/users/profile", profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      setIsEditMode(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update profile",
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

  // Handle profile update
  const handleUpdateProfile = () => {
    updateProfileMutation.mutate({
      displayName,
      bio
    });
  };

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
      
      addSkillMutation.mutate({ type, skill: skill.trim() });
    }
  };

  // Handle removing a skill
  const handleRemoveSkill = (type: 'teach' | 'learn', skill: string) => {
    removeSkillMutation.mutate({ type, skill });
  };
  
  // Handle file selection and upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    
    // Upload to backend
    const formData = new FormData();
    formData.append("avatar", file);
    
    try {
      const res = await fetch("http://localhost:5000/api/users/me/avatar", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      
      if (!res.ok) throw new Error("Upload failed");
      
      // Fetch the avatar blob for preview
      const imgRes = await fetch("http://localhost:5000/api/users/me/avatar", {
        credentials: "include",
      });
      
      if (imgRes.ok) {
        const blob = await imgRes.blob();
        // Force refresh of avatar by invalidating the user query
        queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
        toast({
          title: "Profile photo updated",
          description: "Your profile photo has been updated successfully.",
        });
      }
    } catch (err) {
      toast({
        title: "Failed to upload photo",
        description: "There was an error uploading your profile photo. Please try again.",
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

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setDisplayName(user?.displayName || user?.fullname || "");
    setBio(user?.bio || "");
    setIsEditMode(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="bg-white dark:bg-card shadow-md rounded-lg p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="h-32 w-32 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-4">
                <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-20 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !user) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px]">
            <div className="text-error mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-12 w-12">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-2xl font-heading font-bold mb-2">Error Loading Profile</h2>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
              We couldn't load your profile information. Please try again later.
            </p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-heading font-bold text-deep-indigo dark:text-snow mb-8 flex items-center">
        <User className="mr-3 h-7 w-7 text-royal-purple" />
        My Profile
      </h1>
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-richCream dark:bg-deepIndigo border border-border">
          <TabsTrigger value="profile" className="data-[state=active]:bg-royal-purple/10 data-[state=active]:text-royal-purple dark:data-[state=active]:bg-royal-purple/20">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-royal-purple/10 data-[state=active]:text-royal-purple dark:data-[state=active]:bg-royal-purple/20">
            <History className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-royal-purple/10 data-[state=active]:text-royal-purple dark:data-[state=active]:bg-royal-purple/20">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          {/* Profile Card */}
          <Card className="overflow-hidden border-border shadow-md">
            <div className="h-32 bg-gradient-to-r from-royal-purple to-teal relative" />
            <CardContent className="pt-0 px-6">
              <div className="flex flex-col md:flex-row items-center gap-6 -mt-16 relative">
                <div className="relative flex-shrink-0">
                  <Avatar className="h-32 w-32 border-4 border-white dark:border-deepIndigo shadow-lg">
                    <AvatarImage src={avatarUrl} alt={user.displayName || user.fullname || ""} />
                    <AvatarFallback className="text-2xl bg-royal-purple/10 text-royal-purple dark:bg-royal-purple/20 dark:text-snow">
                      {getInitials(user.displayName || user.fullname || "")}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                  {isEditMode && (
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="absolute -right-2 bottom-0 rounded-full h-8 w-8 p-0 bg-white/90 hover:bg-white"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-royal-purple border-t-transparent"></span>
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center w-full md:items-end">
                  <div className="flex flex-col items-center md:items-start w-full">
                    <h2 className="text-2xl font-heading font-bold text-deep-indigo dark:text-snow">
                      {user.displayName || user.fullname || ""}
                    </h2>
                    <p className="text-charcoal/80 dark:text-lavender/80">{user.email}</p>
                    <div className="mt-4">
                      {isEditMode ? (
                        <div className="space-y-2">
                          <Label htmlFor="bio" className="text-sm font-medium text-charcoal dark:text-lavender">
                            Bio
                          </Label>
                          <Textarea
                            id="bio"
                            placeholder="Write a short bio about yourself..."
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="resize-none min-h-[100px] w-full text-charcoal dark:text-lavender"
                          />
                          <p className="text-xs text-charcoal/60 dark:text-lavender/60">
                            Tell others about your background, interests, and what you hope to achieve.
                          </p>
                        </div>
                      ) : user.bio ? (
                        <p className="text-charcoal dark:text-lavender font-normal">
                          {user.bio}
                        </p>
                      ) : (
                        <p className="text-charcoal/60 dark:text-lavender/60 font-normal">
                          No bio provided. Click 'Edit Profile' to add one.
                        </p>
                      )}
                    </div>
                  </div>
                  {isEditMode ? (
                    <div className="flex gap-2 mt-4 md:mt-0 md:ml-8">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleCancelEdit}
                        className="border-error/30 text-error hover:bg-error/10 hover:text-error"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button 
                        size="sm"
                        onClick={handleUpdateProfile}
                        className="bg-royal-purple hover:bg-royal-purple/90"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsEditMode(true)}
                      className="border-royal-purple/30 text-royal-purple hover:bg-royal-purple/10 hover:text-royal-purple mt-4 md:mt-0 md:ml-8"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Skills Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Teaching Skills */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-heading flex items-center text-deep-indigo dark:text-snow text-left">
                  <Award className="h-5 w-5 mr-2 text-royal-purple" />
                  Teaching Skills
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                {isEditMode && (
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Add a skill you can teach..."
                      value={newTeachSkill}
                      onChange={(e) => setNewTeachSkill(e.target.value)}
                      className="flex-grow"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddSkill('teach');
                        }
                      }}
                    />
                    <Button 
                      onClick={() => handleAddSkill('teach')}
                      disabled={!newTeachSkill.trim() || addSkillMutation.isPending}
                      className="bg-royal-purple hover:bg-royal-purple/90"
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                {user.teachSkills && user.teachSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.teachSkills.map((skill) => (
                      <div key={skill} className="relative group">
                        <SkillTag type="teach">
                          {skill}
                          {isEditMode && (
                            <button
                              className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveSkill('teach', skill)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </SkillTag>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-charcoal/60 dark:text-lavender/60 italic text-left pl-1">
                    No teaching skills added yet.
                    {isEditMode && " Use the field above to add skills you can teach."}
                  </p>
                )}
              </CardContent>
            </Card>
            
            {/* Learning Skills */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-heading flex items-center text-deep-indigo dark:text-snow text-left">
                  <BookOpen className="h-5 w-5 mr-2 text-teal" />
                  Learning Skills
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                {isEditMode && (
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Add a skill you want to learn..."
                      value={newLearnSkill}
                      onChange={(e) => setNewLearnSkill(e.target.value)}
                      className="flex-grow"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddSkill('learn');
                        }
                      }}
                    />
                    <Button 
                      onClick={() => handleAddSkill('learn')}
                      disabled={!newLearnSkill.trim() || addSkillMutation.isPending}
                      className="bg-teal hover:bg-teal/90"
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                {user.learnSkills && user.learnSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.learnSkills.map((skill) => (
                      <div key={skill} className="relative group">
                        <SkillTag type="learn">
                          {skill}
                          {isEditMode && (
                            <button
                              className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveSkill('learn', skill)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </SkillTag>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-charcoal/60 dark:text-lavender/60 italic text-left pl-1">
                    No learning skills added yet.
                    {isEditMode && " Use the field above to add skills you want to learn."}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Stats Card */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-xl font-heading text-deep-indigo dark:text-snow text-left">
                Profile Statistics
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-richCream dark:bg-deepIndigo/50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-royal-purple">{user.teachSkills?.length || 0}</p>
                  <p className="text-sm text-charcoal dark:text-lavender">Teaching Skills</p>
                </div>
                
                <div className="bg-richCream dark:bg-deepIndigo/50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-teal">{user.learnSkills?.length || 0}</p>
                  <p className="text-sm text-charcoal dark:text-lavender">Learning Skills</p>
                </div>
                
                <div className="bg-richCream dark:bg-deepIndigo/50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-amber">{user.completedSessions || 0}</p>
                  <p className="text-sm text-charcoal dark:text-lavender">Sessions Completed</p>
                </div>
                
                <div className="bg-richCream dark:bg-deepIndigo/50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-success">{user.rating || "N/A"}</p>
                  <p className="text-sm text-charcoal dark:text-lavender">Average Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-xl font-heading text-deep-indigo dark:text-snow text-left">
                Recent Activity
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <History className="h-16 w-16 text-royal-purple/30 mb-4" />
                <h3 className="text-xl font-heading font-medium text-deep-indigo dark:text-snow mb-2">
                  Activity History Coming Soon
                </h3>
                <p className="text-charcoal/70 dark:text-lavender/70 max-w-md">
                  We're working on a detailed activity history feature that will show your recent connections, sessions, and learning progress.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-xl font-heading text-deep-indigo dark:text-snow text-left">
                Account Settings
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="h-16 w-16 text-royal-purple/30 mb-4" />
                <h3 className="text-xl font-heading font-medium text-deep-indigo dark:text-snow mb-2">
                  Account Settings Coming Soon
                </h3>
                <p className="text-charcoal/70 dark:text-lavender/70 max-w-md">
                  We're working on comprehensive account settings that will allow you to manage your privacy, notifications, and security preferences.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
