import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Tournament, 
  Player, 
  Match, 
  PlayoffBracketData, 
  PlayerStatistics, 
  DynamicTournamentStats,
  GroupFormat,
  QualificationMethod
} from '../types/tournament';
import { StorageService } from '../services/storage';
import { recalculateTournamentState } from '../services/statsCalculator';
import { generateFixtures } from '../services/fixtureGenerator';
import { DEMO_TOURNAMENT, DEMO_PLAYERS, createDemoMatches, DEMO_PLAYOFFS } from '../data/demoTournament';
import { sounds } from '../services/soundEffects';

interface TournamentContextType {
  tournament: Tournament;
  players: Player[];
  matches: Match[];
  playoffs: PlayoffBracketData;
  overallStats: PlayerStatistics[];
  groupAStats: PlayerStatistics[];
  groupBStats: PlayerStatistics[];
  goldenBootLeaders: PlayerStatistics[];
  dynamicStats: DynamicTournamentStats;
  isAdmin: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  // Admin actions
  setIsAdmin: (status: boolean) => void;
  loginAdmin: (pin: string) => boolean;
  logoutAdmin: () => void;
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
  // Load state from Storage or fall back to rich Demo Tournament
  const [tournament, setTournament] = useState<Tournament>(() => {
    const loaded = StorageService.loadTournament();
    if (!loaded || loaded.id === 'tour_attangal_2026') return DEMO_TOURNAMENT;
    return loaded;
  });

  const [players, setPlayers] = useState<Player[]>(() => {
    const tour = StorageService.loadTournament();
    if (!tour || tour.id === 'tour_attangal_2026') return DEMO_PLAYERS;
    const loaded = StorageService.loadPlayers();
    return loaded.length > 0 ? loaded : DEMO_PLAYERS;
  });

  const [matches, setMatches] = useState<Match[]>(() => {
    const tour = StorageService.loadTournament();
    if (!tour || tour.id === 'tour_attangal_2026') return createDemoMatches();
    const loaded = StorageService.loadMatches();
    return loaded.length > 0 ? loaded : createDemoMatches();
  });

  const [playoffs, setPlayoffs] = useState<PlayoffBracketData>(() => {
    const tour = StorageService.loadTournament();
    if (!tour || tour.id === 'tour_attangal_2026') return DEMO_PLAYOFFS;
    return StorageService.loadPlayoffs() || DEMO_PLAYOFFS;
  });

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

  // Sync to Storage on changes
  useEffect(() => {
    StorageService.saveTournament(tournament);
  }, [tournament]);

  useEffect(() => {
    StorageService.savePlayers(players);
  }, [players]);

  useEffect(() => {
    StorageService.saveMatches(matches);
  }, [matches]);

  useEffect(() => {
    StorageService.savePlayoffs(playoffs);
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
    const savedPin = StorageService.getAdminPin();
    if (pin === savedPin || pin === 'admin123') {
      setIsAdmin(true);
      StorageService.setAdminLoggedIn(true);
      return true;
    }
    return false;
  }, []);

  const logoutAdmin = useCallback(() => {
    setIsAdmin(false);
    StorageService.setAdminLoggedIn(false);
  }, []);

  const updateTournament = useCallback((updates: Partial<Tournament>) => {
    setTournament(prev => ({ ...prev, ...updates }));
  }, []);

