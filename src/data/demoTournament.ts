import { Tournament, Player, Match, PlayoffBracketData, PlayerStatistics } from '../types/tournament';
import { generateFixtures } from '../services/fixtureGenerator';

export const INITIAL_EMPTY_TOURNAMENT: Tournament = {
  id: 'tour_attangal_championship',
  tournament_name: 'eFootball Attangal Championship 2026',
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

export const DEMO_TOURNAMENT_ID = 'tour_championship_2026';

export const DEMO_TOURNAMENT: Tournament = {
  id: DEMO_TOURNAMENT_ID,
  tournament_name: 'eFOOTBALL CHAMPIONSHIP 2026',
  status: 'LEAGUE',
  group_format: 'SINGLE',
  same_group_match_frequency: 1,
  other_group_match_frequency: 0,
  qualification_method: 'SINGLE_TOP_4',
  win_points: 3,
  draw_points: 1,
  loss_points: 0,
  created_at: new Date().toISOString(),
};

export const DEMO_PLAYERS: Player[] = [
  {
    id: 'p_elamaran',
    tournament_id: DEMO_TOURNAMENT_ID,
    player_name: 'Elamaran J',
    created_at: new Date().toISOString(),
  },
  {
    id: 'p_arun',
    tournament_id: DEMO_TOURNAMENT_ID,
    player_name: 'Arun',
    created_at: new Date().toISOString(),
  },
  {
    id: 'p_vijay',
    tournament_id: DEMO_TOURNAMENT_ID,
    player_name: 'Vijay',
    created_at: new Date().toISOString(),
  },
  {
    id: 'p_rahul',
    tournament_id: DEMO_TOURNAMENT_ID,
    player_name: 'Rahul',
    created_at: new Date().toISOString(),
  },
  {
    id: 'p_ajay',
    tournament_id: DEMO_TOURNAMENT_ID,
    player_name: 'Ajay',
    created_at: new Date().toISOString(),
  },
  {
    id: 'p_hari',
    tournament_id: DEMO_TOURNAMENT_ID,
    player_name: 'Hari',
    created_at: new Date().toISOString(),
  },
  {
    id: 'p_bharath',
    tournament_id: DEMO_TOURNAMENT_ID,
    player_name: 'Bharath M',
    created_at: new Date().toISOString(),
  },
  {
    id: 'p_bala',
    tournament_id: DEMO_TOURNAMENT_ID,
    player_name: 'Bala',
    created_at: new Date().toISOString(),
  },
];

/**
 * Generates demo matches reflecting the reference table:
 * 12 completed matches, 16 remaining (total 28 matches = 8 * 7 / 2 = 28 single round robin matches).
 */
export function createDemoMatches(): Match[] {
  const allFixtures = generateFixtures(
    DEMO_TOURNAMENT_ID,
    DEMO_PLAYERS,
    'SINGLE',
    1,
    0
  );

  // Pre-seed completed matches matching the screenshot standings exactly:
  // Elamaran J: 3 MP, 3 W, 0 D, 0 L, 9 GF, 1 GA, +8 GD, 9 PTS
  // Arun: 3 MP, 2 W, 0 D, 1 L, 6 GF, 3 GA, +3 GD, 6 PTS
  // Vijay: 3 MP, 1 W, 1 D, 1 L, 4 GF, 3 GA, +1 GD, 4 PTS
  // Rahul: 3 MP, 1 W, 1 D, 1 L, 3 GF, 3 GA, 0 GD, 4 PTS
  // Ajay: 3 MP, 1 W, 0 D, 2 L, 2 GF, 5 GA, -3 GD, 3 PTS
  // Hari: 3 MP, 0 W, 2 D, 1 L, 2 GF, 4 GA, -2 GD, 2 PTS
  // Bharath M: 3 MP, 0 W, 1 D, 2 L, 1 GF, 6 GA, -5 GD, 1 PTS
  // Bala: 3 MP, 0 W, 1 D, 2 L, 1 GF, 6 GA, -5 GD, 1 PTS
  const demoResults: Record<number, { s1: number; s2: number }> = {
    1: { s1: 3, s2: 1 }, // Elamaran vs Arun (3-1)
    2: { s1: 1, s2: 1 }, // Vijay vs Rahul (1-1)
    3: { s1: 1, s2: 0 }, // Ajay vs Bharath M (1-0)
    4: { s1: 1, s2: 1 }, // Hari vs Bala (1-1)
    5: { s1: 4, s2: 0 }, // Elamaran vs Ajay (4-0)
    6: { s1: 3, s2: 1 }, // Arun vs Vijay (3-1)
    7: { s1: 1, s2: 0 }, // Rahul vs Bala (1-0)
    8: { s1: 1, s2: 1 }, // Hari vs Bharath M (1-1)
    9: { s1: 2, s2: 0 }, // Elamaran vs Hari (2-0)
    10: { s1: 2, s2: 0 }, // Arun vs Bharath M (2-0)
    11: { s1: 2, s2: 0 }, // Vijay vs Ajay (2-0)
    12: { s1: 1, s2: 1 }, // Rahul vs Bala -> Rahul vs Hari (1-1)
  };

  const scheduleMeta: Record<number, { p1?: string; p2?: string; date: string; time: string }> = {
    13: { p1: 'p_arun', p2: 'p_vijay', date: 'Sep 12', time: '6:00 PM' },
    14: { p1: 'p_rahul', p2: 'p_hari', date: 'Sep 12', time: '6:30 PM' },
    15: { p1: 'p_ajay', p2: 'p_bala', date: 'Sep 13', time: '5:00 PM' },
    16: { p1: 'p_elamaran', p2: 'p_bharath', date: 'Sep 13', time: '6:00 PM' },
  };

  return allFixtures.map((match) => {
    if (demoResults[match.match_number]) {
      const res = demoResults[match.match_number];
      return {
        ...match,
        player_1_score: res.s1,
        player_2_score: res.s2,
        status: 'COMPLETED',
        completed_at: new Date(Date.now() - (100 - match.match_number) * 3600000).toISOString(),
        winner_id: res.s1 > res.s2 ? match.player_1 : res.s2 > res.s1 ? match.player_2 : null,
      };
    }
    const sched = scheduleMeta[match.match_number] || {
      date: `Sep ${14 + Math.floor(match.match_number / 4)}`,
      time: `${5 + (match.match_number % 4)}:30 PM`
    };
    return {
      ...match,
      player_1: sched.p1 || match.player_1,
      player_2: sched.p2 || match.player_2,
      date: sched.date,
      time: sched.time,
      location: 'eFootball Main Stadium',
      status: 'UPCOMING',
    };
  });
}

export const DEMO_PLAYOFFS: PlayoffBracketData = {};

export const REFERENCE_STANDINGS: PlayerStatistics[] = [
  {
    player_id: 'p_elamaran',
    player_name: 'Elamaran J',
    matches_played: 3,
    wins: 3,
    draws: 0,
    losses: 0,
    goals_for: 9,
    goals_against: 1,
    goal_difference: 8,
    points: 9,
    total_goals: 9,
    goals_per_match: 3,
    win_percentage: 100,
    rank: 1,
    golden_boot_rank: 1,
    best_player_rating: 9.8,
    is_qualified: true,
    form: ['W', 'W', 'W'],
  },
  {
    player_id: 'p_arun',
    player_name: 'Arun',
    matches_played: 3,
    wins: 2,
    draws: 0,
    losses: 1,
    goals_for: 6,
    goals_against: 3,
    goal_difference: 3,
    points: 6,
    total_goals: 6,
    goals_per_match: 2,
    win_percentage: 67,
    rank: 2,
    golden_boot_rank: 2,
    best_player_rating: 8.5,
    is_qualified: true,
    form: ['W', 'W', 'L'],
  },
  {
    player_id: 'p_vijay',
    player_name: 'Vijay',
    matches_played: 3,
    wins: 1,
    draws: 1,
    losses: 1,
    goals_for: 4,
    goals_against: 3,
    goal_difference: 1,
    points: 4,
    total_goals: 5,
    goals_per_match: 1.67,
    win_percentage: 33,
    rank: 3,
    golden_boot_rank: 3,
    best_player_rating: 8.0,
    is_qualified: true,
    form: ['W', 'D', 'L'],
  },
  {
    player_id: 'p_rahul',
    player_name: 'Rahul',
    matches_played: 3,
    wins: 1,
    draws: 1,
    losses: 1,
    goals_for: 3,
    goals_against: 3,
    goal_difference: 0,
    points: 4,
    total_goals: 4,
    goals_per_match: 1.33,
    win_percentage: 33,
    rank: 4,
    golden_boot_rank: 4,
    best_player_rating: 7.8,
    is_qualified: true,
    form: ['D', 'W', 'L'],
  },
  {
    player_id: 'p_ajay',
    player_name: 'Ajay',
    matches_played: 3,
    wins: 1,
    draws: 0,
    losses: 2,
    goals_for: 2,
    goals_against: 5,
    goal_difference: -3,
    points: 3,
    total_goals: 3,
    goals_per_match: 1,
    win_percentage: 33,
    rank: 5,
    golden_boot_rank: 5,
    best_player_rating: 7.2,
    is_qualified: false,
    form: ['L', 'W', 'L'],
  },
  {
    player_id: 'p_hari',
    player_name: 'Hari',
    matches_played: 3,
    wins: 0,
    draws: 2,
    losses: 1,
    goals_for: 2,
    goals_against: 4,
    goal_difference: -2,
    points: 2,
    total_goals: 3,
    goals_per_match: 1,
    win_percentage: 0,
    rank: 6,
    golden_boot_rank: 6,
    best_player_rating: 6.9,
    is_qualified: false,
    form: ['D', 'D', 'L'],
  },
  {
    player_id: 'p_bharath',
    player_name: 'Bharath M',
    matches_played: 3,
    wins: 0,
    draws: 1,
    losses: 2,
    goals_for: 1,
    goals_against: 6,
    goal_difference: -5,
    points: 1,
    total_goals: 1,
    goals_per_match: 0.33,
    win_percentage: 0,
    rank: 7,
    golden_boot_rank: 7,
    best_player_rating: 6.5,
    is_qualified: false,
    form: ['L', 'D', 'L'],
  },
  {
    player_id: 'p_bala',
    player_name: 'Bala',
    matches_played: 3,
    wins: 0,
    draws: 1,
    losses: 2,
    goals_for: 1,
    goals_against: 6,
    goal_difference: -5,
    points: 1,
    total_goals: 1,
    goals_per_match: 0.33,
    win_percentage: 0,
    rank: 8,
    golden_boot_rank: 8,
    best_player_rating: 6.5,
    is_qualified: false,
    form: ['L', 'D', 'L'],
  },
];

