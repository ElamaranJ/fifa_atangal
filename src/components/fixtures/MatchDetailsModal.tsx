import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { Match } from '../../types/tournament';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { X, Calendar, Clock, MapPin, Edit3 } from 'lucide-react';

interface MatchDetailsModalProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenScoreEntry: (match: Match) => void;
}

export const MatchDetailsModal: React.FC<MatchDetailsModalProps> = ({
  match,
  isOpen,
  onClose,
  onOpenScoreEntry,
}) => {
  const { players, tournament, isAdmin, updateMatchSchedule } = useTournament();

  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [date, setDate] = useState(match?.date || '');
  const [time, setTime] = useState(match?.time || '');
  const [location, setLocation] = useState(match?.location || '');
  const [status, setStatus] = useState<Match['status']>(match?.status || 'UPCOMING');

  if (!isOpen || !match) return null;

  const p1 = players.find(p => p.id === match.player_1);
  const p2 = players.find(p => p.id === match.player_2);

  const isCompleted = match.status === 'COMPLETED';
  const s1 = match.player_1_score ?? 0;
  const s2 = match.player_2_score ?? 0;
  const winner = match.winner_id ? players.find(p => p.id === match.winner_id) : null;
  const isDraw = isCompleted && s1 === s2 && !match.penalties_played;
  const goalDiff = isCompleted ? Math.abs(s1 - s2) : 0;

  const handleSaveSchedule = () => {
    updateMatchSchedule(match.id, date, time, location, status);
    setIsEditingSchedule(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl max-h-[90dvh] overflow-y-auto my-auto">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 min-w-[36px] min-h-[36px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Tag */}
        <div className="text-center mb-4 sm:mb-6 pr-6 pl-6 sm:px-0">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] sm:text-xs font-mono font-semibold text-[#1d6bf3] mb-2 flex-wrap justify-center">
            <span>Match #{match.match_number}</span>
            <span>•</span>
            <span>{match.group || 'League Stage'}</span>
            <span>•</span>
            <span>Round {match.round}</span>
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Match Center
          </h3>
        </div>

        {/* Versus Score Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-5 items-center gap-1 sm:gap-2">
            
            {/* Player 1 */}
            <div className="col-span-2 flex flex-col items-center text-center min-w-0">
              <PlayerAvatar
                name={p1?.player_name || 'Player 1'}
                photo={p1?.player_photo}
                size="lg"
                className="sm:hidden"
                glow={match.winner_id === match.player_1}
              />
              <PlayerAvatar
                name={p1?.player_name || 'Player 1'}
                photo={p1?.player_photo}
                size="xl"
                className="hidden sm:block"
                glow={match.winner_id === match.player_1}
              />
              <h4 className="mt-2 sm:mt-3 font-bold text-xs sm:text-base text-slate-900 truncate max-w-full px-1">
                {p1?.player_name || 'Player 1'}
              </h4>
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate max-w-full">
                {tournament.group_format === 'TWO_GROUPS' ? (p1?.group_name || 'Group Stage') : 'League Stage'}
              </span>
              {match.winner_id === match.player_1 && (
                <span className="mt-1 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                  WINNER
                </span>
              )}
            </div>

            {/* Middle Score / VS */}
            <div className="col-span-1 flex flex-col items-center justify-center">
              {isCompleted ? (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 sm:gap-2 text-2xl sm:text-3xl font-display font-black text-slate-900">
                    <span className={s1 > s2 ? 'text-emerald-600' : ''}>{s1}</span>
                    <span className="text-slate-400 text-lg sm:text-2xl">-</span>
                    <span className={s2 > s1 ? 'text-emerald-600' : ''}>{s2}</span>
                  </div>
                  {match.penalties_played && (
                    <div className="mt-1 text-[10px] sm:text-[11px] font-mono text-amber-600 font-bold">
                      ({match.player_1_penalty_score}-{match.player_2_penalty_score} pens)
                    </div>
                  )}
                  <span className="inline-block mt-1 sm:mt-2 text-[9px] sm:text-[10px] uppercase font-mono tracking-wider px-1.5 sm:px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">
                    Done
                  </span>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center font-display font-black text-slate-400 text-xs shadow-sm mx-auto">
                    VS
                  </div>
                  <span className="inline-block mt-1 sm:mt-2 text-[9px] sm:text-[10px] uppercase font-mono tracking-wider px-1.5 sm:px-2 py-0.5 rounded bg-blue-100 text-[#1d6bf3] font-bold">
                    {match.status}
                  </span>
                </div>
              )}
            </div>

            {/* Player 2 */}
            <div className="col-span-2 flex flex-col items-center text-center min-w-0">
              <PlayerAvatar
                name={p2?.player_name || 'Player 2'}
                photo={p2?.player_photo}
                size="lg"
                className="sm:hidden"
                glow={match.winner_id === match.player_2}
              />
              <PlayerAvatar
                name={p2?.player_name || 'Player 2'}
                photo={p2?.player_photo}
                size="xl"
                className="hidden sm:block"
                glow={match.winner_id === match.player_2}
              />
              <h4 className="mt-2 sm:mt-3 font-bold text-xs sm:text-base text-slate-900 truncate max-w-full px-1">
                {p2?.player_name || 'Player 2'}
              </h4>
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate max-w-full">
                {tournament.group_format === 'TWO_GROUPS' ? (p2?.group_name || 'Group Stage') : 'League Stage'}
              </span>
              {match.winner_id === match.player_2 && (
                <span className="mt-1 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                  WINNER
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Match Statistics Details */}
        {isCompleted && (
          <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center mb-6">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Outcome</span>
              <span className="text-xs font-bold text-slate-800">
                {isDraw ? 'Draw' : winner ? `${winner.player_name} won` : 'Completed'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Goal Diff</span>
              <span className="text-xs font-bold text-amber-600">
                +{goalDiff} Goals
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Points</span>
              <span className="text-xs font-bold text-emerald-600">
                {isDraw ? `${tournament.draw_points} pts each` : `${tournament.win_points} pts winner`}
              </span>
            </div>
          </div>
        )}

        {/* Schedule info */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Match Schedule & Venue
            </span>
            {isAdmin && !isEditingSchedule && (
              <button
                onClick={() => setIsEditingSchedule(true)}
                className="text-xs font-semibold text-[#1d6bf3] hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
            )}
          </div>

          {!isEditingSchedule ? (
            <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 pt-1 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-[#1d6bf3] shrink-0" />
                <span>{match.date || 'TBD'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <Clock className="w-3.5 h-3.5 text-[#1d6bf3] shrink-0" />
                <span>{match.time || 'TBD'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 truncate">
                <MapPin className="w-3.5 h-3.5 text-[#1d6bf3] shrink-0" />
                <span className="truncate">{match.location || 'Main Arena'}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Date</label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="Sep 15"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs min-h-[38px]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Time</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="6:00 PM"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs min-h-[38px]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingSchedule(false)}
                  className="px-4 py-2 min-h-[40px] rounded-lg bg-slate-200 text-xs text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSchedule}
                  className="px-4 py-2 min-h-[40px] rounded-lg bg-[#1d6bf3] text-white font-bold text-xs shadow-sm"
                >
                  Save Schedule
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 min-h-[44px] rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-all flex items-center justify-center"
          >
            Close
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenScoreEntry(match);
              }}
              className="flex-1 py-3 min-h-[44px] rounded-xl bg-[#1d6bf3] hover:bg-[#1557c0] text-white font-bold text-sm shadow-blue-glow transition-all flex items-center justify-center"
            >
              {isCompleted ? 'Edit Score' : 'Enter Score'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
