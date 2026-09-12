import React, { useState, useEffect } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { Trophy, Award, Flame, Star, Sparkles, Medal, RotateCcw, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../../services/soundEffects';

export const ChampionCelebration: React.FC = () => {
  const { 
    playoffs, 
    players, 
    overallStats, 
    goldenBootLeaders, 
    tournament, 
    setActiveTab 
  } = useTournament();

  const championId = playoffs.champion_player_id;
  const champion = players.find(p => p.id === championId);
  const champStats = overallStats.find(s => s.player_id === championId);

  const runnerUp = players.find(p => p.id === playoffs.runner_up_player_id);
  const thirdPlace = players.find(p => p.id === playoffs.third_place_player_id);

  // Best Player award (highest best_player_rating)
  const bestPlayer = [...overallStats].sort((a, b) => b.best_player_rating - a.best_player_rating)[0];

  // Golden Boot award
  const goldenBoot = goldenBootLeaders[0];

  // Suspense reveal states: 'SUSPENSE' -> 'REVEAL'
  const [stage, setStage] = useState<'SUSPENSE' | 'REVEAL'>('SUSPENSE');
  const [suspenseTimer, setSuspenseTimer] = useState<number>(3);

  useEffect(() => {
    if (!champion) return;

    let countdown = 3;
    setStage('SUSPENSE');
    setSuspenseTimer(3);

    const interval = setInterval(() => {
      countdown--;
      setSuspenseTimer(countdown);
      sounds.playSuspensePulse();

      if (countdown <= 0) {
        clearInterval(interval);
        setStage('REVEAL');
        sounds.playFanfare();

        // Massive celebration fireworks & confetti!
        try {
          const count = 200;
          const defaults = { origin: { y: 0.7 } };

          const fire = (particleRatio: number, opts: confetti.Options) => {
            confetti({
              ...defaults,
              ...opts,
              particleCount: Math.floor(count * particleRatio)
            });
          };

          fire(0.25, { spread: 26, startVelocity: 55 });
          fire(0.2, { spread: 60 });
          fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
          fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
          fire(0.1, { spread: 120, startVelocity: 45 });
        } catch {
          // ignore
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [champion]);

  if (!champion) {
    return (
      <div className="p-12 text-center bg-pitch-card border border-pitch-border rounded-3xl space-y-4">
        <Trophy className="w-16 h-16 text-amber-500/40 mx-auto" />
        <h3 className="font-display text-2xl font-bold text-white">Championship In Progress</h3>
        <p className="text-sm text-slate-300 max-w-md mx-auto">
          The Grand Final has not been concluded yet. Once the final match result is submitted, the coronation celebration will commence!
        </p>
        <button
          onClick={() => setActiveTab('playoffs')}
          className="px-6 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-sm shadow-glow-cyan"
        >
          Go to Playoff Bracket
        </button>
      </div>
    );
  }

  // 1. Suspense Animation Stage
  if (stage === 'SUSPENSE') {
    return (
      <div className="min-h-[420px] sm:min-h-[500px] flex flex-col items-center justify-center text-center p-5 sm:p-8 bg-pitch-card border border-pitch-border rounded-2xl sm:rounded-3xl relative overflow-hidden">
        <div className="w-28 h-28 sm:w-40 sm:h-40 rounded-full bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center animate-pulse mb-5 sm:mb-6">
          <Trophy className="w-14 h-14 sm:w-20 sm:h-20 text-amber-400 animate-bounce" />
        </div>

        <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 mb-2">
          FINAL MATCH COMPLETED
        </span>

        <h2 className="font-display text-2xl sm:text-6xl font-black text-white tracking-widest uppercase mb-3 sm:mb-4">
          THE CHAMPION IS...
        </h2>

        <div className="text-5xl sm:text-8xl font-display font-black text-amber-400 animate-ping my-3 sm:my-4">
          {suspenseTimer}
        </div>

        <p className="text-xs text-slate-400 font-mono">
          Revealing the undisputed tournament victor...
        </p>
      </div>
    );
  }

  // 2. Full Reveal & Awards Celebration
  return (
    <div className="space-y-8 sm:space-y-10 animate-in fade-in duration-700">
      
      {/* Hero Champion Card */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-b from-amber-500/25 via-pitch-dark to-pitch-darkest border-2 border-amber-500/60 p-5 sm:p-14 text-center shadow-[0_0_80px_rgba(245,158,11,0.35)]">
        
        {/* Ambient spotlight rays */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 sm:px-5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest mb-5 sm:mb-6 animate-bounce">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          <span>🏆 OFFICIAL TOURNAMENT CHAMPION 🏆</span>
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
        </div>

        {/* Champion Avatar with Trophy Ring */}
        <div className="relative inline-block mb-4 sm:mb-6">
          <PlayerAvatar
            name={champion.player_name}
            photo={champion.player_photo}
            size="2xl"
            glow
            className="w-28 h-28 sm:w-44 sm:h-44 ring-4 sm:ring-8 ring-amber-400/70 shadow-[0_0_60px_rgba(245,158,11,0.7)]"
          />
          <div className="absolute -bottom-2 -right-2 sm:-bottom-3 sm:-right-3 w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-amber-500 via-amber-300 to-yellow-200 border-2 sm:border-4 border-pitch-darkest flex items-center justify-center text-lg sm:text-2xl shadow-xl animate-bounce">
            🏆
          </div>
        </div>

        <h1 className="font-display text-2xl sm:text-6xl font-black text-white tracking-wider uppercase mb-1 sm:mb-2 truncate max-w-full">
          {champion.player_name}
        </h1>

        <p className="font-display text-xs sm:text-xl font-bold gold-gradient-text tracking-widest uppercase mb-6 sm:mb-8">
          eFootball Attangal Grand Champion 2026
        </p>

        {/* Champion Statistics */}
        {champStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-2xl mx-auto mb-6 sm:mb-8">
            <div className="bg-pitch-darkest/80 border border-pitch-border rounded-xl sm:rounded-2xl p-3 sm:p-4">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Total Goals</span>
              <span className="text-2xl sm:text-3xl font-display font-black text-amber-300">{champStats.total_goals}</span>
            </div>
            <div className="bg-pitch-darkest/80 border border-pitch-border rounded-xl sm:rounded-2xl p-3 sm:p-4">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Matches Played</span>
              <span className="text-2xl sm:text-3xl font-display font-black text-white">{champStats.matches_played}</span>
            </div>
            <div className="bg-pitch-darkest/80 border border-pitch-border rounded-xl sm:rounded-2xl p-3 sm:p-4">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Win Rate</span>
              <span className="text-2xl sm:text-3xl font-display font-black text-emerald-400">{champStats.win_percentage}%</span>
            </div>
            <div className="bg-pitch-darkest/80 border border-pitch-border rounded-xl sm:rounded-2xl p-3 sm:p-4">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Tournament Points</span>
              <span className="text-2xl sm:text-3xl font-display font-black text-cyan-300">{champStats.points}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <button
            onClick={() => {
              try {
                confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
              } catch {}
            }}
            className="px-6 py-3 min-h-[44px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-glow-gold flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Celebrate Again 🎉</span>
          </button>
          <button
            onClick={() => setActiveTab('standings')}
            className="px-6 py-3 min-h-[44px] rounded-xl bg-pitch-panel hover:bg-pitch-hover text-white border border-pitch-border font-bold text-sm flex items-center justify-center"
          >
            View Full Standings
          </button>
        </div>
      </div>

      {/* Runner-Up & Tournament Honors / Awards (Section 36) */}
      <div>
        <h3 className="font-display text-2xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
          <Award className="w-6 h-6 text-amber-400" />
          <span>Tournament Awards & Honors</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Award 1: Runner Up */}
          <div className="bg-pitch-card/80 border border-pitch-border rounded-3xl p-6 text-center flex flex-col items-center justify-between shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-slate-300/10 border border-slate-300/30 flex items-center justify-center text-2xl mx-auto mb-3">
                🥈
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-300 block mb-1">
                RUNNER UP
              </span>
              <h4 className="font-display text-xl font-bold text-white mb-4">
                {runnerUp?.player_name || 'Competitor'}
              </h4>
            </div>

            <PlayerAvatar
              name={runnerUp?.player_name || 'Runner Up'}
              photo={runnerUp?.player_photo}
              size="xl"
              className="mb-4"
            />

            <span className="text-xs text-slate-400 font-mono">
              Grand Final Finalist
            </span>
          </div>

          {/* Award 2: Golden Boot Winner */}
          <div className="bg-pitch-card/80 border border-amber-500/40 rounded-3xl p-6 text-center flex flex-col items-center justify-between shadow-glow-gold">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl mx-auto mb-3">
                ⚽
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-300 block mb-1">
                GOLDEN BOOT
              </span>
              <h4 className="font-display text-xl font-bold text-white mb-4">
                {goldenBoot?.player_name || 'Top Scorer'}
              </h4>
            </div>

            <PlayerAvatar
              name={goldenBoot?.player_name || 'Top Scorer'}
              photo={goldenBoot?.player_photo}
              size="xl"
              glow
              className="mb-4 ring-2 ring-amber-400"
            />

            <div className="text-center">
              <span className="text-2xl font-display font-black text-amber-400">
                {goldenBoot?.total_goals} Goals
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                {goldenBoot?.goals_per_match} goals / match
              </span>
            </div>
          </div>

          {/* Award 3: Best Player (Performance Rating) */}
          <div className="bg-pitch-card/80 border border-pitch-border rounded-3xl p-6 text-center flex flex-col items-center justify-between shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-2xl mx-auto mb-3">
                ⭐
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-300 block mb-1">
                BEST PLAYER AWARD
              </span>
              <h4 className="font-display text-xl font-bold text-white mb-4">
                {bestPlayer?.player_name || 'MVP'}
              </h4>
            </div>

            <PlayerAvatar
              name={bestPlayer?.player_name || 'Best Player'}
              photo={bestPlayer?.player_photo}
              size="xl"
              glow
              className="mb-4 ring-2 ring-cyan-400"
            />

            <div className="text-center">
              <span className="text-2xl font-display font-black text-cyan-300">
                Rating {bestPlayer?.best_player_rating}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                Composite rating (0-10.0)
              </span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
