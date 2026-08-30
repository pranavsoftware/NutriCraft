import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';

export default function VideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <section className="bg-white py-20 px-6 md:px-12 max-w-6xl mx-auto text-center">
      <div className="max-w-2xl mx-auto mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Inside NutriCraft Experience
        </div>
        <h2 className="font-serif-display text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
          Transforming Daily Habits with Precision Nutrition
        </h2>
        <p className="text-slate-600 text-sm md:text-base leading-relaxed">
          Watch how our evidence-based consultations, real-time AI food logging, and personalized macro plans guide you to your optimal health.
        </p>
      </div>

      <div 
        onClick={togglePlay}
        className="relative rounded-3xl overflow-hidden group cursor-pointer aspect-video shadow-2xl bg-slate-950 border border-slate-100 max-w-5xl mx-auto"
      >
        <video
          ref={videoRef}
          src="/landing-video.mp4"
          playsInline
          loop
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="w-full h-full object-cover"
        />

        {/* Play / Pause Central Overlay Button */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-all">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-600/90 hover:bg-green-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-green-600/50 transition-transform group-hover:scale-110">
              <Play className="w-9 h-9 sm:w-11 sm:h-11 ml-1" fill="currentColor" />
            </div>
          </div>
        )}

        {/* Bottom Floating Control Bar */}
        <div className={`absolute bottom-0 inset-x-0 p-4 sm:p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
          <div className="flex items-center gap-3 text-white text-xs sm:text-sm font-medium">
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md transition-colors"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
            </button>
            <span className="drop-shadow-sm font-serif-display font-semibold">
              NutriCraft • Lifestyle & Nutrition Walkthrough
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-colors"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-colors"
            >
              <Maximize2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
