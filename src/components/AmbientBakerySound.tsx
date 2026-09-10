import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Sparkles, Sliders, Music, Coffee, Bell } from 'lucide-react';

interface AmbientBakerySoundProps {
  className?: string;
}

export default function AmbientBakerySound({ className = '' }: AmbientBakerySoundProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.35); // 0.0 to 1.0
  const [showControls, setShowControls] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and update master volume when volume changes
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(
        isPlaying ? volume : 0,
        audioCtxRef.current.currentTime,
        0.1
      );
    }
  }, [volume, isPlaying]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAmbientSound();
    };
  }, []);

  const triggerOvenDing = (ctx: AudioContext, masterGain: GainNode) => {
    try {
      const now = ctx.currentTime;
      // High oven timer chime (E6: ~1318.5Hz and B6: ~1975.5Hz)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const dingGain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(1318.5, now);
      osc2.frequency.setValueAtTime(1975.53, now);

      dingGain.gain.setValueAtTime(0.12, now);
      dingGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      osc1.connect(dingGain);
      osc2.connect(dingGain);
      dingGain.connect(masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.8);
      osc2.stop(now + 1.8);

      setLastEvent('Oven Timer Ring 🔔');
      setTimeout(() => setLastEvent(null), 3000);
    } catch (e) {
      console.warn('Oven ding error', e);
    }
  };

  const triggerEspressoSteam = (ctx: AudioContext, masterGain: GainNode) => {
    try {
      const now = ctx.currentTime;
      const bufferSize = ctx.sampleRate * 1.5; // 1.5 seconds of steam hiss
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const steamFilter = ctx.createBiquadFilter();
      steamFilter.type = 'bandpass';
      steamFilter.frequency.setValueAtTime(3200, now);
      steamFilter.Q.setValueAtTime(2, now);

      const steamGain = ctx.createGain();
      steamGain.gain.setValueAtTime(0.01, now);
      steamGain.gain.linearRampToValueAtTime(0.08, now + 0.3);
      steamGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      whiteNoise.connect(steamFilter);
      steamFilter.connect(steamGain);
      steamGain.connect(masterGain);

      whiteNoise.start(now);
      whiteNoise.stop(now + 1.5);

      setLastEvent('Espresso Steam ☕');
      setTimeout(() => setLastEvent(null), 3000);
    } catch (e) {
      console.warn('Steam error', e);
    }
  };

  const triggerPorcelainClink = (ctx: AudioContext, masterGain: GainNode) => {
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const clinkGain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2800 + Math.random() * 400, now);

      clinkGain.gain.setValueAtTime(0.07, now);
      clinkGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

      osc.connect(clinkGain);
      clinkGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.3);

      setLastEvent('Teacup Clink 🍵');
      setTimeout(() => setLastEvent(null), 3000);
    } catch (e) {
      console.warn('Clink error', e);
    }
  };

  const startAmbientSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Master Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume, ctx.currentTime);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      // Create warm low background room rumble (Filtered Noise)
      const bufferSize = ctx.sampleRate * 4; // 4 second loopable noise
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.035; // Soft pink noise
        b6 = white * 0.115926;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      // Lowpass filter for warm room acoustic feel
      const roomFilter = ctx.createBiquadFilter();
      roomFilter.type = 'lowpass';
      roomFilter.frequency.setValueAtTime(260, ctx.currentTime);

      noiseSource.connect(roomFilter);
      roomFilter.connect(masterGain);

      noiseSource.start();
      noiseNodeRef.current = noiseSource;
      filterNodeRef.current = roomFilter;

      // Play an initial welcoming soft oven chime
      setTimeout(() => triggerOvenDing(ctx, masterGain), 600);

      // Periodically trigger ambient bakery sounds
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        if (!audioCtxRef.current || audioCtxRef.current.state !== 'running') return;
        const rand = Math.random();
        if (rand < 0.35) {
          triggerPorcelainClink(ctx, masterGain);
        } else if (rand < 0.70) {
          triggerEspressoSteam(ctx, masterGain);
        } else {
          triggerOvenDing(ctx, masterGain);
        }
      }, 12000); // Trigger a cozy sound every ~12 seconds

      setIsPlaying(true);
      setLastEvent('Bakery Ambience Active');
      setTimeout(() => setLastEvent(null), 3000);
    } catch (e) {
      console.error('Failed to start ambient audio:', e);
    }
  };

  const stopAmbientSound = () => {
    try {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (noiseNodeRef.current) {
        noiseNodeRef.current.stop();
        noiseNodeRef.current.disconnect();
        noiseNodeRef.current = null;
      }
      if (masterGainRef.current && audioCtxRef.current) {
        masterGainRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.05);
      }
      setIsPlaying(false);
      setLastEvent(null);
    } catch (e) {
      console.warn('Error stopping sound:', e);
    }
  };

  const toggleAmbientSound = () => {
    if (isPlaying) {
      stopAmbientSound();
    } else {
      startAmbientSound();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-1.5">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleAmbientSound}
          className={`h-12 px-3.5 rounded-xl border flex items-center gap-2 relative cursor-pointer transition-all focus:outline-none shadow-sm ${
            isPlaying 
              ? 'bg-amber-900/90 text-amber-100 border-amber-600/50 shadow-amber-900/20' 
              : 'bg-brand-cream border-brand-caramel/10 text-brand-chocolate hover:border-brand-caramel/30'
          }`}
          title={isPlaying ? 'Mute Ambient Bakery Sounds' : 'Enable Ambient Bakery Sounds'}
        >
          {isPlaying ? (
            <>
              <Volume2 className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
              {/* Sound waves animation */}
              <div className="flex items-end gap-0.5 h-3 shrink-0">
                <motion.span 
                  animate={{ height: ['20%', '100%', '30%'] }} 
                  transition={{ repeat: Infinity, duration: 0.6, ease: 'easeInOut' }} 
                  className="w-0.5 bg-amber-400 rounded-full" 
                />
                <motion.span 
                  animate={{ height: ['80%', '20%', '90%'] }} 
                  transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }} 
                  className="w-0.5 bg-amber-300 rounded-full" 
                />
                <motion.span 
                  animate={{ height: ['40%', '90%', '20%'] }} 
                  transition={{ repeat: Infinity, duration: 0.5, ease: 'easeInOut' }} 
                  className="w-0.5 bg-amber-200 rounded-full" 
                />
              </div>
              <span className="text-xs font-bold font-sans hidden sm:inline text-amber-100">
                Ambient Bakery
              </span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 text-brand-chocolate/60 shrink-0" />
              <span className="text-xs font-bold font-sans hidden sm:inline text-brand-chocolate/80">
                Bakery Sound
              </span>
            </>
          )}
        </motion.button>

        {/* Settings button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowControls(!showControls)}
          className={`w-8 h-12 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
            showControls 
              ? 'bg-brand-caramel text-brand-cream border-brand-caramel' 
              : 'bg-brand-cream border-brand-caramel/10 text-brand-chocolate/60 hover:text-brand-chocolate'
          }`}
          title="Bakery Sound Settings"
        >
          <Sliders className="w-3.5 h-3.5" />
        </motion.button>
      </div>

      {/* Floating Status Toast when an event triggers */}
      <AnimatePresence>
        {lastEvent && isPlaying && !showControls && (
          <motion.div
            key="ambient-toast"
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9 }}
            className="absolute top-14 left-0 z-40 bg-amber-950 text-amber-200 border border-amber-700/50 text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-lg whitespace-nowrap flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
            <span>{lastEvent}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Popover Drawer */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            key="ambient-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={() => setShowControls(false)}
          />
        )}
        {showControls && (
          <motion.div
            key="ambient-controls-panel"
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="absolute right-0 mt-3 w-72 bg-brand-sugar border border-brand-caramel/15 rounded-2xl shadow-2xl p-4 z-50 space-y-3.5 text-brand-chocolate"
            >
              <div className="flex items-center justify-between pb-2 border-b border-brand-caramel/10">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-brand-caramel" />
                  <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-brand-caramel">
                    Cozy Bakery Ambience
                  </h4>
                </div>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                  isPlaying ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                }`}>
                  {isPlaying ? 'Active' : 'Off'}
                </span>
              </div>

              {/* Toggle switch */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-brand-cream/60 border border-brand-caramel/10">
                <div>
                  <p className="text-xs font-bold">Immersive Cafe Sounds</p>
                  <p className="text-[10px] text-brand-chocolate/60">Oven chimes, steam & chatter</p>
                </div>
                <button
                  onClick={toggleAmbientSound}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                    isPlaying ? 'bg-amber-800' : 'bg-gray-300'
                  }`}
                >
                  <motion.div 
                    className="w-5 h-5 rounded-full bg-white shadow-md"
                    animate={{ x: isPlaying ? 20 : 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  />
                </button>
              </div>

              {/* Volume Slider */}
              <div className="space-y-1.5 px-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-brand-chocolate/80">Master Volume</span>
                  <span className="font-mono text-[11px] font-bold text-brand-caramel">{Math.round(volume * 100)}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-brand-caramel cursor-pointer"
                />
              </div>

              {/* Sound elements active summary */}
              <div className="space-y-1.5 pt-1 border-t border-brand-caramel/10">
                <p className="text-[10px] font-bold text-brand-chocolate/50 uppercase tracking-widest">
                  Included Ambient Layers:
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-brand-cream/40 text-brand-chocolate/80">
                    <Bell className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Oven Timers</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-brand-cream/40 text-brand-chocolate/80">
                    <Coffee className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Espresso Steam</span>
                  </div>
                </div>
              </div>

              {/* Test sounds trigger */}
              {isPlaying && (
                <div className="pt-1 flex gap-2">
                  <button
                    onClick={() => audioCtxRef.current && masterGainRef.current && triggerOvenDing(audioCtxRef.current, masterGainRef.current)}
                    className="flex-1 py-1.5 px-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-[10px] font-bold transition-colors cursor-pointer text-center"
                  >
                    🔔 Test Timer
                  </button>
                  <button
                    onClick={() => audioCtxRef.current && masterGainRef.current && triggerEspressoSteam(audioCtxRef.current, masterGainRef.current)}
                    className="flex-1 py-1.5 px-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-[10px] font-bold transition-colors cursor-pointer text-center"
                  >
                    ☕ Test Steam
                  </button>
                </div>
              )}
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
