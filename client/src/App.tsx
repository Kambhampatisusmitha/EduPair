import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing-page";
import Dashboard from "@/pages/dashboard";
import MatchesPage from "@/pages/matches";
import SessionsPage from "@/pages/sessions";
import CalendarPage from "@/pages/calendar";
import UserProfile from "@/pages/user-profile";
import MyProfile from "@/pages/my-profile";
import SettingsPage from "@/pages/settings";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/contexts/theme-context";
import MainLayout from "@/layouts/main-layout";
import AppShell from "@/layouts/app-shell";
import RequestNotification from "@/components/notifications/request-notification";

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
      <Route path="/matches">
        {() => (
          <AppShell>
            <MatchesPage />
          </AppShell>
        )}
      </Route>
      <Route path="/sessions">
        {() => (
          <AppShell>
            <SessionsPage />
          </AppShell>
        )}
      </Route>
      <Route path="/calendar">
        {() => (
          <AppShell>
            <CalendarPage />
          </AppShell>
        )}
      </Route>
      <Route path="/users/:id">
        {(params) => (
          <AppShell>
            <UserProfile />
          </AppShell>
        )}
      </Route>
      <Route path="/profile">
        {() => (
          <AppShell>
            <MyProfile />
          </AppShell>
        )}
      </Route>
      <Route path="/settings">
        {() => (
          <AppShell>
            <SettingsPage />
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
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <MainLayout>
            <Toaster />
            <Router />
            {/* Notification system for pairing requests */}
            <RequestNotification />
          </MainLayout>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
