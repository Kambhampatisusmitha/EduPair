import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Function to handle login
export async function loginUser(username: string, password: string) {
  try {
    const response = await apiRequest("POST", "/api/auth/login", { 
      username, 
      password 
    });
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Login error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

// Component to handle login
export function LoginHelper() {
  const { toast } = useToast();
  
  const handleLogin = async () => {
    const result = await loginUser("demo", "password");
    
    if (result.success) {
      toast({
        title: "Logged in",
        description: "You have been logged in successfully.",
        duration: 3000
      });
      
      // Reload the page to refresh authentication state
      window.location.reload();
    } else {
      toast({
        title: "Login failed",
        description: result.error,
        variant: "destructive",
        duration: 3000
      });
    }
  };
  
  return (
    <button 
      onClick={handleLogin}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
    >
      Login as Demo User
    </button>
  );
}
