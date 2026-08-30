import React from 'react';
import { Leaf, Sparkles, Heart } from 'lucide-react';

export default function BackgroundAnimation() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Soft Ambient Pastel Glow Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-300/20 blur-3xl animate-pulse-glow" />
      <div className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-teal-200/20 blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />
      <div className="absolute -bottom-32 left-1/4 w-[32rem] h-[32rem] rounded-full bg-green-200/20 blur-3xl animate-pulse-glow" style={{ animationDelay: '4s' }} />

      {/* Cute Subtle Floating Leaves & Wellness Accents */}
      <div className="absolute top-24 left-[8%] text-emerald-600/15 animate-float-slow hidden md:block">
        <Leaf size={32} className="rotate-12" />
      </div>

      <div className="absolute top-[45%] left-[4%] text-teal-600/15 animate-float-reverse hidden lg:block" style={{ animationDelay: '1.5s' }}>
        <Sparkles size={24} />
      </div>

      <div className="absolute top-36 right-[10%] text-emerald-600/15 animate-float-reverse hidden md:block" style={{ animationDelay: '1s' }}>
        <Leaf size={38} className="-rotate-45" />
      </div>

      <div className="absolute top-[60%] right-[6%] text-green-600/15 animate-float-slow hidden lg:block" style={{ animationDelay: '3s' }}>
        <Leaf size={28} className="rotate-45" />
      </div>

      <div className="absolute bottom-28 left-[15%] text-emerald-500/15 animate-float-slow hidden sm:block" style={{ animationDelay: '2.5s' }}>
        <Heart size={20} />
      </div>
    </div>
  );
}
