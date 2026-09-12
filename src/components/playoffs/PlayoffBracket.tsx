import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { Match, Player } from '../../types/tournament';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { 
  Trophy, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Play, 
  Sparkles, 
  ChevronRight, 
  Award,
  Flame,
  AlertCircle
} from 'lucide-react';

interface PlayoffBracketProps {
  onEnterScore: (match: Match) => void;
  onSelectMatch: (match: Match) => void;
}

export const PlayoffBracket: React.FC<PlayoffBracketProps> = ({
  onEnterScore,
  onSelectMatch,
}) => {
  const { 
    playoffs, 
    players, 
    tournament, 
    isAdmin, 
    startPlayoffs, 
    setActiveTab, 
    matches 
  } = useTournament();

  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const getPlayer = (id?: string | null): Player | undefined => {
    if (!id) return undefined;
    return players.find(p => p.id === id);
  };

  const sf1 = playoffs.semi_final_1;
  const sf2 = playoffs.semi_final_2;
  const finalMatch = playoffs.final;
  const thirdPlaceMatch = playoffs.third_place;

  const champion = getPlayer(playoffs.champion_player_id);
  const runnerUp = getPlayer(playoffs.runner_up_player_id);
  const thirdPlace = getPlayer(playoffs.third_place_player_id);

  // Check if playoffs can be launched if not already
  const leagueMatches = matches.filter(m => m.stage === 'LEAGUE');
  const leagueCompleted = leagueMatches.length > 0 && leagueMatches.every(m => m.status === 'COMPLETED');
  const hasPlayoffsStarted = !!(sf1 || sf2);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.15, 1.4));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.15, 0.7));
  const handleFit = () => setZoomLevel(1);

  // Render a bracket match box
  const renderMatchNode = (
    title: string,
    match?: Match,
    isGrandFinal: boolean = false
  ) => {
    if (!match) {
      return (
        <div className="w-64 sm:w-72 bg-pitch-darkest/60 border border-dashed border-pitch-border rounded-2xl p-4 text-center">
          <span className="text-[11px] font-mono text-slate-500 uppercase font-bold block mb-1">
            {title}
          </span>
          <p className="text-xs text-slate-400 italic">Waiting for previous stage to complete...</p>
        </div>
      );
    }

    const p1 = getPlayer(match.player_1);
    const p2 = getPlayer(match.player_2);
    const isCompleted = match.status === 'COMPLETED';
    const s1 = match.player_1_score;
    const s2 = match.player_2_score;

    return (
      <div
        className={`w-64 sm:w-72 bg-pitch-card/95 border rounded-2xl p-4 shadow-xl transition-all relative ${
          isGrandFinal
            ? 'border-amber-500/50 shadow-glow-gold'
            : match.status === 'COMPLETED'
            ? 'border-cyan-500/40'
            : 'border-pitch-border hover:border-cyan-500/30'
        }`}
      >
        {/* Node Header */}
        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2.5 pb-2 border-b border-pitch-border/50">
          <span className={isGrandFinal ? 'text-amber-400 font-extrabold flex items-center gap-1' : 'text-cyan-400'}>
            {isGrandFinal && <Trophy className="w-3.5 h-3.5" />}
            {title}
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[9px] ${isCompleted ? 'bg-emerald-500/20 text-emerald-300' : 'bg-pitch-panel text-slate-400'}`}>
            {match.status}
          </span>
        </div>

        {/* Player 1 Row */}
        <div
          onClick={() => onSelectMatch(match)}
          className={`flex items-center justify-between p-2 rounded-xl mb-1.5 transition-colors cursor-pointer ${
            match.winner_id === match.player_1
              ? 'bg-emerald-500/15 border border-emerald-500/30'
              : 'hover:bg-pitch-panel/50'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <PlayerAvatar
              name={p1?.player_name || 'TBD'}
              photo={p1?.player_photo}
              size="sm"
              glow={match.winner_id === match.player_1}
            />
            <span className={`text-xs truncate ${match.winner_id === match.player_1 ? 'font-black text-emerald-300' : 'font-semibold text-white'}`}>
              {p1?.player_name || 'TBD'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isCompleted && (
              <span className="font-display font-black text-sm text-white px-2 py-0.5 bg-pitch-darkest rounded">
                {s1}
              </span>
            )}
            {match.winner_id === match.player_1 && (
              <span className="text-[10px] text-emerald-400 font-bold ml-1">✓</span>
            )}
          </div>
        </div>

        {/* Player 2 Row */}
        <div
          onClick={() => onSelectMatch(match)}
          className={`flex items-center justify-between p-2 rounded-xl transition-colors cursor-pointer ${
            match.winner_id === match.player_2
              ? 'bg-emerald-500/15 border border-emerald-500/30'
              : 'hover:bg-pitch-panel/50'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <PlayerAvatar
              name={p2?.player_name || 'TBD'}
              photo={p2?.player_photo}
              size="sm"
              glow={match.winner_id === match.player_2}
            />
            <span className={`text-xs truncate ${match.winner_id === match.player_2 ? 'font-black text-emerald-300' : 'font-semibold text-white'}`}>
              {p2?.player_name || 'TBD'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isCompleted && (
              <span className="font-display font-black text-sm text-white px-2 py-0.5 bg-pitch-darkest rounded">
                {s2}
              </span>
            )}
            {match.winner_id === match.player_2 && (
              <span className="text-[10px] text-emerald-400 font-bold ml-1">✓</span>
            )}
          </div>
        </div>

        {/* Penalties indicator if played */}
        {match.penalties_played && (
          <div className="mt-2 text-[10px] font-mono text-center text-amber-400 font-bold bg-amber-500/10 py-1 rounded-lg">
            Penalties: {p1?.player_name} ({match.player_1_penalty_score}) vs {p2?.player_name} ({match.player_2_penalty_score})
          </div>
        )}

        {/* Admin Action Button */}
        {isAdmin && (
          <div className="mt-3 pt-2 border-t border-pitch-border/50 flex justify-end">
            <button
              onClick={() => onEnterScore(match)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                isGrandFinal
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-glow-gold'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-sm'
              }`}
            >
              <Play className="w-3 h-3 fill-slate-950" />
              <span>{isCompleted ? 'Edit Score' : 'Submit Score'}</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header with Zoom & Fit Bracket Controls (Requirement 11) */}
      <div className="bg-pitch-card/80 border border-pitch-border rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span>Playoff Championship Bracket</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Top 4 Knockout Stage • Semi-Finals → Grand Final → Tournament Champion
          </p>
        </div>

        {/* Zoom & Fit controls */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div className="flex items-center bg-pitch-darkest p-1 rounded-xl border border-pitch-border">
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-2 sm:p-1.5 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-pitch-panel transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-mono font-bold text-cyan-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-2 sm:p-1.5 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-pitch-panel transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleFit}
              title="Fit Bracket"
              className="p-2 sm:p-1.5 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-pitch-panel transition-colors border-l border-pitch-border ml-1"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Champion Celebration Button if decided */}
          {champion && (
            <button
              onClick={() => setActiveTab('champion')}
              className="px-4 py-2.5 min-h-[40px] rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-display font-black text-xs hover:brightness-110 shadow-glow-gold flex items-center gap-1.5 transition-all"
            >
              <Trophy className="w-4 h-4" />
              <span>🏆 CELEBRATE CHAMPION</span>
            </button>
          )}
        </div>
      </div>

      {/* If playoffs have not started yet */}
      {!hasPlayoffsStarted && (
        <div className="p-8 sm:p-12 text-center bg-pitch-card/60 border border-pitch-border rounded-3xl space-y-4">
          <Trophy className="w-16 h-16 text-amber-400/50 mx-auto animate-bounce-gentle" />
          <h3 className="font-display text-2xl font-bold text-white">Playoffs Bracket Unlocked Soon</h3>
          <p className="text-sm text-slate-300 max-w-md mx-auto">
            The playoff bracket will generate once all group/league matches are completed.
          </p>

          {isAdmin && (
            <div className="pt-2">
              <button
                onClick={() => {
                  const res = startPlayoffs();
                  if (!res.success && res.error) {
                    alert(res.error);
                  }
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-display font-extrabold text-sm hover:brightness-110 shadow-glow-cyan transition-all"
              >
                INITIALIZE PLAYOFFS NOW (TOP 4)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Bracket Interactive Arena */}
      {hasPlayoffsStarted && (
        <div className="space-y-3">
          {/* Mobile Swipe Cue */}
          <div className="lg:hidden flex items-center justify-center gap-2 py-2 px-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-xs font-mono text-cyan-300">
            <span>👉</span>
            <span>Swipe horizontally to navigate playoff stages</span>
            <span>👈</span>
          </div>

          <div className="bg-pitch-card/90 border border-pitch-border rounded-3xl p-4 sm:p-6 lg:p-10 shadow-2xl overflow-x-auto min-h-[500px] touch-pan-x [-webkit-overflow-scrolling:touch]">
            <div
              className="transition-transform duration-200 origin-top-left flex flex-col lg:flex-row items-center justify-around gap-8 sm:gap-14 py-4 min-w-[740px]"
              style={{ transform: `scale(${zoomLevel})` }}
            >
            {/* Column 1: Semi Finals */}
            <div className="flex flex-col justify-between gap-12 sm:gap-20">
              <div className="relative">
                {renderMatchNode('Semi Final 1', sf1)}
                {/* Visual connecting line */}
                <div className="hidden lg:block absolute -right-8 top-1/2 w-8 h-0.5 bg-gradient-to-r from-cyan-500 to-pitch-border" />
              </div>

              <div className="relative">
                {renderMatchNode('Semi Final 2', sf2)}
                {/* Visual connecting line */}
                <div className="hidden lg:block absolute -right-8 top-1/2 w-8 h-0.5 bg-gradient-to-r from-cyan-500 to-pitch-border" />
              </div>
            </div>

            {/* Middle Column: SVG Connector tree */}
            <div className="hidden lg:flex flex-col items-center justify-center text-slate-500">
              <div className="w-12 h-44 border-r-2 border-t-2 border-b-2 border-cyan-500/40 rounded-r-xl relative">
                <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-6 h-0.5 bg-cyan-500/60" />
              </div>
            </div>

            {/* Column 2: Grand Final */}
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                {renderMatchNode('Grand Championship Final', finalMatch, true)}
                {/* Connector line to trophy */}
                <div className="hidden lg:block absolute -right-8 top-1/2 w-8 h-0.5 bg-gradient-to-r from-amber-500 to-pitch-border" />
              </div>

              {/* Optional 3rd Place Match */}
              {thirdPlaceMatch && (
                <div className="mt-4 pt-4 border-t border-pitch-border/50">
                  {renderMatchNode('3rd Place Playoff', thirdPlaceMatch)}
                </div>
              )}
            </div>

            {/* Column 3: Crowned Champion Spotlight */}
            <div className="flex flex-col items-center text-center">
              <div className="w-64 sm:w-72 bg-gradient-to-b from-amber-500/20 via-pitch-dark to-pitch-darkest border-2 border-amber-500/50 rounded-3xl p-6 shadow-glow-gold relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-bold shadow-lg">
                  <Trophy className="w-9 h-9" />
                </div>

                <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-amber-300 block mb-1">
                  TOURNAMENT CHAMPION
                </span>

                {champion ? (
                  <div className="space-y-3 mt-3">
                    <PlayerAvatar
                      name={champion.player_name}
                      photo={champion.player_photo}
                      size="xl"
                      glow
                      className="mx-auto ring-4 ring-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.5)]"
                    />
                    <h3 className="font-display text-xl font-black text-white">
                      {champion.player_name}
                    </h3>
                    <button
                      onClick={() => setActiveTab('champion')}
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all"
                    >
                      View Champion Hall
                    </button>
                  </div>
                ) : (
                  <div className="py-4 text-xs text-slate-400 italic">
                    Awaiting Grand Final completion
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
      )}

    </div>
  );
};
