import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

/**
 * Global Network Resilience Banner.
 * Automatically informs users of network disconnects and reconnects smoothly
 * without interrupting their interactions across mobile and desktop devices.
 */
export default function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // When fully online and not displaying the reconnection toast, render nothing
  if (isOnline && !showReconnected) {
    return null;
  }

  // Reconnected Toast
  if (isOnline && showReconnected) {
    return (
      <aside
        aria-live="polite"
        role="status"
        className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-900/95 text-emerald-100 border border-emerald-500/40 shadow-xl text-xs font-semibold backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300"
      >
        <span className="flex h-2 w-2 relative shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Wifi size={14} className="text-emerald-400 shrink-0" />
        <span>Back Online • Connection Restored</span>
      </aside>
    );
  }

  // Offline Alert Banner
  return (
    <aside
      aria-live="assertive"
      role="alert"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-amber-950/95 text-amber-100 border border-amber-500/50 shadow-2xl text-xs font-semibold backdrop-blur-md max-w-[92vw] animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <WifiOff size={15} className="text-amber-400 shrink-0 animate-pulse" />
      <span className="truncate">Offline Mode: You are disconnected from the network</span>
      <button
        onClick={() => window.location.reload()}
        className="ml-1 p-1 hover:bg-white/10 rounded-full text-amber-300 hover:text-white transition-colors cursor-pointer shrink-0"
        title="Refresh and retry connection"
      >
        <RefreshCw size={13} />
      </button>
    </aside>
  );
}
