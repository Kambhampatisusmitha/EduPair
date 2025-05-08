import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Presentation, BookOpen } from "lucide-react";

interface SkillTagProps {
  children: ReactNode;
  type: "teach" | "learn";
  className?: string;
}

/**
 * SkillTag component displays a skill with a visual indicator of whether it's 
 * something the user teaches or wants to learn
 */
export default function SkillTag({ children, type, className }: SkillTagProps) {
  return (
    <Badge 
      variant="outline"
      className={cn(
        "flex items-center gap-1 py-1 px-3 text-sm font-medium",
        type === "teach" 
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
          : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        className
      )}
    >
      {type === "teach" ? (
        <Presentation className="h-3 w-3 text-current" />
      ) : (
        <BookOpen className="h-3 w-3 text-current" />
      )}
      {children}
    </Badge>
  );
}