  const addPlayer = useCallback((name: string, photo?: string, group?: string) => {
    const newPlayer: Player = {
      id: `p_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      tournament_id: tournament.id,
      player_name: name.trim(),
      player_photo: photo,
      group_name: group || (tournament.group_format === 'TWO_GROUPS' ? 'Group A' : undefined),
      created_at: new Date().toISOString(),
    };
    setPlayers(prev => [...prev, newPlayer]);
  }, [tournament.id, tournament.group_format]);

  const updatePlayer = useCallback((id: string, updates: Partial<Player>) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const removePlayer = useCallback((id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
  }, []);

  const setPlayersList = useCallback((newPlayers: Player[]) => {
    setPlayers(newPlayers);
  }, []);

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

    setMatches(generated);
    setPlayoffs({});
    setTournament(prev => ({ ...prev, ...activeTournament, status: 'LEAGUE' }));
    return { success: true };
  }, [players, tournament]);

  const submitMatchResult = useCallback((
    matchId: string, 
    s1: number, 
    s2: number, 
    pens1?: number, 
    pens2?: number
  ) => {
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
  }, [updatePrevRanks]);

  const deleteMatchResult = useCallback((matchId: string) => {
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
  }, [updatePrevRanks]);

  const updateMatchSchedule = useCallback((
    matchId: string, 
    date?: string, 
    time?: string, 
    location?: string, 
    status?: Match['status']
  ) => {
    setMatches(prev => prev.map(m => {
      if (m.id !== matchId) return m;
      return {
        ...m,
        date: date !== undefined ? date : m.date,
        time: time !== undefined ? time : m.time,
        location: location !== undefined ? location : m.location,
        status: status || m.status,
      };
    }));
  }, []);

  // Starting Playoffs (Top 4 bracket)
  const startPlayoffs = useCallback((): { success: boolean; error?: string } => {
    const leagueMatches = matches.filter(m => m.stage === 'LEAGUE');
    const incomplete = leagueMatches.filter(m => m.status !== 'COMPLETED');
    if (incomplete.length > 0) {
      return { success: false, error: `Cannot start playoffs: ${incomplete.length} league matches are still incomplete.` };
    }

    let qualifiedIds: string[] = [];

    if (tournament.group_format === 'SINGLE' || tournament.qualification_method === 'TWO_GROUPS_OVERALL_TOP_4') {
      qualifiedIds = overallStats.slice(0, 4).map(s => s.player_id);
    } else if (tournament.qualification_method === 'TWO_GROUPS_TOP_2_EACH') {
      const topA = groupAStats.slice(0, 2).map(s => s.player_id);
      const topB = groupBStats.slice(0, 2).map(s => s.player_id);
      if (topA.length < 2 || topB.length < 2) {
        return { success: false, error: 'Not enough qualified players in Group A or B.' };
      }
      // Semi Final 1: A1 vs B2
      // Semi Final 2: B1 vs A2
      qualifiedIds = [topA[0], topB[1], topB[0], topA[1]];
    } else if (tournament.qualification_method === 'TWO_GROUPS_CUSTOM') {
      const kA = tournament.custom_qualify_group_a ?? 2;
      const kB = tournament.custom_qualify_group_b ?? 2;
      const topA = groupAStats.slice(0, kA).map(s => s.player_id);
      const topB = groupBStats.slice(0, kB).map(s => s.player_id);
      qualifiedIds = [...topA, ...topB].slice(0, 4);
    }

    if (qualifiedIds.length < 4) {
      return { success: false, error: 'Exactly 4 qualified players are required to start the Semi Finals.' };
    }

    let sf1P1: string, sf1P2: string, sf2P1: string, sf2P2: string;

    if (tournament.qualification_method === 'TWO_GROUPS_TOP_2_EACH') {
      sf1P1 = qualifiedIds[0]; // A1
      sf1P2 = qualifiedIds[1]; // B2
      sf2P1 = qualifiedIds[2]; // B1
      sf2P2 = qualifiedIds[3]; // A2
    } else {
      // 1 vs 4, 2 vs 3
      sf1P1 = qualifiedIds[0];
      sf1P2 = qualifiedIds[3];
      sf2P1 = qualifiedIds[1];
      sf2P2 = qualifiedIds[2];
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
  }, [matches, tournament, overallStats, groupAStats, groupBStats]);

  // Submit playoff result and advance winners
  const submitPlayoffResult = useCallback((
    stage: 'SEMI_FINAL_1' | 'SEMI_FINAL_2' | 'FINAL' | 'THIRD_PLACE',
    s1: number,
    s2: number,
    p1Pens?: number,
    p2Pens?: number
  ) => {
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

      // If both semi-finals are completed, auto-generate Final and 3rd Place match!
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
  }, [tournament.id]);

  // 3-tier Reset
  const resetTournament = useCallback((mode: 'RESULTS_ONLY' | 'FIXTURES_AND_RESULTS' | 'COMPLETE') => {
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
        id: `tour_${Date.now()}`,
        tournament_name: 'New eFootball Championship',
        status: 'SETUP',
        group_format: 'SINGLE',
        same_group_match_frequency: 1,
        other_group_match_frequency: 0,
        qualification_method: 'SINGLE_TOP_4',
        win_points: 3,
        draw_points: 1,
        loss_points: 0,
        created_at: new Date().toISOString(),
      };
      setTournament(freshTournament);
      setPlayers([]);
      setMatches([]);
      setPlayoffs({});
      setActiveTab('admin');
    }
  }, []);

  const exportTournamentData = useCallback((): string => {
    return StorageService.exportBackup(tournament, players, matches, playoffs);
  }, [tournament, players, matches, playoffs]);

  const importTournamentData = useCallback((jsonStr: string): { success: boolean; error?: string } => {
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
  }, []);

  return (
    <TournamentContext.Provider
      value={{
        tournament,
        players,
        matches,
        playoffs,
        overallStats,
        groupAStats,
        groupBStats,
        goldenBootLeaders,
        dynamicStats,
        isAdmin,
        activeTab,
        setActiveTab,
        setIsAdmin,
        loginAdmin,
        logoutAdmin,
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
