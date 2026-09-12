import { Player, Match, GroupFormat } from '../types/tournament';

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
 * Validates tournament settings before fixture generation.
 */
export function validateFixtureGeneration(
  players: Player[],
  groupFormat: GroupFormat,
  sameGroupFreq: number,
  otherGroupFreq: number
): { isValid: boolean; error?: string } {
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

  if (sameGroupFreq < 1 && groupFormat === 'SINGLE') {
    return { isValid: false, error: 'Match frequency must be at least 1 for a single group.' };
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
  groupBCount: number = 0
): { total: number; sameGroupTotal: number; crossGroupTotal: number } {
  if (playersCount < 2) return { total: 0, sameGroupTotal: 0, crossGroupTotal: 0 };

  if (groupFormat === 'SINGLE') {
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
