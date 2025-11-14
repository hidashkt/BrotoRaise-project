-- Add complaint_id to chat_messages
ALTER TABLE public.chat_messages
ADD COLUMN complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_chat_messages_complaint_id ON public.chat_messages(complaint_id);

-- Add attachment fields
ALTER TABLE public.chat_messages
ADD COLUMN attachment_url TEXT,
ADD COLUMN attachment_type TEXT CHECK (attachment_type IN ('image', 'video', 'audio', 'document'));

-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true);

-- RLS policies for chat attachments
CREATE POLICY "Users can upload their own chat attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view chat attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chat-attachments');

CREATE POLICY "Admins can upload chat attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Update RLS policies for chat messages to work with complaints
DROP POLICY IF EXISTS "Students can view their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Students can insert their own messages" ON public.chat_messages;

CREATE POLICY "Students can view messages for their complaints"
ON public.chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.complaints
    WHERE complaints.id = chat_messages.complaint_id
    AND complaints.student_id = auth.uid()
  )
);

CREATE POLICY "Students can insert messages for their complaints"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.complaints
    WHERE complaints.id = chat_messages.complaint_id
    AND complaints.student_id = auth.uid()
  ) AND is_from_admin = false
);