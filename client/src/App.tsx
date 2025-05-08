import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing-page";
import Dashboard from "@/pages/dashboard";
import { AuthProvider } from "@/contexts/auth-context";
import MainLayout from "@/layouts/main-layout";
import AppShell from "@/layouts/app-shell";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/dashboard">
        {() => (
          <AppShell>
            <Dashboard />
          </AppShell>
        )}
      </Route>
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <MainLayout>
          <Toaster />
          <Router />
        </MainLayout>
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
