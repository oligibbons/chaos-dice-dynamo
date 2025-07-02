
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { User, Settings, LogOut, Shield, Trophy, Users, Gamepad2, Menu, X, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo";
import NotificationCenter from "./NotificationCenter";

const NavBar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotificationCount();
      setupNotificationSubscription();
    }
  }, [user]);

  const fetchNotificationCount = async () => {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('read', false);

      if (error) throw error;
      setNotificationCount(count || 0);
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  const setupNotificationSubscription = () => {
    const channel = supabase
      .channel('notification-count')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user!.id}`
      }, () => {
        fetchNotificationCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { name: 'Play', path: '/lobby', icon: Gamepad2, color: 'text-green-400' },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy, color: 'text-yellow-400' },
    { name: 'Friends', path: '/friends', icon: Users, color: 'text-blue-400' },
  ];

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <>
      <motion.nav 
        className="bg-black/40 backdrop-blur-md border-b border-purple-500/30 sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Logo size="sm" />
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {user && navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(item.path);
                
                return (
                  <Link key={item.name} to={item.path}>
                    <motion.div
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                        isActive 
                          ? 'bg-purple-600/30 text-white shadow-lg' 
                          : 'text-white/70 hover:text-white hover:bg-purple-600/20'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? item.color : ''}`} />
                      <span className="font-quicksand font-medium">{item.name}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            {/* User Menu / Auth Buttons */}
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  {/* Notification Bell */}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNotifications(true)}
                      className="relative text-white hover:bg-purple-600/20"
                    >
                      <Bell className="h-5 w-5" />
                      {notificationCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 bg-red-600 text-white text-xs min-w-[1.25rem] h-5 flex items-center justify-center p-0">
                          {notificationCount > 99 ? '99+' : notificationCount}
                        </Badge>
                      )}
                    </Button>
                  </motion.div>

                  {/* User Avatar Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full border-2 border-purple-400/50 hover:border-purple-400">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bangers">
                              {user.email?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        </Button>
                      </motion.div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      className="w-56 bg-black/90 backdrop-blur-md border-purple-500/50 text-white" 
                      align="end"
                    >
                      <div className="px-3 py-2">
                        <p className="text-sm font-quicksand font-medium">{user.email}</p>
                        <Badge className="mt-1 bg-purple-600 text-white text-xs">Player</Badge>
                      </div>
                      <DropdownMenuSeparator className="bg-purple-500/30" />
                      
                      <DropdownMenuItem 
                        className="hover:bg-purple-600/20 cursor-pointer"
                        onClick={() => navigate('/settings')}
                      >
                        <Settings className="mr-2 h-4 w-4 text-purple-400" />
                        <span className="font-quicksand">Settings</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        className="hover:bg-purple-600/20 cursor-pointer"
                        onClick={() => navigate('/admin')}
                      >
                        <Shield className="mr-2 h-4 w-4 text-red-400" />
                        <span className="font-quicksand">Admin</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator className="bg-purple-500/30" />
                      <DropdownMenuItem 
                        className="hover:bg-red-600/20 cursor-pointer text-red-300"
                        onClick={handleSignOut}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span className="font-quicksand">Sign Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/auth">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        variant="outline" 
                        className="border-purple-400/50 text-white hover:bg-purple-600/20 font-quicksand font-medium"
                      >
                        Sign In
                      </Button>
                    </motion.div>
                  </Link>
                  <Link to="/auth">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-quicksand font-medium">
                        Join Now
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="text-white hover:bg-purple-600/20"
                  >
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden border-t border-purple-500/30 py-4"
              >
                <div className="space-y-2">
                  {user && navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = isActivePath(item.path);
                    
                    return (
                      <Link 
                        key={item.name} 
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                          isActive 
                            ? 'bg-purple-600/30 text-white' 
                            : 'text-white/70 hover:text-white hover:bg-purple-600/20'
                        }`}>
                          <Icon className={`h-5 w-5 ${isActive ? item.color : ''}`} />
                          <span className="font-quicksand font-medium">{item.name}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </>
  );
};

export default NavBar;
