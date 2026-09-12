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

// Modals
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { ScoreEntryModal } from './components/admin/ScoreEntryModal';
import { MatchDetailsModal } from './components/fixtures/MatchDetailsModal';
import { ResetModal } from './components/admin/ResetModal';
import { ExportImportModal } from './components/admin/ExportImportModal';
import { QualificationModal } from './components/playoffs/QualificationModal';
import { GoldenBootCelebrationModal } from './components/standings/GoldenBootCelebrationModal';
import { PlayerProfileModal } from './components/players/PlayerProfileModal';

import { Match, PlayerStatistics } from './types/tournament';

const MainAppContent: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    setSelectedPlayerForProfile, 
    selectedMatchForDetails, 
    setSelectedMatchForDetails,
    isLoading,
  } = useTournament();

  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
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
    <div className="min-h-screen flex bg-slate-900 overflow-x-hidden font-sans">
      
      {/* 1. Desktop Left Sidebar */}
      <div className="hidden md:block">
        <Sidebar onOpenAdminLogin={() => setAdminLoginOpen(true)} />
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
            />
          </div>
        </div>
      )}

      {/* 2. Main Content Area */}
      <div className="flex-1 min-h-screen flex flex-col relative overflow-hidden bg-slate-100">
        
        {/* Stadium Photo Hero Backdrop at Top */}
        <div className="absolute top-0 left-0 right-0 h-[480px] sm:h-[520px] stadium-hero-bg z-0 pointer-events-none" />

        {/* Turf Grass Backdrop at Bottom */}
        <div className="absolute top-[400px] sm:top-[440px] left-0 right-0 bottom-0 turf-bg z-0 pointer-events-none" />

        {/* Floating Top Navigation Header */}
        <TopHeader
          onOpenAdminLogin={() => setAdminLoginOpen(true)}
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
              <TournamentWizard onOpenResetModal={() => setResetModalOpen(true)} />
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

      <ResetModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
      />

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
