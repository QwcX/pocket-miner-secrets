import { useCallback, useRef } from 'react';

// Telegram-style notification sounds using Web Audio API
export const useNotificationSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Telegram-style message sound - soft "pop" sound
  const playMessageSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      
      // Create main oscillator for the pop
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      
      // Create second oscillator for richness
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      
      // Low-pass filter for softer sound
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
      
      // Connect oscillators through filter
      osc1.connect(gain1);
      osc2.connect(gain2);
      gain1.connect(filter);
      gain2.connect(filter);
      filter.connect(ctx.destination);
      
      // Main tone - descending pitch like TG
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1200, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08);
      
      // Harmonic undertone
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(600, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
      
      // Envelope - quick attack, smooth decay
      gain1.gain.setValueAtTime(0, ctx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.01);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      
      gain2.gain.setValueAtTime(0, ctx.currentTime);
      gain2.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.01);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.15);
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.12);
    } catch (e) {
      console.log('Audio not available');
    }
  }, [getAudioContext]);

  // Moderation alert - more noticeable two-tone chime
  const playModerationSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      
      const playChime = (freq1: number, freq2: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3000, startTime);
        
        osc.connect(gain);
        gain.connect(filter);
        filter.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq1, startTime);
        osc.frequency.setValueAtTime(freq2, startTime + duration * 0.5);
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
        gain.gain.setValueAtTime(0.3, startTime + duration * 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // Two rising tones like notification chime
      playChime(880, 880, ctx.currentTime, 0.12);
      playChime(1320, 1320, ctx.currentTime + 0.1, 0.15);
    } catch (e) {
      console.log('Audio not available');
    }
  }, [getAudioContext]);

  // Notification sound - subtle ding
  const playNotificationSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2500, ctx.currentTime);
      
      osc.connect(gain);
      gain.connect(filter);
      filter.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      console.log('Audio not available');
    }
  }, [getAudioContext]);

  return { playMessageSound, playModerationSound, playNotificationSound };
};
