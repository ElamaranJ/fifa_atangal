import React, { useState } from 'react';
import { 
  X, 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Home, 
  GraduationCap,
  Sparkles,
  ShieldAlert,
  Sliders,
  Scale
} from 'lucide-react';
import { useTournament } from '../../context/TournamentContext';
import { TournamentRulesData, TournamentRuleItem, RuleSeverity, FixtureMode } from '../../types/tournament';
import { DEFAULT_TOURNAMENT_RULES } from '../../data/defaultRules';

interface EditRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditRulesModal: React.FC<EditRulesModalProps> = ({ isOpen, onClose }) => {
  const { rules, updateRules, resetRulesToDefault, tournament, updateTournament, players } = useTournament();

  const [activeCategory, setActiveCategory] = useState<'home' | 'college' | 'general' | 'matchQuota'>('home');
  const [formData, setFormData] = useState<TournamentRulesData>(() => JSON.parse(JSON.stringify(rules)));
  const [fixtureMode, setFixtureMode] = useState<FixtureMode>(tournament.fixture_mode || 'FREQUENCY');
  const [matchesPerPlayer, setMatchesPerPlayer] = useState<number>(tournament.matches_per_player || 8);
  const [sameGroupFreq, setSameGroupFreq] = useState<number>(tournament.same_group_match_frequency || 1);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [resetConfirm, setResetConfirm] = useState<boolean>(false);

  // Sync state if modal reopens or rules change
  React.useEffect(() => {
    if (isOpen) {
      setFormData(JSON.parse(JSON.stringify(rules)));
      setFixtureMode(tournament.fixture_mode || 'FREQUENCY');
      setMatchesPerPlayer(tournament.matches_per_player || 8);
      setSameGroupFreq(tournament.same_group_match_frequency || 1);
      setSaveSuccess(false);
      setResetConfirm(false);
    }
  }, [isOpen, rules, tournament]);

  if (!isOpen) return null;

  const currentRuleList = activeCategory === 'home' 
    ? formData.homeRules 
    : activeCategory === 'college' 
      ? formData.collegeRules 
      : [];

  const handleRuleChange = (
    index: number, 
    field: keyof TournamentRuleItem, 
    value: any
  ) => {
    setFormData(prev => {
      const updated = { ...prev };
      if (activeCategory === 'home') {
        const list = [...updated.homeRules];
        list[index] = { ...list[index], [field]: value };
        updated.homeRules = list;
      } else if (activeCategory === 'college') {
        const list = [...updated.collegeRules];
        list[index] = { ...list[index], [field]: value };
        updated.collegeRules = list;
      }
      return updated;
    });
  };

  const handleAddRule = () => {
    const newRule: TournamentRuleItem = {
      id: `${activeCategory}-${Date.now()}`,
      category: activeCategory === 'general' ? 'home' : activeCategory,
      title: 'New Tournament Rule',
      description: 'Enter rule description and dispute criteria here...',
      badge: activeCategory === 'home' ? '🏠 Home Protocol' : '🏫 Campus Protocol',
      severity: 'info',
      isHighlighted: false,
    };

    setFormData(prev => {
      const updated = { ...prev };
      if (activeCategory === 'home') {
        updated.homeRules = [newRule, ...updated.homeRules];
      } else if (activeCategory === 'college') {
        updated.collegeRules = [newRule, ...updated.collegeRules];
      }
      return updated;
    });
  };

