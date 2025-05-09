import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  withText?: boolean;
  textClassName?: string;
}

export default function Logo({ className, size = "md", withText = true, textClassName }: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10"
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl"
  };

  return (
    <div className="flex items-center">
      <img 
        src="/graduation-student-cap-svgrepo-com.svg" 
        alt="EduPair Logo" 
        className={cn(sizeClasses[size], className)}
      />

      {withText && (
        <span className={cn("-ml-6 font-heading font-bold text-primary dark:text-white", textSizeClasses[size], textClassName)}>
          EduPair
        </span>
      )}
    </div>
  );
}
