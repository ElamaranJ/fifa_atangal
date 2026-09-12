import React, { useState } from 'react';
import { TournamentProvider, useTournament } from './context/TournamentContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { ReferenceHero } from './components/home/ReferenceHero';
import { StatCardsRow } from './components/home/StatCardsRow';
import { ReferenceBottomCards } from './components/home/ReferenceBottomCards';

// Full Screen Tabs
import { FixtureList } from './components/fixtures/FixtureList';
import { PointsTable } from './components/standings/PointsTable';
import { GoldenBoot } from './components/standings/GoldenBoot';
import { PlayoffBracket } from './components/playoffs/PlayoffBracket';
import { ChampionCelebration } from './components/champion/ChampionCelebration';
import { PlayerDirectory } from './components/players/PlayerDirectory';
import { TournamentWizard } from './components/admin/TournamentWizard';
import { TournamentSummary } from './components/home/TournamentSummary';
import { DynamicStats } from './components/home/DynamicStats';
import { TournamentRules } from './components/rules/TournamentRules';

// Modals
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { ScoreEntryModal } from './components/admin/ScoreEntryModal';
import { MatchDetailsModal } from './components/fixtures/MatchDetailsModal';
import { ResetModal } from './components/admin/ResetModal';
import { ChangePasswordModal } from './components/admin/ChangePasswordModal';
import { ExportImportModal } from './components/admin/ExportImportModal';
import { QualificationModal } from './components/playoffs/QualificationModal';
import { GoldenBootCelebrationModal } from './components/standings/GoldenBootCelebrationModal';
import { PlayerProfileModal } from './components/players/PlayerProfileModal';

