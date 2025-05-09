import HeroSection from "@/components/landing/hero-section";
import HowItWorks from "@/components/landing/how-it-works";
import TrendingSkills from "@/components/landing/trending-skills";
import SuccessStories from "@/components/landing/success-stories";
import Footer from "@/components/landing/footer";
import { ThemeToggle } from "@/components/theme-toggle";
import Logo from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import SignupForm from "@/components/auth/signup-form";
import LoginForm from "@/components/auth/login-form";
import OnboardingModal from "@/components/auth/onboarding-modal";

export default function LandingPage() {
  const { openSignupModal, openLoginModal } = useAuth();
  
  return (
    <div id="landing-page" className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Logo />
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              
              <Button
                variant="outline"
                className="bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 text-primary dark:text-white font-medium py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-500 transition"
                onClick={openLoginModal}
              >
                Log In
              </Button>
              
              <Button
                className="bg-primary hover:bg-primary-dark dark:bg-secondary dark:hover:bg-secondary-dark text-white font-medium py-2 px-4 rounded-lg transition"
                onClick={openSignupModal}
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-grow">
        <HeroSection />
        <HowItWorks />
        <TrendingSkills />
        <SuccessStories />
      </main>
      
      <Footer />
      
      {/* Modals */}
      <SignupForm />
      <LoginForm />
      <OnboardingModal />
    </div>
  );
}
