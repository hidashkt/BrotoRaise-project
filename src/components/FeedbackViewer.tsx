import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StarRating } from "@/components/StarRating";
import { toast } from "sonner";

interface Feedback {
  id: string;
  complaint_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  complaint: {
    title: string;
    student_id: string;
  };
  student: {
    name: string;
    email: string;
  };
}

export const FeedbackViewer = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("feedback")
        .select(`
          id,
          complaint_id,
          rating,
          comment,
          created_at,
          complaint:complaints(title, student_id)
        `)
        .order("created_at", { ascending: false });

      if (feedbackError) throw feedbackError;

      // Fetch student names for each feedback
      const feedbacksWithStudents = await Promise.all(
        (feedbackData || []).map(async (feedback: any) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, email")
            .eq("id", feedback.complaint.student_id)
            .single();

          return {
            ...feedback,
            student: profile || { name: "Unknown", email: "" },
          };
        })
      );

      setFeedbacks(feedbacksWithStudents);
    } catch (error: any) {
      console.error("Error fetching feedback:", error);
      toast.error("Failed to load feedback");
    } finally {
      setIsLoading(false);
    }
  };

  const averageRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{feedbacks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{averageRating}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">5 Star Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {feedbacks.filter((f) => f.rating === 5).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading feedback...
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No feedback submitted yet
              </div>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((feedback) => (
                  <Card key={feedback.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{feedback.student.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {feedback.student.email}
                            </p>
                          </div>
                          <StarRating rating={feedback.rating} readonly />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Complaint: {feedback.complaint.title}
                          </p>
                        </div>
                        {feedback.comment && (
                          <div className="rounded-lg bg-muted p-3">
                            <p className="text-sm">{feedback.comment}</p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(feedback.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
