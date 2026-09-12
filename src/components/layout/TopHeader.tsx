import React from 'react';
import { useTournament } from '../../context/TournamentContext';
import { Search, Sun, VolumeX, Lock, Unlock, User, Menu, RotateCcw, KeyRound } from 'lucide-react';

interface TopHeaderProps {
  onOpenAdminLogin: () => void;
  onOpenResetModal?: () => void;
  onOpenChangePassword?: () => void;
  onToggleMobileSidebar: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenAdminLogin,
  onOpenResetModal,
  onOpenChangePassword,
  onToggleMobileSidebar,
  searchQuery,
  onSearchChange,
}) => {
  const { isAdmin, logoutAdmin, isAudioMuted, toggleAudio, setActiveTab, activeTab } = useTournament();

  const isHome = activeTab === 'home';

  return (
    <header className="w-full flex items-center justify-between gap-1.5 sm:gap-4 px-2.5 sm:px-8 py-2.5 sm:py-3.5 select-none relative z-20">
      
      {/* Mobile Sidebar Hamburger Button (Min 44px touch target) */}
      <div className="flex items-center md:hidden shrink-0">
        <button
          onClick={onToggleMobileSidebar}
          aria-label="Open navigation menu"
          className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl shadow-sm flex items-center justify-center transition-colors bg-white/95 border border-slate-200 text-slate-700 hover:bg-slate-50"
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
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 shadow-sm transition-all sm:hidden bg-white/95 backdrop-blur-md border border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-[#1d6bf3]/30"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search players, matches..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 shadow-sm transition-all hidden sm:block bg-white/95 backdrop-blur-md border border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-[#1d6bf3]/30"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        
        {/* Sound / Mute Toggle */}
        <button
          onClick={toggleAudio}
          title={isAudioMuted ? 'Unmute Stadium Audio' : 'Mute Stadium Audio'}
          aria-label="Toggle stadium audio"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all shrink-0 bg-white/95 border border-slate-200/80 text-slate-600 hover:text-slate-900"
        >
          {isAudioMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
        </button>

        {/* Change Password Option for Admin */}
        {isAdmin && onOpenChangePassword && (
          <button
            onClick={onOpenChangePassword}
            title="Change Admin Password"
            aria-label="Change Admin Password"
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 min-h-[38px] sm:min-h-[40px] shrink-0"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Password</span>
          </button>
        )}

        {/* Reset Option for Admin - ONLY visible when admin is logged in */}
        {isAdmin && onOpenResetModal && (
          <button
            onClick={onOpenResetModal}
            title="Reset Tournament Data"
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 min-h-[38px] sm:min-h-[40px] shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}

        {/* Admin Mode Button */}
        {isAdmin ? (
          <button
            onClick={logoutAdmin}
            title="Logged in as Admin. Click to Logout."
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-full bg-[#1d6bf3] text-white font-semibold text-xs shadow-blue-glow hover:brightness-110 active:scale-95 transition-all min-h-[38px] sm:min-h-[40px] shrink-0"
          >
            <Unlock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin (Logout)</span>
            <span className="inline sm:hidden text-[11px] font-bold">Logout</span>
          </button>
        ) : (
          <button
            onClick={onOpenAdminLogin}
            title="Authenticate as Admin"
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-full font-semibold text-xs transition-all shadow-sm active:scale-95 min-h-[38px] sm:min-h-[40px] shrink-0 bg-[#e8f0fe] border border-[#d2e3fc] text-[#1a73e8] hover:bg-[#d2e3fc]"
          >
            <Lock className="w-3.5 h-3.5 text-[#1a73e8]" />
            <span className="hidden sm:inline">Admin Login</span>
            <span className="inline sm:hidden text-[11px] font-bold">Login</span>
          </button>
        )}

        {/* Profile Circle Icon */}
        <div 
          onClick={() => setActiveTab('players')}
          title="View Player Directory"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-sm cursor-pointer active:scale-95 transition-all shrink-0 bg-white/95 border border-slate-200/80 text-slate-600 hover:border-[#1d6bf3]/50"
        >
          <User className="w-4 h-4" />
        </div>

      </div>
    </header>
  );
};
