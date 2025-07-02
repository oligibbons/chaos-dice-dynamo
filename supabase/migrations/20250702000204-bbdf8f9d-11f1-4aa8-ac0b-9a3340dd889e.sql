
-- Create friends table to handle friend requests and friendships
CREATE TABLE public.friends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

-- Enable RLS for friends table
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- Users can view friend requests involving them
CREATE POLICY "Users can view their friend relationships"
  ON public.friends
  FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Users can send friend requests
CREATE POLICY "Users can send friend requests"
  ON public.friends
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id AND requester_id != addressee_id);

-- Users can update friend requests they're involved in
CREATE POLICY "Users can update their friend relationships"
  ON public.friends
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Users can delete friend relationships they're involved in
CREATE POLICY "Users can delete their friend relationships"
  ON public.friends
  FOR DELETE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Create notifications table for friend requests and game invites
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('friend_request', 'game_invite', 'friend_accepted')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- System can insert notifications
CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- Function to create friend request notification
CREATE OR REPLACE FUNCTION public.handle_friend_request_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    SELECT 
      NEW.addressee_id,
      'friend_request',
      'New Friend Request',
      (SELECT username FROM public.profiles WHERE id = NEW.requester_id) || ' sent you a friend request',
      jsonb_build_object('friend_request_id', NEW.id, 'requester_id', NEW.requester_id);
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    SELECT 
      NEW.requester_id,
      'friend_accepted',
      'Friend Request Accepted',
      (SELECT username FROM public.profiles WHERE id = NEW.addressee_id) || ' accepted your friend request',
      jsonb_build_object('friend_id', NEW.addressee_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for friend request notifications
CREATE TRIGGER trigger_friend_request_notification
  AFTER INSERT OR UPDATE ON public.friends
  FOR EACH ROW EXECUTE FUNCTION public.handle_friend_request_notification();
