import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { calculatePasswordStrength, getPasswordStrengthDetails } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

const signupSchema = z.object({
  fullname: z.string().min(1, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val === true, "You must agree to the terms and conditions"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupValues = z.infer<typeof signupSchema>;

export default function SignupForm() {
  const { isSignupOpen, closeSignupModal, openLoginModal, openOnboardingModal } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullname: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const onPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const strength = calculatePasswordStrength(e.target.value);
    setPasswordStrength(strength);
    form.setValue("password", e.target.value);
  };

  const onSubmit = async (values: SignupValues) => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/users/register", {
        username: values.email,
        password: values.password,
        fullname: values.fullname,
      });
      
      toast({
        title: "Account Created",
        description: "Your account has been created successfully!",
        variant: "default",
      });
      
      closeSignupModal();
      openOnboardingModal();
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const strengthDetails = getPasswordStrengthDetails(passwordStrength);

  return (
    <Dialog open={isSignupOpen} onOpenChange={closeSignupModal}>
      <DialogContent className="bg-white dark:bg-card rounded-xl shadow-2xl w-full max-w-md mx-4 sm:mx-auto overflow-hidden fade-in">
        <DialogHeader className="text-center mb-2">
          <DialogTitle className="text-2xl font-heading font-bold text-royal-purple dark:text-lavender">
            Create an Account
          </DialogTitle>
          <p className="text-sm text-charcoal/70 dark:text-lavender/70 mt-1 font-medium">
            Join our knowledge exchange community and grow together
          </p>
          <Button 
            variant="ghost" 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 h-auto absolute right-4 top-4"
            onClick={closeSignupModal}
          >
            <X className="h-6 w-6" />
          </Button>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full Name
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary dark:focus:ring-light-blue bg-white dark:bg-background text-gray-900 dark:text-white" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
              render={({ field: { onChange, ...field } }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        {...field} 
                        type={showPassword ? "text" : "password"}
                        onChange={onPasswordChange}
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
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div className={`${strengthDetails.color} h-1.5 rounded-full`} style={{ width: `${passwordStrength}%` }}></div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Password strength: {strengthDetails.text}</p>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirm Password
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        {...field} 
                        type={showConfirmPassword ? "text" : "password"}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary dark:focus:ring-light-blue bg-white dark:bg-background text-gray-900 dark:text-white pr-10" 
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      className="absolute right-0 top-0 h-full px-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-3 space-y-0 mb-6">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-secondary data-[state=checked]:dark:bg-light-blue"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-medium text-gray-700 dark:text-gray-300">
                      I agree to the <a href="#" className="text-secondary dark:text-light-blue hover:underline">Terms of Service</a> and <a href="#" className="text-secondary dark:text-light-blue hover:underline">Privacy Policy</a>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-royal-purple hover:bg-royal-purple/90 dark:bg-royal-purple dark:hover:bg-royal-purple/90 text-snow font-medium py-3 px-4 rounded-lg transition-all duration-300 flex justify-center items-center shadow-md hover:shadow-lg"
            >
              {isLoading ? (
                <>
                  <span>Creating Account</span>
                  <div className="spinner ml-2"></div>
                </>
              ) : "Create Account"}
            </Button>
            
            <div className="text-center mt-6">
              <p className="text-sm text-charcoal/80 dark:text-lavender/80">
                Already have an account?{" "}
                <Button 
                  type="button" 
                  variant="link" 
                  className="text-royal-purple dark:text-lavender hover:text-royal-purple/80 dark:hover:text-lavender/80 font-medium p-0 transition-colors"
                  onClick={() => {
                    closeSignupModal();
                    openLoginModal();
                  }}
                >
                  Log in
                </Button>
              </p>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