import { SuperstarsBackdrop } from './components/layout/SuperstarsBackdrop';
import { Match, PlayerStatistics } from './types/tournament';
import { Lock, KeyRound } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    setSelectedPlayerForProfile, 
    selectedMatchForDetails, 
    setSelectedMatchForDetails,
    isLoading,
    isAdmin,
  } = useTournament();

  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [exportImportOpen, setExportImportOpen] = useState(false);
  const [activeScoreMatch, setActiveScoreMatch] = useState<Match | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenScoreEntry = (match: Match) => {
    setActiveScoreMatch(match);
  };

  const handleSelectMatch = (match: Match) => {
    setSelectedMatchForDetails(match);
  };

  const handleSelectPlayer = (player: PlayerStatistics) => {
    setSelectedPlayerForProfile(player);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-center p-6 space-y-5 select-none">
        <div className="relative flex items-center justify-center">
          <div className="w-20 h-20 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
          <span className="absolute text-2xl animate-bounce">⚽</span>
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h2 className="text-xl font-display font-black text-white tracking-widest uppercase">
            Connecting to Tournament Cloud
          </h2>
          <p className="text-xs text-cyan-400/80 font-mono">
            Synchronizing live fixtures, standings & multi-device results...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#070d1e] overflow-x-hidden font-sans">
      
      {/* 1. Desktop Left Sidebar */}
      <div className="hidden md:block">
        <Sidebar 
          onOpenAdminLogin={() => setAdminLoginOpen(true)}
          onOpenResetModal={() => setResetModalOpen(true)}
          onOpenChangePassword={() => setChangePasswordOpen(true)}
        />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-10 animate-in slide-in-from-left duration-250 shadow-2xl">
            <Sidebar 
              onNavigate={() => setMobileSidebarOpen(false)}
              onOpenAdminLogin={() => {
                setMobileSidebarOpen(false);
                setAdminLoginOpen(true);
              }}
              onOpenResetModal={() => {
                setMobileSidebarOpen(false);
                setResetModalOpen(true);
              }}
              onOpenChangePassword={() => {
                setMobileSidebarOpen(false);
                setChangePasswordOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* 2. Main Content Area */}
      <div className="flex-1 min-h-screen flex flex-col relative overflow-hidden bg-[#070d1e]">
        
        {/* Dedicated Section Wallpapers: Stadium on Home, Messi on Players, Ronaldo on Fixtures, Neymar on Standings */}
        <SuperstarsBackdrop activeTab={activeTab} />

        {/* Floating Top Navigation Header */}
        <TopHeader
          onOpenAdminLogin={() => setAdminLoginOpen(true)}
          onOpenResetModal={() => setResetModalOpen(true)}
          onOpenChangePassword={() => setChangePasswordOpen(true)}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Page Content */}
        <main className="flex-1 relative z-10 flex flex-col justify-between">
          
          {activeTab === 'home' && (
            <div className="space-y-2 animate-in fade-in duration-300">
              {/* Reference Hero Banner */}
              <ReferenceHero />

              {/* 5 Stat Metric Cards */}
              <StatCardsRow />

              {/* 3 Bottom Cards (Upcoming Matches, Points Table, Golden Boot) */}
              <ReferenceBottomCards
                onEnterScore={handleOpenScoreEntry}
                onSelectMatch={handleSelectMatch}
                onSelectPlayer={handleSelectPlayer}
              />
            </div>
          )}

          {activeTab === 'fixtures' && (
            <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-200">
              <FixtureList
                onSelectMatch={handleSelectMatch}
                onEnterScore={handleOpenScoreEntry}
              />
            </div>
          )}

          {activeTab === 'standings' && (
            <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-200">
              <PointsTable onSelectPlayer={handleSelectPlayer} />
            </div>
          )}

          {activeTab === 'goldenboot' && (
            <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-200">
              <GoldenBoot onSelectPlayer={handleSelectPlayer} />
            </div>
          )}

          {activeTab === 'playoffs' && (
            <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-200">
              <PlayoffBracket
                onSelectMatch={handleSelectMatch}
                onEnterScore={handleOpenScoreEntry}
              />
            </div>
          )}

          {activeTab === 'statistics' && (
            <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-200">
              <DynamicStats />
              <TournamentSummary />
            </div>
          )}

          {activeTab === 'rules' && (
            <TournamentRules />
          )}

          {activeTab === 'players' && (
            <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-200">
              <PlayerDirectory onSelectPlayer={handleSelectPlayer} />
            </div>
          )}

          {activeTab === 'champion' && (
            <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-200">
              <ChampionCelebration />
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-200">
              {isAdmin ? (
                <TournamentWizard 
                  onOpenResetModal={() => setResetModalOpen(true)}
                  onOpenChangePassword={() => setChangePasswordOpen(true)}
                />
              ) : (
                <div className="bg-slate-950/60 backdrop-blur-xl border border-white/20 rounded-3xl p-8 sm:p-12 shadow-2xl max-w-md mx-auto text-center space-y-5 text-white my-10">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 mx-auto flex items-center justify-center text-amber-400 shadow-lg">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-black text-white">Admin Authentication Required</h3>
                    <p className="text-xs sm:text-sm text-slate-300 mt-2">
                      Tournament setup, roster configuration, and controls are protected. Please enter your Admin password to proceed.
                    </p>
                  </div>
                  <button
                    onClick={() => setAdminLoginOpen(true)}
                    className="w-full py-3.5 px-6 rounded-xl bg-[#1d6bf3] hover:bg-[#1557c0] text-white font-bold text-sm shadow-blue-glow transition-all flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Enter Admin Password</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </main>

      </div>

      {/* Global Modals */}
      <AdminLoginModal
        isOpen={adminLoginOpen}
        onClose={() => setAdminLoginOpen(false)}
      />

      <ScoreEntryModal
        match={activeScoreMatch}
        isOpen={!!activeScoreMatch}
        onClose={() => setActiveScoreMatch(null)}
      />

      <MatchDetailsModal
        match={selectedMatchForDetails}
        isOpen={!!selectedMatchForDetails}
        onClose={() => setSelectedMatchForDetails(null)}
        onOpenScoreEntry={(m) => {
          setSelectedMatchForDetails(null);
          setActiveScoreMatch(m);
        }}
      />

      {isAdmin && (
        <ResetModal
          isOpen={resetModalOpen}
          onClose={() => setResetModalOpen(false)}
        />
      )}

      {isAdmin && (
        <ChangePasswordModal
          isOpen={changePasswordOpen}
          onClose={() => setChangePasswordOpen(false)}
        />
      )}

      <ExportImportModal
        isOpen={exportImportOpen}
        onClose={() => setExportImportOpen(false)}
      />

      <QualificationModal />
      <GoldenBootCelebrationModal />
      <PlayerProfileModal />

    </div>
  );
};

export default function App() {
  return (
    <TournamentProvider>
      <MainAppContent />
    </TournamentProvider>
  );
}
