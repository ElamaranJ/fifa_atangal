import React, { useRef } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { 
  X, 
  Trophy, 
  Flame, 
  Percent, 
  ShieldCheck, 
  Upload, 
  TrendingUp, 
  Star,
  Activity,
  Calendar
} from 'lucide-react';
import { compressImage } from '../../services/storage';

export const PlayerProfileModal: React.FC = () => {
  const { 
    selectedPlayerForProfile, 
    setSelectedPlayerForProfile, 
    matches, 
    players, 
    isAdmin, 
    updatePlayer 
  } = useTournament();

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!selectedPlayerForProfile) return null;

  const player = selectedPlayerForProfile;
  const pData = players.find(p => p.id === player.player_id);

  // Player's matches
  const playerMatches = matches.filter(
    m => m.player_1 === player.player_id || m.player_2 === player.player_id
  );

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      updatePlayer(player.player_id, { player_photo: compressed });
    } catch {
      // ignore
    }
  };

  const handleRemovePhoto = () => {
    updatePlayer(player.player_id, { player_photo: undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[90dvh] bg-pitch-card border border-pitch-border rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl overflow-y-auto my-auto">
        <button
          onClick={() => setSelectedPlayerForProfile(null)}
          aria-label="Close"
          className="absolute top-3 right-3 sm:top-5 sm:right-5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-pitch-panel min-w-[36px] min-h-[36px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Player Header Banner */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 pb-5 sm:pb-6 border-b border-pitch-border pr-6 pl-2 sm:px-0">
          <div className="relative group shrink-0">
            <PlayerAvatar
              name={player.player_name}
              photo={pData?.player_photo}
              size="xl"
              glow
              className="sm:hidden ring-4 ring-cyan-500/30"
            />
            <PlayerAvatar
              name={player.player_name}
              photo={pData?.player_photo}
              size="2xl"
              glow
              className="hidden sm:block ring-4 ring-cyan-500/30"
            />
            {isAdmin && (
              <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity cursor-pointer">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[10px] font-bold text-cyan-300 hover:underline"
                >
                  Change Photo
                </button>
                {pData?.player_photo && (
                  <button
                    onClick={handleRemovePhoto}
                    className="text-[9px] font-bold text-rose-300 hover:underline mt-1"
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          <div className="text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h3 className="font-display text-xl sm:text-3xl font-extrabold text-white truncate max-w-full">
                {player.player_name}
              </h3>
              {player.is_qualified && (
                <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 shrink-0">
                  TOP 4 QUALIFIED
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 font-mono mb-2 sm:mb-3">
              {player.group_name || 'League Contender'} • Rank #{player.rank}
            </p>

            {/* Form dots */}
            <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-slate-400 mr-1">Recent Form:</span>
              {player.form.length === 0 ? (
                <span className="text-xs text-slate-400">No matches yet</span>
              ) : (
                player.form.map((res, i) => (
                  <span
                    key={i}
                    className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                      res === 'W'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : res === 'D'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {res}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Performance Rating Badge */}
          <div className="bg-pitch-darkest border border-pitch-border rounded-2xl p-2.5 sm:p-4 text-center shrink-0 w-full sm:w-auto">
            <div className="flex items-center justify-center gap-1 text-amber-400 mb-0.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Rating</span>
            </div>
            <span className="text-2xl sm:text-3xl font-display font-black text-amber-300">
              {player.best_player_rating}
            </span>
            <span className="text-[10px] text-slate-400 block font-mono">out of 10.0</span>
          </div>
        </div>

        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <div className="bg-pitch-darkest/70 border border-pitch-border rounded-xl p-3 text-center">
            <span className="text-[11px] text-slate-400 uppercase font-mono block">Goals Scored</span>
            <span className="text-2xl font-display font-black text-cyan-400">{player.total_goals}</span>
            <span className="text-[10px] text-slate-400 block">{player.goals_per_match} / match</span>
          </div>

          <div className="bg-pitch-darkest/70 border border-pitch-border rounded-xl p-3 text-center">
            <span className="text-[11px] text-slate-400 uppercase font-mono block">Points</span>
            <span className="text-2xl font-display font-black text-emerald-400">{player.points}</span>
            <span className="text-[10px] text-slate-400 block">Rank #{player.rank}</span>
          </div>

          <div className="bg-pitch-darkest/70 border border-pitch-border rounded-xl p-3 text-center">
            <span className="text-[11px] text-slate-400 uppercase font-mono block">Record (W-D-L)</span>
            <span className="text-xl font-display font-bold text-white">
              {player.wins}-{player.draws}-{player.losses}
            </span>
            <span className="text-[10px] text-slate-400 block">{player.matches_played} played</span>
          </div>

          <div className="bg-pitch-darkest/70 border border-pitch-border rounded-xl p-3 text-center">
            <span className="text-[11px] text-slate-400 uppercase font-mono block">Win Rate</span>
            <span className="text-2xl font-display font-black text-amber-400">{player.win_percentage}%</span>
            <span className="text-[10px] text-slate-400 block">GD: {player.goal_difference > 0 ? `+${player.goal_difference}` : player.goal_difference}</span>
          </div>
        </div>

        {/* Golden Boot standing row */}
        <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl mb-6">
          <div className="flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-xs font-bold text-white block">Golden Boot Standings</span>
              <span className="text-[11px] text-slate-400 font-mono">
                {player.is_joint_golden_boot ? 'Joint Rank' : 'Current Rank'}: #{player.golden_boot_rank}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-base font-display font-black text-amber-400">{player.total_goals} Goals</span>
          </div>
        </div>

        {/* Match History list */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Tournament Matches ({playerMatches.length})</span>
          </h4>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {playerMatches.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No fixtures scheduled yet.</p>
            ) : (
              playerMatches.map((m) => {
                const isP1 = m.player_1 === player.player_id;
                const oppId = isP1 ? m.player_2 : m.player_1;
                const opp = players.find(p => p.id === oppId);
                const myScore = isP1 ? m.player_1_score : m.player_2_score;
                const oppScore = isP1 ? m.player_2_score : m.player_1_score;
                const isCompleted = m.status === 'COMPLETED';

                let outcome = 'TBD';
                if (isCompleted && myScore !== null && myScore !== undefined && oppScore !== null && oppScore !== undefined) {
                  if (myScore > oppScore) outcome = 'WIN';
                  else if (oppScore > myScore) outcome = 'LOSS';
                  else outcome = 'DRAW';
                }

                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 bg-pitch-darkest/60 border border-pitch-border rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400">M#{m.match_number}</span>
                      <span className="text-slate-400">vs</span>
                      <span className="font-bold text-white">{opp?.player_name || 'Opponent'}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {isCompleted ? (
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-sm text-white">
                            {myScore} - {oppScore}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              outcome === 'WIN'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : outcome === 'DRAW'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {outcome}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-cyan-400 uppercase">
                          {m.status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
