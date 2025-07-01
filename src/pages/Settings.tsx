
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Settings as SettingsIcon, 
  Volume2, 
  VolumeX, 
  User, 
  Palette,
  Bell,
  Shield,
  Save
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSoundManager } from "@/components/SoundManager";
import ChaoticBackground from "@/components/ChaoticBackground";

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const soundManager = useSoundManager();
  
  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [masterVolume, setMasterVolume] = useState([0.5]);
  const [musicVolume, setMusicVolume] = useState([0.3]);
  const [sfxVolume, setSfxVolume] = useState([0.7]);
  
  // User settings
  const [username, setUsername] = useState('');
  const [showEmotes, setShowEmotes] = useState(true);
  const [quickPlay, setQuickPlay] = useState(false);
  
  // Notification settings
  const [gameNotifications, setGameNotifications] = useState(true);
  const [turnNotifications, setTurnNotifications] = useState(true);
  const [soundNotifications, setSoundNotifications] = useState(true);

  useEffect(() => {
    if (user) {
      // Load user settings from localStorage or API
      const savedSettings = localStorage.getItem(`settings-${user.id}`);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setSoundEnabled(settings.soundEnabled ?? true);
        setMasterVolume([settings.masterVolume ?? 0.5]);
        setMusicVolume([settings.musicVolume ?? 0.3]);
        setSfxVolume([settings.sfxVolume ?? 0.7]);
        setShowEmotes(settings.showEmotes ?? true);
        setQuickPlay(settings.quickPlay ?? false);
        setGameNotifications(settings.gameNotifications ?? true);
        setTurnNotifications(settings.turnNotifications ?? true);
        setSoundNotifications(settings.soundNotifications ?? true);
      }
    }
  }, [user]);

  const saveSettings = () => {
    if (!user) return;
    
    const settings = {
      soundEnabled,
      masterVolume: masterVolume[0],
      musicVolume: musicVolume[0],
      sfxVolume: sfxVolume[0],
      showEmotes,
      quickPlay,
      gameNotifications,
      turnNotifications,
      soundNotifications
    };
    
    localStorage.setItem(`settings-${user.id}`, JSON.stringify(settings));
    soundManager.setEnabled(soundEnabled);
    
    toast({
      title: "Settings Saved",
      description: "Your preferences have been saved successfully!",
    });
  };

  const resetSettings = () => {
    setSoundEnabled(true);
    setMasterVolume([0.5]);
    setMusicVolume([0.3]);
    setSfxVolume([0.7]);
    setShowEmotes(true);
    setQuickPlay(false);
    setGameNotifications(true);
    setTurnNotifications(true);
    setSoundNotifications(true);
    
    toast({
      title: "Settings Reset",
      description: "All settings have been restored to defaults",
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden p-4 font-quicksand">
      <ChaoticBackground />
      
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bangers text-white mb-2 flex items-center justify-center gap-2 drop-shadow-lg">
            <SettingsIcon className="text-teal-400" />
            Settings
          </h1>
          <p className="text-teal-200 font-medium">Customize your chaotic experience!</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Audio Settings */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-black/40 border-teal-500/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white font-bangers flex items-center gap-2">
                  {soundEnabled ? <Volume2 className="text-teal-400" /> : <VolumeX className="text-red-400" />}
                  Audio Settings
                </CardTitle>
                <CardDescription className="text-teal-200 font-quicksand">
                  Control your audio experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="text-white font-quicksand">Enable Sound</Label>
                  <Switch
                    checked={soundEnabled}
                    onCheckedChange={setSoundEnabled}
                    className="data-[state=checked]:bg-teal-600"
                  />
                </div>
                
                <Separator className="bg-teal-500/30" />
                
                <div>
                  <Label className="text-white font-quicksand mb-2 block">
                    Master Volume: {Math.round(masterVolume[0] * 100)}%
                  </Label>
                  <Slider
                    value={masterVolume}
                    onValueChange={setMasterVolume}
                    max={1}
                    step={0.1}
                    disabled={!soundEnabled}
                    className="slider-teal"
                  />
                </div>
                
                <div>
                  <Label className="text-white font-quicksand mb-2 block">
                    Music Volume: {Math.round(musicVolume[0] * 100)}%
                  </Label>
                  <Slider
                    value={musicVolume}
                    onValueChange={setMusicVolume}
                    max={1}
                    step={0.1}
                    disabled={!soundEnabled}
                    className="slider-teal"
                  />
                </div>
                
                <div>
                  <Label className="text-white font-quicksand mb-2 block">
                    Sound Effects: {Math.round(sfxVolume[0] * 100)}%
                  </Label>
                  <Slider
                    value={sfxVolume}
                    onValueChange={setSfxVolume}
                    max={1}
                    step={0.1}
                    disabled={!soundEnabled}
                    className="slider-teal"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Game Settings */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white font-bangers flex items-center gap-2">
                  <User className="text-purple-400" />
                  Game Settings
                </CardTitle>
                <CardDescription className="text-purple-200 font-quicksand">
                  Personalize your gameplay
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="text-white font-quicksand">Show Player Emotes</Label>
                  <Switch
                    checked={showEmotes}
                    onCheckedChange={setShowEmotes}
                    className="data-[state=checked]:bg-purple-600"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-white font-quicksand">Quick Play Mode</Label>
                  <Switch
                    checked={quickPlay}
                    onCheckedChange={setQuickPlay}
                    className="data-[state=checked]:bg-purple-600"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notification Settings */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-black/40 border-amber-500/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white font-bangers flex items-center gap-2">
                  <Bell className="text-amber-400" />
                  Notifications
                </CardTitle>
                <CardDescription className="text-amber-200 font-quicksand">
                  Manage your notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="text-white font-quicksand">Game Start/End</Label>
                  <Switch
                    checked={gameNotifications}
                    onCheckedChange={setGameNotifications}
                    className="data-[state=checked]:bg-amber-600"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-white font-quicksand">Turn Notifications</Label>
                  <Switch
                    checked={turnNotifications}
                    onCheckedChange={setTurnNotifications}
                    className="data-[state=checked]:bg-amber-600"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-white font-quicksand">Sound Notifications</Label>
                  <Switch
                    checked={soundNotifications}
                    onCheckedChange={setSoundNotifications}
                    className="data-[state=checked]:bg-amber-600"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Privacy & Security */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-black/40 border-red-500/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white font-bangers flex items-center gap-2">
                  <Shield className="text-red-400" />
                  Privacy & Security
                </CardTitle>
                <CardDescription className="text-red-200 font-quicksand">
                  Manage your account security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline"
                  className="w-full border-red-500/50 text-red-300 hover:bg-red-800/50 font-quicksand"
                >
                  Change Password
                </Button>
                <Button 
                  variant="outline"
                  className="w-full border-red-500/50 text-red-300 hover:bg-red-800/50 font-quicksand"
                >
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center gap-4 mt-8"
        >
          <Button
            onClick={saveSettings}
            className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 font-bangers px-8 py-3"
          >
            <Save className="mr-2 h-5 w-5" />
            Save Settings
          </Button>
          
          <Button
            onClick={resetSettings}
            variant="outline"
            className="border-purple-500/50 text-purple-300 hover:bg-purple-800/50 font-bangers px-8 py-3"
          >
            Reset to Defaults
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
