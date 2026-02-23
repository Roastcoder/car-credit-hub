
-- Fix overly permissive INSERT policy - restrict to system/self inserts
DROP POLICY "System can insert notifications" ON public.notifications;
CREATE POLICY "Users can receive notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
