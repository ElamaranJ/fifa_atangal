import { 
  Tournament, 
  Player, 
  Match, 
  PlayerStatistics, 
  DynamicTournamentStats 
} from '../types/tournament';

/**
 * Calculates head-to-head points between two players from completed matches.
 */
function getHeadToHeadPoints(
  p1Id: string, 
  p2Id: string, 
  completedMatches: Match[],
  winPts: number,
  drawPts: number
): { p1Points: number; p2Points: number } {
  let p1Points = 0;
  let p2Points = 0;

  for (const m of completedMatches) {
    if ((m.player_1 === p1Id && m.player_2 === p2Id) || (m.player_1 === p2Id && m.player_2 === p1Id)) {
      if (m.player_1_score !== null && m.player_1_score !== undefined &&
          m.player_2_score !== null && m.player_2_score !== undefined) {
        const s1 = m.player_1 === p1Id ? m.player_1_score : m.player_2_score;
        const s2 = m.player_1 === p1Id ? m.player_2_score : m.player_1_score;

        if (s1 > s2) {
          p1Points += winPts;
        } else if (s2 > s1) {
          p2Points += winPts;
        } else {
          p1Points += drawPts;
          p2Points += drawPts;
        }
      }
    }
  }

  return { p1Points, p2Points };
}

/**
 * Calculate composite Best Player performance rating (0.0 to 10.0 scale)
 * Combines points efficiency, win rate, goal difference, and offensive output.
 */
function calculateBestPlayerRating(
  matchesPlayed: number,
  points: number,
  wins: number,
  goalDiff: number,
  goalsScored: number,
  winPts: number
): number {
  if (matchesPlayed === 0) return 6.0;

  const maxPossiblePoints = matchesPlayed * winPts;
  const pointsFactor = maxPossiblePoints > 0 ? (points / maxPossiblePoints) * 4.0 : 0; // up to 4.0
  const winRateFactor = (wins / matchesPlayed) * 2.5; // up to 2.5
  const gdPerMatch = goalDiff / matchesPlayed;
  const gdFactor = Math.max(-1.5, Math.min(2.0, gdPerMatch * 0.8)); // -1.5 to +2.0
  const goalsPerMatch = goalsScored / matchesPlayed;
  const goalFactor = Math.min(1.5, goalsPerMatch * 0.4); // up to 1.5

  const base = 5.0;
  const rawScore = base + pointsFactor + winRateFactor + gdFactor + goalFactor;
  const clamped = Math.max(1.0, Math.min(10.0, rawScore));
  return Number(clamped.toFixed(1));
}

/**
 * Primary calculation engine: Computes all statistics deterministically from raw state.
 */
