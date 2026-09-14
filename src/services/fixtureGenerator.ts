import { Player, Match, GroupFormat, FixtureMode } from '../types/tournament';

interface Pair {
  p1: string;
  p2: string;
  group: string;
}

/**
 * Generates round robin pairings for a single pool of players using the circle / polygon algorithm.
 * Odd number of players is handled by adding a 'BYE' dummy player.
 */
function generateSingleRoundRobin(playerIds: string[], groupName: string): Pair[][] {
  if (playerIds.length < 2) return [];

  const pool = [...playerIds];
  const isOdd = pool.length % 2 !== 0;
  if (isOdd) {
    pool.push('BYE');
  }

  const n = pool.length;
  const numRounds = n - 1;
  const half = n / 2;
  const rounds: Pair[][] = [];

  for (let r = 0; r < numRounds; r++) {
    const roundPairs: Pair[] = [];
    for (let i = 0; i < half; i++) {
      const p1 = pool[i];
      const p2 = pool[n - 1 - i];

      if (p1 !== 'BYE' && p2 !== 'BYE') {
        // Alternate home/away based on round for fairness
        if (r % 2 === 1) {
          roundPairs.push({ p1: p2, p2: p1, group: groupName });
        } else {
          roundPairs.push({ p1, p2, group: groupName });
        }
      }
    }
    rounds.push(roundPairs);

    // Rotate pool elements keeping pool[0] fixed
    const fixed = pool[0];
    const rest = pool.slice(1);
    const last = rest.pop()!;
    rest.unshift(last);
    pool.splice(0, pool.length, fixed, ...rest);
  }

  return rounds;
}

/**
 * Generates cross-group bipartite pairings between Group A and Group B.
 */
function generateCrossGroupPairs(groupAIds: string[], groupBIds: string[], frequency: number): Pair[][] {
  if (frequency <= 0 || groupAIds.length === 0 || groupBIds.length === 0) return [];

  const rounds: Pair[][] = [];
  const maxLen = Math.max(groupAIds.length, groupBIds.length);

  for (let cycle = 0; cycle < frequency; cycle++) {
    for (let shift = 0; shift < maxLen; shift++) {
      const roundPairs: Pair[] = [];
      for (let i = 0; i < groupAIds.length; i++) {
        const bIdx = (i + shift) % groupBIds.length;
        const p1 = groupAIds[i];
        const p2 = groupBIds[bIdx];

        if (cycle % 2 === 0) {
          roundPairs.push({ p1, p2, group: 'Cross Group' });
        } else {
          roundPairs.push({ p1: p2, p2: p1, group: 'Cross Group' });
        }
      }
      if (roundPairs.length > 0) {
        rounds.push(roundPairs);
      }
    }
  }

  return rounds;
}

/**
 * Validates match count fixture generation settings.
 */
export function validateMatchCountFixtures(
  players: Player[],
  matchesPerPlayer: number
): { isValid: boolean; error?: string; warning?: string } {
  if (players.length < 2) {
    return { isValid: false, error: 'At least 2 players are required to generate fixtures.' };
  }

  const emptyNames = players.filter(p => !p.player_name.trim());
  if (emptyNames.length > 0) {
    return { isValid: false, error: 'All players must have a valid name before generating fixtures.' };
  }

  const uniqueIds = new Set(players.map(p => p.id));
  if (uniqueIds.size !== players.length) {
    return { isValid: false, error: 'Duplicate player IDs detected.' };
  }

  if (matchesPerPlayer < 1) {
    return { isValid: false, error: 'Matches per player must be at least 1.' };
  }

  if ((players.length * matchesPerPlayer) % 2 !== 0) {
    return {
      isValid: false,
      error: `Total match slots (${players.length} players × ${matchesPerPlayer} matches = ${players.length * matchesPerPlayer}) cannot be odd because each match requires 2 players. For an odd number of players (${players.length}), please choose an even number of matches per player.`,
    };
  }

  let warning: string | undefined;
  if (matchesPerPlayer > (players.length - 1) * 2) {
    warning = `Matches per player (${matchesPerPlayer}) exceeds 2 full round-robins (${(players.length - 1) * 2} matches). Opponents will be repeated multiple times.`;
  }

  return { isValid: true, warning };
}

/**
 * Validates tournament settings before fixture generation.
 */
