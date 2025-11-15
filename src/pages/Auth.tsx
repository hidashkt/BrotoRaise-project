import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User, GraduationCap, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { name },
        },
      });

      if (error) throw error;

      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
          {/* Left side - Branding */}
          <div className="hidden md:flex flex-col justify-center space-y-6 animate-fade-in">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-2xl backdrop-blur-sm">
                  <GraduationCap className="h-12 w-12 text-primary" />
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  BrotoRaise
                </h1>
              </div>
              <p className="text-xl text-muted-foreground">
                Your voice matters. Share your concerns and get the support you deserve.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50">
                <Shield className="h-6 w-6 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Secure & Confidential</h3>
                  <p className="text-sm text-muted-foreground">
                    Your complaints are handled with utmost privacy and professionalism
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50">
                <Mail className="h-6 w-6 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Real-time Updates</h3>
                  <p className="text-sm text-muted-foreground">
                    Get instant notifications on the status of your complaints
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Auth Form */}
          <Card className="w-full backdrop-blur-sm bg-card/95 shadow-2xl border-border/50 animate-slide-up">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto p-3 bg-primary/10 rounded-2xl w-fit mb-2">
                <GraduationCap className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold">Welcome</CardTitle>
              <CardDescription className="text-base">
                Sign in to manage your complaints or create a new account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-sm font-medium">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signin-email"
                          name="email"
                          type="email"
                          placeholder="student@brototype.com"
                          className="pl-10 h-11"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="text-sm font-medium">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signin-password"
                          name="password"
                          type="password"
                          className="pl-10 h-11"
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-11 text-base font-medium"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-sm font-medium">
                        Full Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          name="name"
                          type="text"
                          placeholder="John Doe"
                          className="pl-10 h-11"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm font-medium">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          name="email"
                          type="email"
                          placeholder="student@brototype.com"
                          className="pl-10 h-11"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm font-medium">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          name="password"
                          type="password"
                          placeholder="Min. 6 characters"
                          className="pl-10 h-11"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-11 text-base font-medium"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
