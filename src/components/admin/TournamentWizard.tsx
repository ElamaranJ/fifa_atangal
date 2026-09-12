import React, { useState, useRef } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { Player, GroupFormat, QualificationMethod } from '../../types/tournament';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { compressImage } from '../../services/storage';
import { calculateTheoreticalMatches } from '../../services/fixtureGenerator';
import { 
  Users, 
  Settings, 
  Layers, 
  Shuffle, 
  Calendar, 
  Check, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Upload, 
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

interface TournamentWizardProps {
  onOpenResetModal: () => void;
}

export const TournamentWizard: React.FC<TournamentWizardProps> = ({ onOpenResetModal }) => {
  const { 
    tournament, 
    players, 
    matches, 
    updateTournament, 
    setPlayersList, 
    generateTournamentFixtures, 
    startPlayoffs, 
    setActiveTab 
  } = useTournament();

  const [activeStep, setActiveStep] = useState<number>(1);
  const [numPlayersInput, setNumPlayersInput] = useState<number>(players.length || 8);
  const [tournamentName, setTournamentName] = useState(tournament.tournament_name);
  const [winPoints, setWinPoints] = useState(tournament.win_points);
  const [drawPoints, setDrawPoints] = useState(tournament.draw_points);
  const [lossPoints, setLossPoints] = useState(tournament.loss_points);

  const [groupFormat, setGroupFormat] = useState<GroupFormat>(tournament.group_format);
  const [sameGroupFreq, setSameGroupFreq] = useState<number>(tournament.same_group_match_frequency);
  const [otherGroupFreq, setOtherGroupFreq] = useState<number>(tournament.other_group_match_frequency);
  const [qualMethod, setQualMethod] = useState<QualificationMethod>(tournament.qualification_method);
  const [customA, setCustomA] = useState<number>(tournament.custom_qualify_group_a ?? 2);
  const [customB, setCustomB] = useState<number>(tournament.custom_qualify_group_b ?? 2);

  const [wizardPlayers, setWizardPlayers] = useState<Player[]>([...players]);
  const [statusAlert, setStatusAlert] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [confirmRegenerateModal, setConfirmRegenerateModal] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPlayerId, setUploadingPlayerId] = useState<string | null>(null);

  // Synchronize dynamic player list based on number input
  const handleGeneratePlayerInputs = (count: number) => {
    const target = Math.max(2, Math.min(64, count));
    setNumPlayersInput(target);

    const updated = [...wizardPlayers];
    if (updated.length < target) {
      for (let i = updated.length; i < target; i++) {
        const id = `p_${Date.now()}_${i + 1}`;
        updated.push({
          id,
          tournament_id: tournament.id,
          player_name: `Player ${String.fromCharCode(65 + (i % 26))}${i >= 26 ? Math.floor(i / 26) : ''}`,
          group_name: groupFormat === 'TWO_GROUPS' ? (i % 2 === 0 ? 'Group A' : 'Group B') : undefined,
          created_at: new Date().toISOString(),
        });
      }
    } else if (updated.length > target) {
      updated.splice(target);
    }
    setWizardPlayers(updated);
  };

  const handleUpdatePlayerName = (id: string, name: string) => {
    setWizardPlayers(prev => prev.map(p => p.id === id ? { ...p, player_name: name } : p));
  };

  const handleToggleGroup = (id: string) => {
    setWizardPlayers(prev => prev.map(p => {
      if (p.id !== id) return p;
      return {
        ...p,
        group_name: p.group_name === 'Group A' ? 'Group B' : 'Group A',
      };
    }));
  };

  const handleAutoDivideGroups = () => {
    setWizardPlayers(prev => prev.map((p, idx) => ({
      ...p,
      group_name: idx % 2 === 0 ? 'Group A' : 'Group B',
    })));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingPlayerId) return;
    try {
      const base64 = await compressImage(file);
      setWizardPlayers(prev => prev.map(p => p.id === uploadingPlayerId ? { ...p, player_photo: base64 } : p));
    } catch {
      // ignore
    } finally {
      setUploadingPlayerId(null);
    }
  };

  // Calculate live theoretical matches
  const groupACount = wizardPlayers.filter(p => p.group_name === 'Group A').length;
  const groupBCount = wizardPlayers.filter(p => p.group_name === 'Group B').length;
  const matchMath = calculateTheoreticalMatches(
    wizardPlayers.length,
    groupFormat,
    sameGroupFreq,
    otherGroupFreq,
    groupACount,
    groupBCount
  );

  // Generation handler
  const executeFixtureGeneration = () => {
    // Save tournament settings
    const updatedTour = {
      ...tournament,
      tournament_name: tournamentName,
      group_format: groupFormat,
      same_group_match_frequency: sameGroupFreq,
      other_group_match_frequency: otherGroupFreq,
      qualification_method: qualMethod,
      custom_qualify_group_a: customA,
      custom_qualify_group_b: customB,
      win_points: winPoints,
      draw_points: drawPoints,
      loss_points: lossPoints,
    };
    updateTournament(updatedTour);
    setPlayersList(wizardPlayers);

    const res = generateTournamentFixtures(updatedTour, wizardPlayers);
    if (res.success) {
      setStatusAlert({ type: 'success', text: 'Fixtures generated successfully! Redirecting to Fixtures...' });
      setTimeout(() => {
        setActiveTab('fixtures');
      }, 1000);
    } else {
      setStatusAlert({ type: 'error', text: res.error || 'Failed to generate fixtures' });
    }
  };

  const handleStartGeneration = () => {
    setStatusAlert(null);
    if (wizardPlayers.length < 2) {
      setStatusAlert({ type: 'error', text: 'At least 2 players are required.' });
      return;
    }
    const empty = wizardPlayers.find(p => !p.player_name.trim());
    if (empty) {
      setStatusAlert({ type: 'error', text: 'Please ensure all players have a name.' });
      return;
    }

    if (groupFormat === 'TWO_GROUPS') {
      if (groupACount === 0 || groupBCount === 0) {
        setStatusAlert({ type: 'error', text: 'Both Group A and Group B must have at least 1 player.' });
        return;
      }
    }

    // If fixtures already exist, prompt confirmation (Requirement 13)
    if (matches.length > 0) {
      setConfirmRegenerateModal(true);
    } else {
      executeFixtureGeneration();
    }
  };

  const steps = [
    { num: 1, title: 'Tournament Info', icon: Settings },
    { num: 2, title: 'Registration', icon: Users },
    { num: 3, title: 'Group Format', icon: Layers },
    { num: 4, title: 'Match Frequency', icon: Shuffle },
    { num: 5, title: 'Review & Generate', icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-pitch-card/80 border border-pitch-border rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-cyan-400" />
            <span>Admin Tournament Setup Wizard</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure player rosters, flexible round frequencies, group splits, and automated fixture schedules
          </p>
        </div>

        <button
          onClick={onOpenResetModal}
          className="px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors self-start md:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Options</span>
        </button>
      </div>

      {/* Step Navigator */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto touch-pan-x [-webkit-overflow-scrolling:touch] bg-pitch-card border border-pitch-border rounded-2xl p-2 sm:p-3 shadow-md">
        {steps.map((stg) => {
          const Icon = stg.icon;
          const isActive = activeStep === stg.num;
          const isDone = activeStep > stg.num;

          return (
            <button
              key={stg.num}
              onClick={() => setActiveStep(stg.num)}
              className={`flex items-center gap-2 px-3 py-2.5 sm:py-2 min-h-[42px] rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan'
                  : isDone
                  ? 'text-emerald-400 hover:bg-pitch-panel'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isActive ? 'bg-slate-950 text-cyan-400' : isDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-pitch-panel'
              }`}>
                {isDone ? '✓' : stg.num}
              </div>
              <span>{stg.title}</span>
            </button>
          );
        })}
      </div>

      {/* Status Alerts */}
      {statusAlert && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center gap-2 ${
          statusAlert.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {statusAlert.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{statusAlert.text}</span>
        </div>
      )}

      {/* Step 1: Tournament Info & Points */}
      {activeStep === 1 && (
        <div className="bg-pitch-card/90 border border-pitch-border rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in">
          <h3 className="font-display text-xl font-bold text-white">Step 1: Tournament Information & Points Rule</h3>

          <div className="space-y-4 max-w-xl">
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                Tournament Name
              </label>
              <input
                type="text"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                placeholder="e.g. eFootball Attangal Championship 2026"
                className="w-full px-4 py-3 bg-pitch-darkest border border-pitch-border rounded-xl text-white text-sm font-semibold focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-3">
                Points System (Default: 3 for Win, 1 for Draw, 0 for Loss)
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-pitch-darkest p-3 rounded-xl border border-pitch-border">
                  <span className="text-[10px] text-slate-400 uppercase block font-mono">Win Points</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={winPoints}
                    onChange={(e) => setWinPoints(parseInt(e.target.value) || 3)}
                    className="w-full mt-1 bg-pitch-panel px-3 py-1.5 rounded-lg text-white font-display font-bold text-center"
                  />
                </div>
                <div className="bg-pitch-darkest p-3 rounded-xl border border-pitch-border">
                  <span className="text-[10px] text-slate-400 uppercase block font-mono">Draw Points</span>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={drawPoints}
                    onChange={(e) => setDrawPoints(parseInt(e.target.value) || 1)}
                    className="w-full mt-1 bg-pitch-panel px-3 py-1.5 rounded-lg text-white font-display font-bold text-center"
                  />
                </div>
                <div className="bg-pitch-darkest p-3 rounded-xl border border-pitch-border">
                  <span className="text-[10px] text-slate-400 uppercase block font-mono">Loss Points</span>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={lossPoints}
                    onChange={(e) => setLossPoints(parseInt(e.target.value) || 0)}
                    className="w-full mt-1 bg-pitch-panel px-3 py-1.5 rounded-lg text-white font-display font-bold text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => setActiveStep(2)}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-glow-cyan"
            >
              <span>Next: Player Registration</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Dynamic Player Registration & Photo Upload */}
      {activeStep === 2 && (
        <div className="bg-pitch-card/90 border border-pitch-border rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-bold text-white">Step 2: Player Registration</h3>
              <p className="text-xs text-slate-400">
                Enter number of competitors and customize names and optional profile pictures
              </p>
            </div>

            {/* Dynamic Player Count Selector */}
            <div className="flex items-center gap-2 bg-pitch-darkest p-2 rounded-2xl border border-pitch-border">
              <span className="text-xs font-semibold text-slate-300">Total Players:</span>
              <input
                type="number"
                min="2"
                max="64"
                value={numPlayersInput}
                onChange={(e) => handleGeneratePlayerInputs(parseInt(e.target.value) || 2)}
                className="w-16 px-2 py-1 text-center font-display font-bold text-sm bg-pitch-panel border border-pitch-border rounded-lg text-cyan-300"
              />
              <button
                onClick={() => handleGeneratePlayerInputs(numPlayersInput)}
                className="px-3 py-1 bg-cyan-500 text-slate-950 text-xs font-bold rounded-lg hover:bg-cyan-400"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Dynamic Input Rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
            {wizardPlayers.map((player, idx) => (
              <div
                key={player.id}
                className="flex items-center gap-3 p-3 bg-pitch-darkest/70 border border-pitch-border rounded-2xl"
              >
                <span className="w-6 text-center font-mono text-xs font-bold text-slate-500">
                  #{idx + 1}
                </span>

                <div className="relative group shrink-0">
                  <PlayerAvatar
                    name={player.player_name}
                    photo={player.player_photo}
                    size="md"
                    glow={!!player.player_photo}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setUploadingPlayerId(player.id);
                      fileInputRef.current?.click();
                    }}
                    title="Upload / Change Photo"
                    className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-cyan-300" />
                  </button>
                </div>

                <input
                  type="text"
                  value={player.player_name}
                  onChange={(e) => handleUpdatePlayerName(player.id, e.target.value)}
                  placeholder={`Player ${idx + 1} name...`}
                  className="flex-1 px-3 py-2 bg-pitch-panel border border-pitch-border rounded-xl text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
                />

                {player.player_photo && (
                  <button
                    onClick={() => setWizardPlayers(prev => prev.map(p => p.id === player.id ? { ...p, player_photo: undefined } : p))}
                    title="Remove Photo"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/png,image/jpeg,image/webp"
            onChange={handlePhotoUpload}
            className="hidden"
          />

          <div className="pt-4 flex items-center justify-between border-t border-pitch-border">
            <button
              onClick={() => setActiveStep(1)}
              className="px-5 py-2.5 rounded-xl border border-pitch-border text-slate-300 hover:bg-pitch-panel text-sm font-semibold"
            >
              Back
            </button>
            <button
              onClick={() => setActiveStep(3)}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-glow-cyan"
            >
              <span>Next: Group Format</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Group Format Selection & Division */}
      {activeStep === 3 && (
        <div className="bg-pitch-card/90 border border-pitch-border rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in">
          <h3 className="font-display text-xl font-bold text-white">Step 3: Tournament Group Organization</h3>
          <p className="text-xs text-slate-400">
            Choose whether all competitors compete in a single league, or split into two groups (Group A & Group B).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setGroupFormat('SINGLE')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                groupFormat === 'SINGLE'
                  ? 'border-cyan-500 bg-cyan-500/10 shadow-glow-cyan'
                  : 'border-pitch-border bg-pitch-darkest hover:border-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-white">All Players in One Group</h4>
                <div className={`w-4 h-4 rounded-full border-2 ${groupFormat === 'SINGLE' ? 'bg-cyan-400 border-cyan-400' : 'border-slate-500'}`} />
              </div>
              <p className="text-xs text-slate-300">
                Single league table where every player competes against everyone else based on the match frequency.
              </p>
            </div>

            <div
              onClick={() => {
                setGroupFormat('TWO_GROUPS');
                handleAutoDivideGroups();
              }}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                groupFormat === 'TWO_GROUPS'
                  ? 'border-cyan-500 bg-cyan-500/10 shadow-glow-cyan'
                  : 'border-pitch-border bg-pitch-darkest hover:border-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-white">Divide Players into Two Groups</h4>
                <div className={`w-4 h-4 rounded-full border-2 ${groupFormat === 'TWO_GROUPS' ? 'bg-cyan-400 border-cyan-400' : 'border-slate-500'}`} />
              </div>
              <p className="text-xs text-slate-300">
                Splits competitors into Group A & Group B. Supports automatic or manual drag/click assignment.
              </p>
            </div>
          </div>

          {/* If Two Groups selected: Show Group Assignment buckets */}
          {groupFormat === 'TWO_GROUPS' && (
            <div className="space-y-4 pt-4 border-t border-pitch-border">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Group Assignment (Click any player tag to switch groups)
                </h4>
                <button
                  onClick={handleAutoDivideGroups}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                >
                  <Shuffle className="w-3.5 h-3.5" /> Auto Balance Groups
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Group A Box */}
                <div className="p-4 bg-pitch-darkest/90 border border-pitch-border rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-display font-bold text-sm text-cyan-400 uppercase">
                      Group A ({groupACount} Players)
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Seed 1</span>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {wizardPlayers.filter(p => p.group_name === 'Group A').map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleToggleGroup(p.id)}
                        className="flex items-center justify-between p-2 rounded-xl bg-pitch-panel border border-pitch-border hover:border-cyan-500/50 cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <PlayerAvatar name={p.player_name} photo={p.player_photo} size="xs" />
                          <span className="font-bold text-white">{p.player_name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-300">Move to B →</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Group B Box */}
                <div className="p-4 bg-pitch-darkest/90 border border-pitch-border rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-display font-bold text-sm text-emerald-400 uppercase">
                      Group B ({groupBCount} Players)
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Seed 2</span>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {wizardPlayers.filter(p => p.group_name === 'Group B').map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleToggleGroup(p.id)}
                        className="flex items-center justify-between p-2 rounded-xl bg-pitch-panel border border-pitch-border hover:border-emerald-500/50 cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <PlayerAvatar name={p.player_name} photo={p.player_photo} size="xs" />
                          <span className="font-bold text-white">{p.player_name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-300">← Move to A</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 flex items-center justify-between border-t border-pitch-border">
            <button
              onClick={() => setActiveStep(2)}
              className="px-5 py-2.5 rounded-xl border border-pitch-border text-slate-300 hover:bg-pitch-panel text-sm font-semibold"
            >
              Back
            </button>
            <button
              onClick={() => setActiveStep(4)}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-glow-cyan"
            >
              <span>Next: Match Frequency</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Flexible Match Frequency Configuration */}
      {activeStep === 4 && (
        <div className="bg-pitch-card/90 border border-pitch-border rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in">
          <h3 className="font-display text-xl font-bold text-white">Step 4: Flexible Match Frequency Configuration</h3>
          <p className="text-xs text-slate-400">
            Define how many times opponents face each other. The system will calculate and preview the exact fixture numbers.
          </p>

          {groupFormat === 'SINGLE' ? (
            <div className="max-w-xl space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Matches Per Opponent (Single / Double / Custom Round Robin)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setSameGroupFreq(freq)}
                      className={`py-3 rounded-xl border font-display font-bold text-sm transition-all ${
                        sameGroupFreq === freq
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-glow-cyan'
                          : 'bg-pitch-darkest text-slate-300 border-pitch-border hover:bg-pitch-panel'
                      }`}
                    >
                      {freq === 1 ? '1 Match (Single)' : freq === 2 ? '2 Matches (Double)' : `${freq} Matches`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Same Group Matches Per Opponent
                </label>
                <select
                  value={sameGroupFreq}
                  onChange={(e) => setSameGroupFreq(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-pitch-darkest border border-pitch-border rounded-xl text-white font-bold text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value={0}>0 Matches (No intra-group)</option>
                  <option value={1}>1 Match (Single Round Robin)</option>
                  <option value={2}>2 Matches (Double Round Robin)</option>
                  <option value={3}>3 Matches (Triple Round Robin)</option>
                  <option value={4}>4 Matches (Custom)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Cross Group Matches Per Opponent
                </label>
                <select
                  value={otherGroupFreq}
                  onChange={(e) => setOtherGroupFreq(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-pitch-darkest border border-pitch-border rounded-xl text-white font-bold text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value={0}>0 Matches (No cross-group)</option>
                  <option value={1}>1 Match against each other group team</option>
                  <option value={2}>2 Matches (Home & Away cross-group)</option>
                  <option value={3}>3 Matches</option>
                </select>
              </div>
            </div>
          )}

          {/* Mathematical Verification Card */}
          <div className="p-5 bg-pitch-darkest/90 border border-pitch-border rounded-2xl space-y-2">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
              📊 Live Fixture Mathematics Preview
            </span>
            <div className="grid grid-cols-3 gap-3 pt-2 text-center">
              <div className="p-3 bg-pitch-panel/60 rounded-xl border border-pitch-border">
                <span className="text-[10px] text-slate-400 block font-mono">Matches / Player</span>
                <span className="text-xl font-display font-bold text-white">
                  {groupFormat === 'SINGLE' 
                    ? (wizardPlayers.length - 1) * sameGroupFreq 
                    : `${(Math.max(0, groupACount - 1)) * sameGroupFreq + (groupBCount * otherGroupFreq)} (avg)`}
                </span>
              </div>
              <div className="p-3 bg-pitch-panel/60 rounded-xl border border-pitch-border">
                <span className="text-[10px] text-slate-400 block font-mono">Same Group Matches</span>
                <span className="text-xl font-display font-bold text-cyan-300">
                  {matchMath.sameGroupTotal}
                </span>
              </div>
              <div className="p-3 bg-pitch-panel/60 rounded-xl border border-pitch-border">
                <span className="text-[10px] text-slate-400 block font-mono">Total Tournament Matches</span>
                <span className="text-2xl font-display font-black text-amber-400">
                  {matchMath.total}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-pitch-border">
            <button
              onClick={() => setActiveStep(3)}
              className="px-5 py-2.5 rounded-xl border border-pitch-border text-slate-300 hover:bg-pitch-panel text-sm font-semibold"
            >
              Back
            </button>
            <button
              onClick={() => setActiveStep(5)}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-glow-cyan"
            >
              <span>Next: Review & Generate</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Review & Fixture Generation */}
      {activeStep === 5 && (
        <div className="bg-pitch-card/90 border border-pitch-border rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in">
          <h3 className="font-display text-xl font-bold text-white">Step 5: Review & Generate Fixtures</h3>
          <p className="text-xs text-slate-400">
            Verify tournament rules before generating the full fixture schedule.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-pitch-darkest/70 border border-pitch-border rounded-2xl space-y-2 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Tournament Configuration</span>
              <div className="flex justify-between py-1 border-b border-pitch-border/50">
                <span className="text-slate-400">Name:</span>
                <span className="font-bold text-white">{tournamentName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-pitch-border/50">
                <span className="text-slate-400">Format:</span>
                <span className="font-bold text-white">{groupFormat === 'SINGLE' ? 'Single Group' : '2 Groups (A & B)'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Total Registered:</span>
                <span className="font-bold text-cyan-300">{wizardPlayers.length} Players</span>
              </div>
            </div>

            <div className="p-4 bg-pitch-darkest/70 border border-pitch-border rounded-2xl space-y-2 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Match Schedule Math</span>
              <div className="flex justify-between py-1 border-b border-pitch-border/50">
                <span className="text-slate-400">Same Group Freq:</span>
                <span className="font-bold text-white">{sameGroupFreq}x</span>
              </div>
              <div className="flex justify-between py-1 border-b border-pitch-border/50">
                <span className="text-slate-400">Cross Group Freq:</span>
                <span className="font-bold text-white">{otherGroupFreq}x</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Total Fixtures to Generate:</span>
                <span className="font-bold text-amber-400 text-sm">{matchMath.total} Matches</span>
              </div>
            </div>
          </div>

          {/* Qualification Options for 2-Group */}
          {groupFormat === 'TWO_GROUPS' && (
            <div className="p-4 bg-pitch-darkest/70 border border-pitch-border rounded-2xl space-y-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Playoff Qualification Rule
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setQualMethod('TWO_GROUPS_TOP_2_EACH')}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                    qualMethod === 'TWO_GROUPS_TOP_2_EACH'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-pitch-panel border-pitch-border text-slate-300'
                  }`}
                >
                  <div>Top 2 from Each Group</div>
                  <span className="text-[10px] text-slate-400 font-normal">A1 vs B2, B1 vs A2</span>
                </button>

                <button
                  type="button"
                  onClick={() => setQualMethod('TWO_GROUPS_OVERALL_TOP_4')}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                    qualMethod === 'TWO_GROUPS_OVERALL_TOP_4'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-pitch-panel border-pitch-border text-slate-300'
                  }`}
                >
                  <div>Combined Overall Top 4</div>
                  <span className="text-[10px] text-slate-400 font-normal">Top 4 points overall</span>
                </button>

                <button
                  type="button"
                  onClick={() => setQualMethod('TWO_GROUPS_CUSTOM')}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                    qualMethod === 'TWO_GROUPS_CUSTOM'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-pitch-panel border-pitch-border text-slate-300'
                  }`}
                >
                  <div>Custom Division</div>
                  <span className="text-[10px] text-slate-400 font-normal">Specify count per group</span>
                </button>
              </div>
            </div>
          )}

          {/* Big Action Button */}
          <div className="pt-4 flex items-center justify-between border-t border-pitch-border">
            <button
              onClick={() => setActiveStep(4)}
              className="px-5 py-2.5 rounded-xl border border-pitch-border text-slate-300 hover:bg-pitch-panel text-sm font-semibold"
            >
              Back
            </button>
            <button
              onClick={handleStartGeneration}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-display font-extrabold text-base hover:brightness-110 shadow-glow-green flex items-center gap-2 transition-all"
            >
              <Calendar className="w-5 h-5 text-slate-950" />
              <span>GENERATE TOURNAMENT FIXTURES</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for regenerating fixtures (Requirement 13) */}
      {confirmRegenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-pitch-card border border-rose-500/40 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto animate-bounce" />
            <h4 className="font-display text-xl font-bold text-white">Regenerate All Fixtures?</h4>
            <p className="text-xs text-rose-200">
              ⚠️ Changing tournament group structure or match frequency will regenerate all fixtures. Existing match scores and statistics will be deleted.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setConfirmRegenerateModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-pitch-border text-slate-300 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setConfirmRegenerateModal(false);
                  executeFixtureGeneration();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-900/50"
              >
                Continue & Regenerate
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