export function validateFixtureGeneration(
  players: Player[],
  groupFormat: GroupFormat,
  sameGroupFreq: number,
  otherGroupFreq: number,
  fixtureMode?: FixtureMode,
  matchesPerPlayer?: number
): { isValid: boolean; error?: string; warning?: string } {
  if (players.length < 2) {
    return { isValid: false, error: 'At least 2 players are required to generate fixtures.' };
  }

  const emptyNames = players.filter(p => !p.player_name.trim());
  if (emptyNames.length > 0) {
    return { isValid: false, error: 'All players must have a valid name before generating fixtures.' };
  }

  const uniqueIds = new Set(players.map(p => p.id));
  if (uniqueIds.size !== players.length) {
    return { isValid: false, error: 'Duplicate player IDs detected.' };
  }

  if (groupFormat === 'SINGLE') {
    if (fixtureMode === 'MATCH_COUNT') {
      return validateMatchCountFixtures(players, matchesPerPlayer || 0);
    }
    if (sameGroupFreq < 1) {
      return { isValid: false, error: 'Match frequency must be at least 1 for a single group.' };
    }
  }

  if (groupFormat === 'TWO_GROUPS') {
    const groupA = players.filter(p => p.group_name === 'Group A');
    const groupB = players.filter(p => p.group_name === 'Group B');

    if (groupA.length === 0 || groupB.length === 0) {
      return { isValid: false, error: 'Both Group A and Group B must contain at least one player.' };
    }

    if (sameGroupFreq === 0 && otherGroupFreq === 0) {
      return { isValid: false, error: 'Both Same Group and Other Group match frequencies cannot be 0.' };
    }
  }

  return { isValid: true };
}

/**
 * Calculates theoretical total matches based on tournament parameters.
 */
export function calculateTheoreticalMatches(
  playersCount: number,
  groupFormat: GroupFormat,
  sameGroupFreq: number,
  otherGroupFreq: number,
  groupACount: number = 0,
  groupBCount: number = 0,
  fixtureMode?: FixtureMode,
  matchesPerPlayer?: number
): { total: number; sameGroupTotal: number; crossGroupTotal: number } {
  if (playersCount < 2) return { total: 0, sameGroupTotal: 0, crossGroupTotal: 0 };

  if (groupFormat === 'SINGLE') {
    if (fixtureMode === 'MATCH_COUNT' && matchesPerPlayer && matchesPerPlayer > 0) {
      const total = Math.floor((playersCount * matchesPerPlayer) / 2);
      return { total, sameGroupTotal: total, crossGroupTotal: 0 };
    }
    const total = Math.floor((playersCount * (playersCount - 1) * sameGroupFreq) / 2);
    return { total, sameGroupTotal: total, crossGroupTotal: 0 };
  } else {
    const a = groupACount || Math.ceil(playersCount / 2);
    const b = groupBCount || Math.floor(playersCount / 2);

    const aSame = a >= 2 ? (a * (a - 1)) / 2 : 0;
    const bSame = b >= 2 ? (b * (b - 1)) / 2 : 0;
    const sameGroupTotal = (aSame + bSame) * sameGroupFreq;

    const crossGroupTotal = a * b * otherGroupFreq;
    const total = sameGroupTotal + crossGroupTotal;

    return { total, sameGroupTotal, crossGroupTotal };
  }
}

/**
 * Generates all match fixtures for the tournament.
 */
