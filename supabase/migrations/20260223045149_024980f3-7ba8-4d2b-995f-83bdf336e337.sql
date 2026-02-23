
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, success, warning, error
  loan_id TEXT REFERENCES public.loans(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can update (mark read) their own notifications
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- System/triggers can insert notifications (via security definer function)
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to generate notifications on loan status change
CREATE OR REPLACE FUNCTION public.notify_loan_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _title TEXT;
  _message TEXT;
  _type TEXT;
  _notify_user_id UUID;
BEGIN
  -- Only fire on status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Determine notification content
  CASE NEW.status
    WHEN 'submitted' THEN
      _title := 'Loan Submitted';
      _message := 'Loan ' || NEW.id || ' for ' || NEW.applicant_name || ' has been submitted.';
      _type := 'info';
    WHEN 'under_review' THEN
      _title := 'Loan Under Review';
      _message := 'Loan ' || NEW.id || ' for ' || NEW.applicant_name || ' is now under review.';
      _type := 'warning';
    WHEN 'approved' THEN
      _title := 'Loan Approved';
      _message := 'Loan ' || NEW.id || ' for ' || NEW.applicant_name || ' has been approved!';
      _type := 'success';
    WHEN 'rejected' THEN
      _title := 'Loan Rejected';
      _message := 'Loan ' || NEW.id || ' for ' || NEW.applicant_name || ' has been rejected.';
      _type := 'error';
    WHEN 'disbursed' THEN
      _title := 'Loan Disbursed';
      _message := 'Loan ' || NEW.id || ' for ' || NEW.applicant_name || ' has been disbursed.';
      _type := 'success';
    WHEN 'cancelled' THEN
      _title := 'Loan Cancelled';
      _message := 'Loan ' || NEW.id || ' for ' || NEW.applicant_name || ' has been cancelled.';
      _type := 'error';
    ELSE
      _title := 'Loan Status Updated';
      _message := 'Loan ' || NEW.id || ' status changed to ' || NEW.status;
      _type := 'info';
  END CASE;

  -- Notify the loan creator
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, loan_id)
    VALUES (NEW.created_by, _title, _message, _type, NEW.id);
  END IF;

  -- Notify the manager if different from creator
  IF NEW.manager_id IS NOT NULL AND NEW.manager_id != COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000'::uuid) THEN
    INSERT INTO public.notifications (user_id, title, message, type, loan_id)
    VALUES (NEW.manager_id, _title, _message, _type, NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_loan_status_change
  AFTER UPDATE ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_loan_status_change();

-- Also notify on new loan creation
CREATE OR REPLACE FUNCTION public.notify_loan_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, loan_id)
    VALUES (NEW.created_by, 'Loan Created', 'Loan ' || NEW.id || ' for ' || NEW.applicant_name || ' has been created.', 'success', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_loan_created
  AFTER INSERT ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_loan_created();
