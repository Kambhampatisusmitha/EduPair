import { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
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
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const login = async (username: string, password: string) => {
    // This would normally call an API to authenticate
    // For now, we'll just set isAuthenticated to true
    setIsAuthenticated(true);
  };

  const logout = async () => {
    // Call API to logout
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider 
      value={{
        isAuthenticated,
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
