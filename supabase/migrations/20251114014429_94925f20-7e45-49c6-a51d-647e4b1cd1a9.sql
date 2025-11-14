-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_from_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Students can view their own chat messages
CREATE POLICY "Students can view their own messages"
ON public.chat_messages
FOR SELECT
USING (auth.uid() = student_id);

-- Students can insert their own messages
CREATE POLICY "Students can insert their own messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (auth.uid() = student_id AND is_from_admin = false);

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
ON public.chat_messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert messages
CREATE POLICY "Admins can insert messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;