-- Allow students to update their own complaints (only when status is 'open')
CREATE POLICY "Students can update their own open complaints"
ON public.complaints
FOR UPDATE
USING (auth.uid() = student_id AND status = 'open')
WITH CHECK (auth.uid() = student_id AND status = 'open');

-- Allow students to delete their own complaints (only when status is 'open')
CREATE POLICY "Students can delete their own open complaints"
ON public.complaints
FOR DELETE
USING (auth.uid() = student_id AND status = 'open');