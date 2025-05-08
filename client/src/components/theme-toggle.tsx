import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme-provider";
import { SunIcon, MoonIcon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // After mounting, we have access to the theme
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="p-2 rounded-full text-gray-500 opacity-0"
        disabled
        aria-hidden="true"
      >
        <SunIcon className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      className="relative p-2 overflow-hidden rounded-full bg-gray-100/50 dark:bg-gray-800/50 text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-light-blue focus:outline-none transition-colors duration-300 hover:ring-2 ring-primary/20 dark:ring-light-blue/20"
    >
      <span className="sr-only">{theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}</span>
      
      <span className="absolute inset-0 transform transition-transform duration-500 ease-in-out">
        <span className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${theme === 'light' ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'}`}>
          <SunIcon className="h-5 w-5" />
        </span>
        <span className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${theme === 'dark' ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`}>
          <MoonIcon className="h-5 w-5" />
        </span>
      </span>
    </Button>
  );
}
