import React, { useState, useEffect } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { SeasonRecord } from '../../types/tournament';
import { Trophy, Award, X, Sparkles, Check, CheckCircle2 } from 'lucide-react';

export const SaveToHallOfFameModal: React.FC = () => {
  const { 
    pendingHallOfFameCaptures, 
    popPendingHallOfFameCapture, 
    addSeasonRecord,
    hallOfFame,
    tournament,
  } = useTournament();

  const currentCapture = pendingHallOfFameCaptures[0];

  const [seasonLabel, setSeasonLabel] = useState('');
  const [championName, setChampionName] = useState('');
  const [goldenBootName, setGoldenBootName] = useState('');
  const [goldenBootGoals, setGoldenBootGoals] = useState<number | ''>('');
  const [order, setOrder] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [alreadySaved, setAlreadySaved] = useState(false);

  useEffect(() => {
    if (currentCapture?.defaultData) {
      const d = currentCapture.defaultData;
      setSeasonLabel(d.season_label || 'Season');
      setChampionName(d.champion_name || '');
      setGoldenBootName(d.golden_boot_name || '');
      setGoldenBootGoals(d.golden_boot_goals !== undefined ? d.golden_boot_goals : '');
      setOrder(d.order || 1);
      
      // Check if already in hall of fame
      const exists = hallOfFame.some(r => r.tournament_id === (d.tournament_id || tournament.id));
      setAlreadySaved(exists);
    }
  }, [currentCapture, hallOfFame, tournament.id]);

  if (!currentCapture) return null;

  const handleClose = () => {
    popPendingHallOfFameCapture();
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || alreadySaved) return;

    setIsSaving(true);
    try {
      const d = currentCapture.defaultData;
      const record: Omit<SeasonRecord, 'id' | 'created_at'> = {
        season_label: seasonLabel.trim() || 'Championship Season',
        champion_name: championName.trim() || 'Champion',
        champion_player_id: d.champion_player_id,
        golden_boot_name: goldenBootName.trim() || undefined,
        golden_boot_goals: goldenBootGoals !== '' ? Number(goldenBootGoals) : undefined,
        golden_boot_player_id: d.golden_boot_player_id,
        tournament_id: d.tournament_id || tournament.id,
        order: Number(order) || 1,
      };

      await addSeasonRecord(record);
      popPendingHallOfFameCapture();
    } catch (err) {
      console.error('[HallOfFame] Failed to auto-capture season:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-400/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-[0_20px_60px_rgba(245,158,11,0.25)] space-y-6 text-white relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header with celebration badge */}
        <div className="flex items-start justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Championship Concluded</span>
                </span>
                {pendingHallOfFameCaptures.length > 1 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    Queue: 1 of {pendingHallOfFameCaptures.length}
                  </span>
                )}
              </div>
              <h3 className="font-display text-xl font-black text-white">
                Save to Hall of Fame?
              </h3>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300">
          The Grand Final has concluded! Would you like to immortalize this season in the permanent Hall of Fame? You can review or edit the details below before saving.
        </p>

        {alreadySaved && (
          <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>This tournament has already been saved to the Hall of Fame archive.</span>
          </div>
        )}

        <form onSubmit={handleConfirm} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Season Label
              </label>
              <input
                type="text"
                required
                value={seasonLabel}
                onChange={(e) => setSeasonLabel(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs font-bold text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Chronological Order #
              </label>
              <input
                type="number"
                min="1"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-300 mb-1 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Tournament Champion</span>
            </label>
            <input
              type="text"
              required
              value={championName}
              onChange={(e) => setChampionName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-amber-500/10 border border-amber-400/40 rounded-xl text-xs font-black text-amber-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-cyan-300 mb-1">
                👟 Golden Boot Winner
              </label>
              <input
                type="text"
                value={goldenBootName}
                onChange={(e) => setGoldenBootName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cyan-300 mb-1">
                Goals Scored
              </label>
              <input
                type="number"
                min="0"
                value={goldenBootGoals}
                onChange={(e) => setGoldenBootGoals(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs font-bold text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl border border-white/20 text-slate-300 hover:bg-white/10 text-xs font-semibold transition-colors"
            >
              Skip / Not Now
            </button>

            <button
              type="submit"
              disabled={isSaving || alreadySaved}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : alreadySaved ? 'Already Saved' : 'Save to Hall of Fame'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
