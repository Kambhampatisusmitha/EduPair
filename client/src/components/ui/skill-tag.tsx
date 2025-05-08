import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Presentation, BookOpen, Brain, LightbulbIcon, GraduationCap, Code, Palette, Music, ActivitySquare } from "lucide-react";

interface SkillTagProps {
  children: ReactNode;
  type: "teach" | "learn";
  size?: "sm" | "md" | "lg";
  variant?: "default" | "subtle" | "outlined" | "solid";
  className?: string;
  animated?: boolean;
}

// Map skills to appropriate icons based on their names
const getSkillIcon = (skill: string) => {
  const skillLower = typeof skill === 'string' ? skill.toLowerCase() : '';
  
  if (skillLower.includes('code') || skillLower.includes('java') || skillLower.includes('python') || 
      skillLower.includes('react') || skillLower.includes('script')) {
    return Code;
  }
  if (skillLower.includes('design') || skillLower.includes('art') || skillLower.includes('paint') || 
      skillLower.includes('draw') || skillLower.includes('photo')) {
    return Palette;
  }
  if (skillLower.includes('music') || skillLower.includes('guitar') || skillLower.includes('piano')) {
    return Music;
  }
  if (skillLower.includes('math') || skillLower.includes('science') || skillLower.includes('physics')) {
    return Brain;
  }
  if (skillLower.includes('idea') || skillLower.includes('creative')) {
    return LightbulbIcon;
  }
  if (skillLower.includes('sport') || skillLower.includes('fitness') || skillLower.includes('yoga')) {
    return ActivitySquare;
  }
  
  // Default icons based on teach/learn type
  return type === "teach" ? Presentation : GraduationCap;
};

/**
 * SkillTag component displays a skill with a visual indicator of whether it's 
 * something the user teaches or wants to learn
 */
export default function SkillTag({ 
  children, 
  type, 
  size = "md", 
  variant = "default",
  animated = false,
  className 
}: SkillTagProps) {
  const skillContent = typeof children === 'string' ? children : 'Skill';
  const IconComponent = getSkillIcon(skillContent as string);
  
  const sizeClasses = {
    sm: "text-xs py-0.5 px-2 gap-1",
    md: "text-sm py-1 px-3 gap-1.5",
    lg: "text-base py-1.5 px-4 gap-2"
  };
  
  const iconSizes = {
    sm: "h-2.5 w-2.5",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4"
  };
  
  const variantClasses = {
    default: type === "teach"
      ? "bg-[#ECEFCA]/70 text-primary dark:bg-[#ECEFCA]/30 dark:text-[#ECEFCA] border border-[#ECEFCA]/30 dark:border-[#ECEFCA]/20"
      : "bg-[#94B4C1]/70 text-primary dark:bg-[#94B4C1]/30 dark:text-[#94B4C1] border border-[#94B4C1]/30 dark:border-[#94B4C1]/20",
    
    subtle: type === "teach"
      ? "bg-[#ECEFCA]/20 text-[#5c6437] dark:bg-[#ECEFCA]/10 dark:text-[#ECEFCA]/80 border border-transparent"
      : "bg-[#94B4C1]/20 text-[#425f6d] dark:bg-[#94B4C1]/10 dark:text-[#94B4C1]/80 border border-transparent",
    
    outlined: type === "teach"
      ? "bg-transparent text-[#5c6437] dark:text-[#ECEFCA] border border-[#ECEFCA]/50 dark:border-[#ECEFCA]/30"
      : "bg-transparent text-[#425f6d] dark:text-[#94B4C1] border border-[#94B4C1]/50 dark:border-[#94B4C1]/30",
    
    solid: type === "teach"
      ? "bg-[#ECEFCA] text-primary dark:bg-[#ECEFCA]/90 dark:text-gray-900 border border-[#ECEFCA]/70"
      : "bg-[#94B4C1] text-primary dark:bg-[#94B4C1]/90 dark:text-gray-900 border border-[#94B4C1]/70",
  };
  
  return (
    <Badge 
      variant="outline"
      className={cn(
        "inline-flex items-center font-medium rounded-full border transition-all duration-300",
        sizeClasses[size],
        variantClasses[variant],
        animated && "hover:scale-105 hover:shadow-sm",
        animated && type === "teach" 
          ? "hover:bg-[#ECEFCA]/90 dark:hover:bg-[#ECEFCA]/40" 
          : "hover:bg-[#94B4C1]/90 dark:hover:bg-[#94B4C1]/40",
        className
      )}
    >
      <IconComponent className={cn(
        iconSizes[size], 
        "flex-shrink-0", 
        animated && "group-hover:rotate-12 transition-transform"
      )} />
      <span>{children}</span>
    </Badge>
  );
}