import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Eye, EyeOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/auth-context";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const { isLoginOpen, closeLoginModal, openSignupModal } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (values: LoginValues) => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/users/login", {
        username: values.email,
        password: values.password,
      });
      
      toast({
        title: "Logged In",
        description: "You have been logged in successfully!",
        variant: "default",
      });
      
      closeLoginModal();
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isLoginOpen} onOpenChange={closeLoginModal}>
      <DialogContent className="bg-white dark:bg-card rounded-xl shadow-2xl w-full max-w-md mx-4 sm:mx-auto overflow-hidden fade-in">
        <DialogHeader className="flex justify-between items-center mb-4">
          <DialogTitle className="text-2xl font-heading font-bold text-primary dark:text-white">
            Welcome Back
          </DialogTitle>
          <Button 
            variant="ghost" 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 h-auto"
            onClick={closeLoginModal}
          >
            <X className="h-6 w-6" />
          </Button>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary dark:focus:ring-light-blue bg-white dark:bg-background text-gray-900 dark:text-white" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        {...field} 
                        type={showPassword ? "text" : "password"}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary dark:focus:ring-light-blue bg-white dark:bg-background text-gray-900 dark:text-white pr-10" 
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      className="absolute right-0 top-0 h-full px-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex items-center justify-between mb-6">
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-secondary data-[state=checked]:dark:bg-light-blue"
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Remember me
                    </FormLabel>
                  </FormItem>
                )}
              />
              <Button 
                type="button" 
                variant="link" 
                className="text-sm text-secondary dark:text-light-blue hover:underline p-0"
              >
                Forgot password?
              </Button>
            </div>
            
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-dark dark:bg-secondary dark:hover:bg-secondary-dark text-white font-medium py-2 px-4 rounded-lg transition flex justify-center items-center"
            >
              {isLoading ? (
                <>
                  <span>Logging In</span>
                  <div className="spinner ml-2"></div>
                </>
              ) : "Log In"}
            </Button>
            
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{" "}
                <Button 
                  type="button" 
                  variant="link" 
                  className="text-secondary dark:text-light-blue hover:underline p-0"
                  onClick={() => {
                    closeLoginModal();
                    openSignupModal();
                  }}
                >
                  Sign up
                </Button>
              </p>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
