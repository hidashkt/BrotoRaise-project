-- Add file_url and source columns to complaints table
ALTER TABLE public.complaints
ADD COLUMN file_url TEXT,
ADD COLUMN source TEXT;

-- Create storage bucket for complaint attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('complaint-attachments', 'complaint-attachments', true);

-- Allow students to upload files for their complaints
CREATE POLICY "Students can upload complaint attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'complaint-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow students to view their own complaint attachments
CREATE POLICY "Students can view their own attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'complaint-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to view all complaint attachments
CREATE POLICY "Admins can view all attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'complaint-attachments'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow students to delete their own attachments for open complaints
CREATE POLICY "Students can delete their own attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'complaint-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);