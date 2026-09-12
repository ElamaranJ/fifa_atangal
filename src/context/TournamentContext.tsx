import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Tournament, 
  Player, 
  Match, 
  PlayoffBracketData, 
  PlayerStatistics, 
  DynamicTournamentStats,
  TournamentRulesData,
} from '../types/tournament';
import { StorageService, DEFAULT_ADMIN_PIN, TournamentFirestoreDoc } from '../services/storage';
import { recalculateTournamentState } from '../services/statsCalculator';
import { generateFixtures } from '../services/fixtureGenerator';
import { INITIAL_EMPTY_TOURNAMENT, DEMO_TOURNAMENT_ID } from '../data/demoTournament';
import { DEFAULT_TOURNAMENT_RULES } from '../data/defaultRules';
import { sounds } from '../services/soundEffects';

interface TournamentContextType {
  tournament: Tournament;
  players: Player[];
  matches: Match[];
  playoffs: PlayoffBracketData;
  rules: TournamentRulesData;
  updateRules: (newRules: TournamentRulesData) => Promise<void>;
  resetRulesToDefault: () => Promise<void>;
  overallStats: PlayerStatistics[];
  groupAStats: PlayerStatistics[];
  groupBStats: PlayerStatistics[];
  goldenBootLeaders: PlayerStatistics[];
  dynamicStats: DynamicTournamentStats;
  isAdmin: boolean;
  isLoading: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  activeTab: string;
  setActiveTab: (tab: string) => void;
  // Admin actions
  setIsAdmin: (status: boolean) => void;
  loginAdmin: (pin: string) => boolean;
  logoutAdmin: () => void;
  changeAdminPassword: (currentPin: string, newPin: string) => Promise<{ success: boolean; error?: string }>;
  updateTournament: (updates: Partial<Tournament>) => void;
  addPlayer: (name: string, photo?: string, group?: string) => void;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  removePlayer: (id: string) => void;
  setPlayersList: (newPlayers: Player[]) => void;
  saveTournamentAndPlayers: (tourUpdates: Partial<Tournament>, newPlayers: Player[]) => void;
  generateTournamentFixtures: (customTournament?: Tournament, customPlayers?: Player[]) => { success: boolean; error?: string };
  submitMatchResult: (matchId: string, s1: number, s2: number, pens1?: number, pens2?: number) => void;
  deleteMatchResult: (matchId: string) => void;
  updateMatchSchedule: (matchId: string, date?: string, time?: string, location?: string, status?: Match['status']) => void;
  startPlayoffs: () => { success: boolean; error?: string };
  submitPlayoffResult: (
    stage: 'QUALIFIER_1' | 'ELIMINATOR' | 'QUALIFIER_2' | 'FINAL' | 'THIRD_PLACE' | 'SEMI_FINAL_1' | 'SEMI_FINAL_2',
    s1: number,
    s2: number,
    p1Pens?: number,
    p2Pens?: number
  ) => void;
  resetTournament: (mode: 'RESULTS_ONLY' | 'FIXTURES_AND_RESULTS' | 'COMPLETE') => void;
  importTournamentData: (jsonStr: string) => { success: boolean; error?: string };
  exportTournamentData: () => string;
  // Selected modals
  selectedPlayerForProfile: PlayerStatistics | null;
  setSelectedPlayerForProfile: (player: PlayerStatistics | null) => void;
  selectedMatchForDetails: Match | null;
  setSelectedMatchForDetails: (match: Match | null) => void;
  // Celebrations & alerts
  newGoldenBootLeaderAlert: PlayerStatistics | null;
  setNewGoldenBootLeaderAlert: (player: PlayerStatistics | null) => void;
  showQualificationModal: boolean;
  setShowQualificationModal: (show: boolean) => void;
  isAudioMuted: boolean;
  toggleAudio: () => void;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tournament, setTournament] = useState<Tournament>(() => {
    const local = StorageService.loadTournamentLocal();
    return local || INITIAL_EMPTY_TOURNAMENT;
  });
  const [players, setPlayers] = useState<Player[]>(() => {
    const local = StorageService.loadPlayersLocal();
    return local || [];
  });
  const [matches, setMatches] = useState<Match[]>(() => {
    const local = StorageService.loadMatchesLocal();
    return local || [];
  });
  const [playoffs, setPlayoffs] = useState<PlayoffBracketData>(() => {
    const local = StorageService.loadPlayoffsLocal();
    return local || {};
  });
  const [rules, setRules] = useState<TournamentRulesData>(() => {
    try {
      const saved = localStorage.getItem('efootball_rules_data');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_TOURNAMENT_RULES;
  });
  const [adminPin, setAdminPin] = useState<string>(() => localStorage.getItem('efootball_admin_pin') || DEFAULT_ADMIN_PIN);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('syncing');

  const [isAdmin, setIsAdmin] = useState<boolean>(() => StorageService.isAdminLoggedIn());
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedPlayerForProfile, setSelectedPlayerForProfile] = useState<PlayerStatistics | null>(null);
  const [selectedMatchForDetails, setSelectedMatchForDetails] = useState<Match | null>(null);
  const [newGoldenBootLeaderAlert, setNewGoldenBootLeaderAlert] = useState<PlayerStatistics | null>(null);
  const [showQualificationModal, setShowQualificationModal] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => sounds.getIsMuted());

  // Rank history map for rank shifts (↑ / ↓)
  const [prevRankMap, setPrevRankMap] = useState<Map<string, number>>(new Map());

  // Top Golden boot leader reference to detect lead changes
  const [lastGoldenBootLeaderId, setLastGoldenBootLeaderId] = useState<string | null>(null);

  // Suppress write loop when an update is incoming from remote onSnapshot
  const isRemoteSyncing = useRef(false);
  const hasInitialized = useRef(false);
  // Track in-flight admin password updates to prevent premature onSnapshot overwrite
  const pendingPasswordRef = useRef<string | null>(null);

  // 1. Initial Firestore Setup & Real-time Subscription
  useEffect(() => {
    let isMounted = true;

    async function initFirestore() {
      try {
        // Purge any legacy localStorage mock data
        const localT = localStorage.getItem('fifa_tournament');
        if (localT && localT.includes(DEMO_TOURNAMENT_ID)) {
          localStorage.removeItem('fifa_tournament');
          localStorage.removeItem('fifa_players');
          localStorage.removeItem('fifa_matches');
          localStorage.removeItem('fifa_playoffs');
        }

        // Initialize empty tournament if document is empty
        await StorageService.seedInitialDataIfEmpty(
          INITIAL_EMPTY_TOURNAMENT,
          [],
          [],
          {}
        );
      } catch (err) {
        console.error('[Storage] Init check failed:', err);
      }
    }

    initFirestore();

    // Subscribe to real-time changes across all devices via Firestore onSnapshot
    const unsubscribe = StorageService.subscribeTournamentData(
      (data: TournamentFirestoreDoc | null) => {
        if (!isMounted) return;

        if (data) {
          // Detect if remote Firestore contains legacy mock data; if so, wipe it
          const isLegacyMock = data.tournament?.id === DEMO_TOURNAMENT_ID && data.tournament?.tournament_name === 'eFOOTBALL CHAMPIONSHIP 2026';
          if (isLegacyMock) {
            console.log('[Storage] Found legacy mock data in Firestore. Auto-clearing to clean tournament...');
            StorageService.clearAllData();
            StorageService.saveTournament(INITIAL_EMPTY_TOURNAMENT);
            StorageService.savePlayers([]);
            StorageService.saveMatches([]);
            StorageService.savePlayoffs({});
            setTournament(INITIAL_EMPTY_TOURNAMENT);
            setPlayers([]);
            setMatches([]);
            setPlayoffs({});
            setIsLoading(false);
            setSyncStatus('synced');
            return;
          }

          isRemoteSyncing.current = true;
          if (data.tournament) setTournament(data.tournament);
          if (Array.isArray(data.players)) setPlayers(data.players);
          if (Array.isArray(data.matches)) setMatches(data.matches);
          if (data.playoffs) setPlayoffs(data.playoffs);
          if (data.rules) setRules(data.rules);
          if (data.adminPin) {
            // Guard: Don't overwrite local adminPin state if a password change was just made locally and hasn't been confirmed yet
            if (!pendingPasswordRef.current || data.adminPin === pendingPasswordRef.current) {
              setAdminPin(data.adminPin);
              if (data.adminPin === pendingPasswordRef.current) {
                pendingPasswordRef.current = null;
              }
            }
          }

          setTimeout(() => {
            isRemoteSyncing.current = false;
            hasInitialized.current = true;
          }, 60);
        } else {
          hasInitialized.current = true;
        }

        setIsLoading(false);
        setSyncStatus('synced');
      },
      (error: Error) => {
        if (!isMounted) return;
        console.error('[Storage] Sync error:', error);
        setIsLoading(false);
        setSyncStatus('error');
        hasInitialized.current = true;
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Recalculate all statistics centrally via pure deterministic engine
  const { overallStats, groupAStats, groupBStats, goldenBootLeaders, dynamicStats } = useMemo(() => {
    return recalculateTournamentState(tournament, players, matches, prevRankMap);
  }, [tournament, players, matches, prevRankMap]);

  // Check for new Golden Boot leader changes
  useEffect(() => {
    if (goldenBootLeaders.length > 0 && goldenBootLeaders[0].total_goals > 0) {
      const topPlayer = goldenBootLeaders[0];
      if (lastGoldenBootLeaderId && topPlayer.player_id !== lastGoldenBootLeaderId) {
        setNewGoldenBootLeaderAlert(topPlayer);
        sounds.playFanfare();
      }
      setLastGoldenBootLeaderId(topPlayer.player_id);
    }
  }, [goldenBootLeaders, lastGoldenBootLeaderId]);

  // Check if League stage just completed to trigger Top 4 Qualification modal
  useEffect(() => {
    const leagueMatches = matches.filter(m => m.stage === 'LEAGUE');
    if (leagueMatches.length > 0) {
      const allDone = leagueMatches.every(m => m.status === 'COMPLETED');
      if (allDone && tournament.status === 'LEAGUE') {
        const updatedTournament: Tournament = { ...tournament, status: 'QUALIFICATION' };
        setTournament(updatedTournament);
        StorageService.saveTournament(updatedTournament).catch(err =>
          console.error('[Storage] Save qualification status error:', err)
        );
        setShowQualificationModal(true);
        sounds.playFanfare();
      }
    }
  }, [matches, tournament]);

  const toggleAudio = useCallback(() => {
    const muted = sounds.toggleMute();
    setIsAudioMuted(muted);
  }, []);

  const loginAdmin = useCallback((pin: string): boolean => {
    const inputPin = pin.trim();
    if (inputPin === adminPin || (adminPin === DEFAULT_ADMIN_PIN && (inputPin === DEFAULT_ADMIN_PIN || inputPin === 'rmdec@123'))) {
      setIsAdmin(true);
      StorageService.setAdminLoggedIn(true);
      return true;
    }
    return false;
  }, [adminPin]);

  const changeAdminPassword = useCallback(async (currentPin: string, newPin: string): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) {
      return { success: false, error: 'Admin authorization required.' };
    }
    if (currentPin.trim() !== adminPin.trim()) {
      return { success: false, error: 'Current password is incorrect.' };
    }
    if (!newPin || newPin.trim().length < 4) {
      return { success: false, error: 'New password must be at least 4 characters long.' };
    }
    const cleanPin = newPin.trim();
    pendingPasswordRef.current = cleanPin;
    try {
      await StorageService.setAdminPin(cleanPin);

      // Confirm the adminPin field actually equals the new value before confirming success
      const docData = await StorageService.loadTournamentDoc();
      const verifiedPin = docData?.adminPin ?? (await StorageService.getAdminPin());
      if (verifiedPin !== cleanPin) {
        pendingPasswordRef.current = null;
        return { success: false, error: 'Password update could not be verified in database.' };
      }

      setAdminPin(cleanPin);
      pendingPasswordRef.current = null;
      return { success: true };
    } catch (err: any) {
      pendingPasswordRef.current = null;
      console.error('[Storage] Error updating admin password:', err);
      return { success: false, error: err?.message || 'Failed to update password' };
    }
  }, [isAdmin, adminPin]);

  const logoutAdmin = useCallback(() => {
    setIsAdmin(false);
    StorageService.setAdminLoggedIn(false);
    setActiveTab(prev => (prev === 'admin' ? 'home' : prev));
  }, []);

  const updateTournament = useCallback((updates: Partial<Tournament>) => {
    if (!isAdmin) {
      console.warn('[Security] Unauthorized updateTournament attempt blocked');
      return;
    }
    setTournament(prev => {
      const updated = { ...prev, ...updates };
      StorageService.saveTournament(updated).catch(err =>
        console.error('[Storage] Update tournament error:', err)
      );
      return updated;
    });
  }, [isAdmin]);

  const addPlayer = useCallback((name: string, photo?: string, group?: string) => {
    if (!isAdmin) {
      console.warn('[Security] Unauthorized addPlayer attempt blocked');
      return;
    }
    const newPlayer: Player = {
      id: `p_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      tournament_id: tournament.id,
      player_name: name.trim(),
      created_at: new Date().toISOString(),
    };
    if (photo) newPlayer.player_photo = photo;
    if (group || tournament.group_format === 'TWO_GROUPS') {
      newPlayer.group_name = group || 'Group A';
    }
    setPlayers(prev => {
      const updated = [...prev, newPlayer];
      StorageService.savePlayers(updated).catch(err =>
        console.error('[Storage] Add player error:', err)
      );
      return updated;
    });
  }, [isAdmin, tournament.id, tournament.group_format]);

  const updatePlayer = useCallback((id: string, updates: Partial<Player>) => {
    if (!isAdmin) {
      console.warn('[Security] Unauthorized updatePlayer attempt blocked');
      return;
    }
    setPlayers(prev => {
      const updated = prev.map(p => (p.id === id ? { ...p, ...updates } : p));
      StorageService.savePlayers(updated).catch(err =>
        console.error('[Storage] Update player error:', err)
      );
      return updated;
    });
  }, [isAdmin]);

  const removePlayer = useCallback((id: string) => {
    if (!isAdmin) {
      console.warn('[Security] Unauthorized removePlayer attempt blocked');
      return;
    }
    setPlayers(prev => {
      const updated = prev.filter(p => p.id !== id);
      StorageService.savePlayers(updated).catch(err =>
        console.error('[Storage] Remove player error:', err)
      );
      return updated;
    });
  }, [isAdmin]);

  const setPlayersList = useCallback((newPlayers: Player[]) => {
    if (!isAdmin) {
      console.warn('[Security] Unauthorized setPlayersList attempt blocked');
      return;
    }
    const cleanPlayers: Player[] = newPlayers.map((p) => {
      const cp: Player = {
        id: p.id,
        tournament_id: p.tournament_id || tournament.id,
        player_name: p.player_name,
        created_at: p.created_at || new Date().toISOString(),
      };
      if (p.player_photo) cp.player_photo = p.player_photo;
      if (p.group_name) cp.group_name = p.group_name;
      return cp;
    });
    setPlayers(cleanPlayers);
    StorageService.saveTournamentState({ players: cleanPlayers }).catch(err =>
      console.error('[Storage] Save players list error:', err)
    );
  }, [isAdmin, tournament.id]);

  const saveTournamentAndPlayers = useCallback((tourUpdates: Partial<Tournament>, newPlayers: Player[]) => {
    if (!isAdmin) {
      console.warn('[Security] Unauthorized saveTournamentAndPlayers attempt blocked');
      return;
    }
    const cleanPlayers: Player[] = newPlayers.map((p) => {
      const cp: Player = {
        id: p.id,
        tournament_id: p.tournament_id || tournament.id,
        player_name: p.player_name,
        created_at: p.created_at || new Date().toISOString(),
      };
      if (p.player_photo) cp.player_photo = p.player_photo;
      if (p.group_name) cp.group_name = p.group_name;
      return cp;
    });

    const updatedTour: Tournament = {
      ...tournament,
      ...tourUpdates,
    };

    setTournament(updatedTour);
    setPlayers(cleanPlayers);

    StorageService.saveTournamentState({
      tournament: updatedTour,
      players: cleanPlayers,
    }).catch(err => console.error('[Storage] saveTournamentAndPlayers error:', err));
  }, [isAdmin, tournament]);

  // Update previous rank map before score changes to show rank shifts
  const updatePrevRanks = useCallback(() => {
    const map = new Map<string, number>();
    overallStats.forEach(s => map.set(s.player_id, s.rank));
    setPrevRankMap(map);
  }, [overallStats]);

  const generateTournamentFixtures = useCallback((
    customTournament?: Tournament,
    customPlayers?: Player[]
  ): { success: boolean; error?: string } => {
    if (!isAdmin) {
      return { success: false, error: 'Admin login required to generate fixtures.' };
    }
    const activeTournament = customTournament || tournament;
    const activePlayers = customPlayers || players;

    if (activePlayers.length < 2) {
      return { success: false, error: 'You need at least 2 registered players.' };
    }
    const empty = activePlayers.find(p => !p.player_name.trim());
    if (empty) {
      return { success: false, error: 'All players must have a non-empty name.' };
    }

    if (activeTournament.group_format === 'TWO_GROUPS') {
      const gA = activePlayers.filter(p => p.group_name === 'Group A');
      const gB = activePlayers.filter(p => p.group_name === 'Group B');
      if (gA.length === 0 || gB.length === 0) {
        return { success: false, error: 'Both Group A and Group B must contain at least 1 player.' };
      }
    }

    const generated = generateFixtures(
      activeTournament.id,
      activePlayers,
      activeTournament.group_format,
      activeTournament.same_group_match_frequency,
      activeTournament.other_group_match_frequency
    );

    const updatedTour: Tournament = {
      ...tournament,
      ...activeTournament,
      status: 'LEAGUE',
    };

    const cleanPlayers: Player[] = activePlayers.map((p, idx) => {
      const cp: Player = {
        id: p.id,
        tournament_id: activeTournament.id,
        player_name: p.player_name,
        created_at: p.created_at || new Date().toISOString(),
      };
      if (p.player_photo) cp.player_photo = p.player_photo;
      if (activeTournament.group_format === 'TWO_GROUPS') {
        cp.group_name = p.group_name || (idx % 2 === 0 ? 'Group A' : 'Group B');
      }
      return cp;
    });

    setPlayers(cleanPlayers);
    setMatches(generated);
    setPlayoffs({});
    setTournament(updatedTour);

    // Save atomically so Firestore snapshot cannot receive partial/out-of-order updates
    StorageService.saveTournamentState({
      tournament: updatedTour,
      players: cleanPlayers,
      matches: generated,
      playoffs: {},
    }).catch(err => console.error('[Storage] Fixture generation save error:', err));

    return { success: true };
  }, [isAdmin, players, tournament]);

  const submitMatchResult = useCallback((
    matchId: string, 
    s1: number, 
    s2: number, 
    pens1?: number, 
    pens2?: number
  ) => {
    if (!isAdmin) {
      console.warn('[Security] Unauthorized submitMatchResult attempt blocked');
      return;
    }
    updatePrevRanks();
    sounds.playWhistle();

    const numS1 = Number(s1);
    const numS2 = Number(s2);

    setMatches(prev => {
      const updated: Match[] = prev.map(m => {
        if (m.id !== matchId) return m;

        let winnerId: string | null = null;
        let penaltiesPlayed = false;

        if (m.stage !== 'LEAGUE' && numS1 === numS2) {
          penaltiesPlayed = true;
          if (pens1 !== undefined && pens2 !== undefined) {
            winnerId = Number(pens1) > Number(pens2) ? m.player_1 : m.player_2;
          }
        } else {
          if (numS1 > numS2) winnerId = m.player_1;
          else if (numS2 > numS1) winnerId = m.player_2;
        }

        return {
          ...m,
          player_1_score: numS1,
          player_2_score: numS2,
          penalties_played: penaltiesPlayed,
          player_1_penalty_score: pens1 !== undefined ? Number(pens1) : null,
          player_2_penalty_score: pens2 !== undefined ? Number(pens2) : null,
          winner_id: winnerId,
          status: 'COMPLETED' as const,
          completed_at: new Date().toISOString(),
        };
      });
      StorageService.saveMatches(updated).catch(err =>
        console.error('[Storage] Save match result error:', err)
      );
      return updated;
    });
  }, [isAdmin, updatePrevRanks]);

  const deleteMatchResult = useCallback((matchId: string) => {
    if (!isAdmin) {
      console.warn('[Security] Unauthorized deleteMatchResult attempt blocked');
      return;
    }
    updatePrevRanks();
    setMatches(prev => {
      const updated: Match[] = prev.map(m => {
        if (m.id !== matchId) return m;
        const { completed_at, ...rest } = m;
        return {
          ...rest,
          player_1_score: null,
          player_2_score: null,
          penalties_played: false,
          player_1_penalty_score: null,
          player_2_penalty_score: null,
          winner_id: null,
          status: 'UPCOMING' as const,
        };
      });
      StorageService.saveMatches(updated).catch(err =>
        console.error('[Storage] Delete match result error:', err)
      );
      return updated;
    });
  }, [isAdmin, updatePrevRanks]);

  const updateMatchSchedule = useCallback((
    matchId: string, 
    date?: string, 
    time?: string, 
    location?: string, 
    status?: Match['status']
  ) => {
    if (!isAdmin) {
      console.warn('[Security] Unauthorized updateMatchSchedule attempt blocked');
      return;
    }
    setMatches(prev => {
      const updated: Match[] = prev.map(m => {
        if (m.id !== matchId) return m;
        return {
          ...m,
          date: date !== undefined ? date : m.date,
          time: time !== undefined ? time : m.time,
          location: location !== undefined ? location : m.location,
          status: status !== undefined ? status : m.status,
        };
      });
      StorageService.saveMatches(updated).catch(err =>
        console.error('[Storage] Update match schedule error:', err)
      );
      return updated;
    });
  }, [isAdmin]);

  const startPlayoffs = useCallback((): { success: boolean; error?: string } => {
    if (!isAdmin) {
      return { success: false, error: 'Admin login required to start playoffs.' };
    }
    const leagueMatches = matches.filter(m => m.stage === 'LEAGUE');
    const allDone = leagueMatches.length > 0 && leagueMatches.every(m => m.status === 'COMPLETED');
    if (!allDone) {
      return { success: false, error: 'All league matches must be completed before starting playoffs!' };
    }

    let top4: PlayerStatistics[] = [];
    if (tournament.group_format === 'SINGLE') {
      top4 = overallStats.slice(0, 4);
    } else {
      if (tournament.qualification_method === 'TWO_GROUPS_TOP_2_EACH') {
        const topA = groupAStats.slice(0, 2);
        const topB = groupBStats.slice(0, 2);
        // In Two Groups Top 2: Group winners face off in Qualifier 1; Runners-up face off in Eliminator
        if (topA.length >= 2 && topB.length >= 2) {
          top4 = [topA[0], topB[0], topA[1], topB[1]];
        } else {
          top4 = overallStats.slice(0, 4);
        }
      } else {
        top4 = overallStats.slice(0, 4);
      }
    }

    if (top4.length < 4) {
      return { success: false, error: 'At least 4 contenders are required for playoffs.' };
    }

    // Qualifier 1: 1st Place vs 2nd Place (Winner -> Final, Loser -> Qualifier 2)
    const q1P1 = top4[0].player_id;
    const q1P2 = top4[1].player_id;

    // Eliminator: 3rd Place vs 4th Place (Winner -> Qualifier 2, Loser -> Knocked Out)
    const elimP1 = top4[2].player_id;
    const elimP2 = top4[3].player_id;

    const q1: Match = {
      id: `playoff_q1_${tournament.id}`,
      tournament_id: tournament.id,
      player_1: q1P1,
      player_2: q1P2,
      group: 'Qualifier 1',
      round: 1,
      match_number: 101,
      status: 'UPCOMING',
      stage: 'QUALIFIER_1',
    };

    const elim: Match = {
      id: `playoff_el_${tournament.id}`,
      tournament_id: tournament.id,
      player_1: elimP1,
      player_2: elimP2,
      group: 'Eliminator',
      round: 1,
      match_number: 102,
      status: 'UPCOMING',
      stage: 'ELIMINATOR',
    };

    const updatedPlayoffs: PlayoffBracketData = {
      qualifier_1: q1,
      eliminator: elim,
    };
    const updatedTour: Tournament = { ...tournament, status: 'QUALIFICATION' };

    setPlayoffs(updatedPlayoffs);
    setTournament(updatedTour);
    StorageService.saveTournamentState({
      tournament: updatedTour,
      playoffs: updatedPlayoffs,
    }).catch(err => console.error('[Storage] Start playoffs save error:', err));

    setActiveTab('playoffs');
    return { success: true };
  }, [isAdmin, matches, tournament, overallStats, groupAStats, groupBStats, setActiveTab]);

  const submitPlayoffResult = useCallback((
    stage: 'QUALIFIER_1' | 'ELIMINATOR' | 'QUALIFIER_2' | 'FINAL' | 'THIRD_PLACE' | 'SEMI_FINAL_1' | 'SEMI_FINAL_2',
    s1: number,
    s2: number,
    p1Pens?: number,
    p2Pens?: number
  ) => {
    if (!isAdmin) {
      console.warn('[Security] Unauthorized submitPlayoffResult attempt blocked');
      return;
    }
    sounds.playWhistle();

    setPlayoffs(prev => {
      const updated = { ...prev };
      let matchToUpdate: Match | undefined;

      if (stage === 'QUALIFIER_1' || stage === 'SEMI_FINAL_1') {
        matchToUpdate = updated.qualifier_1 || updated.semi_final_1;
      } else if (stage === 'ELIMINATOR' || stage === 'SEMI_FINAL_2') {
        matchToUpdate = updated.eliminator || updated.semi_final_2;
      } else if (stage === 'QUALIFIER_2') {
        matchToUpdate = updated.qualifier_2;
      } else if (stage === 'FINAL') {
        matchToUpdate = updated.final;
      } else if (stage === 'THIRD_PLACE') {
        matchToUpdate = updated.third_place;
      }

      if (!matchToUpdate) return prev;

      let winnerId: string;
      let loserId: string;
      let penaltiesPlayed = false;

      if (s1 === s2) {
        penaltiesPlayed = true;
        const pensA = p1Pens ?? 0;
        const pensB = p2Pens ?? 0;
        if (pensA >= pensB) {
          winnerId = matchToUpdate.player_1;
          loserId = matchToUpdate.player_2;
        } else {
          winnerId = matchToUpdate.player_2;
          loserId = matchToUpdate.player_1;
        }
      } else if (s1 > s2) {
        winnerId = matchToUpdate.player_1;
        loserId = matchToUpdate.player_2;
      } else {
        winnerId = matchToUpdate.player_2;
        loserId = matchToUpdate.player_1;
      }

      const completedMatch: Match = {
        ...matchToUpdate,
        player_1_score: s1,
        player_2_score: s2,
        penalties_played: penaltiesPlayed,
        player_1_penalty_score: p1Pens,
        player_2_penalty_score: p2Pens,
        winner_id: winnerId,
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
      };

      let tourStatusUpdate: Tournament['status'] | undefined;

      // Assign to respective stage slot
      if (stage === 'QUALIFIER_1' || (stage === 'SEMI_FINAL_1' && updated.qualifier_1)) {
        updated.qualifier_1 = completedMatch;
      } else if (stage === 'SEMI_FINAL_1') {
        updated.semi_final_1 = completedMatch;
      }

      if (stage === 'ELIMINATOR' || (stage === 'SEMI_FINAL_2' && updated.eliminator)) {
        updated.eliminator = completedMatch;
      } else if (stage === 'SEMI_FINAL_2') {
        updated.semi_final_2 = completedMatch;
      }

      if (stage === 'QUALIFIER_2') {
        updated.qualifier_2 = completedMatch;
      }

      if (stage === 'THIRD_PLACE') {
        updated.third_place = completedMatch;
        updated.third_place_player_id = winnerId;
      }

      // --- IPL / Page Playoff System Automatic Progression ---
      const q1Done = updated.qualifier_1?.status === 'COMPLETED';
      const elimDone = updated.eliminator?.status === 'COMPLETED';

      // 1. When Qualifier 1 & Eliminator are both finished: Auto-generate Qualifier 2
      // (Loser of Qualifier 1 vs Winner of Eliminator)
      if (q1Done && elimDone) {
        const q1Loser = updated.qualifier_1!.winner_id === updated.qualifier_1!.player_1
          ? updated.qualifier_1!.player_2
          : updated.qualifier_1!.player_1;
        const elimWinner = updated.eliminator!.winner_id!;

        if (
          !updated.qualifier_2 ||
          updated.qualifier_2.player_1 !== q1Loser ||
          updated.qualifier_2.player_2 !== elimWinner
        ) {
          updated.qualifier_2 = {
            id: `playoff_q2_${tournament.id}`,
            tournament_id: tournament.id,
            player_1: q1Loser,
            player_2: elimWinner,
            group: 'Qualifier 2',
            round: 2,
            match_number: 103,
            status: 'UPCOMING',
            stage: 'QUALIFIER_2',
          };
        }
      }

      // 2. When Qualifier 2 is finished: Auto-generate The Final
      // (Winner of Qualifier 1 vs Winner of Qualifier 2)
      const q2Done = updated.qualifier_2?.status === 'COMPLETED';

      if (q1Done && q2Done) {
        const q1Winner = updated.qualifier_1!.winner_id!;
        const q2Winner = updated.qualifier_2!.winner_id!;
        const q2Loser = updated.qualifier_2!.winner_id === updated.qualifier_2!.player_1
          ? updated.qualifier_2!.player_2
          : updated.qualifier_2!.player_1;

        // Loser of Qualifier 2 takes 3rd place overall
        updated.third_place_player_id = q2Loser;

        if (
          !updated.final ||
          updated.final.player_1 !== q1Winner ||
          updated.final.player_2 !== q2Winner
        ) {
          updated.final = {
            id: `playoff_final_${tournament.id}`,
            tournament_id: tournament.id,
            player_1: q1Winner,
            player_2: q2Winner,
            group: 'Grand Championship Final',
            round: 3,
            match_number: 104,
            status: 'UPCOMING',
            stage: 'FINAL',
          };
          tourStatusUpdate = 'FINAL';
          setTournament(t => ({ ...t, status: 'FINAL' }));
        }
      }

      // 3. Final completed -> Crown Champion & Runner-up
      if (stage === 'FINAL') {
        updated.final = completedMatch;
        updated.champion_player_id = winnerId;
        updated.runner_up_player_id = loserId;
        tourStatusUpdate = 'COMPLETED';
        setTournament(t => ({ ...t, status: 'COMPLETED' }));
        sounds.playFanfare();
      }

      // Legacy fallback: if old tournament had semi_final_1 and semi_final_2
      if (
        updated.semi_final_1?.status === 'COMPLETED' &&
        updated.semi_final_2?.status === 'COMPLETED' &&
        !updated.qualifier_1 &&
        !updated.final
      ) {
        const sf1Winner = updated.semi_final_1.winner_id!;
        const sf2Winner = updated.semi_final_2.winner_id!;
        const sf1Loser = updated.semi_final_1.winner_id === updated.semi_final_1.player_1 
          ? updated.semi_final_1.player_2 
          : updated.semi_final_1.player_1;
        const sf2Loser = updated.semi_final_2.winner_id === updated.semi_final_2.player_1 
          ? updated.semi_final_2.player_2 
          : updated.semi_final_2.player_1;

        updated.final = {
          id: `playoff_final_${tournament.id}`,
          tournament_id: tournament.id,
          player_1: sf1Winner,
          player_2: sf2Winner,
          group: 'Grand Final',
          round: 2,
          match_number: 103,
          status: 'UPCOMING',
          stage: 'FINAL',
        };

        updated.third_place = {
          id: `playoff_third_${tournament.id}`,
          tournament_id: tournament.id,
          player_1: sf1Loser,
          player_2: sf2Loser,
          group: 'Third Place Playoff',
          round: 2,
          match_number: 104,
          status: 'UPCOMING',
          stage: 'THIRD_PLACE',
        };

        tourStatusUpdate = 'FINAL';
        setTournament(t => ({ ...t, status: 'FINAL' }));
      }

      const savePayload: { playoffs: PlayoffBracketData; tournament?: Tournament } = {
        playoffs: updated,
      };
      if (tourStatusUpdate) {
        savePayload.tournament = { ...tournament, status: tourStatusUpdate };
      }
      StorageService.saveTournamentState(savePayload).catch(err =>
        console.error('[Storage] Submit playoff result error:', err)
      );

      return updated;
    });
  }, [isAdmin, tournament]);

  const resetTournament = useCallback((mode: 'RESULTS_ONLY' | 'FIXTURES_AND_RESULTS' | 'COMPLETE') => {
    if (!isAdmin) {
      console.warn('[Security] Unauthorized resetTournament attempt blocked');
      return;
    }
    if (mode === 'RESULTS_ONLY') {
      const updatedMatches = StorageService.resetResultsOnly(matches);
      const updatedTour: Tournament = { ...tournament, status: 'LEAGUE' };
      setMatches(updatedMatches);
      setPlayoffs({});
      setTournament(updatedTour);
      StorageService.saveTournamentState({
        matches: updatedMatches,
        playoffs: {},
        tournament: updatedTour,
      }).catch(err => console.error('[Storage] Reset tournament results error:', err));
    } else if (mode === 'FIXTURES_AND_RESULTS') {
      const updatedTour: Tournament = { ...tournament, status: 'SETUP' };
      setMatches([]);
      setPlayoffs({});
      setTournament(updatedTour);
      StorageService.saveTournamentState({
        matches: [],
        playoffs: {},
        tournament: updatedTour,
      }).catch(err => console.error('[Storage] Reset tournament fixtures error:', err));
    } else if (mode === 'COMPLETE') {
      StorageService.clearAllData();
      const freshTournament: Tournament = {
        ...INITIAL_EMPTY_TOURNAMENT,
        id: `tour_${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      setTournament(freshTournament);
      setPlayers([]);
      setMatches([]);
      setPlayoffs({});
      StorageService.saveTournamentState({
        tournament: freshTournament,
        players: [],
        matches: [],
        playoffs: {},
      }).catch(err => console.error('[Storage] Reset tournament complete error:', err));
      setActiveTab('admin');
    }
  }, [isAdmin, matches, tournament, setActiveTab]);

  const exportTournamentData = useCallback((): string => {
    return StorageService.exportBackup(tournament, players, matches, playoffs);
  }, [tournament, players, matches, playoffs]);

  const importTournamentData = useCallback((jsonStr: string): { success: boolean; error?: string } => {
    if (!isAdmin) {
      return { success: false, error: 'Admin login required to import tournament data.' };
    }
    const res = StorageService.validateAndParseBackup(jsonStr);
    if (!res.isValid || !res.backup) {
      return { success: false, error: res.error || 'Invalid backup structure' };
    }
    const b = res.backup;
    setTournament(b.tournament);
    setPlayers(b.players);
    setMatches(b.matches);
    setPlayoffs(b.playoffs || {});
    StorageService.saveTournamentState({
      tournament: b.tournament,
      players: b.players,
      matches: b.matches,
      playoffs: b.playoffs || {},
    }).catch(err => console.error('[Storage] Import tournament error:', err));
    setActiveTab('home');
    return { success: true };
  }, [isAdmin, setActiveTab]);

  const updateRules = useCallback(async (newRules: TournamentRulesData) => {
    setRules(newRules);
    await StorageService.saveRules(newRules);
  }, []);

  const resetRulesToDefault = useCallback(async () => {
    setRules(DEFAULT_TOURNAMENT_RULES);
    await StorageService.saveRules(DEFAULT_TOURNAMENT_RULES);
  }, []);

  return (
    <TournamentContext.Provider
      value={{
        tournament,
        players,
        matches,
        playoffs,
        rules,
        updateRules,
        resetRulesToDefault,
        overallStats,
        groupAStats,
        groupBStats,
        goldenBootLeaders,
        dynamicStats,
        isAdmin,
        isLoading,
        syncStatus,
        activeTab,
        setActiveTab,
        setIsAdmin,
        loginAdmin,
        logoutAdmin,
        changeAdminPassword,
        updateTournament,
        addPlayer,
        updatePlayer,
        removePlayer,
        setPlayersList,
        saveTournamentAndPlayers,
        generateTournamentFixtures,
        submitMatchResult,
        deleteMatchResult,
        updateMatchSchedule,
        startPlayoffs,
        submitPlayoffResult,
        resetTournament,
        importTournamentData,
        exportTournamentData,
        selectedPlayerForProfile,
        setSelectedPlayerForProfile,
        selectedMatchForDetails,
        setSelectedMatchForDetails,
        newGoldenBootLeaderAlert,
        setNewGoldenBootLeaderAlert,
        showQualificationModal,
        setShowQualificationModal,
        isAudioMuted,
        toggleAudio,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};
