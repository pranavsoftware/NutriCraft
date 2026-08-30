import React from 'react';
import { Leaf } from 'lucide-react';

interface ThemeLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullscreen?: boolean;
}

export default function ThemeLoader({
  message = 'Loading your nutrition data...',
  size = 'md',
  fullscreen = false,
}: ThemeLoaderProps) {
  const sizeMap = {
    sm: { box: 'w-10 h-10', icon: 18, ring: 'w-14 h-14', text: 'text-xs' },
    md: { box: 'w-14 h-14', icon: 24, ring: 'w-20 h-20', text: 'text-sm' },
    lg: { box: 'w-20 h-20', icon: 32, ring: 'w-28 h-28', text: 'text-base' },
  };

  const config = sizeMap[size];

  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center">
        {/* Outer Rotating Glowing Track */}
        <div
          className={`${config.ring} rounded-full border-2 border-emerald-100 border-t-emerald-600 border-r-emerald-500 animate-spin`}
          style={{ animationDuration: '1.2s' }}
        />

        {/* Inner Soft Pulsing Leaf Core */}
        <div className={`absolute ${config.box} rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/10 animate-pulse`}>
          <Leaf size={config.icon} className="stroke-[2.2]" />
        </div>
      </div>

      {message && (
        <div className="space-y-1">
          <p className={`font-semibold text-slate-800 ${config.text} tracking-tight`}>
            {message}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">
            NutriCraft Precision Engine
          </p>
        </div>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-xs flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