  const handleDeleteRule = (index: number) => {
    setFormData(prev => {
      const updated = { ...prev };
      if (activeCategory === 'home') {
        updated.homeRules = updated.homeRules.filter((_, i) => i !== index);
      } else if (activeCategory === 'college') {
        updated.collegeRules = updated.collegeRules.filter((_, i) => i !== index);
      }
      return updated;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedPayload: TournamentRulesData = {
        ...formData,
        lastUpdated: new Date().toISOString(),
      };
      await updateRules(updatedPayload);
      await updateTournament({
        fixture_mode: fixtureMode,
        matches_per_player: matchesPerPlayer,
        same_group_match_frequency: sameGroupFreq,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to update rules:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    setIsSaving(true);
    try {
      await resetRulesToDefault();
      setFormData(JSON.parse(JSON.stringify(DEFAULT_TOURNAMENT_RULES)));
      setResetConfirm(false);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to reset rules:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      {/* Dark overlay backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative z-10 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Edit Tournament Rules & Regulations
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  Admin Master
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Changes persist to Firestore and sync immediately across all spectator devices.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-6 py-2.5 bg-slate-950/30 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveCategory('home')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeCategory === 'home'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Playing at Home ({formData.homeRules.length})</span>
            </button>

            <button
              onClick={() => setActiveCategory('college')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeCategory === 'college'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Playing at College ({formData.collegeRules.length})</span>
            </button>

            <button
              onClick={() => setActiveCategory('general')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeCategory === 'general'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>General Notice</span>
            </button>

            <button
              onClick={() => setActiveCategory('matchQuota')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeCategory === 'matchQuota'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Match Quota (N Matches)</span>
            </button>
          </div>

          {activeCategory !== 'general' && activeCategory !== 'matchQuota' && (
            <button
              onClick={handleAddRule}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Rule</span>
            </button>
          )}
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {saveSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Rules updated successfully and synchronized to all devices!</span>
            </div>
          )}

          {activeCategory === 'matchQuota' ? (
            <div className="space-y-6 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-cyan-400" />
                    Tournament League Match Quota
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure matches per player with automated Home/Away balance.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  {tournament.group_format === 'SINGLE' ? 'Single League Format' : 'Two Groups Format'}
                </span>
              </div>

              {tournament.group_format === 'SINGLE' ? (
                <div className="space-y-5">
                  {/* Mode selector: Frequency Cycles vs Matches Per Player */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Fixture Generation Mode
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setFixtureMode('FREQUENCY')}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          fixtureMode === 'FREQUENCY'
                            ? 'bg-blue-600/20 border-blue-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">Standard Frequency Cycles</span>
                          <input
                            type="radio"
                            name="fixture_mode_rules"
                            checked={fixtureMode === 'FREQUENCY'}
                            onChange={() => setFixtureMode('FREQUENCY')}
                            className="text-blue-600"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Full round-robin multiplier (e.g. 1x, 2x, 3x against every opponent).
                        </p>
                      </div>

                      <div
                        onClick={() => setFixtureMode('MATCH_COUNT')}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          fixtureMode === 'MATCH_COUNT'
                            ? 'bg-blue-600/20 border-blue-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">Fixed Matches per Player (N)</span>
                          <input
                            type="radio"
                            name="fixture_mode_rules"
                            checked={fixtureMode === 'MATCH_COUNT'}
                            onChange={() => setFixtureMode('MATCH_COUNT')}
                            className="text-blue-600"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Each player gets exactly N matches with balanced Home and Away.
                        </p>
                      </div>
                    </div>
                  </div>

                  {fixtureMode === 'MATCH_COUNT' ? (
                    <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label htmlFor="matches-per-player-input" className="text-xs font-bold text-slate-200">
                            Each player plays N matches (Home/Away auto-balanced)
                          </label>
                          <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                            → {Math.ceil(matchesPerPlayer / 2)} Home, {Math.floor(matchesPerPlayer / 2)} Away per player
                          </span>
                        </div>
                        <input
                          id="matches-per-player-input"
                          type="number"
                          min={1}
                          max={50}
                          value={matchesPerPlayer}
                          onChange={(e) => setMatchesPerPlayer(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-center text-xs">
                        <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-mono">Home Target</span>
                          <span className="font-display font-bold text-cyan-400 text-sm">
                            {Math.ceil(matchesPerPlayer / 2)} Home
                          </span>
                        </div>
                        <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-mono">Away Target</span>
                          <span className="font-display font-bold text-purple-400 text-sm">
                            {Math.floor(matchesPerPlayer / 2)} Away
                          </span>
                        </div>
                        <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-mono">Total Fixtures</span>
                          <span className="font-display font-bold text-amber-400 text-sm">
                            {Math.floor((players.length * matchesPerPlayer) / 2)} Matches
                          </span>
                        </div>
                      </div>

                      {players.length > 0 && (players.length * matchesPerPlayer) % 2 !== 0 && (
                        <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg text-xs">
                          ⚠️ For an odd number of players ({players.length}), total match slots ({players.length * matchesPerPlayer}) is odd. Please select an even number of matches so every match has two competitors.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
                      <label className="text-xs font-bold text-slate-200 block">
                        Round Robin Multiplier (Same Group Frequency)
                      </label>
                      <select
                        value={sameGroupFreq}
                        onChange={(e) => setSameGroupFreq(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value={1}>1 Match against each player (Single Round Robin)</option>
                        <option value={2}>2 Matches against each player (Double Round Robin - Home & Away)</option>
                        <option value={3}>3 Matches against each player (Triple Round Robin)</option>
                        <option value={4}>4 Matches against each player (Quadruple)</option>
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2">
                  <p>
                    Fixed "Matches Per Player (N)" is available when the tournament format is set to <strong className="text-white">Single League</strong>.
                  </p>
                  <p>
                    Current tournament format is <strong className="text-cyan-400">Two Groups (A & B)</strong>, where matches are determined by intra-group and cross-group frequency settings.
                  </p>
                </div>
              )}
            </div>
          ) : activeCategory === 'general' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  General Tournament Code of Conduct Notice
                </label>
                <textarea
                  rows={5}
                  value={formData.generalNotice || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, generalNotice: e.target.value }))}
                  placeholder="Official code of conduct statement..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  This statement is displayed at the bottom of the tournament rules page for all contenders.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {currentRuleList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No rules found for this category. Click "Add New Rule" above to create one.
                </div>
              ) : (
                currentRuleList.map((rule, index) => (
                  <div 
                    key={rule.id || index}
                    className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3 relative group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-mono text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                        {index + 1}
                      </span>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                        {/* Title */}
                        <div className="md:col-span-7">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Rule Title
                          </label>
                          <input
                            type="text"
                            value={rule.title}
                            onChange={(e) => handleRuleChange(index, 'title', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700/70 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        {/* Badge */}
                        <div className="md:col-span-3">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Callout Badge
                          </label>
                          <input
                            type="text"
                            value={rule.badge || ''}
                            onChange={(e) => handleRuleChange(index, 'badge', e.target.value)}
                            placeholder="e.g. 🚨 Anti-Cheat"
                            className="w-full bg-slate-900 border border-slate-700/70 rounded-lg px-3 py-1.5 text-xs text-amber-300 focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        {/* Severity */}
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Severity
                          </label>
                          <select
                            value={rule.severity}
                            onChange={(e) => handleRuleChange(index, 'severity', e.target.value as RuleSeverity)}
                            className="w-full bg-slate-900 border border-slate-700/70 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                          >
                            <option value="critical">Critical (Red)</option>
                            <option value="warning">Warning (Amber)</option>
                            <option value="info">Info (Blue)</option>
                            <option value="success">Success (Green)</option>
                          </select>
                        </div>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteRule(index)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete this rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Detailed Rule Description & Dispute Penalty
                      </label>
                      <textarea
                        rows={3}
                        value={rule.description}
                        onChange={(e) => handleRuleChange(index, 'description', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/70 rounded-lg p-2.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed"
                      />
                    </div>

                    {/* Highlight switch */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                      <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!rule.isHighlighted}
                          onChange={(e) => handleRuleChange(index, 'isHighlighted', e.target.checked)}
                          className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                        />
                        <span>Highlight as Critical Protocol (Top Accent Card)</span>
                      </label>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            {!resetConfirm ? (
              <button
                onClick={() => setResetConfirm(true)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 rounded-xl transition-colors border border-amber-500/30"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Official Defaults</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-300 font-medium">Revert all rules to factory default?</span>
                <button
                  onClick={handleResetToDefaults}
                  disabled={isSaving}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Yes, Revert
                </button>
                <button
                  onClick={() => setResetConfirm(false)}
                  className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Rules...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save All Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
