import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { Download, Upload, X, Check, AlertCircle, FileJson } from 'lucide-react';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({ isOpen, onClose }) => {
  const { exportTournamentData, importTournamentData, tournament } = useTournament();
  const [importJson, setImportJson] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    const json = exportTournamentData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tournament.tournament_name.toLowerCase().replace(/\s+/g, '_')}_backup.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatusMessage({ type: 'success', text: 'Tournament exported successfully!' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJson(content);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!importJson.trim()) {
      setStatusMessage({ type: 'error', text: 'Please choose a file or paste backup JSON.' });
      return;
    }
    const result = importTournamentData(importJson);
    if (result.success) {
      setStatusMessage({ type: 'success', text: 'Tournament imported successfully!' });
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setStatusMessage({ type: 'error', text: result.error || 'Failed to import backup' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-pitch-card border border-pitch-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl max-h-[90dvh] overflow-y-auto my-auto">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-pitch-panel min-w-[36px] min-h-[36px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 sm:mb-6 pr-8">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <FileJson className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-lg sm:text-xl font-bold text-white truncate">Tournament Backup & Restore</h3>
            <p className="text-xs text-slate-400">Export or restore full tournament database in JSON</p>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="space-y-4 sm:space-y-6">
          {/* Export section */}
          <div className="bg-pitch-darkest/70 border border-pitch-border rounded-xl p-3.5 sm:p-4">
            <h4 className="text-sm font-bold text-white mb-1">Export Tournament</h4>
            <p className="text-xs text-slate-300 mb-3">
              Download complete tournament state (configurations, players, photos, fixtures, results & playoffs) as a single JSON file.
            </p>
            <button
              onClick={handleExport}
              className="w-full py-3 min-h-[44px] rounded-xl bg-pitch-panel hover:bg-pitch-hover border border-pitch-border text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>EXPORT TOURNAMENT (JSON)</span>
            </button>
          </div>

          {/* Import section */}
          <div className="bg-pitch-darkest/70 border border-pitch-border rounded-xl p-3.5 sm:p-4">
            <h4 className="text-sm font-bold text-white mb-1">Import Tournament Backup</h4>
            <p className="text-xs text-slate-300 mb-3">
              Restore an existing tournament file. Data will be validated before replacing current state.
            </p>
            
            <div className="space-y-3">
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/20 file:text-cyan-300 hover:file:bg-cyan-500/30 cursor-pointer"
              />
              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder="Or paste tournament JSON content here..."
                rows={3}
                className="w-full p-2.5 bg-pitch-card border border-pitch-border rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleImport}
                className="w-full py-3 min-h-[44px] rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-sm font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4 text-slate-950" />
                <span>IMPORT & RESTORE TOURNAMENT</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
