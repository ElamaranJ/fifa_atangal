import React from 'react';
import { useTournament } from '../../context/TournamentContext';
import { 
  Home, 
  Users, 
  Calendar, 
  TableProperties, 
  Trophy, 
  BarChart2, 
  Settings, 
  Zap,
  Lock,
  Unlock,
  X,
  RotateCcw,
  KeyRound,
  ScrollText
} from 'lucide-react';

interface SidebarProps {
  onOpenAdminLogin: () => void;
  onOpenResetModal?: () => void;
  onOpenChangePassword?: () => void;
  onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  onOpenAdminLogin, 
  onOpenResetModal, 
  onOpenChangePassword,
  onNavigate 
}) => {
  const { activeTab, setActiveTab, isAdmin, logoutAdmin } = useTournament();

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    onNavigate?.();
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'players', label: 'Players', icon: Users },
    { id: 'fixtures', label: 'Fixtures', icon: Calendar },
    { id: 'standings', label: 'Points Table', icon: TableProperties },
    { 
      id: 'goldenboot', 
      label: 'Golden Boot', 
      // Cleat / shoe SVG
      customIcon: (active: boolean) => (
        <svg className={`w-4 h-4 ${active ? 'fill-white' : 'fill-slate-500 group-hover:fill-slate-700'}`} viewBox="0 0 24 24">
          <path d="M21 16.5c-1.5-1-4-1.5-6-1.5s-4 .5-5.5 1.5c-1.5 1-3.5 1.5-5 1.5H3v2c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-3.5zM2 13.5c2 0 4.5-1 6-2.5 1.5-1.5 3.5-2.5 5.5-2.5s3.5.5 5 1.5l1.5-1.5C18.5 7 16 6 13.5 6s-4.5 1-6.5 3C5 11 3.5 12 2 12v1.5z"/>
        </svg>
      ) 
    },
    { id: 'playoffs', label: 'Playoffs', icon: Trophy },
    { id: 'rules', label: 'Rules & Conduct', icon: ScrollText },
    { id: 'statistics', label: 'Statistics', icon: BarChart2 },
  ];

  return (
    <aside className="w-64 sm:w-60 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 shadow-sm select-none">
      
      {/* Top Header Logo & Optional Mobile Close Button */}
      <div>
        <div className="flex items-center justify-between px-5 pt-4 pb-2 sm:pb-4">
          <div 
            onClick={() => handleSelectTab('home')}
            className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
          >
            {/* Gold Trophy Icon */}
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 36 36" className="w-9 h-9 drop-shadow-sm">
                <path fill="#FFD700" d="M11 4h14v12a7 7 0 0 1-14 0V4z"/>
                <path fill="#F59E0B" d="M25 4h-2v12a5 5 0 0 1-5 5 5 5 0 0 0 5-5V4z"/>
                <path fill="#FBBF24" d="M10 6H6a3 3 0 0 0-3 3v2a6 6 0 0 0 6 6h1V6zm16 0h4a3 3 0 0 1 3 3v2a6 6 0 0 1-6 6h-1V6z"/>
                <path fill="#F59E0B" d="M9 15A4 4 0 0 1 5 11V9a1 1 0 0 1 1-1h3v7zm18 0h3a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-3v7z"/>
                <path fill="#EAB308" d="M16 23h4v4h-4z"/>
                <path fill="#D97706" d="M13 27h10v2a2 2 0 0 1-2 2H15a2 2 0 0 1-2-2v-2z"/>
              </svg>
            </div>

            <div>
              <h1 className="font-display font-extrabold text-lg tracking-tight text-slate-900 leading-none">
                eFOOTBALL
              </h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1">
                CHAMPIONSHIP 2026
              </span>
            </div>
          </div>

          {/* Close button inside mobile drawer */}
          {onNavigate && (
            <button
              onClick={onNavigate}
              aria-label="Close menu"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="px-3.5 space-y-1 mt-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 sm:py-2.5 rounded-xl font-medium text-sm transition-all group min-h-[44px] ${
                  isActive
                    ? 'bg-[#1d6bf3] text-white font-bold shadow-blue-glow'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                {item.customIcon ? (
                  item.customIcon(isActive)
                ) : Icon ? (
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}`} />
                ) : null}
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-2 pb-1">
            <div className="h-[1px] bg-slate-200/80 mx-2" />
          </div>

          {/* Admin Dashboard link (Password protected) */}
          <button
            onClick={() => {
              if (!isAdmin) {
                onNavigate?.();
                onOpenAdminLogin();
              } else {
                handleSelectTab('admin');
              }
            }}
            className={`w-full flex items-center justify-between px-4 py-3 sm:py-2.5 rounded-xl font-medium text-sm transition-all group min-h-[44px] ${
              isAdmin && activeTab === 'admin'
                ? 'bg-[#1d6bf3] text-white font-bold shadow-blue-glow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              {isAdmin ? (
                <Settings className={`w-4 h-4 ${activeTab === 'admin' ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}`} />
              ) : (
                <Lock className="w-4 h-4 text-amber-500" />
              )}
              <span className="truncate">{isAdmin ? 'Admin Dashboard' : 'Admin Login'}</span>
            </div>
            {!isAdmin && (
              <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                PIN
              </span>
            )}
          </button>

          {/* Admin actions when logged in */}
          {isAdmin && (
            <>
              {onOpenChangePassword && (
                <button
                  onClick={() => {
                    onNavigate?.();
                    onOpenChangePassword();
                  }}
                  className="w-full flex items-center gap-3.5 px-4 py-3 sm:py-2.5 rounded-xl font-medium text-sm transition-all group min-h-[44px] text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 mt-1"
                >
                  <KeyRound className="w-4 h-4 text-amber-500" />
                  <span>Change Password</span>
                </button>
              )}

              <button
                onClick={() => {
                  onNavigate?.();
                  onOpenResetModal?.();
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 sm:py-2.5 rounded-xl font-medium text-sm transition-all group min-h-[44px] text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 mt-1"
              >
                <RotateCcw className="w-4 h-4 text-rose-500" />
                <span>Reset Tournament</span>
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Bottom Decoration: "More Than a Game" + Stadium Lights SVG watermark */}
      <div className="p-5 relative overflow-hidden">
        {/* Subtle SVG Stadium Light Pole in Background */}
        <div className="absolute right-1 bottom-1 opacity-10 pointer-events-none">
          <svg width="110" height="130" viewBox="0 0 100 120" fill="none" stroke="#0f172a" strokeWidth="2">
            <line x1="70" y1="120" x2="60" y2="30" />
            <line x1="80" y1="120" x2="68" y2="30" />
            <rect x="40" y="10" width="48" height="20" rx="3" fill="#cbd5e1" />
            <circle cx="48" cy="16" r="3" fill="#64748b" />
            <circle cx="56" cy="16" r="3" fill="#64748b" />
            <circle cx="64" cy="16" r="3" fill="#64748b" />
            <circle cx="72" cy="16" r="3" fill="#64748b" />
            <circle cx="80" cy="16" r="3" fill="#64748b" />
            <circle cx="48" cy="24" r="3" fill="#64748b" />
            <circle cx="56" cy="24" r="3" fill="#64748b" />
            <circle cx="64" cy="24" r="3" fill="#64748b" />
            <circle cx="72" cy="24" r="3" fill="#64748b" />
            <circle cx="80" cy="24" r="3" fill="#64748b" />
          </svg>
        </div>

        <div className="relative z-10">
          <h4 className="font-display font-black italic text-lg text-[#0f294a] leading-tight">
            More
          </h4>
          <h4 className="font-display font-black italic text-lg text-[#1d6bf3] leading-tight mb-2">
            Than a Game
          </h4>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            PLAY | COMPETE | BE A CHAMPION
          </p>
        </div>
      </div>

    </aside>
  );
};
