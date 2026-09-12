import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { Search, Sun, Moon, Volume2, VolumeX, Lock, Unlock, User, Menu } from 'lucide-react';

interface TopHeaderProps {
  onOpenAdminLogin: () => void;
  onToggleMobileSidebar: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenAdminLogin,
  onToggleMobileSidebar,
  searchQuery,
  onSearchChange,
}) => {
  const { isAdmin, logoutAdmin, isAudioMuted, toggleAudio, setActiveTab } = useTournament();

  return (
    <header className="w-full flex items-center justify-between gap-1.5 sm:gap-4 px-2.5 sm:px-8 py-2.5 sm:py-3.5 select-none relative z-20">
      
      {/* Mobile Sidebar Hamburger Button (Min 44px touch target) */}
      <div className="flex items-center md:hidden shrink-0">
        <button
          onClick={onToggleMobileSidebar}
          aria-label="Open navigation menu"
          className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl bg-white/95 border border-slate-200 text-slate-700 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Center Floating Search Input */}
      <div className="flex-1 min-w-[110px] max-w-md mx-1 sm:mx-auto relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 bg-white/90 backdrop-blur-md border border-white/70 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d6bf3]/30 shadow-sm transition-all sm:hidden"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search players, matches..."
            className="w-full pl-10 pr-4 py-2 bg-white/90 backdrop-blur-md border border-white/70 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d6bf3]/30 shadow-sm transition-all hidden sm:block"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        
        {/* Sound / Mute Toggle (Touch Target min 40px) */}
        <button
          onClick={toggleAudio}
          title={isAudioMuted ? 'Unmute Stadium Audio' : 'Mute Stadium Audio'}
          aria-label="Toggle stadium audio"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-sm hover:scale-105 active:scale-95 transition-all shrink-0"
        >
          {isAudioMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
        </button>

        {/* Admin Mode Pill Button (Responsive text on mobile) */}
        {isAdmin ? (
          <button
            onClick={logoutAdmin}
            title="Click to Switch to Public View"
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-full bg-[#1d6bf3] text-white font-semibold text-xs shadow-blue-glow hover:brightness-110 active:scale-95 transition-all min-h-[38px] sm:min-h-[40px] shrink-0"
          >
            <Unlock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin Mode</span>
            <span className="inline sm:hidden text-[11px] font-bold">Admin</span>
          </button>
        ) : (
          <button
            onClick={onOpenAdminLogin}
            title="Authenticate as Admin"
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-full bg-[#e8f0fe] border border-[#d2e3fc] text-[#1a73e8] hover:bg-[#d2e3fc] font-semibold text-xs transition-all shadow-sm active:scale-95 min-h-[38px] sm:min-h-[40px] shrink-0"
          >
            <Lock className="w-3.5 h-3.5 text-[#1a73e8]" />
            <span className="hidden sm:inline">Admin Mode</span>
            <span className="inline sm:hidden text-[11px] font-bold">Admin</span>
          </button>
        )}

        {/* Profile Circle Icon */}
        <div 
          onClick={() => setActiveTab('players')}
          title="View Player Directory"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 border border-slate-200/80 flex items-center justify-center text-slate-600 shadow-sm cursor-pointer hover:border-[#1d6bf3]/50 active:scale-95 transition-all shrink-0"
        >
          <User className="w-4 h-4 text-slate-600" />
        </div>

      </div>

    </header>
  );
};
