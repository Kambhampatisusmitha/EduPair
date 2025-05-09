import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/auth-context";
import SkillTag from "@/components/ui/skill-tag";

const popularTeachSkills = [
  "JavaScript", "Spanish", "Photography", "Piano", 
  "Graphic Design", "Cooking", "Digital Marketing", "Yoga"
];

const popularLearnSkills = [
  "Python", "Japanese", "Data Science", "Drawing", 
  "Public Speaking", "Baking", "Machine Learning", "Chess"
];

export default function OnboardingModal() {
  const { isOnboardingOpen, closeOnboardingModal } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [teachSkills, setTeachSkills] = useState<string[]>([]);
  const [learnSkills, setLearnSkills] = useState<string[]>([]);
  const [teachSkillInput, setTeachSkillInput] = useState("");
  const [learnSkillInput, setLearnSkillInput] = useState("");
  const [avatar, setAvatar] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const progressPercentage = (currentStep / 4) * 100;

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addTeachSkill = () => {
    if (teachSkillInput && teachSkills.length < 3 && !teachSkills.includes(teachSkillInput)) {
      setTeachSkills([...teachSkills, teachSkillInput]);
      setTeachSkillInput("");
    }
  };

  // Filter popular teach skills based on search input
  const filteredTeachSkills = teachSkillInput
    ? popularTeachSkills.filter(skill => 
        skill.toLowerCase().includes(teachSkillInput.toLowerCase()))
    : popularTeachSkills;

  const addLearnSkill = () => {
    if (learnSkillInput && learnSkills.length < 3 && !learnSkills.includes(learnSkillInput)) {
      setLearnSkills([...learnSkills, learnSkillInput]);
      setLearnSkillInput("");
    }
  };

  // Filter popular learn skills based on search input
  const filteredLearnSkills = learnSkillInput
    ? popularLearnSkills.filter(skill => 
        skill.toLowerCase().includes(learnSkillInput.toLowerCase()))
    : popularLearnSkills;
  
  const removeTeachSkill = (skill: string) => {
    setTeachSkills(teachSkills.filter(s => s !== skill));
  };
  
  const removeLearnSkill = (skill: string) => {
    setLearnSkills(learnSkills.filter(s => s !== skill));
  };

  const selectTeachSkill = (skill: string) => {
    if (teachSkills.length < 3 && !teachSkills.includes(skill)) {
      setTeachSkills([...teachSkills, skill]);
    }
  };

  const selectLearnSkill = (skill: string) => {
    if (learnSkills.length < 3 && !learnSkills.includes(skill)) {
      setLearnSkills([...learnSkills, skill]);
    }
  };

  // Handle file selection and upload
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setAvatarFile(file);
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
        setAvatar(URL.createObjectURL(blob));
      }
    } catch (err) {
      // Optionally show toast error
    }
    setIsUploading(false);
  };

  const completeOnboarding = async () => {
    try {
      await apiRequest("POST", "/api/users/profile", {
        displayName,
        bio,
        teachSkills,
        learnSkills,
      });
      
      toast({
        title: "Profile Setup Complete",
        description: "Your profile has been set up and you're ready to start finding learning partners!",
        variant: "default",
      });
      
      closeOnboardingModal();
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Profile setup failed",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOnboardingOpen} onOpenChange={closeOnboardingModal}>
      <DialogContent className="bg-white dark:bg-card rounded-xl shadow-2xl w-full max-w-2xl mx-4 sm:mx-auto overflow-hidden fade-in p-0">
        <div className="relative">
          {/* Progress indicator */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
            <div 
              className="h-1 bg-secondary dark:bg-light-blue transition-all duration-300" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          
          {/* Step counter */}
          <div className="absolute top-4 right-4 bg-secondary dark:bg-light-blue text-white text-xs font-medium px-2.5 py-1 rounded-full">
            Step {currentStep} of 4
          </div>
          
          {/* Content area */}
          <div className="p-6 pt-14">
            {/* Step 1: Welcome */}
            {currentStep === 1 && (
              <div className="fade-in">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-heading font-bold text-primary dark:text-white">Welcome to EduPair!</h2>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    We're excited to help you find your perfect learning partner. Let's set up your profile.
                  </p>
                </div>
                
                <div className="flex justify-center mb-8">
                  <img 
                    src="https://images.unsplash.com/photo-1577896851231-70ef18881754?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500" 
                    alt="People connecting for learning" 
                    className="rounded-lg shadow-md w-full max-w-lg h-auto" 
                  />
                </div>
                
                <div className="flex justify-between mt-8">
                  <Button
                    variant="ghost"
                    onClick={closeOnboardingModal}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Skip for now
                  </Button>
                  <Button
                    onClick={nextStep}
                    className="bg-primary hover:bg-primary-dark dark:bg-secondary dark:hover:bg-secondary-dark text-white font-medium py-2 px-6 rounded-lg transition"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}
            
            {/* Step 2: Basic Profile */}
            {currentStep === 2 && (
              <div className="fade-in">
                <h2 className="text-2xl font-heading font-bold text-primary dark:text-white mb-6">Basic Profile</h2>
                
                <div className="flex flex-col sm:flex-row gap-6 mb-6">
                  {/* Profile photo upload */}
                  <div className="sm:w-1/3 flex flex-col items-center">
                    <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 shadow-md mb-2">
                      {avatar ? (
                        <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                    <Button
                      variant="outline"
                      className="bg-secondary/10 hover:bg-secondary/20 dark:bg-light-blue/10 dark:hover:bg-light-blue/20 text-secondary dark:text-light-blue text-sm font-medium py-1 px-3 rounded transition"
                      onClick={handlePhotoClick}
                      disabled={isUploading}
                    >
                      {isUploading ? "Uploading..." : "Upload Photo"}
                    </Button>
                  </div>
                  
                  {/* Profile details */}
                  <div className="sm:w-2/3">
                    <div className="mb-4">
                      <label htmlFor="display-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Display Name
                      </label>
                      <Input
                        id="display-name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary dark:focus:ring-light-blue bg-white dark:bg-background text-gray-900 dark:text-white"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Short Bio
                      </label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary dark:focus:ring-light-blue bg-white dark:bg-background text-gray-900 dark:text-white"
                        placeholder="Tell us a bit about yourself, your learning style, and what you hope to achieve."
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Max 150 characters</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between mt-8">
                  <Button
                    variant="ghost"
                    onClick={prevStep}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={nextStep}
                    className="bg-primary hover:bg-primary-dark dark:bg-secondary dark:hover:bg-secondary-dark text-white font-medium py-2 px-6 rounded-lg transition"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}
            
            {/* Step 3: Skills I Can Teach */}
            {currentStep === 3 && (
              <div className="fade-in">
                <h2 className="text-2xl font-heading font-bold text-primary dark:text-white mb-2">Skills I Can Teach</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Select up to 3 skills that you're confident in teaching others.
                </p>
                
                <div className="mb-4">
                  <div className="flex items-center">
                    <Input
                      id="teach-skill-input"
                      value={teachSkillInput}
                      onChange={(e) => setTeachSkillInput(e.target.value)}
                      className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary dark:focus:ring-light-blue bg-white dark:bg-background text-gray-900 dark:text-white"
                      placeholder="Search or add a skill..."
                    />
                    <Button
                      onClick={addTeachSkill}
                      disabled={!teachSkillInput || teachSkills.length >= 3}
                      className="ml-2 bg-secondary hover:bg-secondary-dark dark:bg-light-blue dark:hover:bg-light-blue-dark text-white font-medium py-2 px-4 rounded-lg transition"
                    >
                      <Plus className="h-5 w-5" />
                      <span className="sr-only">Add</span>
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Type a skill name or select from popular skills below</p>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your selected skills:</h3>
                  <div className="flex flex-wrap gap-2 min-h-[40px]">
                    {teachSkills.map((skill) => (
                      <SkillTag key={skill} type="teach" onRemove={() => removeTeachSkill(skill)}>
                        {skill}
                      </SkillTag>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {teachSkillInput ? "Matching skills:" : "Popular skills:"}
                  </h3>
                  <div className="flex flex-wrap gap-2 min-h-[40px]">
                    {filteredTeachSkills.length > 0 ? (
                      filteredTeachSkills.map((skill) => (
                        <Button
                          key={skill}
                          onClick={() => selectTeachSkill(skill)}
                          disabled={teachSkills.includes(skill) || teachSkills.length >= 3}
                          variant="outline"
                          className="bg-gray-100 hover:bg-accent/30 dark:bg-gray-800 dark:hover:bg-accent/10 text-gray-800 dark:text-gray-200 text-sm rounded-full px-3 py-1 transition"
                        >
                          {skill}
                        </Button>
                      ))
                    ) : teachSkillInput ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 py-1">
                        No matching skills found. You can add "{teachSkillInput}" as a new skill.
                      </p>
                    ) : (
                      popularTeachSkills.map((skill) => (
                        <Button
                          key={skill}
                          onClick={() => selectTeachSkill(skill)}
                          disabled={teachSkills.includes(skill) || teachSkills.length >= 3}
                          variant="outline"
                          className="bg-gray-100 hover:bg-accent/30 dark:bg-gray-800 dark:hover:bg-accent/10 text-gray-800 dark:text-gray-200 text-sm rounded-full px-3 py-1 transition"
                        >
                          {skill}
                        </Button>
                      ))
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between mt-8">
                  <Button
                    variant="ghost"
                    onClick={prevStep}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={nextStep}
                    className="bg-primary hover:bg-primary-dark dark:bg-secondary dark:hover:bg-secondary-dark text-white font-medium py-2 px-6 rounded-lg transition"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}
            
            {/* Step 4: Skills I Want to Learn */}
            {currentStep === 4 && (
              <div className="fade-in">
                <h2 className="text-2xl font-heading font-bold text-primary dark:text-white mb-2">Skills I Want to Learn</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Select up to 3 skills that you'd like to learn from others.
                </p>
                
                <div className="mb-4">
                  <div className="flex items-center">
                    <Input
                      id="learn-skill-input"
                      value={learnSkillInput}
                      onChange={(e) => setLearnSkillInput(e.target.value)}
                      className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary dark:focus:ring-light-blue bg-white dark:bg-background text-gray-900 dark:text-white"
                      placeholder="Search or add a skill..."
                    />
                    <Button
                      onClick={addLearnSkill}
                      disabled={!learnSkillInput || learnSkills.length >= 3}
                      className="ml-2 bg-secondary hover:bg-secondary-dark dark:bg-light-blue dark:hover:bg-light-blue-dark text-white font-medium py-2 px-4 rounded-lg transition"
                    >
                      <Plus className="h-5 w-5" />
                      <span className="sr-only">Add</span>
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Type a skill name or select from popular skills below</p>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your selected skills:</h3>
                  <div className="flex flex-wrap gap-2 min-h-[40px]">
                    {learnSkills.map((skill) => (
                      <SkillTag key={skill} type="learn" onRemove={() => removeLearnSkill(skill)}>
                        {skill}
                      </SkillTag>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {learnSkillInput ? "Matching skills:" : "Popular skills:"}
                  </h3>
                  <div className="flex flex-wrap gap-2 min-h-[40px]">
                    {filteredLearnSkills.length > 0 ? (
                      filteredLearnSkills.map((skill) => (
                        <Button
                          key={skill}
                          onClick={() => selectLearnSkill(skill)}
                          disabled={learnSkills.includes(skill) || learnSkills.length >= 3}
                          variant="outline"
                          className="bg-gray-100 hover:bg-accent/30 dark:bg-gray-800 dark:hover:bg-accent/10 text-gray-800 dark:text-gray-200 text-sm rounded-full px-3 py-1 transition"
                        >
                          {skill}
                        </Button>
                      ))
                    ) : learnSkillInput ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 py-1">
                        No matching skills found. You can add "{learnSkillInput}" as a new skill.
                      </p>
                    ) : (
                      popularLearnSkills.map((skill) => (
                        <Button
                          key={skill}
                          onClick={() => selectLearnSkill(skill)}
                          disabled={learnSkills.includes(skill) || learnSkills.length >= 3}
                          variant="outline"
                          className="bg-gray-100 hover:bg-accent/30 dark:bg-gray-800 dark:hover:bg-accent/10 text-gray-800 dark:text-gray-200 text-sm rounded-full px-3 py-1 transition"
                        >
                          {skill}
                        </Button>
                      ))
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between mt-8">
                  <Button
                    variant="ghost"
                    onClick={prevStep}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={completeOnboarding}
                    className="bg-primary hover:bg-primary-dark dark:bg-secondary dark:hover:bg-secondary-dark text-white font-medium py-2 px-6 rounded-lg transition"
                  >
                    Complete Setup
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
