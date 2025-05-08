import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

export default function HeroSection() {
  const { openSignupModal, openLoginModal } = useAuth();
  
  return (
    <div className="relative bg-gradient-to-br from-[#94B4C1]/20 to-white dark:from-primary dark:to-background py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center">
        <div className="lg:w-1/2 lg:pr-12">
          <h1 className="text-4xl sm:text-5xl font-heading font-bold text-primary dark:text-white tracking-tight">
            Find Your Perfect <span className="text-secondary dark:text-light-blue">Learning Partner</span>
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
            Exchange skills, grow together, and make learning social with EduPair's skill-swap platform.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
            <Button
              onClick={openSignupModal}
              className="bg-primary hover:bg-primary-dark dark:bg-secondary dark:hover:bg-secondary-dark text-white text-lg font-medium py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition"
              size="lg"
            >
              Get Started
            </Button>
            <Button
              onClick={() => {
                // Scroll to how it works section
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
              variant="outline"
              className="bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-800 text-primary dark:text-light-blue text-lg font-medium py-3 px-6 rounded-lg border border-gray-300 dark:border-gray-700 shadow-md hover:shadow-lg transition"
              size="lg"
            >
              How It Works
            </Button>
          </div>
        </div>
        <div className="lg:w-1/2 mt-12 lg:mt-0">
          <img 
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=800" 
            alt="Diverse group learning together" 
            className="rounded-xl shadow-xl w-full h-auto" 
          />
        </div>
      </div>
    </div>
  );
}