export function recalculateTournamentState(
  tournament: Tournament,
  players: Player[],
  matches: Match[],
  previousStatsMap?: Map<string, number> // Map<playerId, previousRank>
): {
  overallStats: PlayerStatistics[];
  groupAStats: PlayerStatistics[];
  groupBStats: PlayerStatistics[];
  goldenBootLeaders: PlayerStatistics[];
  dynamicStats: DynamicTournamentStats;
} {
  const completedLeagueMatches = matches.filter((m) => {
    const isCompleted = m.status === 'COMPLETED';
    const hasScores = 
      m.player_1_score !== null && m.player_1_score !== undefined &&
      m.player_2_score !== null && m.player_2_score !== undefined &&
      !isNaN(Number(m.player_1_score)) && !isNaN(Number(m.player_2_score));
    const isLeagueMatch = m.stage === 'LEAGUE';
    return isCompleted && hasScores && isLeagueMatch;
  });

  // Initialize stats dictionary for all players
  const statsDict: Record<string, PlayerStatistics> = {};

  players.forEach((p) => {
    statsDict[p.id] = {
      player_id: p.id,
      player_name: p.player_name,
      player_photo: p.player_photo,
      group_name: p.group_name,
      matches_played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0,
      points: 0,
      total_goals: 0,
      goals_per_match: 0,
      win_percentage: 0,
      rank: 0,
      golden_boot_rank: 0,
      best_player_rating: 6.0,
      is_qualified: false,
      form: [],
    };
  });

  // Tally matches in chronological order for form tracking
  const sortedCompleted = [...completedLeagueMatches].sort(
    (a, b) => a.match_number - b.match_number
  );

  const winPts = Number(tournament.win_points ?? 3);
  const drawPts = Number(tournament.draw_points ?? 1);
  const lossPts = Number(tournament.loss_points ?? 0);

  sortedCompleted.forEach((m) => {
    const p1 = statsDict[m.player_1];
    const p2 = statsDict[m.player_2];
    if (!p1 || !p2) return;

    const s1 = Number(m.player_1_score ?? 0);
    const s2 = Number(m.player_2_score ?? 0);

    p1.matches_played += 1;
    p2.matches_played += 1;

    p1.goals_for += s1;
    p1.goals_against += s2;
    p2.goals_for += s2;
    p2.goals_against += s1;

    if (s1 > s2) {
      p1.wins += 1;
      p1.points += winPts;
      p1.form.push('W');

      p2.losses += 1;
      p2.points += lossPts;
      p2.form.push('L');
    } else if (s2 > s1) {
      p2.wins += 1;
      p2.points += winPts;
      p2.form.push('W');

      p1.losses += 1;
      p1.points += lossPts;
      p1.form.push('L');
    } else {
      p1.draws += 1;
      p2.draws += 1;
      p1.points += drawPts;
      p2.points += drawPts;
      p1.form.push('D');
      p2.form.push('D');
    }
  });

  // Finalize aggregate metrics for each player
  Object.values(statsDict).forEach((s) => {
    s.goal_difference = s.goals_for - s.goals_against;
    s.total_goals = s.goals_for;
    s.goals_per_match = s.matches_played > 0 ? Number((s.goals_for / s.matches_played).toFixed(2)) : 0;
    s.win_percentage = s.matches_played > 0 ? Math.round((s.wins / s.matches_played) * 100) : 0;
    s.form = s.form.slice(-5); // Keep last 5 matches
    s.best_player_rating = calculateBestPlayerRating(
      s.matches_played,
      s.points,
      s.wins,
      s.goal_difference,
      s.goals_for,
      winPts
    );
  });

  // Custom sort function adhering to tournament rules:
  // 1. Points, 2. GD, 3. GF, 4. Head-to-head, 5. Wins
  const sortComparator = (a: PlayerStatistics, b: PlayerStatistics): number => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
    if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;

    // Head to head
    const h2h = getHeadToHeadPoints(a.player_id, b.player_id, sortedCompleted, winPts, drawPts);
    if (h2h.p1Points !== h2h.p2Points) return h2h.p2Points - h2h.p1Points;

    return b.wins - a.wins;
  };

  // Overall Standings - CLONE each object to prevent cross-contamination
  const overallStats = Object.values(statsDict)
    .map(s => ({ ...s }))
    .sort(sortComparator);

  overallStats.forEach((s, idx) => {
    s.rank = idx + 1;
    if (previousStatsMap && previousStatsMap.has(s.player_id)) {
      const prev = previousStatsMap.get(s.player_id)!;
      s.previous_rank = prev;
      if (s.rank < prev) {
        s.rank_change = 'UP';
      } else if (s.rank > prev) {
        s.rank_change = 'DOWN';
      } else {
        s.rank_change = 'SAME';
      }
    }
  });

  // Group A & Group B Standings - CLONE each object to preserve independent ranks
  const groupAStats = Object.values(statsDict)
    .filter(s => s.group_name === 'Group A')
    .map(s => ({ ...s }))
    .sort(sortComparator);

  groupAStats.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  const groupBStats = Object.values(statsDict)
    .filter(s => s.group_name === 'Group B')
    .map(s => ({ ...s }))
    .sort(sortComparator);

  groupBStats.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  // Qualification tagging based on method:
  // Top 4 in overall standings are always qualified for playoffs
  overallStats.slice(0, 4).forEach(s => { s.is_qualified = true; });

  if (tournament.qualification_method === 'TWO_GROUPS_TOP_2_EACH') {
    groupAStats.slice(0, 2).forEach(s => { s.is_qualified = true; });
    groupBStats.slice(0, 2).forEach(s => { s.is_qualified = true; });
  } else if (tournament.qualification_method === 'TWO_GROUPS_CUSTOM') {
    const kA = tournament.custom_qualify_group_a ?? 2;
    const kB = tournament.custom_qualify_group_b ?? 2;
    groupAStats.slice(0, kA).forEach(s => { s.is_qualified = true; });
    groupBStats.slice(0, kB).forEach(s => { s.is_qualified = true; });
    const qIds = new Set([
      ...groupAStats.slice(0, kA).map(s => s.player_id),
      ...groupBStats.slice(0, kB).map(s => s.player_id),
    ]);
    overallStats.forEach(s => {
      if (qIds.has(s.player_id)) s.is_qualified = true;
    });
  }

  // Golden Boot Rankings (Requirement 8):
  // Sort: Total Goals (desc) -> Matches Played (asc) -> Goals Per Match (desc)
  const goldenBootList = [...Object.values(statsDict)].sort((a, b) => {
    if (b.total_goals !== a.total_goals) return b.total_goals - a.total_goals;
    if (a.matches_played !== b.matches_played) return a.matches_played - b.matches_played;
    return b.goals_per_match - a.goals_per_match;
  });

  // Assign Golden Boot ranks and detect ties
  let currentRank = 1;
  for (let i = 0; i < goldenBootList.length; i++) {
    if (i > 0) {
      const prev = goldenBootList[i - 1];
      const curr = goldenBootList[i];
      const isExactTie = 
        curr.total_goals === prev.total_goals &&
        curr.matches_played === prev.matches_played &&
        curr.goals_per_match === prev.goals_per_match;

      if (isExactTie) {
        curr.golden_boot_rank = prev.golden_boot_rank;
        curr.is_joint_golden_boot = true;
        prev.is_joint_golden_boot = true;
      } else {
        currentRank = i + 1;
        curr.golden_boot_rank = currentRank;
      }
    } else {
      goldenBootList[0].golden_boot_rank = 1;
    }
  }

  // Dynamic Overall Stats
  const totalGoals = completedLeagueMatches.reduce(
    (acc, m) => acc + (m.player_1_score || 0) + (m.player_2_score || 0),
    0
  );
  const totalMatches = matches.filter(m => m.stage === 'LEAGUE').length;
  const completedMatchesCount = completedLeagueMatches.length;
  const remainingMatchesCount = Math.max(0, totalMatches - completedMatchesCount);
  const avgGoals = completedMatchesCount > 0 ? Number((totalGoals / completedMatchesCount).toFixed(2)) : 0;

  const highestScorer = goldenBootList.length > 0 && goldenBootList[0].total_goals > 0 ? goldenBootList[0] : undefined;
  const isJointHighestScorer = highestScorer ? !!highestScorer.is_joint_golden_boot && goldenBootList.filter(p => p.golden_boot_rank === 1).length > 1 : false;

  const currentLeader = overallStats.length > 0 && overallStats[0].points > 0 ? overallStats[0] : overallStats[0];

  const highestGoalDiffPlayer = [...overallStats].sort((a, b) => b.goal_difference - a.goal_difference)[0];

  const dynamicStats: DynamicTournamentStats = {
    total_goals: totalGoals,
    total_matches: totalMatches,
    completed_matches: completedMatchesCount,
    remaining_matches: remainingMatchesCount,
    highest_scorer: highestScorer,
    is_joint_highest_scorer: isJointHighestScorer,
    current_leader: currentLeader,
    highest_goal_diff_player: highestGoalDiffPlayer,
    average_goals_per_match: avgGoals,
  };

  return {
    overallStats,
    groupAStats,
    groupBStats,
    goldenBootLeaders: goldenBootList,
    dynamicStats,
  };
}
