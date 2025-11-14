import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  unreadCount: number;
}

interface Message {
  id: string;
  message: string;
  is_from_admin: boolean;
  created_at: string;
  student_id: string;
}

export const AdminChatInterface = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchStudentsWithMessages();
    subscribeToMessages();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchMessages(selectedStudent.id);
    }
  }, [selectedStudent]);

  const fetchStudentsWithMessages = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name");

    if (!profiles) return;

    const studentsWithChats: Student[] = [];
    
    for (const profile of profiles) {
      const { data: messages } = await supabase
        .from("chat_messages")
        .select("id")
        .eq("student_id", profile.id);

      if (messages && messages.length > 0) {
        studentsWithChats.push({
          id: profile.id,
          name: profile.name,
          unreadCount: 0,
        });
      }
    }

    setStudents(studentsWithChats);
  };

  const fetchMessages = async (studentId: string) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    setMessages(data || []);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("admin_chat_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((current) => [...current, newMsg]);
          
          // Refresh students list if new student starts chatting
          fetchStudentsWithMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading || !selectedStudent) return;

    setIsLoading(true);

    const { error } = await supabase.from("chat_messages").insert({
      student_id: selectedStudent.id,
      message: newMessage.trim(),
      is_from_admin: true,
    });

    if (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } else {
      setNewMessage("");
    }

    setIsLoading(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="text-sm">Students</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[520px]">
            {students.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No active chats
              </div>
            ) : (
              students.map((student) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`w-full text-left p-4 hover:bg-accent transition-colors border-b ${
                    selectedStudent?.id === student.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{student.name}</span>
                    {student.unreadCount > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1">
                        {student.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {selectedStudent ? `Chat with ${selectedStudent.name}` : "Select a student"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          {selectedStudent ? (
            <>
              <ScrollArea className="flex-1 px-4">
                <div className="space-y-4 py-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No messages yet
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.is_from_admin ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            msg.is_from_admin
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          <p className="text-sm break-words">{msg.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              <form onSubmit={handleSendMessage} className="border-t p-4 flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a student to start chatting
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
