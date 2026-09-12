import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { 
  Trophy, 
  Shield, 
  Lock, 
  Unlock, 
  Volume2, 
  VolumeX, 
  Menu, 
  X, 
  Download, 
  Upload, 
  RotateCcw,
  Sparkles,
  Users,
  Calendar,
  TableProperties,
  Flame,
  LayoutDashboard
} from 'lucide-react';

interface NavbarProps {
  onOpenAdminLogin: () => void;
  onOpenResetModal: () => void;
  onOpenExportImportModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAdminLogin,
  onOpenResetModal,
  onOpenExportImportModal,
}) => {
  const { 
    tournament, 
    isAdmin, 
    logoutAdmin, 
    activeTab, 
    setActiveTab, 
    isAudioMuted, 
    toggleAudio,
    playoffs
  } = useTournament();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Sparkles },
    { id: 'players', label: 'Players', icon: Users },
    { id: 'fixtures', label: 'Fixtures', icon: Calendar },
    { id: 'standings', label: 'Points Table', icon: TableProperties },
    { id: 'goldenboot', label: 'Golden Boot', icon: Flame },
    { id: 'playoffs', label: 'Playoffs', icon: Trophy },
    ...(playoffs.champion_player_id || tournament.status === 'COMPLETED' ? [
      { id: 'champion', label: 'Champion 🏆', icon: Trophy }
    ] : []),
    { id: 'admin', label: 'Admin Dashboard', icon: LayoutDashboard, adminOnlyBadge: true },
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-pitch-dark/90 backdrop-blur-md border-b border-pitch-border shadow-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-emerald-500 to-amber-400 p-[2px] shadow-glow-cyan">
              <div className="w-full h-full bg-pitch-dark rounded-[10px] flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-lg sm:text-xl tracking-wider text-white">
                  eFOOTBALL
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[170px] sm:max-w-xs font-medium">
                {tournament.tournament_name}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-pitch-panel text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)] border border-cyan-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-pitch-panel/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.adminOnlyBadge && (
                    <span className={`text-[9px] px-1 rounded uppercase font-mono ${
                      isAdmin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isAdmin ? 'ACTIVE' : 'LOCK'}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Audio, Export/Import, Reset, Admin Auth */}
          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              onClick={toggleAudio}
              title={isAudioMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
              className="p-2 rounded-lg bg-pitch-panel hover:bg-pitch-hover text-slate-300 hover:text-white border border-pitch-border transition-colors"
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>

            {/* Admin Management quick menu (Export, Import, Reset) */}
            {isAdmin && (
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  onClick={onOpenExportImportModal}
                  title="Backup / Restore Tournament"
                  className="p-2 rounded-lg bg-pitch-panel hover:bg-pitch-hover text-slate-300 hover:text-white border border-pitch-border transition-colors"
                >
                  <Download className="w-4 h-4 text-slate-300" />
                </button>
                <button
                  onClick={onOpenResetModal}
                  title="Reset Tournament"
                  className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Admin Mode Toggle Button */}
            {isAdmin ? (
              <button
                onClick={logoutAdmin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                title="Click to Switch to Public Spectator Mode"
              >
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Admin Mode</span>
                <span className="text-[10px] text-emerald-300/80 font-mono">(Logout)</span>
              </button>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-pitch-panel border border-pitch-border text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-all"
                title="Enter PIN for Tournament Administration"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Admin Login</span>
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-pitch-panel text-slate-300 hover:text-white border border-pitch-border"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-pitch-dark/95 backdrop-blur-xl border-b border-pitch-border px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-300 hover:bg-pitch-panel'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.adminOnlyBadge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isAdmin ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isAdmin ? 'ADMIN' : 'PROTECTED'}
                  </span>
                )}
              </button>
            );
          })}

          {isAdmin && (
            <div className="pt-2 border-t border-pitch-border flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenExportImportModal();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-pitch-panel text-xs text-slate-300"
              >
                <Download className="w-3.5 h-3.5" /> Backup
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenResetModal();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-rose-950/40 text-xs text-rose-300 border border-rose-800/40"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
