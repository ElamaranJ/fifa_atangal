import React from 'react';
import { useTournament } from '../../context/TournamentContext';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { 
  Flame, 
  Trophy, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Activity,
  Layers
} from 'lucide-react';

export const DynamicStats: React.FC = () => {
  const { dynamicStats, setSelectedPlayerForProfile } = useTournament();

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <span>Live Tournament Intelligence</span>
        </h2>
        <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          Auto-updating
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Metric 1: Total Goals */}
        <div className="bg-pitch-card/80 border border-pitch-border rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-cyan-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Goals</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              ⚽
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-display font-black text-white">
            {dynamicStats.total_goals}
          </div>
          <div className="mt-1 text-[11px] text-cyan-300/80 font-mono">
            {dynamicStats.average_goals_per_match} goals / match
          </div>
        </div>

        {/* Metric 2: Matches (Completed vs Remaining) */}
        <div className="bg-pitch-card/80 border border-pitch-border rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Matches</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-display font-black text-white">
            {dynamicStats.completed_matches}
            <span className="text-lg font-normal text-slate-400"> / {dynamicStats.total_matches}</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-300/80 font-mono">
            {dynamicStats.remaining_matches} remaining
          </div>
        </div>

        {/* Metric 3: Highest Scorer / Golden Boot Leader */}
        <div 
          onClick={() => dynamicStats.highest_scorer && setSelectedPlayerForProfile(dynamicStats.highest_scorer)}
          className="bg-pitch-card/80 border border-pitch-border rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-amber-500/50 transition-all shadow-lg cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Highest Scorer</span>
            </span>
            {dynamicStats.is_joint_highest_scorer && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase font-mono">
                JOINT
              </span>
            )}
          </div>
          
          {dynamicStats.highest_scorer ? (
            <div className="flex items-center gap-3">
              <PlayerAvatar
                name={dynamicStats.highest_scorer.player_name}
                photo={dynamicStats.highest_scorer.player_photo}
                size="md"
                glow
              />
              <div className="truncate">
                <h4 className="font-bold text-sm sm:text-base text-white truncate">
                  {dynamicStats.highest_scorer.player_name}
                </h4>
                <span className="text-xs font-display font-black text-amber-400">
                  {dynamicStats.highest_scorer.total_goals} Goals
                </span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400 py-2">No goals scored yet</div>
          )}
        </div>

        {/* Metric 4: Current Table Leader */}
        <div 
          onClick={() => dynamicStats.current_leader && setSelectedPlayerForProfile(dynamicStats.current_leader)}
          className="bg-pitch-card/80 border border-pitch-border rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-cyan-500/50 transition-all shadow-lg cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span>Current Leader</span>
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold uppercase font-mono">
              RANK #1
            </span>
          </div>

          {dynamicStats.current_leader ? (
            <div className="flex items-center gap-3">
              <PlayerAvatar
                name={dynamicStats.current_leader.player_name}
                photo={dynamicStats.current_leader.player_photo}
                size="md"
                glow
              />
              <div className="truncate">
                <h4 className="font-bold text-sm sm:text-base text-white truncate">
                  {dynamicStats.current_leader.player_name}
                </h4>
                <span className="text-xs font-display font-black text-cyan-300">
                  {dynamicStats.current_leader.points} PTS • GD {dynamicStats.current_leader.goal_difference > 0 ? `+${dynamicStats.current_leader.goal_difference}` : dynamicStats.current_leader.goal_difference}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400 py-2">No active leader</div>
          )}
        </div>

      </div>
    </div>
  );
};
