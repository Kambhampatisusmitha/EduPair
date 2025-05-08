import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme-provider";
import { SunIcon, MoonIcon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      className="p-2 rounded-full text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-light-blue focus:outline-none"
    >
      {theme === "dark" ? (
        <SunIcon className="h-6 w-6" />
      ) : (
        <MoonIcon className="h-6 w-6" />
      )}
    </Button>
  );
}
