import React, { useState, useRef } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { Tournament, Player, GroupFormat, QualificationMethod, MasterPlayer } from '../../types/tournament';
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
  RotateCcw,
  KeyRound,
  Save,
  CheckSquare,
  Square,
  Search,
  UserCheck,
  UserPlus
} from 'lucide-react';

interface TournamentWizardProps {
  onOpenResetModal: () => void;
  onOpenChangePassword?: () => void;
}

export const TournamentWizard: React.FC<TournamentWizardProps> = ({ onOpenResetModal, onOpenChangePassword }) => {
  const { 
    tournament, 
    players, 
    matches, 
    updateTournament, 
    setPlayersList, 
    saveTournamentAndPlayers,
    generateTournamentFixtures, 
    startPlayoffs, 
    setActiveTab,
    isAdmin,
    masterRoster,
    addMasterPlayer,
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

  // New player inline creation states
  const [newPlayerNameInput, setNewPlayerNameInput] = useState('');
  const [newPlayerPhotoPreview, setNewPlayerPhotoPreview] = useState<string | undefined>();
  const [rosterSearchQuery, setRosterSearchQuery] = useState('');
  const newPlayerFileInputRef = useRef<HTMLInputElement>(null);

  const [wizardPlayers, setWizardPlayers] = useState<Player[]>(() => {
    if (players.length > 0) return [...players];
    // If master roster exists, don't create dummy players
    return [];
  });

  // Helper to build a clean Player object without undefined properties (which crash Firestore)
  const buildCleanPlayer = (p: Player, idx: number, format: GroupFormat): Player => {
    const clean: Player = {
      id: p.id,
      tournament_id: tournament.id,
      player_name: p.player_name,
      created_at: p.created_at || new Date().toISOString(),
    };
    if (p.player_photo) clean.player_photo = p.player_photo;
    if (format === 'TWO_GROUPS') {
      clean.group_name = p.group_name || (idx % 2 === 0 ? 'Group A' : 'Group B');
    }
    return clean;
  };

  const [statusAlert, setStatusAlert] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [confirmRegenerateModal, setConfirmRegenerateModal] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPlayerId, setUploadingPlayerId] = useState<string | null>(null);

  const isUserDirty = useRef(false);

  // Sync with context tournament when loaded from database
  React.useEffect(() => {
    if (!isUserDirty.current) {
      if (tournament.tournament_name) setTournamentName(tournament.tournament_name);
      if (tournament.win_points !== undefined) setWinPoints(tournament.win_points);
      if (tournament.draw_points !== undefined) setDrawPoints(tournament.draw_points);
      if (tournament.loss_points !== undefined) setLossPoints(tournament.loss_points);
      if (tournament.group_format) setGroupFormat(tournament.group_format);
      if (tournament.same_group_match_frequency !== undefined) setSameGroupFreq(tournament.same_group_match_frequency);
      if (tournament.other_group_match_frequency !== undefined) setOtherGroupFreq(tournament.other_group_match_frequency);
      if (tournament.qualification_method) setQualMethod(tournament.qualification_method);
      if (tournament.custom_qualify_group_a !== undefined) setCustomA(tournament.custom_qualify_group_a);
      if (tournament.custom_qualify_group_b !== undefined) setCustomB(tournament.custom_qualify_group_b);
    }
  }, [tournament]);

  // Sync with context players only if user hasn't made dirty edits
  React.useEffect(() => {
    if (players.length > 0 && !isUserDirty.current) {
      setWizardPlayers([...players]);
      setNumPlayersInput(players.length);
    }
  }, [players]);

  // Debounced auto-save: whenever wizardPlayers, tournamentName, or groupFormat changes (and only after user started editing)
  React.useEffect(() => {
    if (!isUserDirty.current) return;

    const timer = setTimeout(() => {
      const finalPlayers = wizardPlayers.map((p, idx) => buildCleanPlayer(p, idx, groupFormat));

      const tourUpdates: Partial<Tournament> = {
        tournament_name: tournamentName.trim() || tournament.tournament_name,
        group_format: groupFormat,
        win_points: winPoints,
        draw_points: drawPoints,
        loss_points: lossPoints,
        same_group_match_frequency: sameGroupFreq,
        other_group_match_frequency: otherGroupFreq,
        qualification_method: qualMethod,
      };
      if (groupFormat === 'TWO_GROUPS' && qualMethod === 'TWO_GROUPS_CUSTOM') {
        if (customA !== undefined) tourUpdates.custom_qualify_group_a = customA;
        if (customB !== undefined) tourUpdates.custom_qualify_group_b = customB;
      }

      saveTournamentAndPlayers(tourUpdates, finalPlayers);
    }, 800);

    return () => clearTimeout(timer);
  }, [
    wizardPlayers,
    tournamentName,
    groupFormat,
    winPoints,
    drawPoints,
    lossPoints,
    sameGroupFreq,
    otherGroupFreq,
    qualMethod,
    customA,
    customB,
    tournament.tournament_name,
    saveTournamentAndPlayers
  ]);

  // Step 1 Save handler
  const handleSaveStep1 = () => {
    updateTournament({
      tournament_name: tournamentName.trim() || 'eFootball Championship 2026',
      win_points: winPoints,
      draw_points: drawPoints,
      loss_points: lossPoints,
    });
    setStatusAlert({ type: 'success', text: 'Tournament info saved.' });
    setTimeout(() => setStatusAlert(null), 2500);
  };

  // Step 2 Roster Save handler
  const handleSaveRoster = (): boolean => {
    const validPlayers = wizardPlayers.filter(p => p.player_name.trim().length > 0);
    if (validPlayers.length < 2) {
      setStatusAlert({ type: 'error', text: 'Please ensure at least 2 players have valid names.' });
      return false;
    }
    const finalPlayers = validPlayers.map((p, idx) => buildCleanPlayer(p, idx, groupFormat));
    setWizardPlayers(finalPlayers);
    saveTournamentAndPlayers(
      { tournament_name: tournamentName.trim() || tournament.tournament_name },
      finalPlayers
    );
    setStatusAlert({ type: 'success', text: `✅ Roster saved successfully (${finalPlayers.length} players registered)!` });
    setTimeout(() => setStatusAlert(null), 3500);
    return true;
  };

  // Step 3 Group Format Save handler
  const handleSaveStep3 = () => {
    const updatedPlayers = wizardPlayers.map((p, idx) => buildCleanPlayer(p, idx, groupFormat));
    setWizardPlayers(updatedPlayers);
    saveTournamentAndPlayers({ group_format: groupFormat }, updatedPlayers);
    setStatusAlert({ type: 'success', text: 'Group format saved.' });
    setTimeout(() => setStatusAlert(null), 2500);
  };

  // Step 4 Frequency Save handler
  const handleSaveStep4 = () => {
    updateTournament({
      same_group_match_frequency: sameGroupFreq,
      other_group_match_frequency: otherGroupFreq,
      qualification_method: qualMethod,
      custom_qualify_group_a: customA,
      custom_qualify_group_b: customB,
    });
    setStatusAlert({ type: 'success', text: 'Match frequency saved.' });
    setTimeout(() => setStatusAlert(null), 2500);
  };

  // Save full tournament in SETUP draft state (without generating fixtures)
  const handleSaveSetupDraft = () => {
    const validPlayers = wizardPlayers.filter(p => p.player_name.trim().length > 0);
    const finalPlayers = validPlayers.map((p, idx) => buildCleanPlayer(p, idx, groupFormat));

    const updatedTour: Partial<Tournament> = {
      tournament_name: tournamentName.trim() || 'eFootball Championship 2026',
      group_format: groupFormat,
      same_group_match_frequency: sameGroupFreq,
      other_group_match_frequency: otherGroupFreq,
      qualification_method: qualMethod,
      win_points: winPoints,
      draw_points: drawPoints,
      loss_points: lossPoints,
      status: 'SETUP' as const,
    };
    if (groupFormat === 'TWO_GROUPS' && qualMethod === 'TWO_GROUPS_CUSTOM') {
      if (customA !== undefined) updatedTour.custom_qualify_group_a = customA;
      if (customB !== undefined) updatedTour.custom_qualify_group_b = customB;
    }

    setWizardPlayers(finalPlayers);
    saveTournamentAndPlayers(updatedTour, finalPlayers);
    setStatusAlert({
      type: 'success',
      text: `✅ Tournament setup & roster saved (${finalPlayers.length} players)! You can generate fixtures now or anytime later.`
    });
  };

  // Toggle selection of a Master Player into wizardPlayers
  const handleToggleMasterPlayer = (mp: MasterPlayer) => {
    isUserDirty.current = true;
    setWizardPlayers(prev => {
      const exists = prev.some(p => p.id === mp.id);
      if (exists) {
        const next = prev.filter(p => p.id !== mp.id);
        setNumPlayersInput(next.length);
        return next;
      } else {
        const newP: Player = {
          id: mp.id,
          tournament_id: tournament.id,
          player_name: mp.player_name,
          player_photo: mp.player_photo,
          created_at: new Date().toISOString(),
        };
        if (groupFormat === 'TWO_GROUPS') {
          newP.group_name = prev.length % 2 === 0 ? 'Group A' : 'Group B';
        }
        const next = [...prev, newP];
        setNumPlayersInput(next.length);
        return next;
      }
    });
  };

  const handleSelectAllMasterPlayers = () => {
    isUserDirty.current = true;
    const activeMaster = masterRoster.filter(p => !p.is_archived);
    const existingIds = new Set(wizardPlayers.map(p => p.id));
    const toAdd = activeMaster.filter(p => !existingIds.has(p.id));

    setWizardPlayers(prev => {
      const next = [
        ...prev,
        ...toAdd.map((mp, idx) => {
          const p: Player = {
            id: mp.id,
            tournament_id: tournament.id,
            player_name: mp.player_name,
            player_photo: mp.player_photo,
            created_at: new Date().toISOString(),
          };
          if (groupFormat === 'TWO_GROUPS') {
            p.group_name = (prev.length + idx) % 2 === 0 ? 'Group A' : 'Group B';
          }
          return p;
        }),
      ];
      setNumPlayersInput(next.length);
      return next;
    });
  };

  const handleDeselectAll = () => {
    isUserDirty.current = true;
    setWizardPlayers([]);
    setNumPlayersInput(0);
  };

  const handleAddNewPlayerToRoster = async () => {
    const trimmed = newPlayerNameInput.trim();
    if (!trimmed) return;
    isUserDirty.current = true;

    // 1. Add to Master Roster
    const createdMaster = await addMasterPlayer(trimmed, newPlayerPhotoPreview);

    // 2. Automatically select for this tournament with same ID & photo
    const newP: Player = {
      id: createdMaster.id,
      tournament_id: tournament.id,
      player_name: createdMaster.player_name,
      player_photo: createdMaster.player_photo,
      created_at: createdMaster.created_at,
    };
    if (groupFormat === 'TWO_GROUPS') {
      newP.group_name = wizardPlayers.length % 2 === 0 ? 'Group A' : 'Group B';
    }

    setWizardPlayers(prev => {
      const next = [...prev, newP];
      setNumPlayersInput(next.length);
      return next;
    });

    setNewPlayerNameInput('');
    setNewPlayerPhotoPreview(undefined);
    setStatusAlert({ type: 'success', text: `Added ${trimmed} to Master Roster and current tournament!` });
    setTimeout(() => setStatusAlert(null), 2500);
  };

  const handleRemoveTournamentPlayer = (id: string) => {
    isUserDirty.current = true;
    setWizardPlayers(prev => {
      const next = prev.filter(p => p.id !== id);
      setNumPlayersInput(next.length);
      return next;
    });
  };

  // Synchronize dynamic player list based on number input
  const handleGeneratePlayerInputs = (count: number) => {
    isUserDirty.current = true;
    const target = Math.max(2, Math.min(64, count));
    setNumPlayersInput(target);

    const updated = [...wizardPlayers];
    if (updated.length < target) {
      for (let i = updated.length; i < target; i++) {
        const id = `p_${Date.now()}_${i + 1}`;
        const newP: Player = {
          id,
          tournament_id: tournament.id,
          player_name: `Player ${String.fromCharCode(65 + (i % 26))}${i >= 26 ? Math.floor(i / 26) : ''}`,
          created_at: new Date().toISOString(),
        };
        if (groupFormat === 'TWO_GROUPS') {
          newP.group_name = i % 2 === 0 ? 'Group A' : 'Group B';
        }
        updated.push(newP);
      }
    } else if (updated.length > target) {
      updated.splice(target);
    }
    setWizardPlayers(updated);
  };

  const handleUpdatePlayerName = (id: string, name: string) => {
    isUserDirty.current = true;
    setWizardPlayers(prev => prev.map(p => p.id === id ? { ...p, player_name: name } : p));
  };

  const handleToggleGroup = (id: string) => {
    isUserDirty.current = true;
    setWizardPlayers(prev => prev.map(p => {
      if (p.id !== id) return p;
      return {
        ...p,
        group_name: p.group_name === 'Group A' ? 'Group B' : 'Group A',
      };
    }));
  };

  const handleAutoDivideGroups = () => {
    isUserDirty.current = true;
    setWizardPlayers(prev => prev.map((p, idx) => ({
      ...p,
      group_name: idx % 2 === 0 ? 'Group A' : 'Group B',
    })));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    isUserDirty.current = true;
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
    const finalPlayers = wizardPlayers.map((p, idx) => buildCleanPlayer(p, idx, groupFormat));

    // Save tournament settings
    const updatedTour: Tournament = {
      ...tournament,
      tournament_name: tournamentName.trim() || tournament.tournament_name || 'eFootball Championship 2026',
      group_format: groupFormat,
      same_group_match_frequency: sameGroupFreq,
      other_group_match_frequency: otherGroupFreq,
      qualification_method: qualMethod,
      win_points: winPoints,
      draw_points: drawPoints,
      loss_points: lossPoints,
      status: 'LEAGUE' as const,
    };
    if (groupFormat === 'TWO_GROUPS' && qualMethod === 'TWO_GROUPS_CUSTOM') {
      if (customA !== undefined) updatedTour.custom_qualify_group_a = customA;
      if (customB !== undefined) updatedTour.custom_qualify_group_b = customB;
    }

    const res = generateTournamentFixtures(updatedTour, finalPlayers);
    if (res.success) {
      setStatusAlert({ type: 'success', text: 'Fixtures generated successfully! Redirecting to Fixtures...' });
      setTimeout(() => {
        setActiveTab('fixtures');
      }, 800);
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

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white/95 backdrop-blur-md border border-white/80 rounded-3xl p-5 sm:p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-[#1d6bf3]" />
            <span>Admin Tournament Setup Wizard</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Configure player rosters, flexible round frequencies, group splits, and automated fixture schedules
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
            {onOpenChangePassword && (
              <button
                onClick={onOpenChangePassword}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 border-0"
              >
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Change Password</span>
              </button>
            )}
            <button
              onClick={onOpenResetModal}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 border-0"
            >
              <RotateCcw className="w-4 h-4 text-white" />
              <span>Reset Tournament</span>
            </button>
          </div>
        )}
      </div>

      {/* Step Navigator */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto touch-pan-x [-webkit-overflow-scrolling:touch] bg-white/90 backdrop-blur-md border border-white/80 rounded-2xl p-2 sm:p-3 shadow-sm">
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
                  ? 'bg-[#1d6bf3] text-white shadow-md'
                  : isDone
                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isActive ? 'bg-white text-[#1d6bf3]' : isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
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
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {statusAlert.type === 'success' ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
          <span className="font-semibold">{statusAlert.text}</span>
        </div>
      )}

      {/* Step 1: Tournament Info & Points */}
      {activeStep === 1 && (
        <div className="bg-white/95 backdrop-blur-md border border-white/80 rounded-3xl p-6 sm:p-8 shadow-md space-y-6 animate-in fade-in">
          <h3 className="font-display text-xl font-black text-slate-900">Step 1: Tournament Information & Points Rule</h3>

          <div className="space-y-4 max-w-xl">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Tournament Name
              </label>
              <input
                type="text"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                placeholder="e.g. eFootball Attangal Championship 2026"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1d6bf3]/30 focus:border-[#1d6bf3] placeholder-slate-400"
              />
            </div>

            <div className="pt-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3">
                Points System (Default: 3 for Win, 1 for Draw, 0 for Loss)
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block font-mono font-bold">Win Points</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={winPoints}
                    onChange={(e) => setWinPoints(parseInt(e.target.value) || 3)}
                    className="w-full mt-1 bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-slate-900 font-display font-bold text-center focus:ring-2 focus:ring-[#1d6bf3]/30 focus:outline-none"
                  />
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block font-mono font-bold">Draw Points</span>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={drawPoints}
                    onChange={(e) => setDrawPoints(parseInt(e.target.value) || 1)}
                    className="w-full mt-1 bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-slate-900 font-display font-bold text-center focus:ring-2 focus:ring-[#1d6bf3]/30 focus:outline-none"
                  />
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block font-mono font-bold">Loss Points</span>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={lossPoints}
                    onChange={(e) => setLossPoints(parseInt(e.target.value) || 0)}
                    className="w-full mt-1 bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-slate-900 font-display font-bold text-center focus:ring-2 focus:ring-[#1d6bf3]/30 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => {
                handleSaveStep1();
                setActiveStep(2);
              }}
              className="px-6 py-2.5 rounded-xl bg-[#1d6bf3] hover:bg-[#1557c0] text-white font-bold text-sm flex items-center gap-2 shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <span>Next: Player Registration</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Master Roster Selection & Player Registration */}
      {activeStep === 2 && (
        <div className="bg-white/95 backdrop-blur-md border border-white/80 rounded-3xl p-6 sm:p-8 shadow-md space-y-7 animate-in fade-in">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#1d6bf3]" />
                <h3 className="font-display text-xl font-black text-slate-900">Step 2: Competitor Selection & Registration</h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Select competitors from your persistent Global Roster or add new ones. Selected players carry their names and profile photos across seasons.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#1d6bf3] font-bold text-xs border border-blue-200">
                {wizardPlayers.length} Competitors Selected
              </span>
              <button
                type="button"
                onClick={handleSaveRoster}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-sm transition-all flex items-center gap-1.5 active:scale-95 min-h-[40px]"
              >
                <Save className="w-4 h-4" />
                <span>Save Roster</span>
              </button>
            </div>
          </div>

          {/* Section A: Global Player Roster Selection */}
          <div className="space-y-3 bg-slate-50/80 p-5 rounded-2xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h4 className="font-display font-bold text-sm text-slate-800">
                  Global Player Roster
                </h4>
                <span className="text-[11px] font-semibold text-slate-400">
                  ({masterRoster.filter(p => !p.is_archived).length} total players)
                </span>
              </div>

              {/* Search and Quick Select */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search roster..."
                    value={rosterSearchQuery}
                    onChange={(e) => setRosterSearchQuery(e.target.value)}
                    className="w-36 sm:w-44 pl-7 pr-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1d6bf3]/30"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                </div>
                <button
                  type="button"
                  onClick={handleSelectAllMasterPlayers}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Select All</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1"
                >
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Quick Add New Player input bar */}
            <div className="flex items-center gap-2 pt-1">
              <div className="relative shrink-0">
                <PlayerAvatar
                  name={newPlayerNameInput || 'New'}
                  photo={newPlayerPhotoPreview}
                  size="sm"
                />
                <button
                  type="button"
                  onClick={() => newPlayerFileInputRef.current?.click()}
                  title="Upload photo"
                  className="absolute inset-0 rounded-full bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <Upload className="w-3 h-3 text-white" />
                </button>
                <input
                  type="file"
                  ref={newPlayerFileInputRef}
                  accept="image/png,image/jpeg,image/webp"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const base64 = await compressImage(file);
                      setNewPlayerPhotoPreview(base64);
                    } catch {
                      // ignore
                    }
                  }}
                  className="hidden"
                />
              </div>

              <input
                type="text"
                placeholder="+ Register new competitor (e.g. John Doe)..."
                value={newPlayerNameInput}
                onChange={(e) => setNewPlayerNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewPlayerToRoster();
                  }
                }}
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d6bf3]/30"
              />

              <button
                type="button"
                onClick={handleAddNewPlayerToRoster}
                disabled={!newPlayerNameInput.trim()}
                className="px-3.5 py-2 bg-[#1d6bf3] hover:bg-[#1557c0] disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add & Select</span>
              </button>
            </div>

            {/* Master Roster Checklist Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto pr-1 pt-2">
              {masterRoster
                .filter(p => !p.is_archived && (!rosterSearchQuery.trim() || p.player_name.toLowerCase().includes(rosterSearchQuery.toLowerCase())))
                .map((mp) => {
                  const isSelected = wizardPlayers.some(p => p.id === mp.id);
                  return (
                    <div
                      key={mp.id}
                      onClick={() => handleToggleMasterPlayer(mp)}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer select-none transition-all ${
                        isSelected
                          ? 'bg-blue-50/80 border-[#1d6bf3] shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 text-white transition-colors ${
                        isSelected ? 'bg-[#1d6bf3]' : 'border border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <PlayerAvatar
                        name={mp.player_name}
                        photo={mp.player_photo}
                        size="xs"
                      />
                      <span className={`text-xs font-bold truncate flex-1 ${isSelected ? 'text-blue-950' : 'text-slate-700'}`}>
                        {mp.player_name}
                      </span>
                    </div>
                  );
                })}
              {masterRoster.filter(p => !p.is_archived).length === 0 && (
                <div className="col-span-full py-4 text-center text-xs text-slate-400">
                  No players in global roster yet. Type a name above to register your first competitor!
                </div>
              )}
            </div>
          </div>

          {/* Section B: Active Selected Tournament Competitors */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-display font-bold text-base text-slate-900">
                  Active Competitors for this Tournament ({wizardPlayers.length})
                </h4>
                <p className="text-xs text-slate-500">
                  {groupFormat === 'TWO_GROUPS' ? 'Assign Group A/B and customize player details' : 'Review competitor names and photos'}
                </p>
              </div>

              {groupFormat === 'TWO_GROUPS' && wizardPlayers.length > 0 && (
                <button
                  type="button"
                  onClick={handleAutoDivideGroups}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1"
                >
                  <span>Auto-Divide (A / B)</span>
                </button>
              )}
            </div>

            {/* Dynamic Input Rows */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
              {wizardPlayers.map((player, idx) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl shadow-xs"
                >
                  <span className="w-6 text-center font-mono text-xs font-bold text-slate-400">
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
                      <Upload className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={player.player_name}
                    onChange={(e) => handleUpdatePlayerName(player.id, e.target.value)}
                    placeholder={`Player ${idx + 1} name...`}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d6bf3]/30 focus:border-[#1d6bf3]"
                  />

                  {groupFormat === 'TWO_GROUPS' && (
                    <button
                      type="button"
                      onClick={() => handleToggleGroup(player.id)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors ${
                        player.group_name === 'Group B'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                      }`}
                    >
                      {player.group_name || 'Group A'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveTournamentPlayer(player.id)}
                    title="Remove from this tournament"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 text-xs transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {wizardPlayers.length === 0 && (
                <div className="col-span-full py-8 text-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">No Competitors Selected</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Select players from the Global Roster above or add new players.
                  </p>
                </div>
              )}
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/png,image/jpeg,image/webp"
            onChange={handlePhotoUpload}
            className="hidden"
          />

          <div className="pt-4 flex items-center justify-between border-t border-slate-200">
            <button
              onClick={() => setActiveStep(1)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors"
            >
              Back
            </button>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleSaveRoster}
                className="px-4 py-2.5 rounded-xl border border-emerald-600/30 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-4 h-4 text-emerald-600" />
                <span>Save Roster</span>
              </button>
              <button
                onClick={() => {
                  const valid = handleSaveRoster();
                  if (valid) {
                    setActiveStep(3);
                  }
                }}
                className="px-6 py-2.5 rounded-xl bg-[#1d6bf3] hover:bg-[#1557c0] text-white font-bold text-sm flex items-center gap-2 shadow-md transition-all hover:scale-105 active:scale-95"
              >
                <span>Next: Group Format</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Group Format Selection & Division */}
      {activeStep === 3 && (
        <div className="bg-white/95 backdrop-blur-md border border-white/80 rounded-3xl p-6 sm:p-8 shadow-md space-y-6 animate-in fade-in">
          <h3 className="font-display text-xl font-black text-slate-900">Step 3: Tournament Group Organization</h3>
          <p className="text-xs text-slate-500 font-medium">
            Choose whether all competitors compete in a single league, or split into two groups (Group A & Group B).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => {
                isUserDirty.current = true;
                setGroupFormat('SINGLE');
                setWizardPlayers(prev => prev.map(p => {
                  const { group_name, ...rest } = p;
                  return rest;
                }));
              }}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                groupFormat === 'SINGLE'
                  ? 'border-[#1d6bf3] bg-blue-50/70 shadow-sm'
                  : 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-900">All Players in One Group</h4>
                <div className={`w-4 h-4 rounded-full border-2 ${groupFormat === 'SINGLE' ? 'bg-[#1d6bf3] border-[#1d6bf3]' : 'border-slate-300'}`} />
              </div>
              <p className="text-xs text-slate-600">
                Single league table where every player competes against everyone else based on the match frequency.
              </p>
            </div>

            <div
              onClick={() => {
                isUserDirty.current = true;
                setGroupFormat('TWO_GROUPS');
                handleAutoDivideGroups();
              }}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                groupFormat === 'TWO_GROUPS'
                  ? 'border-[#1d6bf3] bg-blue-50/70 shadow-sm'
                  : 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-900">Divide Players into Two Groups</h4>
                <div className={`w-4 h-4 rounded-full border-2 ${groupFormat === 'TWO_GROUPS' ? 'bg-[#1d6bf3] border-[#1d6bf3]' : 'border-slate-300'}`} />
              </div>
              <p className="text-xs text-slate-600">
                Splits competitors into Group A & Group B. Supports automatic or manual drag/click assignment.
              </p>
            </div>
          </div>

          {/* If Two Groups selected: Show Group Assignment buckets */}
          {groupFormat === 'TWO_GROUPS' && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Group Assignment (Click any player tag to switch groups)
                </h4>
                <button
                  onClick={handleAutoDivideGroups}
                  className="text-xs text-[#1d6bf3] hover:text-[#1557c0] font-bold flex items-center gap-1"
                >
                  <Shuffle className="w-3.5 h-3.5" /> Auto Balance Groups
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Group A Box */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-display font-bold text-sm text-cyan-700 uppercase">
                      Group A ({groupACount} Players)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Seed 1</span>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {wizardPlayers.filter(p => p.group_name === 'Group A').map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleToggleGroup(p.id)}
                        className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 hover:border-cyan-500/50 cursor-pointer text-xs shadow-xs"
                      >
                        <div className="flex items-center gap-2">
                          <PlayerAvatar name={p.player_name} photo={p.player_photo} size="xs" />
                          <span className="font-bold text-slate-800">{p.player_name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-600 font-semibold">Move to B →</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Group B Box */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-display font-bold text-sm text-emerald-700 uppercase">
                      Group B ({groupBCount} Players)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Seed 2</span>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {wizardPlayers.filter(p => p.group_name === 'Group B').map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleToggleGroup(p.id)}
                        className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-500/50 cursor-pointer text-xs shadow-xs"
                      >
                        <div className="flex items-center gap-2">
                          <PlayerAvatar name={p.player_name} photo={p.player_photo} size="xs" />
                          <span className="font-bold text-slate-800">{p.player_name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-600 font-semibold">← Move to A</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 flex items-center justify-between border-t border-slate-200">
            <button
              onClick={() => setActiveStep(2)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => {
                handleSaveStep3();
                setActiveStep(4);
              }}
              className="px-6 py-2.5 rounded-xl bg-[#1d6bf3] hover:bg-[#1557c0] text-white font-bold text-sm flex items-center gap-2 shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <span>Next: Match Frequency</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Flexible Match Frequency Configuration */}
      {activeStep === 4 && (
        <div className="bg-white/95 backdrop-blur-md border border-white/80 rounded-3xl p-6 sm:p-8 shadow-md space-y-6 animate-in fade-in">
          <h3 className="font-display text-xl font-black text-slate-900">Step 4: Flexible Match Frequency Configuration</h3>
          <p className="text-xs text-slate-500 font-medium">
            Define how many times opponents face each other. The system will calculate and preview the exact fixture numbers.
          </p>

          {groupFormat === 'SINGLE' ? (
            <div className="max-w-xl space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
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
                          ? 'bg-[#1d6bf3] text-white border-[#1d6bf3] shadow-md'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
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
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Same Group Matches Per Opponent
                </label>
                <select
                  value={sameGroupFreq}
                  onChange={(e) => setSameGroupFreq(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#1d6bf3]/30 focus:border-[#1d6bf3]"
                >
                  <option value={0}>0 Matches (No intra-group)</option>
                  <option value={1}>1 Match (Single Round Robin)</option>
                  <option value={2}>2 Matches (Double Round Robin)</option>
                  <option value={3}>3 Matches (Triple Round Robin)</option>
                  <option value={4}>4 Matches (Custom)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Cross Group Matches Per Opponent
                </label>
                <select
                  value={otherGroupFreq}
                  onChange={(e) => setOtherGroupFreq(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#1d6bf3]/30 focus:border-[#1d6bf3]"
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
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-[#1d6bf3] uppercase tracking-wider block">
              📊 Live Fixture Mathematics Preview
            </span>
            <div className="grid grid-cols-3 gap-3 pt-2 text-center">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-500 block font-mono font-bold">Matches / Player</span>
                <span className="text-xl font-display font-bold text-slate-900">
                  {groupFormat === 'SINGLE' 
                    ? (wizardPlayers.length - 1) * sameGroupFreq 
                    : `${(Math.max(0, groupACount - 1)) * sameGroupFreq + (groupBCount * otherGroupFreq)} (avg)`}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-500 block font-mono font-bold">Same Group Matches</span>
                <span className="text-xl font-display font-bold text-cyan-600">
                  {matchMath.sameGroupTotal}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-500 block font-mono font-bold">Total Tournament Matches</span>
                <span className="text-2xl font-display font-black text-amber-600">
                  {matchMath.total}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-200">
            <button
              onClick={() => setActiveStep(3)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => {
                handleSaveStep4();
                setActiveStep(5);
              }}
              className="px-6 py-2.5 rounded-xl bg-[#1d6bf3] hover:bg-[#1557c0] text-white font-bold text-sm flex items-center gap-2 shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <span>Next: Review & Generate</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Review & Fixture Generation */}
      {activeStep === 5 && (
        <div className="bg-white/95 backdrop-blur-md border border-white/80 rounded-3xl p-6 sm:p-8 shadow-md space-y-6 animate-in fade-in">
          <h3 className="font-display text-xl font-black text-slate-900">Step 5: Review & Generate Fixtures</h3>
          <p className="text-xs text-slate-500 font-medium">
            Verify tournament rules before generating the full fixture schedule.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
              <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Tournament Configuration</span>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Name:</span>
                <span className="font-bold text-slate-900">{tournamentName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Format:</span>
                <span className="font-bold text-slate-900">{groupFormat === 'SINGLE' ? 'Single Group' : '2 Groups (A & B)'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Total Registered:</span>
                <span className="font-bold text-cyan-600">{wizardPlayers.length} Players</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
              <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Match Schedule Math</span>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Same Group Freq:</span>
                <span className="font-bold text-slate-900">{sameGroupFreq}x</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Cross Group Freq:</span>
                <span className="font-bold text-slate-900">{otherGroupFreq}x</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Total Fixtures to Generate:</span>
                <span className="font-bold text-amber-600 text-sm">{matchMath.total} Matches</span>
              </div>
            </div>
          </div>

          {/* Qualification Options for 2-Group */}
          {groupFormat === 'TWO_GROUPS' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Playoff Qualification Rule
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setQualMethod('TWO_GROUPS_TOP_2_EACH')}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                    qualMethod === 'TWO_GROUPS_TOP_2_EACH'
                      ? 'bg-blue-50 border-[#1d6bf3] text-[#1d6bf3] shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div>Top 2 from Each Group</div>
                  <span className="text-[10px] text-slate-500 font-normal">A1 vs B2, B1 vs A2</span>
                </button>

                <button
                  type="button"
                  onClick={() => setQualMethod('TWO_GROUPS_OVERALL_TOP_4')}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                    qualMethod === 'TWO_GROUPS_OVERALL_TOP_4'
                      ? 'bg-blue-50 border-[#1d6bf3] text-[#1d6bf3] shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div>Combined Overall Top 4</div>
                  <span className="text-[10px] text-slate-500 font-normal">Top 4 points overall</span>
                </button>

                <button
                  type="button"
                  onClick={() => setQualMethod('TWO_GROUPS_CUSTOM')}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                    qualMethod === 'TWO_GROUPS_CUSTOM'
                      ? 'bg-blue-50 border-[#1d6bf3] text-[#1d6bf3] shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div>Custom Division</div>
                  <span className="text-[10px] text-slate-500 font-normal">Specify count per group</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-200">
            <button
              onClick={() => setActiveStep(4)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors"
            >
              Back
            </button>
            <div className="flex items-center gap-2.5 flex-wrap justify-end">
              <button
                type="button"
                onClick={handleSaveSetupDraft}
                className="px-5 py-3 rounded-xl border-2 border-slate-300 hover:border-slate-400 text-slate-700 bg-white hover:bg-slate-50 font-display font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4 text-slate-600" />
                <span>Save Setup Draft</span>
              </button>
              <button
                onClick={handleStartGeneration}
                className="px-8 py-3 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-display font-black text-sm sm:text-base shadow-md flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
              >
                <Calendar className="w-5 h-5 text-white" />
                <span>GENERATE TOURNAMENT FIXTURES</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for regenerating fixtures (Requirement 13) */}
      {confirmRegenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-rose-200 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto animate-bounce" />
            <h4 className="font-display text-xl font-black text-slate-900">Regenerate All Fixtures?</h4>
            <p className="text-xs text-rose-600 font-medium">
              ⚠️ Changing tournament group structure or match frequency will regenerate all fixtures. Existing match scores and statistics will be deleted.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setConfirmRegenerateModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setConfirmRegenerateModal(false);
                  executeFixtureGeneration();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md transition-all active:scale-95"
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
