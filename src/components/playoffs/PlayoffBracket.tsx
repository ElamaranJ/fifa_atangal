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
  AlertCircle,
  ShieldAlert,
  ArrowRight,
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
    isAdmin, 
    startPlayoffs, 
    setActiveTab, 
  } = useTournament();

  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const getPlayer = (id?: string | null): Player | undefined => {
    if (!id) return undefined;
    return players.find(p => p.id === id);
  };

  // Support both new IPL structure and legacy fallbacks
  const q1 = playoffs.qualifier_1 || playoffs.semi_final_1;
  const elim = playoffs.eliminator || playoffs.semi_final_2;
  const q2 = playoffs.qualifier_2;
  const finalMatch = playoffs.final;

  const champion = getPlayer(playoffs.champion_player_id);
  const runnerUp = getPlayer(playoffs.runner_up_player_id);
  const thirdPlace = getPlayer(playoffs.third_place_player_id);

  const hasPlayoffsStarted = !!(q1 || elim);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.15, 1.4));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.15, 0.7));
  const handleFit = () => setZoomLevel(1);

  // Render a bracket match node
  const renderMatchNode = (
    title: string,
    badgeText: string,
    subtitle: string,
    match?: Match,
    variant: 'q1' | 'elim' | 'q2' | 'final' = 'q1',
    waitingText: string = 'Waiting for previous stage to complete...',
    pathwayText?: string
  ) => {
    if (!match) {
      return (
        <div className="w-[270px] sm:w-[285px] bg-slate-950/60 backdrop-blur-xl border border-dashed border-white/20 rounded-3xl p-4 sm:p-5 text-center shadow-xl text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/10">
              <span className="text-[11px] font-mono text-cyan-300 uppercase font-black tracking-wider">
                {title}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/10 text-slate-400 border border-white/10">
                PENDING
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mb-3 italic">
              {subtitle}
            </p>
            <div className="py-4 px-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-400 flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-[11px]">{waitingText}</span>
            </div>
          </div>
          {pathwayText && (
            <div className="mt-3 px-2.5 py-1 rounded-xl text-[10px] font-mono border bg-white/5 text-slate-400 border-white/10 text-center">
              {pathwayText}
            </div>
          )}
        </div>
      );
    }

    const p1 = getPlayer(match.player_1);
    const p2 = getPlayer(match.player_2);
    const isCompleted = match.status === 'COMPLETED';
    const s1 = match.player_1_score;
    const s2 = match.player_2_score;
    const isGrandFinal = variant === 'final';

    const getHeaderColor = () => {
      if (variant === 'final') return 'text-amber-300';
      if (variant === 'q1') return 'text-emerald-400';
      if (variant === 'elim') return 'text-rose-400';
      return 'text-cyan-400';
    };

    const getBadgeStyle = () => {
      if (variant === 'final') return 'bg-amber-400/20 text-amber-300 border-amber-400/40';
      if (variant === 'q1') return 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40';
      if (variant === 'elim') return 'bg-rose-400/20 text-rose-300 border-rose-400/40';
      return 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40';
    };

    const getPathwayBadgeStyle = () => {
      if (variant === 'final') return 'bg-amber-500/15 text-amber-300 border-amber-400/30 font-bold';
      if (variant === 'q1') return 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30';
      if (variant === 'elim') return 'bg-rose-500/15 text-rose-300 border-rose-400/30';
      return 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30';
    };

    return (
      <div
        className={`w-[270px] sm:w-[285px] bg-slate-950/60 backdrop-blur-xl border rounded-3xl p-4 sm:p-5 shadow-2xl transition-all relative text-white ${
          isGrandFinal
            ? 'border-amber-400/80 shadow-[0_0_35px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50'
            : variant === 'elim'
            ? 'border-rose-500/40 hover:border-rose-400/70 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
            : match.status === 'COMPLETED'
            ? 'border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
            : 'border-white/20 hover:border-cyan-400/50'
        }`}
      >
        {/* Node Header */}
        <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider mb-2 pb-2 border-b border-white/10">
          <div className="flex items-center gap-1.5 min-w-0">
            {isGrandFinal && <Trophy className="w-4 h-4 text-amber-400 shrink-0" />}
            {variant === 'elim' && <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
            <span className={`font-black truncate ${getHeaderColor()}`}>
              {title}
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${isCompleted ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40' : 'bg-white/10 text-slate-300 border border-white/10'}`}>
            {match.status}
          </span>
        </div>

        {/* Subtitle & Rules Tooltip badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border ${getBadgeStyle()}`}>
            {badgeText}
          </span>
          <span className="text-[10px] text-slate-300 font-medium truncate">
            {subtitle}
          </span>
        </div>

        {/* Player 1 Row */}
        <div
          onClick={() => onSelectMatch(match)}
          className={`flex items-center justify-between p-2.5 rounded-2xl mb-2 transition-all cursor-pointer ${
            match.winner_id === match.player_1
              ? 'bg-emerald-500/25 border border-emerald-400/50 shadow-sm'
              : 'hover:bg-white/10 border border-transparent'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <PlayerAvatar
              name={p1?.player_name || 'TBD'}
              photo={p1?.player_photo}
              size="sm"
              glow={match.winner_id === match.player_1}
            />
            <span className={`text-xs truncate ${match.winner_id === match.player_1 ? 'font-black text-cyan-300' : 'font-semibold text-white'}`}>
              {p1?.player_name || 'TBD'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isCompleted && (
              <span className="font-display font-black text-sm text-white px-2.5 py-0.5 bg-white/15 rounded-lg border border-white/20">
                {s1}
              </span>
            )}
            {match.winner_id === match.player_1 && (
              <span className="text-xs text-cyan-300 font-black px-1">✓</span>
            )}
          </div>
        </div>

        {/* Player 2 Row */}
        <div
          onClick={() => onSelectMatch(match)}
          className={`flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer ${
            match.winner_id === match.player_2
              ? 'bg-emerald-500/25 border border-emerald-400/50 shadow-sm'
              : 'hover:bg-white/10 border border-transparent'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <PlayerAvatar
              name={p2?.player_name || 'TBD'}
              photo={p2?.player_photo}
              size="sm"
              glow={match.winner_id === match.player_2}
            />
            <span className={`text-xs truncate ${match.winner_id === match.player_2 ? 'font-black text-cyan-300' : 'font-semibold text-white'}`}>
              {p2?.player_name || 'TBD'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isCompleted && (
              <span className="font-display font-black text-sm text-white px-2.5 py-0.5 bg-white/15 rounded-lg border border-white/20">
                {s2}
              </span>
            )}
            {match.winner_id === match.player_2 && (
              <span className="text-xs text-cyan-300 font-black px-1">✓</span>
            )}
          </div>
        </div>

        {/* Penalties indicator if played */}
        {match.penalties_played && (
          <div className="mt-2 text-[10px] font-mono text-center text-amber-300 font-bold bg-amber-400/20 border border-amber-400/40 py-1 rounded-xl">
            Shootout: {p1?.player_name} ({match.player_1_penalty_score}) vs {p2?.player_name} ({match.player_2_penalty_score})
          </div>
        )}

        {/* Integrated Pathway Rule Badge */}
        {pathwayText && (
          <div className={`mt-2.5 px-2.5 py-1 rounded-xl text-[10px] font-mono border text-center ${getPathwayBadgeStyle()}`}>
            {pathwayText}
          </div>
        )}

        {/* Admin Action Button */}
        {isAdmin && (
          <div className="mt-2.5 pt-2 border-t border-white/10 flex justify-end">
            <button
              onClick={() => onEnterScore(match)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 ${
                isGrandFinal
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                  : 'bg-[#1d6bf3] hover:bg-[#1557c0] text-white'
              }`}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{isCompleted ? 'Edit Score' : 'Submit Score'}</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header with Zoom & Fit Bracket Controls */}
      <div className="bg-slate-950/45 backdrop-blur-xl border border-white/20 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h2 className="font-display text-2xl sm:text-3xl font-black text-white">
              IPL Playoff Championship Bracket
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 font-medium flex items-center gap-1.5 flex-wrap">
            <span>Qualifier 1 & Eliminator</span>
            <span>→</span>
            <span>Qualifier 2</span>
            <span>→</span>
            <span className="text-amber-300 font-bold">Grand Final</span>
            <span>→</span>
            <span className="text-yellow-400 font-black">🏆 Champion</span>
          </p>
        </div>

        {/* Zoom & Fit controls */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div className="flex items-center bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/15">
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-2 sm:p-1.5 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-mono font-bold text-cyan-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-2 sm:p-1.5 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleFit}
              title="Fit Bracket"
              className="p-2 sm:p-1.5 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors border-l border-white/15 ml-1"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Champion Celebration Button if decided */}
          {champion && (
            <button
              onClick={() => setActiveTab('champion')}
              className="px-4 py-2.5 min-h-[40px] rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-display font-black text-xs hover:brightness-110 shadow-lg flex items-center gap-1.5 transition-all"
            >
              <Trophy className="w-4 h-4" />
              <span>🏆 CELEBRATE CHAMPION</span>
            </button>
          )}
        </div>
      </div>

      {/* If playoffs have not started yet */}
      {!hasPlayoffsStarted && (
        <div className="p-8 sm:p-12 text-center bg-slate-950/45 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl space-y-4 text-white">
          <Trophy className="w-16 h-16 text-amber-400 mx-auto animate-bounce-gentle" />
          <h3 className="font-display text-2xl font-black text-white">Playoffs Bracket Unlocked Soon</h3>
          <p className="text-sm text-slate-300 max-w-md mx-auto font-medium">
            The playoff bracket will unlock automatically once all league matches are completed.
          </p>

          <div className="max-w-md mx-auto bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-slate-300 text-left space-y-2">
            <div className="font-bold text-cyan-300 uppercase tracking-wider text-[11px]">IPL Playoff Structure:</div>
            <div>• <strong className="text-emerald-400">Qualifier 1:</strong> 1st vs 2nd (Winner → Final, Loser → Qualifier 2)</div>
            <div>• <strong className="text-rose-400">Eliminator:</strong> 3rd vs 4th (Winner → Qualifier 2, Loser Out)</div>
            <div>• <strong className="text-amber-300">Qualifier 2:</strong> Q1 Loser vs Eliminator Winner (Winner → Final)</div>
            <div>• <strong className="text-yellow-400">The Final:</strong> Q1 Winner vs Q2 Winner → Champion!</div>
          </div>

          {isAdmin && (
            <div className="pt-2">
              <button
                onClick={() => {
                  const res = startPlayoffs();
                  if (!res.success && res.error) {
                    alert(res.error);
                  }
                }}
                className="px-6 py-3 rounded-xl bg-[#1d6bf3] hover:bg-[#1557c0] text-white font-display font-black text-sm shadow-blue-glow transition-all hover:scale-105 active:scale-95"
              >
                INITIALIZE IPL PLAYOFFS NOW (TOP 4)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Bracket Interactive Arena */}
      {hasPlayoffsStarted && (
        <div className="space-y-3">
          {/* Mobile Swipe Cue */}
          <div className="xl:hidden flex items-center justify-center gap-2 py-2 px-3 bg-cyan-500/10 border border-cyan-400/30 rounded-xl text-xs font-mono text-cyan-300">
            <span>👉</span>
            <span>Scroll horizontally to view all 4 stages: Q1 & Eliminator → Q2 → Final → Champion</span>
            <span>👈</span>
          </div>

          <div className="bg-slate-950/45 backdrop-blur-xl border border-white/20 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl overflow-x-auto min-h-[520px] touch-pan-x [-webkit-overflow-scrolling:touch] text-white">
            <div
              className="transition-transform duration-200 origin-top-left flex flex-row items-center justify-start py-4 min-w-[1240px]"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {/* Column 1: Round 1 (Qualifier 1 & Eliminator) */}
              <div className="flex flex-col justify-center gap-6 sm:gap-7 shrink-0">
                <div className="relative">
                  {renderMatchNode(
                    'Qualifier 1',
                    'Double Chance',
                    '1st vs 2nd',
                    q1,
                    'q1',
                    'Waiting for League rankings to finalize...',
                    'Winner ➔ Final • Loser ➔ Qualifier 2'
                  )}
                </div>

                <div className="relative">
                  {renderMatchNode(
                    'Eliminator',
                    'Knockout Match',
                    '3rd vs 4th',
                    elim,
                    'elim',
                    'Waiting for League rankings to finalize...',
                    'Winner ➔ Qualifier 2 • Loser ➔ Knocked Out'
                  )}
                </div>
              </div>

              {/* Connector 1: Q1 Loser + Eliminator Winner -> Q2 */}
              <div className="flex flex-col justify-center items-center w-12 sm:w-16 self-stretch relative shrink-0">
                <svg
                  className="w-full h-full text-slate-600"
                  viewBox="0 0 64 200"
                  preserveAspectRatio="none"
                  fill="none"
                >
                  {/* Q1 Loser curve down to Q2 */}
                  <path
                    d="M 0 50 C 36 50, 28 100, 64 100"
                    stroke="rgba(34, 211, 238, 0.45)"
                    strokeWidth="2.5"
                    strokeDasharray="4 3"
                  />
                  {/* Eliminator Winner curve up to Q2 */}
                  <path
                    d="M 0 150 C 36 150, 28 100, 64 100"
                    stroke="rgba(34, 211, 238, 0.7)"
                    strokeWidth="2.5"
                  />
                </svg>
                {/* Right pointing arrowhead at midline */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-slate-900 border border-cyan-400/60 rounded-full p-1 text-cyan-300 shadow-md">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Column 2: Round 2 (Qualifier 2) */}
              <div className="flex flex-col justify-center items-center shrink-0">
                <div className="relative">
                  {renderMatchNode(
                    'Qualifier 2',
                    'Second Chance Battle',
                    'Q1 Loser vs Eliminator Winner',
                    q2,
                    'q2',
                    'Awaiting Qualifier 1 (Loser) & Eliminator (Winner)',
                    'Winner ➔ The Final • Loser ➔ 3rd Place'
                  )}
                </div>
              </div>

              {/* Connector 2: Q2 Winner -> Grand Final */}
              <div className="flex flex-col justify-center items-center w-12 sm:w-16 self-stretch relative shrink-0">
                <div className="w-full h-0.5 bg-gradient-to-r from-cyan-400/60 to-amber-400/80 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-slate-900 border border-amber-400/70 rounded-full p-1 text-amber-300 shadow-md">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Column 3: Round 3 (The Grand Championship Final) */}
              <div className="flex flex-col justify-center items-center shrink-0">
                <div className="relative">
                  {renderMatchNode(
                    'Grand Championship Final',
                    'The Title Clash',
                    'Q1 Winner vs Q2 Winner',
                    finalMatch,
                    'final',
                    'Awaiting Qualifier 1 Winner & Qualifier 2 Winner',
                    'Winner is Crowned Champion! 🏆'
                  )}
                </div>
              </div>

              {/* Connector 3: Grand Final Winner -> Champion Showcase */}
              <div className="flex flex-col justify-center items-center w-12 sm:w-16 self-stretch relative shrink-0">
                <div className="w-full h-0.5 bg-gradient-to-r from-amber-400/80 to-yellow-300 shadow-[0_0_14px_rgba(251,191,36,0.7)]" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-slate-900 border border-yellow-400 rounded-full p-1 text-yellow-300 shadow-lg animate-pulse">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Column 4: Tournament Champion Showcase & Podium */}
              <div className="flex flex-col justify-center items-center text-center shrink-0">
                <div className="w-[270px] sm:w-[285px] bg-slate-900/80 backdrop-blur-xl border-2 border-amber-400/80 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden text-white">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-bold shadow-lg">
                    <Trophy className="w-9 h-9" />
                  </div>

                  <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-amber-300 block mb-1">
                    TOURNAMENT CHAMPION
                  </span>

                  {champion ? (
                    <div className="space-y-4 mt-3">
                      <PlayerAvatar
                        name={champion.player_name}
                        photo={champion.player_photo}
                        size="xl"
                        glow
                        className="mx-auto ring-4 ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                      />
                      <div>
                        <h3 className="font-display text-xl font-black text-white">
                          {champion.player_name}
                        </h3>
                        <span className="text-xs text-amber-300 font-mono font-bold">
                          1st Place • Winner of The Final
                        </span>
                      </div>

                      {/* Runner-up and 3rd place badges */}
                      <div className="pt-3 border-t border-white/10 space-y-1.5 text-left text-xs font-mono">
                        {runnerUp && (
                          <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                            <span className="text-slate-300 flex items-center gap-1">
                              <span>🥈</span> Runner-Up:
                            </span>
                            <span className="font-bold text-white truncate max-w-[120px]">
                              {runnerUp.player_name}
                            </span>
                          </div>
                        )}
                        {thirdPlace && (
                          <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                            <span className="text-slate-300 flex items-center gap-1">
                              <span>🥉</span> 3rd Place:
                            </span>
                            <span className="font-bold text-amber-200 truncate max-w-[120px]">
                              {thirdPlace.player_name}
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setActiveTab('champion')}
                        className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all hover:scale-105"
                      >
                        VIEW CHAMPION HALL
                      </button>
                    </div>
                  ) : (
                    <div className="py-6 space-y-3">
                      <p className="text-xs text-slate-400 italic font-medium">
                        Awaiting Grand Final completion...
                      </p>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-300 text-left space-y-1">
                        <div>🥇 <strong>1st:</strong> Winner of Final</div>
                        <div>🥈 <strong>2nd:</strong> Loser of Final</div>
                        <div>🥉 <strong>3rd:</strong> Loser of Qualifier 2</div>
                      </div>
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