export function generateFixtures(
  tournamentId: string,
  players: Player[],
  groupFormat: GroupFormat,
  sameGroupFreq: number,
  otherGroupFreq: number
): Match[] {
  const allMatches: Match[] = [];
  let matchNumber = 1;

  if (groupFormat === 'SINGLE') {
    const playerIds = players.map(p => p.id);
    let roundIndex = 1;

    for (let cycle = 0; cycle < sameGroupFreq; cycle++) {
      const baseRounds = generateSingleRoundRobin(playerIds, 'League');

      baseRounds.forEach((roundPairs) => {
        roundPairs.forEach((pair) => {
          // If cycle is odd, invert home/away for double/triple round robin
          const p1 = cycle % 2 === 0 ? pair.p1 : pair.p2;
          const p2 = cycle % 2 === 0 ? pair.p2 : pair.p1;

          allMatches.push({
            id: `match_${tournamentId}_${matchNumber}`,
            tournament_id: tournamentId,
            player_1: p1,
            player_2: p2,
            group: 'League',
            round: roundIndex,
            match_number: matchNumber,
            status: 'UPCOMING',
            stage: 'LEAGUE',
          });
          matchNumber++;
        });
        roundIndex++;
      });
    }
  } else {
    // TWO GROUPS
    const groupA = players.filter(p => p.group_name === 'Group A').map(p => p.id);
    const groupB = players.filter(p => p.group_name === 'Group B').map(p => p.id);

    let roundIndex = 1;

    // 1. Same Group matches
    if (sameGroupFreq > 0) {
      for (let cycle = 0; cycle < sameGroupFreq; cycle++) {
        const roundsA = groupA.length >= 2 ? generateSingleRoundRobin(groupA, 'Group A') : [];
        const roundsB = groupB.length >= 2 ? generateSingleRoundRobin(groupB, 'Group B') : [];
        const maxRounds = Math.max(roundsA.length, roundsB.length);

        for (let r = 0; r < maxRounds; r++) {
          const pairsA = roundsA[r] || [];
          const pairsB = roundsB[r] || [];

          pairsA.forEach((pair) => {
            const p1 = cycle % 2 === 0 ? pair.p1 : pair.p2;
            const p2 = cycle % 2 === 0 ? pair.p2 : pair.p1;
            allMatches.push({
              id: `match_${tournamentId}_${matchNumber}`,
              tournament_id: tournamentId,
              player_1: p1,
              player_2: p2,
              group: 'Group A',
              round: roundIndex,
              match_number: matchNumber,
              status: 'UPCOMING',
              stage: 'LEAGUE',
            });
            matchNumber++;
          });

          pairsB.forEach((pair) => {
            const p1 = cycle % 2 === 0 ? pair.p1 : pair.p2;
            const p2 = cycle % 2 === 0 ? pair.p2 : pair.p1;
            allMatches.push({
              id: `match_${tournamentId}_${matchNumber}`,
              tournament_id: tournamentId,
              player_1: p1,
              player_2: p2,
              group: 'Group B',
              round: roundIndex,
              match_number: matchNumber,
              status: 'UPCOMING',
              stage: 'LEAGUE',
            });
            matchNumber++;
          });

          roundIndex++;
        }
      }
    }

    // 2. Cross Group matches
    if (otherGroupFreq > 0 && groupA.length > 0 && groupB.length > 0) {
      const crossRounds = generateCrossGroupPairs(groupA, groupB, otherGroupFreq);
      crossRounds.forEach((roundPairs) => {
        roundPairs.forEach((pair) => {
          allMatches.push({
            id: `match_${tournamentId}_${matchNumber}`,
            tournament_id: tournamentId,
            player_1: pair.p1,
            player_2: pair.p2,
            group: 'Cross Group',
            round: roundIndex,
            match_number: matchNumber,
            status: 'UPCOMING',
            stage: 'LEAGUE',
          });
          matchNumber++;
        });
        roundIndex++;
      });
    }
  }

  return allMatches;
}

/**
 * Fisher-Yates array shuffle.
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Walecki's theorem: Decomposes K_p (where p is odd) into (p - 1) / 2 edge-disjoint Hamiltonian cycles.
 * Each cycle provides degree 2 to every vertex.
 */
function generateWaleckiCycles(playerIds: string[]): { u: string; v: string }[][] {
  const p = playerIds.length;
  if (p < 3 || p % 2 === 0) return [];

  const m = p - 1; // even number of circle vertices: 0 .. m - 1
  const center = playerIds[m];
  const numCycles = m / 2;
  const cycles: { u: string; v: string }[][] = [];

  for (let j = 0; j < numCycles; j++) {
    const cycleVertices: string[] = [];
    cycleVertices.push(center);

    for (let s = 0; s < m; s++) {
      let idx: number;
      if (s % 2 === 0) {
        idx = (j + s / 2) % m;
      } else {
        idx = (j - Math.floor((s + 1) / 2) + m * m) % m;
      }
      cycleVertices.push(playerIds[idx]);
    }

    const cycleEdges: { u: string; v: string }[] = [];
    for (let i = 0; i < cycleVertices.length - 1; i++) {
      cycleEdges.push({ u: cycleVertices[i], v: cycleVertices[i + 1] });
    }
    // Close cycle back to center
    cycleEdges.push({ u: cycleVertices[cycleVertices.length - 1], v: cycleVertices[0] });
    cycles.push(cycleEdges);
  }

  return cycles;
}

interface EulerEdge {
  id: number;
  u: string;
  v: string;
  used: boolean;
}

