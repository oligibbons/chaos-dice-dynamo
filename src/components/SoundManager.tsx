
import { useEffect, useRef } from 'react';

class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;

  constructor() {
    // Initialize sounds
    this.loadSound('roll', '/sounds/dice-roll.mp3');
    this.loadSound('score', '/sounds/score.mp3');
    this.loadSound('chaos', '/sounds/chaos.mp3');
    this.loadSound('win', '/sounds/win.mp3');
    this.loadSound('tick', '/sounds/tick.mp3');
    this.loadSound('notification', '/sounds/notification.mp3');
    this.loadSound('emote', '/sounds/emote.mp3');
  }

  private loadSound(name: string, src: string) {
    try {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.volume = 0.3;
      this.sounds.set(name, audio);
    } catch (error) {
      console.warn(`Failed to load sound: ${name}`);
    }
  }

  play(soundName: string, volume: number = 0.3) {
    if (!this.enabled) return;
    
    const sound = this.sounds.get(soundName);
    if (sound) {
      sound.volume = volume;
      sound.currentTime = 0;
      sound.play().catch(() => {
        // Ignore play errors (usually due to autoplay restrictions)
      });
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled() {
    return this.enabled;
  }
}

const soundManager = new SoundManager();

export const useSoundManager = () => {
  return soundManager;
};

const SoundManagerComponent = () => {
  const soundManagerRef = useRef(soundManager);

  useEffect(() => {
    // Enable sound after user interaction
    const enableSound = () => {
      soundManagerRef.current.setEnabled(true);
      document.removeEventListener('click', enableSound);
    };

    document.addEventListener('click', enableSound);
    return () => document.removeEventListener('click', enableSound);
  }, []);

  return null;
};

export default SoundManagerComponent;
