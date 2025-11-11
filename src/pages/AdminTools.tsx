import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const AdminTools = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGrantAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Find user by email
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profiles) {
        toast.error("No user found with that email address");
        return;
      }

      // Check if already admin
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", profiles.id)
        .eq("role", "admin")
        .maybeSingle();

      if (existingRole) {
        toast.error("User is already an admin");
        return;
      }

      // Grant admin role
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({
          user_id: profiles.id,
          role: "admin",
        });

      if (insertError) throw insertError;

      toast.success("Admin role granted successfully!");
      setEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to grant admin role");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Admin Tools</CardTitle>
            <CardDescription>
              Manage user roles and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGrantAdmin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Grant Admin Access</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@brototype.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Enter the email address of the user you want to make an admin
                </p>
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Granting Access..." : "Grant Admin Role"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminTools;
