import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, MessageCircle, Paperclip, Image, Video, Mic, FileText, X } from "lucide-react";
import { toast } from "sonner";

interface Complaint {
  id: string;
  title: string;
  category: string;
  student_id: string;
  profiles: {
    name: string;
  };
}

interface Message {
  id: string;
  message: string;
  is_from_admin: boolean;
  created_at: string;
  complaint_id: string;
  attachment_url: string | null;
  attachment_type: string | null;
}

export const AdminChatInterface = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchComplaintsWithMessages();
    subscribeToMessages();
  }, []);

  useEffect(() => {
    if (selectedComplaint) {
      fetchMessages(selectedComplaint.id);
    }
  }, [selectedComplaint]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchComplaintsWithMessages = async () => {
    const { data, error } = await supabase
      .from("complaints")
      .select(`
        id,
        title,
        category,
        student_id,
        profiles!complaints_student_id_fkey (
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching complaints:", error);
      return;
    }

    setComplaints(data as any || []);
  };

  const fetchMessages = async (complaintId: string) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("complaint_id", complaintId)
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
          setMessages((current) => {
            if (selectedComplaint?.id === newMsg.complaint_id) {
              return [...current, newMsg];
            }
            return current;
          });
          
          fetchComplaintsWithMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleFileSelect = (accept: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  const getAttachmentType = (file: File): string => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || isLoading || !selectedComplaint) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setIsLoading(true);
    setIsUploading(true);

    try {
      let attachmentUrl = null;
      let attachmentType = null;

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `admin/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(fileName);

        attachmentUrl = publicUrl;
        attachmentType = getAttachmentType(selectedFile);
      }

      const { error } = await supabase.from("chat_messages").insert({
        complaint_id: selectedComplaint.id,
        student_id: selectedComplaint.student_id,
        message: newMessage.trim() || "Sent an attachment",
        is_from_admin: true,
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
      });

      if (error) throw error;

      setNewMessage("");
      setSelectedFile(null);
      toast.success("Message sent");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const renderAttachment = (msg: Message) => {
    if (!msg.attachment_url) return null;

    switch (msg.attachment_type) {
      case 'image':
        return (
          <img 
            src={msg.attachment_url} 
            alt="attachment" 
            className="max-w-xs rounded-lg mt-2 cursor-pointer"
            onClick={() => window.open(msg.attachment_url!, '_blank')}
          />
        );
      case 'video':
        return (
          <video 
            src={msg.attachment_url} 
            controls 
            className="max-w-xs rounded-lg mt-2"
          />
        );
      case 'audio':
        return (
          <audio 
            src={msg.attachment_url} 
            controls 
            className="mt-2"
          />
        );
      case 'document':
        return (
          <a 
            href={msg.attachment_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 mt-2 text-sm underline"
          >
            <FileText className="h-4 w-4" />
            View Document
          </a>
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="text-sm">Complaints</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[520px]">
            {complaints.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No complaints
              </div>
            ) : (
              complaints.map((complaint) => (
                <button
                  key={complaint.id}
                  onClick={() => setSelectedComplaint(complaint)}
                  className={`w-full text-left p-4 hover:bg-accent transition-colors border-b ${
                    selectedComplaint?.id === complaint.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="font-medium text-sm mb-1">{complaint.title}</div>
                  <div className="text-xs text-muted-foreground">
                    by {complaint.profiles.name} • {complaint.category}
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
            {selectedComplaint ? `${selectedComplaint.title}` : "Select a complaint"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          {selectedComplaint ? (
            <>
              <ScrollArea className="flex-1 px-4" ref={scrollRef}>
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
                          {renderAttachment(msg)}
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              
              <div className="border-t p-4">
                {selectedFile && (
                  <div className="mb-2 flex items-center gap-2 text-sm bg-muted p-2 rounded">
                    <Paperclip className="h-4 w-4" />
                    <span className="flex-1 truncate">{selectedFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 20 * 1024 * 1024) {
                          toast.error("File size must be less than 20MB");
                          return;
                        }
                        setSelectedFile(file);
                      }
                    }}
                  />
                  
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleFileSelect('image/*')}
                      disabled={isLoading}
                      title="Send image"
                    >
                      <Image className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleFileSelect('video/*')}
                      disabled={isLoading}
                      title="Send video"
                    >
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleFileSelect('audio/*')}
                      disabled={isLoading}
                      title="Send audio"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleFileSelect('*')}
                      disabled={isLoading}
                      title="Send document"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    disabled={isLoading || (!newMessage.trim() && !selectedFile)}
                  >
                    {isUploading ? (
                      <span className="text-xs">Uploading...</span>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a complaint to start chatting
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
