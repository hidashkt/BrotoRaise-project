import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ComplaintCard } from "@/components/ComplaintCard";
import { Filter, Settings } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminChatInterface } from "@/components/AdminChatInterface";
import { FeedbackViewer } from "@/components/FeedbackViewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [resolution, setResolution] = useState("");

  useEffect(() => {
    checkAdminAuth();
    fetchComplaints();
  }, []);

  useEffect(() => {
    filterComplaints();
  }, [complaints, statusFilter, categoryFilter]);

  const checkAdminAuth = async () => {
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
    }
  };

  const fetchComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filterComplaints = () => {
    let filtered = [...complaints];

    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((c) => c.category === categoryFilter);
    }

    setFilteredComplaints(filtered);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const updateComplaintStatus = async (status: "open" | "in_progress" | "resolved" | "closed") => {
    if (!selectedComplaint) return;

    try {
      const { error } = await supabase
        .from("complaints")
        .update({
          status,
          resolution_details: resolution || null,
        })
        .eq("id", selectedComplaint.id);

      if (error) throw error;

      toast.success("Complaint updated successfully!");
      setSelectedComplaint(null);
      setResolution("");
      fetchComplaints();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const stats = {
    total: complaints.length,
    open: complaints.filter((c) => c.status === "open").length,
    inProgress: complaints.filter((c) => c.status === "in_progress").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">BrotoRaise Admin</h1>
            <p className="text-sm text-muted-foreground">Manage all complaints</p>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={() => navigate("/admin/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="complaints" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
            <TabsTrigger value="complaints">Complaints</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="complaints">
            <div className="grid gap-4 md:grid-cols-4 mb-8">
          <div className="bg-card p-6 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-1">Total</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-1">Open</p>
            <p className="text-3xl font-bold text-primary">{stats.open}</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-1">In Progress</p>
            <p className="text-3xl font-bold text-warning">{stats.inProgress}</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-1">Resolved</p>
            <p className="text-3xl font-bold text-success">{stats.resolved}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="basic_coding">Basic Coding</SelectItem>
              <SelectItem value="mern_stack">MERN Stack</SelectItem>
              <SelectItem value="python_django">Python Django</SelectItem>
              <SelectItem value="brohub">BroHub</SelectItem>
              <SelectItem value="game_dev_unity">Game Dev (Unity)</SelectItem>
              <SelectItem value="github_challenge">GitHub Challenge</SelectItem>
              <SelectItem value="cyber_security">Cyber Security</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading complaints...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No complaints found</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredComplaints.map((complaint) => (
              <ComplaintCard
                key={complaint.id}
                complaint={complaint}
                onClick={() => {
                  setSelectedComplaint(complaint);
                  setResolution(complaint.resolution_details || "");
                }}
              />
            ))}
          </div>
        )}

      <Dialog open={!!selectedComplaint} onOpenChange={() => setSelectedComplaint(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Complaint</DialogTitle>
            <DialogDescription>
              Update status and add resolution details
            </DialogDescription>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">{selectedComplaint.title}</h3>
                <p className="text-sm text-muted-foreground">{selectedComplaint.description}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resolution">Resolution Details</Label>
                <Textarea
                  id="resolution"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Describe how this issue was resolved..."
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => updateComplaintStatus("in_progress")}
                  variant="secondary"
                  className="flex-1"
                >
                  Mark In Progress
                </Button>
                <Button
                  onClick={() => updateComplaintStatus("resolved")}
                  className="flex-1 bg-success hover:bg-success/90"
                >
                  Mark Resolved
                </Button>
                <Button
                  onClick={() => updateComplaintStatus("closed")}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
          </TabsContent>

        <TabsContent value="chat">
          <AdminChatInterface />
        </TabsContent>

        <TabsContent value="feedback">
          <FeedbackViewer />
        </TabsContent>
      </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
