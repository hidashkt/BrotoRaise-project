import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ComplaintCard } from "@/components/ComplaintCard";
import { PlusCircle, LogOut } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StarRating } from "@/components/StarRating";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [editingComplaint, setEditingComplaint] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedbackComplaint, setFeedbackComplaint] = useState<any>(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchComplaints();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", session.user.id)
      .single();

    if (profile) setUserName(profile.name);
  };

  const fetchComplaints = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .eq("student_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleSubmitComplaint = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      setIsUploading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let fileUrl = editingComplaint?.file_url || null;

      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('complaint-attachments')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('complaint-attachments')
          .getPublicUrl(fileName);

        fileUrl = publicUrl;
      }

      const complaintData = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        category: formData.get("category") as any,
        source: formData.get("source") as string || null,
        file_url: fileUrl,
      };

      if (editingComplaint) {
        const { error } = await supabase
          .from("complaints")
          .update(complaintData)
          .eq("id", editingComplaint.id);

        if (error) throw error;
        toast.success("Complaint updated successfully!");
      } else {
        const { error } = await supabase.from("complaints").insert({
          student_id: session.user.id,
          ...complaintData,
        });

        if (error) throw error;
        toast.success("Complaint submitted successfully!");
      }

      setIsOpen(false);
      setEditingComplaint(null);
      setSelectedFile(null);
      fetchComplaints();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditComplaint = (complaint: any) => {
    setEditingComplaint(complaint);
    setSelectedFile(null);
    setIsOpen(true);
  };

  const handleDeleteComplaint = async () => {
    if (!deletingId) return;

    try {
      const { error } = await supabase
        .from("complaints")
        .delete()
        .eq("id", deletingId);

      if (error) throw error;
      toast.success("Complaint deleted successfully!");
      fetchComplaints();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackComplaint || feedbackRating === 0) {
      toast.error("Please provide a rating");
      return;
    }

    try {
      const { error } = await supabase.from("feedback").insert({
        complaint_id: feedbackComplaint.id,
        rating: feedbackRating,
        comment: feedbackComment,
      });

      if (error) throw error;
      toast.success("Feedback submitted successfully!");
      setFeedbackComplaint(null);
      setFeedbackRating(0);
      setFeedbackComment("");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleOpenDialog = () => {
    setEditingComplaint(null);
    setIsOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">BrotoRaise</h1>
            <p className="text-sm text-muted-foreground">Welcome, {userName}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">My Complaints</h2>
            <p className="text-muted-foreground">Track and manage your submitted complaints</p>
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) setEditingComplaint(null);
          }}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenDialog}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Complaint
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingComplaint ? "Edit Complaint" : "Submit a New Complaint"}
                </DialogTitle>
                <DialogDescription>
                  {editingComplaint 
                    ? "Update your complaint details" 
                    : "Describe your issue in detail to help us resolve it quickly"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitComplaint} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={editingComplaint?.title}
                    placeholder="Brief description of the issue"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" defaultValue={editingComplaint?.category} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
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
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editingComplaint?.description}
                    placeholder="Provide detailed information about your issue"
                    rows={5}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="source">Source/Reference (Optional)</Label>
                  <Input
                    id="source"
                    name="source"
                    placeholder="e.g., Room number, department, URL"
                    defaultValue={editingComplaint?.source || ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Attachment (Optional)</Label>
                  <Input
                    id="file"
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  {editingComplaint?.file_url && !selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Current file attached
                    </p>
                  )}
                </div>
                
                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsOpen(false);
                    setEditingComplaint(null);
                    setSelectedFile(null);
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? "Uploading..." : editingComplaint ? "Update" : "Submit"} Complaint
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading complaints...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No complaints submitted yet</p>
            <Button onClick={() => setIsOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Submit Your First Complaint
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {complaints.map((complaint) => (
              <ComplaintCard 
                key={complaint.id} 
                complaint={complaint}
                showActions={true}
                onEdit={handleEditComplaint}
                onDelete={(id) => setDeletingId(id)}
                onClick={() => {
                  if (complaint.status === 'resolved') {
                    setFeedbackComplaint(complaint);
                  }
                }}
              />
            ))}
          </div>
        )}

        <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Complaint</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this complaint? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteComplaint} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={!!feedbackComplaint} onOpenChange={() => {
          setFeedbackComplaint(null);
          setFeedbackRating(0);
          setFeedbackComment("");
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Feedback</DialogTitle>
              <DialogDescription>
                Rate your experience with the resolution of: {feedbackComplaint?.title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Rating</Label>
                <StarRating 
                  rating={feedbackRating} 
                  onRatingChange={setFeedbackRating}
                  size="lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback-comment">Comment (optional)</Label>
                <Textarea
                  id="feedback-comment"
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Share your thoughts about the resolution..."
                  rows={4}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => {
                setFeedbackComplaint(null);
                setFeedbackRating(0);
                setFeedbackComment("");
              }}>
                Cancel
              </Button>
              <Button onClick={handleSubmitFeedback}>
                Submit Feedback
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default StudentDashboard;
