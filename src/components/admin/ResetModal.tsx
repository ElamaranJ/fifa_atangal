import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { AlertTriangle, X, RotateCcw, ShieldAlert, Check } from 'lucide-react';

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResetModal: React.FC<ResetModalProps> = ({ isOpen, onClose }) => {
  const { resetTournament } = useTournament();
  const [selectedMode, setSelectedMode] = useState<'RESULTS_ONLY' | 'FIXTURES_AND_RESULTS' | 'COMPLETE'>('RESULTS_ONLY');
  const [confirmStep, setConfirmStep] = useState(false);

  if (!isOpen) return null;

  const handleExecuteReset = () => {
    resetTournament(selectedMode);
    setConfirmStep(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-pitch-card border border-rose-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl max-h-[90dvh] overflow-y-auto my-auto">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-pitch-panel min-w-[36px] min-h-[36px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 sm:mb-5 pr-8">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-lg sm:text-xl font-bold text-white truncate">Reset Tournament Data</h3>
            <p className="text-xs text-slate-400">Select reset scope and confirm destructive actions</p>
          </div>
        </div>

        {!confirmStep ? (
          <div className="space-y-4">
            <div className="space-y-2.5">
              {/* Option 1 */}
              <label
                onClick={() => setSelectedMode('RESULTS_ONLY')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedMode === 'RESULTS_ONLY'
                    ? 'bg-rose-950/30 border-rose-500/50 ring-1 ring-rose-500/40'
                    : 'bg-pitch-darkest/60 border-pitch-border hover:bg-pitch-panel/40'
                }`}
              >
                <input
                  type="radio"
                  name="resetMode"
                  checked={selectedMode === 'RESULTS_ONLY'}
                  onChange={() => setSelectedMode('RESULTS_ONLY')}
                  className="mt-1 accent-rose-500"
                />
                <div>
                  <h4 className="text-sm font-bold text-white">Reset Results Only</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Preserves registered Players, Groups, and generated Fixtures. Clears all match scores, points table, and statistics.
                  </p>
                </div>
              </label>

              {/* Option 2 */}
              <label
                onClick={() => setSelectedMode('FIXTURES_AND_RESULTS')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedMode === 'FIXTURES_AND_RESULTS'
                    ? 'bg-rose-950/30 border-rose-500/50 ring-1 ring-rose-500/40'
                    : 'bg-pitch-darkest/60 border-pitch-border hover:bg-pitch-panel/40'
                }`}
              >
                <input
                  type="radio"
                  name="resetMode"
                  checked={selectedMode === 'FIXTURES_AND_RESULTS'}
                  onChange={() => setSelectedMode('FIXTURES_AND_RESULTS')}
                  className="mt-1 accent-rose-500"
                />
                <div>
                  <h4 className="text-sm font-bold text-white">Reset Fixtures and Results</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Keeps Tournament configuration, Players, and Groups. Deletes all match fixtures, scores, playoffs, and statistics.
                  </p>
                </div>
              </label>

              {/* Option 3 */}
              <label
                onClick={() => setSelectedMode('COMPLETE')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedMode === 'COMPLETE'
                    ? 'bg-rose-950/30 border-rose-500/50 ring-1 ring-rose-500/40'
                    : 'bg-pitch-darkest/60 border-pitch-border hover:bg-pitch-panel/40'
                }`}
              >
                <input
                  type="radio"
                  name="resetMode"
                  checked={selectedMode === 'COMPLETE'}
                  onChange={() => setSelectedMode('COMPLETE')}
                  className="mt-1 accent-rose-500"
                />
                <div>
                  <h4 className="text-sm font-bold text-rose-300">Complete Reset (Factory Reset)</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Wipes everything completely. Starts a fresh empty tournament ready for initial configuration.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 min-h-[44px] rounded-xl border border-pitch-border text-slate-300 hover:bg-pitch-panel text-sm font-semibold transition-all flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setConfirmStep(true)}
                className="flex-1 py-3 min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-900/40 transition-all flex items-center justify-center"
              >
                Continue to Confirm
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 bg-rose-950/50 border border-rose-600/50 rounded-xl space-y-2 text-center">
              <ShieldAlert className="w-8 h-8 text-rose-400 mx-auto animate-bounce" />
              <h4 className="text-base font-bold text-white">⚠️ RESET TOURNAMENT?</h4>
              <p className="text-xs text-rose-200">
                This action cannot be undone. Are you sure you want to proceed with{' '}
                <span className="font-bold underline uppercase">
                  {selectedMode.replace(/_/g, ' ')}
                </span>
                ?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmStep(false)}
                className="flex-1 py-3 min-h-[44px] rounded-xl border border-pitch-border text-slate-300 hover:bg-pitch-panel text-sm font-semibold transition-all flex items-center justify-center"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                className="flex-1 py-3 min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-900/50 flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>CONFIRM RESET</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
