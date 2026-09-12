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
  generateTournamentFixtures: (customTournament?: Tournament, customPlayers?: Player[]) => { success: boolean; error?: string };
  submitMatchResult: (matchId: string, s1: number, s2: number, pens1?: number, pens2?: number) => void;
  deleteMatchResult: (matchId: string) => void;
  updateMatchSchedule: (matchId: string, date?: string, time?: string, location?: string, status?: Match['status']) => void;
  startPlayoffs: () => { success: boolean; error?: string };
  submitPlayoffResult: (stage: 'SEMI_FINAL_1' | 'SEMI_FINAL_2' | 'FINAL' | 'THIRD_PLACE', s1: number, s2: number, p1Pens?: number, p2Pens?: number) => void;
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
  const [tournament, setTournament] = useState<Tournament>(INITIAL_EMPTY_TOURNAMENT);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [playoffs, setPlayoffs] = useState<PlayoffBracketData>({});
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

  // 1. Initial Firestore Setup & Real-time Subscription
  useEffect(() => {
    let isMounted = true;

    async function initFirestore() {
      try {
        // Purge any legacy localStorage mock data
        const localT = localStorage.getItem('fifa_tournament');
        if (localT && (localT.includes(DEMO_TOURNAMENT_ID) || localT.includes('p_bharath'))) {
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
          const isLegacyMock = data.tournament?.id === DEMO_TOURNAMENT_ID || data.players?.some(p => p.id === 'p_bharath');
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
          if (data.adminPin) setAdminPin(data.adminPin);

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

  // 2. Synchronize local state mutations to Firestore (suppressed during remote onSnapshot updates)
  useEffect(() => {
    if (!hasInitialized.current || isRemoteSyncing.current) return;
    StorageService.saveTournament(tournament).catch(err => console.error('[Storage] Save tournament error:', err));
  }, [tournament]);

  useEffect(() => {
    if (!hasInitialized.current || isRemoteSyncing.current) return;
    StorageService.savePlayers(players).catch(err => console.error('[Storage] Save players error:', err));
  }, [players]);

  useEffect(() => {
    if (!hasInitialized.current || isRemoteSyncing.current) return;
    StorageService.saveMatches(matches).catch(err => console.error('[Storage] Save matches error:', err));
  }, [matches]);

  useEffect(() => {
    if (!hasInitialized.current || isRemoteSyncing.current) return;
    StorageService.savePlayoffs(playoffs).catch(err => console.error('[Storage] Save playoffs error:', err));
  }, [playoffs]);

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
        setTournament(prev => ({ ...prev, status: 'QUALIFICATION' }));
        setShowQualificationModal(true);
        sounds.playFanfare();
      }
    }
  }, [matches, tournament.status]);

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
    setAdminPin(cleanPin);
    try {
      await StorageService.setAdminPin(cleanPin);
      return { success: true };
    } catch (err: any) {
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
    setTournament(prev => ({ ...prev, ...updates }));
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
      player_photo: photo,
      group_name: group || (tournament.group_format === 'TWO_GROUPS' ? 'Group A' : undefined),
      created_at: new Date().toISOString(),
    };
    setPlayers(prev => [...prev, newPlayer]);
  }, [isAdmin, tournament.id, tournament.group_format]);

  const updatePlayer = useCallback((id: string, updates: Partial<Player>) => {
    if (!isAdmin) {
      console.warn('[Security] Unauthorized updatePlayer attempt blocked');
      return;
    }
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, [isAdmin]);

  const removePlayer = useCallback((id: string) => {
    if (!isAdmin) {
      console.warn('[Security] Unauthorized removePlayer attempt blocked');
      return;
    }
    setPlayers(prev => prev.filter(p => p.id !== id));
  }, [isAdmin]);

  const setPlayersList = useCallback((newPlayers: Player[]) => {
    if (!isAdmin) {
      console.warn('[Security] Unauthorized setPlayersList attempt blocked');
      return;
    }
    setPlayers(newPlayers);
    StorageService.saveTournamentState({ players: newPlayers }).catch(err =>
      console.error('[Storage] Save players list error:', err)
    );
  }, [isAdmin]);

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

    setPlayers(activePlayers);
    setMatches(generated);
    setPlayoffs({});
    setTournament(updatedTour);

    // Save atomically so Firestore snapshot cannot receive partial/out-of-order updates
    StorageService.saveTournamentState({
      tournament: updatedTour,
      players: activePlayers,
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

    setMatches(prev => prev.map(m => {
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
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
      };
    }));
  }, [isAdmin, updatePrevRanks]);

  const deleteMatchResult = useCallback((matchId: string) => {
    if (!isAdmin) {
      console.warn('[Security] Unauthorized deleteMatchResult attempt blocked');
      return;
    }
    updatePrevRanks();
    setMatches(prev => prev.map(m => {
      if (m.id !== matchId) return m;
      return {
        ...m,
        player_1_score: null,
        player_2_score: null,
        penalties_played: false,
        player_1_penalty_score: null,
        player_2_penalty_score: null,
        winner_id: null,
        status: 'UPCOMING',
        completed_at: undefined,
      };
    }));
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
    setMatches(prev => prev.map(m => {
      if (m.id !== matchId) return m;
      return {
        ...m,
        date: date !== undefined ? date : m.date,
        time: time !== undefined ? time : m.time,
        location: location !== undefined ? location : m.location,
        status: status !== undefined ? status : m.status,
      };
    }));
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
        top4 = [...topA, ...topB];
      } else {
        top4 = overallStats.slice(0, 4);
      }
    }

    if (top4.length < 4) {
      return { success: false, error: 'At least 4 contenders are required for playoffs.' };
    }

    let sf1P1 = top4[0].player_id;
    let sf1P2 = top4[3].player_id;
    let sf2P1 = top4[1].player_id;
    let sf2P2 = top4[2].player_id;

    if (tournament.group_format === 'TWO_GROUPS' && tournament.qualification_method === 'TWO_GROUPS_TOP_2_EACH') {
      const topA = groupAStats.slice(0, 2);
      const topB = groupBStats.slice(0, 2);
      if (topA.length >= 2 && topB.length >= 2) {
        sf1P1 = topA[0].player_id;
        sf1P2 = topB[1].player_id;
        sf2P1 = topB[0].player_id;
        sf2P2 = topA[1].player_id;
      }
    }

    const sf1: Match = {
      id: `playoff_sf1_${tournament.id}`,
      tournament_id: tournament.id,
      player_1: sf1P1,
      player_2: sf1P2,
      group: 'Semi Final 1',
      round: 1,
      match_number: 101,
      status: 'UPCOMING',
      stage: 'SEMI_FINAL',
    };

    const sf2: Match = {
      id: `playoff_sf2_${tournament.id}`,
      tournament_id: tournament.id,
      player_1: sf2P1,
      player_2: sf2P2,
      group: 'Semi Final 2',
      round: 1,
      match_number: 102,
      status: 'UPCOMING',
      stage: 'SEMI_FINAL',
    };

    setPlayoffs({
      semi_final_1: sf1,
      semi_final_2: sf2,
    });

    setTournament(prev => ({ ...prev, status: 'SEMI_FINALS' }));
    setActiveTab('playoffs');
    return { success: true };
  }, [isAdmin, matches, tournament, overallStats, groupAStats, groupBStats, setActiveTab]);

  const submitPlayoffResult = useCallback((
    stage: 'SEMI_FINAL_1' | 'SEMI_FINAL_2' | 'FINAL' | 'THIRD_PLACE',
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

      if (stage === 'SEMI_FINAL_1') matchToUpdate = updated.semi_final_1;
      else if (stage === 'SEMI_FINAL_2') matchToUpdate = updated.semi_final_2;
      else if (stage === 'FINAL') matchToUpdate = updated.final;
      else if (stage === 'THIRD_PLACE') matchToUpdate = updated.third_place;

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

      if (stage === 'SEMI_FINAL_1') updated.semi_final_1 = completedMatch;
      if (stage === 'SEMI_FINAL_2') updated.semi_final_2 = completedMatch;
      if (stage === 'FINAL') {
        updated.final = completedMatch;
        updated.champion_player_id = winnerId;
        updated.runner_up_player_id = loserId;
        setTournament(t => ({ ...t, status: 'COMPLETED' }));
        sounds.playFanfare();
      }
      if (stage === 'THIRD_PLACE') {
        updated.third_place = completedMatch;
        updated.third_place_player_id = winnerId;
      }

      // If both semi-finals are completed, auto-generate Final and 3rd Place match
      if (
        updated.semi_final_1?.status === 'COMPLETED' &&
        updated.semi_final_2?.status === 'COMPLETED' &&
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

        setTournament(t => ({ ...t, status: 'FINAL' }));
      }

      return updated;
    });
  }, [isAdmin, tournament.id]);

  const resetTournament = useCallback((mode: 'RESULTS_ONLY' | 'FIXTURES_AND_RESULTS' | 'COMPLETE') => {
    if (!isAdmin) {
      console.warn('[Security] Unauthorized resetTournament attempt blocked');
      return;
    }
    if (mode === 'RESULTS_ONLY') {
      setMatches(prev => StorageService.resetResultsOnly(prev));
      setPlayoffs({});
      setTournament(prev => ({ ...prev, status: 'LEAGUE' }));
    } else if (mode === 'FIXTURES_AND_RESULTS') {
      setMatches([]);
      setPlayoffs({});
      setTournament(prev => ({ ...prev, status: 'SETUP' }));
    } else if (mode === 'COMPLETE') {
      StorageService.clearAllData();
      const freshTournament: Tournament = {
        ...INITIAL_EMPTY_TOURNAMENT,
        id: `tour_${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      StorageService.saveTournament(freshTournament);
      StorageService.savePlayers([]);
      StorageService.saveMatches([]);
      StorageService.savePlayoffs({});
      setTournament(freshTournament);
      setPlayers([]);
      setMatches([]);
      setPlayoffs({});
      setActiveTab('admin');
    }
  }, [isAdmin, setActiveTab]);

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
