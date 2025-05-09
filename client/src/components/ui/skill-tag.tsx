import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Presentation, BookOpen, Brain, LightbulbIcon, GraduationCap, Code, Palette, Music, ActivitySquare, X } from "lucide-react";

interface SkillTagProps {
  children: ReactNode;
  type: "teach" | "learn";
  size?: "sm" | "md" | "lg";
  variant?: "default" | "subtle" | "outlined" | "solid";
  className?: string;
  animated?: boolean;
  onRemove?: () => void;
}

// Map skills to appropriate icons based on their names
const getSkillIcon = (skill: string, skillType: "teach" | "learn") => {
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
  return skillType === "teach" ? Presentation : GraduationCap;
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
  className,
  onRemove
}: SkillTagProps) {
  const skillContent = typeof children === 'string' ? children : 'Skill';
  const IconComponent = getSkillIcon(skillContent as string, type);
  
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
      ? "bg-royal-purple text-snow dark:bg-royal-purple dark:text-snow border border-royal-purple/30 dark:border-royal-purple/20"
      : "bg-teal text-snow dark:bg-teal dark:text-snow border border-teal/30 dark:border-teal/20",
    
    subtle: type === "teach"
      ? "bg-lavender/20 text-royal-purple dark:bg-lavender/10 dark:text-lavender border border-transparent"
      : "bg-aqua-breeze/20 text-teal dark:bg-aqua-breeze/10 dark:text-aqua-breeze border border-transparent",
    
    outlined: type === "teach"
      ? "bg-transparent text-royal-purple dark:text-lavender border border-royal-purple/50 dark:border-lavender/30"
      : "bg-transparent text-teal dark:text-aqua-breeze border border-teal/50 dark:border-aqua-breeze/30",
    
    solid: type === "teach"
      ? "bg-royal-purple text-snow dark:bg-royal-purple dark:text-snow border border-royal-purple/70"
      : "bg-teal text-snow dark:bg-teal dark:text-snow border border-teal/70",
  };
  
  return (
    <div className="relative inline-flex group">
      {onRemove && (
        <button 
          onClick={onRemove} 
          className="absolute -top-2 -right-2 bg-white dark:bg-deep-indigo rounded-full p-0.5 shadow-sm border border-gray-200 dark:border-gray-700 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Remove skill"
        >
          <X className="h-3 w-3 text-gray-500 dark:text-gray-400" />
        </button>
      )}
      <Badge 
        variant="outline"
        className={cn(
          "inline-flex items-center font-medium rounded-full border transition-all duration-300",
          sizeClasses[size],
          variantClasses[variant],
          animated && "hover:scale-105 hover:shadow-sm",
          animated && type === "teach" 
            ? "hover:bg-royal-purple/90 hover:border-lavender dark:hover:bg-royal-purple/80" 
            : "hover:bg-teal/90 hover:border-aqua-breeze dark:hover:bg-teal/80",
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
    </div>
  );
}