import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/brototype-logo.webp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, LogOut, User, Palette, Info, Shield } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

const AdminSettings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const isAdmin = roles?.some((r) => r.role === "admin");
      if (!isAdmin) {
        toast.error("Access denied. Admin privileges required.");
        navigate("/dashboard");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, email, preferred_theme")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setUserName(profile.name);
        setUserEmail(profile.email);
        if (profile.preferred_theme) {
          setTheme(profile.preferred_theme);
        }
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeChange = async (newTheme: string) => {
    try {
      setTheme(newTheme);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("profiles")
        .update({ preferred_theme: newTheme })
        .eq("id", session.user.id);

      if (error) throw error;
      toast.success("Theme preference saved!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/tools")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <img src={logo} alt="Brototype" className="h-10" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-foreground">Admin Settings</h1>
              <Badge variant="default" className="bg-primary">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            </div>
            <p className="text-muted-foreground">Manage your admin account preferences</p>
          </div>
        </div>

        <Separator />

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Profile Information</CardTitle>
            </div>
            <CardDescription>Your admin account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <div className="text-foreground font-medium">{userName}</div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="text-muted-foreground">{userEmail}</div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-primary">
                  <Shield className="h-3 w-3 mr-1" />
                  Administrator
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>Customize your theme preference</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={theme} onValueChange={handleThemeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* App Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <CardTitle>About</CardTitle>
            </div>
            <CardDescription>Application information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Version</Label>
              <span className="text-muted-foreground">1.0.0</span>
            </div>
            <div className="flex justify-between items-center">
              <Label>Platform</Label>
              <span className="text-muted-foreground">BroToRaise Admin</span>
            </div>
            <div className="flex justify-between items-center">
              <Label>Environment</Label>
              <span className="text-muted-foreground">Production</span>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Account Actions</CardTitle>
            <CardDescription>Manage your admin session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Switch Account</Label>
              <p className="text-sm text-muted-foreground mb-2">
                To switch to another account, please log out and sign in with different credentials.
              </p>
            </div>
            <Button 
              variant="destructive" 
              className="w-full" 
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;