/**
 * Orients an undirected multigraph using Hierholzer's algorithm (with a dummy node augmentation if degree is odd).
 * Guarantees that:
 * - When degree is even: every player has exactly degree / 2 home and degree / 2 away matches.
 * - When degree is odd: every player has |home - away| <= 1 (i.e. ceil(N/2) and floor(N/2)).
 * - In all cases: total home slots across all players === total away slots across all players.
 */
function orientEdgesEulerian(
  playerIds: string[],
  undirectedEdges: { u: string; v: string }[],
  isOddDegree: boolean
): { p1: string; p2: string }[] {
  const DUMMY = '__DUMMY_EULER__';
  const allEdges: EulerEdge[] = [];
  let edgeId = 0;

  for (const e of undirectedEdges) {
    allEdges.push({ id: edgeId++, u: e.u, v: e.v, used: false });
  }

  if (isOddDegree) {
    // Every player has odd degree; connect dummy vertex to each player to make all degrees even
    for (const p of playerIds) {
      allEdges.push({ id: edgeId++, u: DUMMY, v: p, used: false });
    }
  }

  // Build adjacency list
  const adj = new Map<string, EulerEdge[]>();
  const addAdj = (node: string, edge: EulerEdge) => {
    if (!adj.has(node)) adj.set(node, []);
    adj.get(node)!.push(edge);
  };

  for (const edge of allEdges) {
    addAdj(edge.u, edge);
    addAdj(edge.v, edge);
  }

  // Shuffle edge order at each vertex for randomized matchups
  for (const edges of adj.values()) {
    for (let i = edges.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [edges[i], edges[j]] = [edges[j], edges[i]];
    }
  }

  const nodes = Array.from(adj.keys());
  const directedSteps: { u: string; v: string }[] = [];

  for (const startNode of nodes) {
    const stack: string[] = [startNode];
    const path: string[] = [];

    while (stack.length > 0) {
      const curr = stack[stack.length - 1];
      const edgeList = adj.get(curr) || [];
      let nextEdge: EulerEdge | undefined;

      while (edgeList.length > 0) {
        const candidate = edgeList.pop()!;
        if (!candidate.used) {
          nextEdge = candidate;
          break;
        }
      }

      if (nextEdge) {
        nextEdge.used = true;
        const nextNode = nextEdge.u === curr ? nextEdge.v : nextEdge.u;
        stack.push(nextNode);
      } else {
        path.push(stack.pop()!);
      }
    }

    if (path.length > 1) {
      // Path has vertices in reverse traversal order; walk forward
      for (let i = path.length - 1; i > 0; i--) {
        directedSteps.push({ u: path[i], v: path[i - 1] });
      }
    }
  }

  // Filter out any steps involving the dummy node
  const realMatches: { p1: string; p2: string }[] = [];
  for (const step of directedSteps) {
    if (step.u !== DUMMY && step.v !== DUMMY) {
      realMatches.push({ p1: step.u, p2: step.v });
    }
  }

  return realMatches;
}

/**
 * Groups matches into conflict-free rounds so players don't play more than once per round.
 */
