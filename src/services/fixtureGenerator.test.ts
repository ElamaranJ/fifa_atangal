import { generateFixturesByMatchCount, validateMatchCountFixtures } from './fixtureGenerator';
import { Player } from '../types/tournament';

function createMockPlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    tournament_id: 'test_tour',
    player_name: `Player ${i + 1}`,
    created_at: new Date().toISOString(),
  }));
}

function runTests() {
  console.log('🧪 Running Fixture Generator Tests...\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // Test 1: Even N (N = 8) with 4 players
  console.log('--- Test 1: Even N = 8 with 4 players ---');
  {
    const players = createMockPlayers(4);
    const N = 8;
    const fixtures = generateFixturesByMatchCount('tour1', players, N);

    assert(fixtures.length === (4 * 8) / 2, `Total matches should be 16, got ${fixtures.length}`);

    const homeCounts: Record<string, number> = {};
    const awayCounts: Record<string, number> = {};
    players.forEach(p => {
      homeCounts[p.id] = 0;
      awayCounts[p.id] = 0;
    });

    fixtures.forEach(m => {
      homeCounts[m.player_1]++;
      awayCounts[m.player_2]++;
    });

    players.forEach(p => {
      const h = homeCounts[p.id];
      const a = awayCounts[p.id];
      assert(h === Math.ceil(N / 2), `Player ${p.id} home matches (${h}) === ceil(N/2) (4)`);
      assert(a === Math.floor(N / 2), `Player ${p.id} away matches (${a}) === floor(N/2) (4)`);
      assert(h + a === N, `Player ${p.id} total matches (${h + a}) === ${N}`);
    });

    const totalHome = Object.values(homeCounts).reduce((a, b) => a + b, 0);
    const totalAway = Object.values(awayCounts).reduce((a, b) => a + b, 0);
    assert(totalHome === totalAway, `Total home (${totalHome}) === total away (${totalAway})`);
  }

  // Test 2: Odd N (N = 9) with 4 players
  console.log('\n--- Test 2: Odd N = 9 with 4 players ---');
  {
    const players = createMockPlayers(4);
    const N = 9;
    const fixtures = generateFixturesByMatchCount('tour2', players, N);

    assert(fixtures.length === (4 * 9) / 2, `Total matches should be 18, got ${fixtures.length}`);

    const homeCounts: Record<string, number> = {};
    const awayCounts: Record<string, number> = {};
    players.forEach(p => {
      homeCounts[p.id] = 0;
      awayCounts[p.id] = 0;
    });

    fixtures.forEach(m => {
      homeCounts[m.player_1]++;
      awayCounts[m.player_2]++;
    });

    let count5Home = 0;
    let count4Home = 0;
    players.forEach(p => {
      const h = homeCounts[p.id];
      const a = awayCounts[p.id];
      assert(h + a === N, `Player ${p.id} total matches (${h + a}) === ${N}`);
      assert(Math.abs(h - a) === 1, `Player ${p.id} home/away difference is 1 (H:${h}, A:${a})`);
      if (h === 5 && a === 4) count5Home++;
      if (h === 4 && a === 5) count4Home++;
    });

    assert(count5Home === 2, `Exactly half the players (2) have 5 Home / 4 Away (got ${count5Home})`);
    assert(count4Home === 2, `Exactly half the players (2) have 4 Home / 5 Away (got ${count4Home})`);

    const totalHome = Object.values(homeCounts).reduce((a, b) => a + b, 0);
    const totalAway = Object.values(awayCounts).reduce((a, b) => a + b, 0);
    assert(totalHome === totalAway, `Total home (${totalHome}) === total away (${totalAway})`);
  }

  // Test 3: Small player pool (3 players, N = 4)
  console.log('\n--- Test 3: 3 players with N = 4 ---');
  {
    const players = createMockPlayers(3);
    const N = 4;
    const fixtures = generateFixturesByMatchCount('tour3', players, N);

    assert(fixtures.length === (3 * 4) / 2, `Total matches should be 6, got ${fixtures.length}`);

    const homeCounts: Record<string, number> = {};
    const awayCounts: Record<string, number> = {};
    players.forEach(p => {
      homeCounts[p.id] = 0;
      awayCounts[p.id] = 0;
    });

    fixtures.forEach(m => {
      homeCounts[m.player_1]++;
      awayCounts[m.player_2]++;
    });

    players.forEach(p => {
      const h = homeCounts[p.id];
      const a = awayCounts[p.id];
      assert(h === 2, `Player ${p.id} has 2 home matches`);
      assert(a === 2, `Player ${p.id} has 2 away matches`);
      assert(h + a === 4, `Player ${p.id} has 4 total matches`);
    });
  }

  // Test 4: Minimal N (N = 1) with 4 players
  console.log('\n--- Test 4: 4 players with N = 1 ---');
  {
    const players = createMockPlayers(4);
    const N = 1;
    const fixtures = generateFixturesByMatchCount('tour4', players, N);

    assert(fixtures.length === 2, `Total matches should be 2, got ${fixtures.length}`);

    const playedCounts: Record<string, number> = {};
    fixtures.forEach(m => {
      playedCounts[m.player_1] = (playedCounts[m.player_1] || 0) + 1;
      playedCounts[m.player_2] = (playedCounts[m.player_2] || 0) + 1;
    });

    players.forEach(p => {
      assert(playedCounts[p.id] === 1, `Player ${p.id} played exactly 1 match`);
    });
  }

  // Test 5: Validation tests
  console.log('\n--- Test 5: Validation checks ---');
  {
    const players4 = createMockPlayers(4);
    const players3 = createMockPlayers(3);

    const val1 = validateMatchCountFixtures(players4, 0);
    assert(!val1.isValid, 'N < 1 should be invalid');

    const val2 = validateMatchCountFixtures(createMockPlayers(1), 4);
    assert(!val2.isValid, 'Players < 2 should be invalid');

    const val3 = validateMatchCountFixtures(players3, 9);
    assert(!val3.isValid, 'Odd players (3) with odd N (9) should be invalid (slot parity)');

    const val4 = validateMatchCountFixtures(players4, 8);
    assert(val4.isValid, 'Even players with N=8 should be valid');
    assert(val4.warning !== undefined, 'N > 2*(4-1) = 6 should produce a warning about repeated opponents');

    const val5 = validateMatchCountFixtures(players4, 3);
    assert(val5.isValid, 'Valid parameters with no warning');
    assert(val5.warning === undefined, 'No warning when N <= 2*(P-1)');
  }

  console.log(`\n🎉 All ${passed}/${total} tests passed successfully!`);
}

runTests();
