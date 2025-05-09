import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface User {
  id: number;
  fullname?: string;
  displayName?: string;
  email?: string;
  avatar?: string;
  // add other fields as needed
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  
  isSignupOpen: boolean;
  isLoginOpen: boolean;
  isOnboardingOpen: boolean;
  
  openSignupModal: () => void;
  closeSignupModal: () => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  openOnboardingModal: () => void;
  closeOnboardingModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [, navigate] = useLocation();

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest("GET", "/api/users/me");
        const userData = await response.json();
        if (userData) {
          setIsAuthenticated(true);
          setUser(userData as User);
        }
      } catch (error) {
        console.error("Session check failed:", error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, []);
  
  // Fetch user when authentication state changes
  useEffect(() => {
    if (isAuthenticated && !user) {
      apiRequest("GET", "/api/users/me")
        .then(response => response.json())
        .then((data) => setUser(data as User))
        .catch((error) => {
          console.error("Failed to fetch user data:", error);
          setUser(null);
        });
    } else if (!isAuthenticated) {
      setUser(null);
    }
  }, [isAuthenticated, user]);

  const login = async (username: string, password: string) => {
    try {
      // Call login API
      await apiRequest("POST", "/api/users/login", { username, password });
      setIsAuthenticated(true);
      // Fetch user data
      const response = await apiRequest("GET", "/api/users/me");
      const userData = await response.json();
      setUser(userData as User);
    } catch (error) {
      console.error("Login failed:", error);
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/users/logout");
      setIsAuthenticated(false);
      setUser(null);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider 
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        
        isSignupOpen,
        isLoginOpen,
        isOnboardingOpen,
        
        openSignupModal: () => setIsSignupOpen(true),
        closeSignupModal: () => setIsSignupOpen(false),
        openLoginModal: () => setIsLoginOpen(true),
        closeLoginModal: () => setIsLoginOpen(false),
        openOnboardingModal: () => setIsOnboardingOpen(true),
        closeOnboardingModal: () => setIsOnboardingOpen(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
