import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { SeasonRecord } from '../../types/tournament';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { 
  Trophy, 
  Award, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Save, 
  Calendar, 
  Flame, 
  Sparkles,
  Medal,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

export const HallOfFame: React.FC = () => {
  const { 
    hallOfFame, 
    masterRoster, 
    isAdmin, 
    addSeasonRecord, 
    updateSeasonRecord, 
    deleteSeasonRecord 
  } = useTournament();

  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT' | null>(null);
  const [editingRecord, setEditingRecord] = useState<SeasonRecord | null>(null);

  // Form states
  const [seasonLabel, setSeasonLabel] = useState('');
  const [championName, setChampionName] = useState('');
  const [championPlayerId, setChampionPlayerId] = useState<string>('');
  const [goldenBootName, setGoldenBootName] = useState('');
  const [goldenBootPlayerId, setGoldenBootPlayerId] = useState<string>('');
  const [goldenBootGoals, setGoldenBootGoals] = useState<number | ''>('');
  const [recordOrder, setRecordOrder] = useState<number>(1);
  const [formError, setFormError] = useState<string | null>(null);

  // Helper to resolve player photo by ID or by matching name from master roster
  const resolvePlayerPhoto = (playerId?: string, playerName?: string): string | undefined => {
    if (playerId) {
      const match = masterRoster.find(p => p.id === playerId);
      if (match?.player_photo) return match.player_photo;
    }
    if (playerName) {
      const match = masterRoster.find(
        p => p.player_name.toLowerCase().trim() === playerName.toLowerCase().trim()
      );
      if (match?.player_photo) return match.player_photo;
    }
    return undefined;
  };

  const handleOpenAdd = () => {
    const nextOrder = hallOfFame.length > 0 ? Math.max(...hallOfFame.map(r => r.order || 0)) + 1 : 1;
    setSeasonLabel(`Season ${nextOrder}`);
    setChampionName('');
    setChampionPlayerId('');
    setGoldenBootName('');
    setGoldenBootPlayerId('');
    setGoldenBootGoals('');
    setRecordOrder(nextOrder);
    setFormError(null);
    setModalMode('ADD');
  };

  const handleOpenEdit = (rec: SeasonRecord) => {
    setEditingRecord(rec);
    setSeasonLabel(rec.season_label);
    setChampionName(rec.champion_name);
    setChampionPlayerId(rec.champion_player_id || '');
    setGoldenBootName(rec.golden_boot_name || '');
    setGoldenBootPlayerId(rec.golden_boot_player_id || '');
    setGoldenBootGoals(rec.golden_boot_goals !== undefined ? rec.golden_boot_goals : '');
    setRecordOrder(rec.order || 1);
    setFormError(null);
    setModalMode('EDIT');
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seasonLabel.trim()) {
      setFormError('Season label is required (e.g. Season 6)');
      return;
    }
    if (!championName.trim()) {
      setFormError('Champion name is required');
      return;
    }

    const payload: Omit<SeasonRecord, 'id' | 'created_at'> = {
      season_label: seasonLabel.trim(),
      champion_name: championName.trim(),
      order: Number(recordOrder) || 1,
    };
    if (championPlayerId) payload.champion_player_id = championPlayerId;
    if (goldenBootName.trim()) payload.golden_boot_name = goldenBootName.trim();
    if (goldenBootPlayerId) payload.golden_boot_player_id = goldenBootPlayerId;
    if (goldenBootGoals !== '') payload.golden_boot_goals = Number(goldenBootGoals);

    try {
      if (modalMode === 'ADD') {
        await addSeasonRecord(payload);
      } else if (modalMode === 'EDIT' && editingRecord) {
        await updateSeasonRecord(editingRecord.id, payload);
      }
      setModalMode(null);
      setEditingRecord(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save season record');
    }
  };

  const handleDelete = async (id: string, label: string) => {
    if (window.confirm(`Are you sure you want to delete the record for "${label}"?`)) {
      await deleteSeasonRecord(id);
    }
  };

  // Sort chronological order ascending
  const sortedRecords = [...hallOfFame].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="space-y-6">
      
      {/* Top Header Banner */}
      <div className="bg-slate-950/45 backdrop-blur-xl border border-white/20 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
        <div>
          <div className="flex items-center gap-2.5">
            <Award className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400 shrink-0" />
            <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white">
              Hall of Fame
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1.5 font-medium">
            Chronological archive of past season champions, legendary golden boot top scorers & tournament history
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/25 transition-all self-start md:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Past Season</span>
          </button>
        )}
      </div>

      {/* Hall of Fame Records Grid */}
      {sortedRecords.length === 0 ? (
        <div className="bg-slate-950/45 backdrop-blur-xl border border-white/20 rounded-3xl p-12 text-center text-white space-y-4 shadow-2xl">
          <Trophy className="w-12 h-12 text-amber-400/60 mx-auto" />
          <h3 className="font-display text-xl font-black">No Historical Seasons Recorded</h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
            Complete tournaments or use the Admin controls above to record previous champions and golden boot winners.
          </p>
          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="px-5 py-2.5 rounded-xl bg-[#1d6bf3] text-white font-bold text-xs inline-flex items-center gap-2 mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Record</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedRecords.map((rec) => {
            const champPhoto = resolvePlayerPhoto(rec.champion_player_id, rec.champion_name);
            const bootPhoto = resolvePlayerPhoto(rec.golden_boot_player_id, rec.golden_boot_name);

            return (
              <div
                key={rec.id}
                className="bg-slate-950/45 backdrop-blur-xl border border-white/20 hover:border-amber-400/50 rounded-3xl p-5 sm:p-6 shadow-2xl text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(245,158,11,0.2)] flex flex-col justify-between relative group overflow-hidden"
              >
                {/* Background decorative trophy watermark */}
                <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                  <Trophy className="w-44 h-44 text-amber-300" />
                </div>

                <div>
                  {/* Top Bar: Season label & admin actions */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black tracking-wider uppercase border border-amber-400/30 flex items-center gap-1.5 shadow-xs">
                        <Sparkles className="w-3 h-3" />
                        <span>{rec.season_label}</span>
                      </span>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEdit(rec)}
                          title="Edit season"
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(rec.id, rec.season_label)}
                          title="Delete season"
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Champion Section */}
                  <div className="my-5 p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-yellow-500/5 to-transparent border border-amber-400/30 flex items-center gap-4">
                    <div className="relative shrink-0">
                      <PlayerAvatar
                        name={rec.champion_name}
                        photo={champPhoto}
                        size="lg"
                        glow
                        className="ring-2 ring-amber-400"
                      />
                      <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md">
                        <Trophy className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
                        Tournament Champion
                      </span>
                      <h3 className="font-display text-lg sm:text-xl font-black text-white truncate drop-shadow-xs">
                        {rec.champion_name}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                        <Medal className="w-3 h-3 text-amber-400" />
                        <span>Title Winner</span>
                      </span>
                    </div>
                  </div>

                  {/* Golden Boot Winner Section (if present) */}
                  {rec.golden_boot_name ? (
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <PlayerAvatar
                          name={rec.golden_boot_name}
                          photo={bootPhoto}
                          size="sm"
                          className="ring-1 ring-white/20"
                        />
                        <div className="min-w-0">
                          <span className="text-[9px] font-mono font-bold text-cyan-300 uppercase tracking-wider block flex items-center gap-1">
                            {/* Cleat icon */}
                            <svg className="w-3 h-3 fill-cyan-400" viewBox="0 0 24 24">
                              <path d="M21 16.5c-1.5-1-4-1.5-6-1.5s-4 .5-5.5 1.5c-1.5 1-3.5 1.5-5 1.5H3v2c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-3.5zM2 13.5c2 0 4.5-1 6-2.5 1.5-1.5 3.5-2.5 5.5-2.5s3.5.5 5 1.5l1.5-1.5C18.5 7 16 6 13.5 6s-4.5 1-6.5 3C5 11 3.5 12 2 12v1.5z"/>
                            </svg>
                            <span>Golden Boot Winner</span>
                          </span>
                          <span className="font-bold text-sm text-white truncate block">
                            {rec.golden_boot_name}
                          </span>
                        </div>
                      </div>

                      {rec.golden_boot_goals !== undefined && (
                        <div className="text-right shrink-0 bg-white/10 px-2.5 py-1 rounded-xl border border-white/15">
                          <span className="font-display font-black text-amber-400 text-sm block leading-none">
                            {rec.golden_boot_goals}
                          </span>
                          <span className="text-[8px] uppercase tracking-wider font-mono text-slate-400">
                            Goals
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center text-[11px] text-slate-400 italic">
                      Golden Boot record not archived
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Record #{rec.order || 1}</span>
                  <span className="text-amber-400 font-bold uppercase">Official Archive</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Past Season Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="font-display text-lg font-black text-white">
                  {modalMode === 'ADD' ? 'Add Past Season Record' : 'Edit Season Record'}
                </h3>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Season Label *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Season 6 or Champions League"
                  value={seasonLabel}
                  onChange={(e) => setSeasonLabel(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Chronological Order #
                </label>
                <input
                  type="number"
                  min="1"
                  value={recordOrder}
                  onChange={(e) => setRecordOrder(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Lower numbers display first (e.g. 1 for Season 1, 2 for Season 2)
                </span>
              </div>

              {/* Champion Input & optional master roster pick */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  🏆 Champion Name *
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    required
                    placeholder="Enter champion name..."
                    value={championName}
                    onChange={(e) => {
                      setChampionName(e.target.value);
                      const match = masterRoster.find(
                        p => p.player_name.toLowerCase().trim() === e.target.value.toLowerCase().trim()
                      );
                      setChampionPlayerId(match ? match.id : '');
                    }}
                    className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-bold"
                  />
                  {masterRoster.length > 0 && (
                    <select
                      value={championPlayerId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setChampionPlayerId(id);
                        const match = masterRoster.find(p => p.id === id);
                        if (match) setChampionName(match.player_name);
                      }}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-white/15 rounded-xl text-[11px] text-slate-300"
                    >
                      <option value="">-- Or pick from Global Roster --</option>
                      {masterRoster.map(p => (
                        <option key={p.id} value={p.id}>{p.player_name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Golden Boot Winner Input & goals */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    👟 Golden Boot Winner Name
                  </label>
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      placeholder="e.g. Bharath"
                      value={goldenBootName}
                      onChange={(e) => {
                        setGoldenBootName(e.target.value);
                        const match = masterRoster.find(
                          p => p.player_name.toLowerCase().trim() === e.target.value.toLowerCase().trim()
                        );
                        setGoldenBootPlayerId(match ? match.id : '');
                      }}
                      className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    {masterRoster.length > 0 && (
                      <select
                        value={goldenBootPlayerId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setGoldenBootPlayerId(id);
                          const match = masterRoster.find(p => p.id === id);
                          if (match) setGoldenBootName(match.player_name);
                        }}
                        className="w-full px-3 py-1.5 bg-slate-800 border border-white/15 rounded-xl text-[11px] text-slate-300"
                      >
                        <option value="">-- Or pick from Global Roster --</option>
                        {masterRoster.map(p => (
                          <option key={p.id} value={p.id}>{p.player_name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Golden Boot Goals Scored
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 14"
                    value={goldenBootGoals}
                    onChange={(e) => setGoldenBootGoals(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2.5 rounded-xl border border-white/20 text-slate-300 hover:bg-white/10 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
