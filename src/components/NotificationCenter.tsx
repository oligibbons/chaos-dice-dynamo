
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Users, Check, X, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter = ({ isOpen, onClose }: NotificationCenterProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchNotifications();
      setupRealtimeSubscription();
    }
  }, [isOpen, user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user!.id}`
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleFriendRequest = async (notificationId: string, friendRequestId: string, action: 'accept' | 'decline') => {
    try {
      if (action === 'accept') {
        const { error } = await supabase
          .from('friends')
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('id', friendRequestId);

        if (error) throw error;

        toast({
          title: "Friend Request Accepted",
          description: "You are now friends!",
        });
      } else {
        const { error } = await supabase
          .from('friends')
          .delete()
          .eq('id', friendRequestId);

        if (error) throw error;

        toast({
          title: "Friend Request Declined",
          description: "The friend request has been declined",
        });
      }

      // Remove the notification
      await deleteNotification(notificationId);
    } catch (error: any) {
      console.error('Error handling friend request:', error);
      toast({
        title: "Error",
        description: "Failed to handle friend request",
        variant: "destructive",
      });
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-end p-4">
      <motion.div
        initial={{ opacity: 0, x: 400 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 400 }}
        className="w-full max-w-md max-h-[80vh] overflow-hidden"
      >
        <Card className="bg-black/90 border-purple-500/50 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-400" />
              <CardTitle className="font-bangers text-white text-xl">
                Notifications
              </CardTitle>
              {unreadCount > 0 && (
                <Badge className="bg-red-600 text-white font-quicksand text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-purple-600/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0 max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center">
                <p className="text-white font-quicksand">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="h-12 w-12 text-purple-400 mx-auto mb-4 opacity-50" />
                <p className="text-white font-quicksand mb-2">No notifications</p>
                <p className="text-purple-300 text-sm font-quicksand">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-2 p-4">
                <AnimatePresence>
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`p-4 rounded-lg border transition-all ${
                        notification.read 
                          ? 'bg-purple-900/20 border-purple-500/20' 
                          : 'bg-purple-900/40 border-purple-500/50'
                      }`}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {notification.type === 'friend_request' && (
                              <Users className="h-4 w-4 text-blue-400" />
                            )}
                            <h4 className="text-white font-quicksand font-semibold text-sm">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-400 rounded-full" />
                            )}
                          </div>
                          <p className="text-purple-200 text-sm font-quicksand">
                            {notification.message}
                          </p>
                          <p className="text-purple-400 text-xs font-quicksand">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>

                          {notification.type === 'friend_request' && (
                            <div className="flex items-center gap-2 pt-2">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFriendRequest(notification.id, notification.data.friend_request_id, 'accept');
                                }}
                                className="bg-green-600 hover:bg-green-700 font-quicksand text-xs"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFriendRequest(notification.id, notification.data.friend_request_id, 'decline');
                                }}
                                className="border-red-500/50 text-red-300 hover:bg-red-600/20 font-quicksand text-xs"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Decline
                              </Button>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-purple-400 hover:text-red-400 hover:bg-red-600/20"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default NotificationCenter;