function scheduleMatchesIntoRounds(
  matches: { p1: string; p2: string }[],
  playersCount: number
): { p1: string; p2: string; round: number }[] {
  const maxMatchesPerRound = Math.max(1, Math.floor(playersCount / 2));
  const rounds: { p1: string; p2: string }[][] = [];

  const shuffled = shuffleArray(matches);

  for (const match of shuffled) {
    let assigned = false;
    for (let r = 0; r < rounds.length; r++) {
      const roundMatches = rounds[r];
      if (roundMatches.length >= maxMatchesPerRound) continue;

      const playerAlreadyInRound = roundMatches.some(
        m => m.p1 === match.p1 || m.p2 === match.p1 || m.p1 === match.p2 || m.p2 === match.p2
      );

      if (!playerAlreadyInRound) {
        roundMatches.push(match);
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      rounds.push([match]);
    }
  }

  const result: { p1: string; p2: string; round: number }[] = [];
  rounds.forEach((roundMatches, rIdx) => {
    roundMatches.forEach(m => {
      result.push({ p1: m.p1, p2: m.p2, round: rIdx + 1 });
    });
  });

  return result;
}

/**
 * Generates tournament fixtures where each player plays exactly N matches,
 * with Home (player_1) and Away (player_2) balanced as evenly as possible.
 *
 * Mathematical guarantee:
 * - If N is even: exactly N/2 Home and N/2 Away for every player.
 * - If N is odd: exactly ceil(N/2) Home and floor(N/2) Away for half the roster,
 *   and floor(N/2) Home and ceil(N/2) Away for the other half.
 * - Total home slots across all players === Total away slots across all players.
 * - Opponents are randomized each generation.
 * - Minimal duplicate pairings: pairs repeat only when N > players.length - 1.
 */
export function generateFixturesByMatchCount(
  tournamentId: string,
  players: Player[],
  matchesPerPlayer: number
): Match[] {
  const validation = validateMatchCountFixtures(players, matchesPerPlayer);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid match count tournament parameters.');
  }

  const P = players.length;
  const N = matchesPerPlayer;

  // Randomize initial player order
  const shuffledPlayers = shuffleArray(players);
  const playerIds = shuffledPlayers.map(p => p.id);

  // 1. Build regular multigraph with degree N for every player
  const undirectedEdges: { u: string; v: string }[] = [];

  const k = Math.floor(N / (P - 1));
  const r = N % (P - 1);

  // Add k complete round-robin cycles (each pair gets k edges)
  for (let c = 0; c < k; c++) {
    const perm = shuffleArray(playerIds);
    for (let i = 0; i < P; i++) {
      for (let j = i + 1; j < P; j++) {
        undirectedEdges.push({ u: perm[i], v: perm[j] });
      }
    }
  }

  // Add remainder r-regular simple graph
  if (r > 0) {
    if (P % 2 === 0) {
      // Even number of players: use r randomly selected 1-factors from round-robin
      const baseRounds = generateSingleRoundRobin(shuffleArray(playerIds), 'League');
      const shuffledRounds = shuffleArray(baseRounds);
      for (let i = 0; i < r; i++) {
        for (const pair of shuffledRounds[i]) {
          undirectedEdges.push({ u: pair.p1, v: pair.p2 });
        }
      }
    } else {
      // Odd number of players: N must be even, so r is even.
      // Use r / 2 edge-disjoint Hamiltonian cycles from Walecki decomposition.
      const cycles = generateWaleckiCycles(shuffleArray(playerIds));
      const shuffledCycles = shuffleArray(cycles);
      const cyclesNeeded = r / 2;
      for (let i = 0; i < cyclesNeeded; i++) {
        for (const edge of shuffledCycles[i]) {
          undirectedEdges.push({ u: edge.u, v: edge.v });
        }
      }
    }
  }

  // 2. Orient edges using Eulerian tour
  const isOddDegree = (N % 2 !== 0);
  const orientedPairs = orientEdgesEulerian(playerIds, undirectedEdges, isOddDegree);

  // 3. Schedule matches into rounds
  const scheduled = scheduleMatchesIntoRounds(orientedPairs, P);

  // 4. Build Match objects
  const allMatches: Match[] = scheduled.map((item, idx) => ({
    id: `match_${tournamentId}_${idx + 1}`,
    tournament_id: tournamentId,
    player_1: item.p1,
    player_2: item.p2,
    group: 'League',
    round: item.round,
    match_number: idx + 1,
    status: 'UPCOMING',
    stage: 'LEAGUE',
  }));

  // 5. Sanity Check Validation
  const homeCounts: Record<string, number> = {};
  const awayCounts: Record<string, number> = {};
  players.forEach(p => {
    homeCounts[p.id] = 0;
    awayCounts[p.id] = 0;
  });

  allMatches.forEach(m => {
    homeCounts[m.player_1] = (homeCounts[m.player_1] || 0) + 1;
    awayCounts[m.player_2] = (awayCounts[m.player_2] || 0) + 1;
  });

  let totalHome = 0;
  let totalAway = 0;
  players.forEach(p => {
    const h = homeCounts[p.id] || 0;
    const a = awayCounts[p.id] || 0;
    totalHome += h;
    totalAway += a;
    if (h + a !== matchesPerPlayer) {
      console.warn(`[generateFixturesByMatchCount] Player ${p.player_name} (${p.id}) total matches ${h + a} !== target ${matchesPerPlayer}`);
    }
    if (Math.abs(h - a) > 1) {
      console.warn(`[generateFixturesByMatchCount] Player ${p.player_name} (${p.id}) Home/Away difference > 1 (H:${h}, A:${a})`);
    }
  });

  if (totalHome !== totalAway) {
    throw new Error(`Sanity check failed: total home slots (${totalHome}) !== total away slots (${totalAway})`);
  }

  return allMatches;
}

