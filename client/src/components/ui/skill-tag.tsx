import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface SkillTagProps {
  children: React.ReactNode;
  type: "teach" | "learn";
  className?: string;
  onRemove?: () => void;
}

export default function SkillTag({ children, type, className, onRemove }: SkillTagProps) {
  return (
    <div 
      className={cn(
        "rounded-full px-3 py-1 text-sm flex items-center",
        type === "teach" ? "skill-teach" : "skill-learn",
        className
      )}
    >
      {children}
      {onRemove && (
        <button 
          onClick={onRemove} 
          className="ml-1 text-primary dark:text-accent"
          aria-label="Remove skill"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
