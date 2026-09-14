import { 
  Tournament, 
  Player, 
  Match, 
  PlayoffBracketData, 
  TournamentBackup,
  TournamentRulesData,
  MasterPlayer,
  SeasonRecord,
  TournamentIndexEntry
} from '../types/tournament';
import { DEFAULT_TOURNAMENT_RULES } from '../data/defaultRules';
import { db, isFirebaseConfigured } from './firebaseConfig';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot, 
  Unsubscribe 
} from 'firebase/firestore';

export interface TournamentFirestoreDoc {
  tournament: Tournament;
  players: Player[];
  matches: Match[];
  playoffs: PlayoffBracketData;
  rules?: TournamentRulesData;
  updatedAt: string;
}

export interface TournamentIndexFirestoreDoc {
  entries: TournamentIndexEntry[];
  updatedAt: string;
}

export interface AdminAuthFirestoreDoc {
  adminPin: string;
  updatedAt: string;
}

export interface MasterRosterFirestoreDoc {
  players: MasterPlayer[];
  updatedAt: string;
}

export interface HallOfFameFirestoreDoc {
  records: SeasonRecord[];
  updatedAt: string;
}

const TOURNAMENT_COLLECTION = 'tournaments';
const INDEX_DOC = 'index';
const ADMIN_AUTH_DOC = 'adminAuth';
const ROSTER_DOC = 'roster';
const HALL_OF_FAME_DOC = 'hallOfFame';

const STORAGE_KEYS = {
  INDEX: 'efootball_tournament_index',
  ACTIVE_ID: 'efootball_active_tournament_id',
  ADMIN_PIN: 'efootball_admin_pin',
  ADMIN_AUTH: 'efootball_admin_logged_in',
  MASTER_ROSTER: 'efootball_master_roster_data',
  HALL_OF_FAME: 'efootball_hall_of_fame_data',
  // Per-tournament prefixes
  TOURNAMENT_PREFIX: 'efootball_tournament_data_',
  PLAYERS_PREFIX: 'efootball_players_data_',
  MATCHES_PREFIX: 'efootball_matches_data_',
  PLAYOFFS_PREFIX: 'efootball_playoffs_data_',
  RULES_PREFIX: 'efootball_rules_data_',
  // Legacy keys for migration
  LEGACY_TOURNAMENT: 'efootball_tournament_data',
  LEGACY_PLAYERS: 'efootball_players_data',
  LEGACY_MATCHES: 'efootball_matches_data',
  LEGACY_PLAYOFFS: 'efootball_playoffs_data',
  LEGACY_RULES: 'efootball_rules_data',
};

export const SEED_HALL_OF_FAME: Omit<SeasonRecord, 'id' | 'created_at'>[] = [
  { order: 1, season_label: 'Season 1', champion_name: 'Aadthiya' },
  { order: 2, season_label: 'Season 2', champion_name: 'Bharath', golden_boot_name: 'Bharath', golden_boot_goals: 7 },
  { order: 3, season_label: 'Season 3', champion_name: 'Bharath', golden_boot_name: 'Calwin', golden_boot_goals: 6 },
  { order: 4, season_label: 'Season 4', champion_name: 'Danny', golden_boot_name: 'Dhanush', golden_boot_goals: 13 },
  { order: 5, season_label: 'Champions League', champion_name: 'Bharath', golden_boot_name: 'Dhanush', golden_boot_goals: 11 },
  { order: 6, season_label: 'Season 5', champion_name: 'Calwin', golden_boot_name: 'Calwin', golden_boot_goals: 23 },
];

export const DEFAULT_ADMIN_PIN = 'rmdec@123';

/**
 * Compresses an image file using an offscreen canvas to maximum dimensions (256x256)
 * Returns a compact base64 string.
 */
export async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        try {
          const compressed = canvas.toDataURL('image/webp', 0.82);
          resolve(compressed);
        } catch {
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          resolve(compressed);
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

function getTournamentDocRef(tournamentId: string) {
  if (!db) throw new Error('Firestore is not initialized');
  return doc(db, TOURNAMENT_COLLECTION, tournamentId);
}

function getIndexDocRef() {
  if (!db) throw new Error('Firestore is not initialized');
  return doc(db, TOURNAMENT_COLLECTION, INDEX_DOC);
}

function getAdminAuthDocRef() {
  if (!db) throw new Error('Firestore is not initialized');
  return doc(db, TOURNAMENT_COLLECTION, ADMIN_AUTH_DOC);
}

function getRosterDocRef() {
  if (!db) throw new Error('Firestore is not initialized');
  return doc(db, TOURNAMENT_COLLECTION, ROSTER_DOC);
}

function getHallOfFameDocRef() {
  if (!db) throw new Error('Firestore is not initialized');
  return doc(db, TOURNAMENT_COLLECTION, HALL_OF_FAME_DOC);
}

/**
 * Recursively removes any object keys whose value is undefined,
 * and strips undefined values from arrays.
 */
export function removeUndefinedDeep<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => removeUndefinedDeep(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        result[key] = removeUndefinedDeep(value);
      }
    }
    return result as T;
  }
  return obj;
}

/**
 * Storage Service interfacing with Firebase Cloud Firestore & LocalStorage
 * Multi-Tournament Architecture
 */
export const StorageService = {
  // ==========================================
  // ACTIVE TOURNAMENT POINTER & INDEX
  // ==========================================
  getActiveTournamentIdLocal(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ID);
  },

  setActiveTournamentIdLocal(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, id);
  },

  loadTournamentIndexLocal(): TournamentIndexEntry[] {
    const raw = localStorage.getItem(STORAGE_KEYS.INDEX);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveTournamentIndexLocal(entries: TournamentIndexEntry[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.INDEX, JSON.stringify(entries));
    } catch (e) {
      console.warn('[Storage] Failed to save tournament index to localStorage:', e);
    }
  },

  async listTournaments(): Promise<TournamentIndexEntry[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(getIndexDocRef());
        if (snap.exists() && Array.isArray(snap.data()?.entries)) {
          const entries = snap.data().entries as TournamentIndexEntry[];
          this.saveTournamentIndexLocal(entries);
          return entries;
        }
      } catch (err) {
        console.error('[Storage] Error listing tournaments from Firestore:', err);
      }
    }
    return this.loadTournamentIndexLocal();
  },

  async saveTournamentIndex(entries: TournamentIndexEntry[]): Promise<void> {
    this.saveTournamentIndexLocal(entries);

    if (isFirebaseConfigured && db) {
      try {
        const payload = removeUndefinedDeep({
          entries,
          updatedAt: new Date().toISOString(),
        });
        await setDoc(getIndexDocRef(), payload, { merge: true });
      } catch (err) {
        console.error('[Storage] Error saving tournament index to Firestore:', err);
        throw err;
      }
    }
  },

  subscribeTournamentIndex(
    onUpdate: (entries: TournamentIndexEntry[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    if (isFirebaseConfigured && db) {
      try {
        return onSnapshot(
          getIndexDocRef(),
          (snapshot) => {
            if (snapshot.exists() && Array.isArray(snapshot.data()?.entries)) {
              const remote = snapshot.data().entries as TournamentIndexEntry[];
              this.saveTournamentIndexLocal(remote);
              onUpdate(remote);
            } else {
              onUpdate(this.loadTournamentIndexLocal());
            }
          },
          (err) => {
            console.error('[Storage] Index subscription error:', err);
            onUpdate(this.loadTournamentIndexLocal());
            onError?.(err);
          }
        );
      } catch (err) {
        console.error('[Storage] Failed to attach index listener:', err);
        onUpdate(this.loadTournamentIndexLocal());
        onError?.(err as Error);
      }
    }

    onUpdate(this.loadTournamentIndexLocal());
    return () => {};
  },

  // ==========================================
  // PER-TOURNAMENT REAL-TIME LISTENER & DATA
  // ==========================================
  subscribeTournamentData(
    tournamentId: string,
    onUpdate: (data: TournamentFirestoreDoc | null) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    if (!tournamentId) {
      onUpdate(null);
      return () => {};
    }

    if (isFirebaseConfigured && db) {
      try {
        const docRef = getTournamentDocRef(tournamentId);
        return onSnapshot(
          docRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const docData = snapshot.data() as TournamentFirestoreDoc;
              try {
                StorageService.saveAllLocal(tournamentId, docData);
              } catch (e) {
                console.warn('[Storage] Failed to mirror tournament to localStorage:', e);
              }
              onUpdate(docData);
            } else {
              onUpdate(null);
            }
          },
          (err) => {
            console.error(`[Firestore] onSnapshot error for tournament ${tournamentId}:`, err);
            const localData = StorageService.loadAllLocal(tournamentId);
            if (localData) onUpdate(localData);
            onError?.(err);
          }
        );
      } catch (err) {
        console.error(`[Firestore] Failed to attach listener for ${tournamentId}:`, err);
        const localData = StorageService.loadAllLocal(tournamentId);
        if (localData) onUpdate(localData);
        onError?.(err as Error);
      }
    }

    const localData = this.loadAllLocal(tournamentId);
    onUpdate(localData);
    return () => {};
  },

  async loadTournamentDoc(tournamentId: string): Promise<TournamentFirestoreDoc | null> {
    if (!tournamentId) return null;
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(getTournamentDocRef(tournamentId));
        if (snap.exists()) {
          return snap.data() as TournamentFirestoreDoc;
        }
      } catch (err) {
        console.error(`[Firestore] Error loading doc for ${tournamentId}:`, err);
      }
    }
    return this.loadAllLocal(tournamentId);
  },

  async saveTournamentState(
    first: string | {
      tournament?: Tournament;
      players?: Player[];
      matches?: Match[];
      playoffs?: PlayoffBracketData;
      rules?: TournamentRulesData;
    },
    second?: {
      tournament?: Tournament;
      players?: Player[];
      matches?: Match[];
      playoffs?: PlayoffBracketData;
      rules?: TournamentRulesData;
    }
  ): Promise<void> {
    let tournamentId = '';
    let state: {
      tournament?: Tournament;
      players?: Player[];
      matches?: Match[];
      playoffs?: PlayoffBracketData;
      rules?: TournamentRulesData;
    } = {};

    if (typeof first === 'string') {
      tournamentId = first;
      state = second || {};
    } else {
      state = first || {};
      tournamentId = state.tournament?.id || this.getActiveTournamentIdLocal() || '';
    }

    if (!tournamentId) return;

    // 1. Immediately persist synchronously to local storage with prefix
    try {
      if (state.tournament !== undefined) {
        localStorage.setItem(STORAGE_KEYS.TOURNAMENT_PREFIX + tournamentId, JSON.stringify(state.tournament));
      }
      if (state.players !== undefined) {
        localStorage.setItem(STORAGE_KEYS.PLAYERS_PREFIX + tournamentId, JSON.stringify(state.players));
      }
      if (state.matches !== undefined) {
        localStorage.setItem(STORAGE_KEYS.MATCHES_PREFIX + tournamentId, JSON.stringify(state.matches));
      }
      if (state.playoffs !== undefined) {
        localStorage.setItem(STORAGE_KEYS.PLAYOFFS_PREFIX + tournamentId, JSON.stringify(state.playoffs));
      }
      if (state.rules !== undefined) {
        localStorage.setItem(STORAGE_KEYS.RULES_PREFIX + tournamentId, JSON.stringify(state.rules));
      }
    } catch (localErr) {
      console.warn('[Storage] LocalStorage write error:', localErr);
    }

    // 2. Persist to Firestore
    if (isFirebaseConfigured && db) {
      const rawPayload: Record<string, any> = {
        updatedAt: new Date().toISOString(),
      };
      if (state.tournament !== undefined) rawPayload.tournament = state.tournament;
      if (state.players !== undefined) rawPayload.players = state.players;
      if (state.matches !== undefined) rawPayload.matches = state.matches;
      if (state.playoffs !== undefined) rawPayload.playoffs = state.playoffs;
      if (state.rules !== undefined) rawPayload.rules = state.rules;

      const payload = removeUndefinedDeep(rawPayload);
      const docRef = getTournamentDocRef(tournamentId);

      try {
        await updateDoc(docRef, payload);
      } catch (updateErr) {
        try {
          await setDoc(docRef, payload, { merge: true });
        } catch (setErr) {
          console.error(`[Storage] setDoc failed for ${tournamentId}:`, setErr);
          throw setErr;
        }
      }
    }

    // 3. Update index entry if tournament status or name changed
    if (state.tournament) {
      const currentList = await this.listTournaments();
      const updatedList = currentList.map(entry => {
        if (entry.id === tournamentId) {
          return {
            ...entry,
            tournament_name: state.tournament!.tournament_name,
            status: state.tournament!.status,
            logo_url: state.tournament!.logo_url,
          };
        }
        return entry;
      });
      await this.saveTournamentIndex(updatedList);
    }
  },

  async saveTournament(tournament: Tournament): Promise<void> {
    await this.saveTournamentState(tournament.id, { tournament });
  },

  async savePlayers(players: Player[], tournamentId?: string): Promise<void> {
    const tid = tournamentId || this.getActiveTournamentIdLocal() || '';
    if (tid) await this.saveTournamentState(tid, { players });
  },

  async saveMatches(matches: Match[], tournamentId?: string): Promise<void> {
    const tid = tournamentId || this.getActiveTournamentIdLocal() || '';
    if (tid) await this.saveTournamentState(tid, { matches });
  },

  async savePlayoffs(playoffs: PlayoffBracketData, tournamentId?: string): Promise<void> {
    const tid = tournamentId || this.getActiveTournamentIdLocal() || '';
    if (tid) await this.saveTournamentState(tid, { playoffs });
  },

  async saveRules(rules: TournamentRulesData, tournamentId?: string): Promise<void> {
    const tid = tournamentId || this.getActiveTournamentIdLocal() || '';
    if (tid) await this.saveTournamentState(tid, { rules });
  },

  async createTournament(
    tournament: Tournament,
    initialPlayers?: Player[]
  ): Promise<string> {
    const id = tournament.id || `tour_${Date.now()}`;
    const cleanTour: Tournament = {
      ...tournament,
      id,
      created_at: tournament.created_at || new Date().toISOString(),
    };

    // Save tournament state
    await this.saveTournamentState(id, {
      tournament: cleanTour,
      players: initialPlayers || [],
      matches: [],
      playoffs: {},
      rules: DEFAULT_TOURNAMENT_RULES,
    });

    // Append to index
    const indexEntry: TournamentIndexEntry = {
      id,
      tournament_name: cleanTour.tournament_name,
      status: cleanTour.status,
      created_at: cleanTour.created_at,
      logo_url: cleanTour.logo_url,
    };

    const currentEntries = await this.listTournaments();
    const updatedEntries = [
      ...currentEntries.filter(e => e.id !== id),
      indexEntry,
    ];
    await this.saveTournamentIndex(updatedEntries);
    this.setActiveTournamentIdLocal(id);

    return id;
  },

  async deleteTournament(tournamentId: string): Promise<void> {
    if (!tournamentId) return;

    // 1. Remove from Firestore
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(getTournamentDocRef(tournamentId));
      } catch (err) {
        console.error(`[Storage] Error deleting doc ${tournamentId}:`, err);
      }
    }

    // 2. Remove from LocalStorage
    localStorage.removeItem(STORAGE_KEYS.TOURNAMENT_PREFIX + tournamentId);
    localStorage.removeItem(STORAGE_KEYS.PLAYERS_PREFIX + tournamentId);
    localStorage.removeItem(STORAGE_KEYS.MATCHES_PREFIX + tournamentId);
    localStorage.removeItem(STORAGE_KEYS.PLAYOFFS_PREFIX + tournamentId);
    localStorage.removeItem(STORAGE_KEYS.RULES_PREFIX + tournamentId);

    // 3. Remove from Index
    const currentList = await this.listTournaments();
    const filtered = currentList.filter(e => e.id !== tournamentId);
    await this.saveTournamentIndex(filtered);
  },

  loadTournamentLocal(tournamentId: string): Tournament | null {
    const raw = localStorage.getItem(STORAGE_KEYS.TOURNAMENT_PREFIX + tournamentId);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  loadPlayersLocal(tournamentId: string): Player[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PLAYERS_PREFIX + tournamentId);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  loadMatchesLocal(tournamentId: string): Match[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MATCHES_PREFIX + tournamentId);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  loadPlayoffsLocal(tournamentId: string): PlayoffBracketData {
    const raw = localStorage.getItem(STORAGE_KEYS.PLAYOFFS_PREFIX + tournamentId);
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  },

  loadRulesLocal(tournamentId: string): TournamentRulesData {
    const raw = localStorage.getItem(STORAGE_KEYS.RULES_PREFIX + tournamentId);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    return DEFAULT_TOURNAMENT_RULES;
  },

  loadAllLocal(tournamentId: string): TournamentFirestoreDoc | null {
    const tournament = this.loadTournamentLocal(tournamentId);
    if (!tournament) return null;
    return {
      tournament,
      players: this.loadPlayersLocal(tournamentId),
      matches: this.loadMatchesLocal(tournamentId),
      playoffs: this.loadPlayoffsLocal(tournamentId),
      rules: this.loadRulesLocal(tournamentId),
      updatedAt: new Date().toISOString(),
    };
  },

  saveAllLocal(tournamentId: string, data: TournamentFirestoreDoc): void {
    if (!tournamentId) return;
    localStorage.setItem(STORAGE_KEYS.TOURNAMENT_PREFIX + tournamentId, JSON.stringify(data.tournament));
    localStorage.setItem(STORAGE_KEYS.PLAYERS_PREFIX + tournamentId, JSON.stringify(data.players));
    localStorage.setItem(STORAGE_KEYS.MATCHES_PREFIX + tournamentId, JSON.stringify(data.matches));
    localStorage.setItem(STORAGE_KEYS.PLAYOFFS_PREFIX + tournamentId, JSON.stringify(data.playoffs));
    if (data.rules) {
      localStorage.setItem(STORAGE_KEYS.RULES_PREFIX + tournamentId, JSON.stringify(data.rules));
    }
  },

  async clearTournamentData(tournamentId: string): Promise<void> {
    if (!tournamentId) return;
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(getTournamentDocRef(tournamentId), {
          tournament: null,
          players: [],
          matches: [],
          playoffs: {},
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error(`[Firestore] Error clearing tournament ${tournamentId}:`, err);
      }
    }
    localStorage.removeItem(STORAGE_KEYS.TOURNAMENT_PREFIX + tournamentId);
    localStorage.removeItem(STORAGE_KEYS.PLAYERS_PREFIX + tournamentId);
    localStorage.removeItem(STORAGE_KEYS.MATCHES_PREFIX + tournamentId);
    localStorage.removeItem(STORAGE_KEYS.PLAYOFFS_PREFIX + tournamentId);
  },

  resetResultsOnly(matches: Match[]): Match[] {
    return matches.map(m => {
      const { completed_at, ...rest } = m;
      return {
        ...rest,
        player_1_score: null,
        player_2_score: null,
        status: 'UPCOMING',
        penalties_played: false,
        player_1_penalty_score: null,
        player_2_penalty_score: null,
        winner_id: null,
      };
    });
  },

  // ==========================================
  // GLOBAL ADMIN AUTHENTICATION (Independent doc tournaments/adminAuth)
  // ==========================================
  async getAdminPin(): Promise<string> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(getAdminAuthDocRef());
        if (snap.exists() && snap.data()?.adminPin) {
          const pin = snap.data().adminPin;
          localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, pin);
          return pin;
        }
      } catch {
        // fallback
      }
    }
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_PIN);
    if (!saved || saved === 'admin123') {
      return DEFAULT_ADMIN_PIN;
    }
    return saved;
  },

  async setAdminPin(pin: string): Promise<void> {
    const cleanPin = pin.trim();
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(
          getAdminAuthDocRef(),
          {
            adminPin: cleanPin,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err: any) {
        console.error('[Storage] Failed to save admin PIN to Firestore:', err);
        throw new Error(`Failed to persist admin PIN to database: ${err?.message || 'Unknown error'}`);
      }
    }
    localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, cleanPin);
  },

  isAdminLoggedIn(): boolean {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  },

  setAdminLoggedIn(status: boolean): void {
    localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, String(status));
  },

  // ==========================================
  // BACKUP & RESTORE (Active tournament only)
  // ==========================================
  exportBackup(
    tournament: Tournament,
    players: Player[],
    matches: Match[],
    playoffs: PlayoffBracketData
  ): string {
    const backup: TournamentBackup = {
      version: '2.0.0',
      exported_at: new Date().toISOString(),
      tournament,
      players,
      matches,
      playoffs,
    };
    return JSON.stringify(backup, null, 2);
  },

  validateAndParseBackup(jsonString: string): { isValid: boolean; backup?: TournamentBackup; error?: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') {
        return { isValid: false, error: 'Invalid JSON format' };
      }
      if (!data.tournament || !data.tournament.id || !data.tournament.tournament_name) {
        return { isValid: false, error: 'Missing or invalid tournament metadata' };
      }
      if (!Array.isArray(data.players) || data.players.length === 0) {
        return { isValid: false, error: 'Invalid or empty players list in backup' };
      }
      if (!Array.isArray(data.matches)) {
        return { isValid: false, error: 'Invalid matches structure in backup' };
      }
      return { isValid: true, backup: data as TournamentBackup };
    } catch (e) {
      return { isValid: false, error: (e as Error).message || 'Corrupt JSON file' };
    }
  },

  // ==========================================
  // FIRST-RUN MIGRATION
  // ==========================================
  async migrateLegacySingletonIfPresent(defaultTournament: Tournament): Promise<{ activeId: string; entries: TournamentIndexEntry[] }> {
    // 1. Check if index exists locally or in Firestore
    const localIndex = this.loadTournamentIndexLocal();
    if (localIndex.length > 0) {
      const activeId = this.getActiveTournamentIdLocal() || localIndex[0].id;
      return { activeId, entries: localIndex };
    }

    if (isFirebaseConfigured && db) {
      try {
        const indexSnap = await getDoc(getIndexDocRef());
        if (indexSnap.exists() && Array.isArray(indexSnap.data()?.entries) && indexSnap.data().entries.length > 0) {
          const entries = indexSnap.data().entries as TournamentIndexEntry[];
          this.saveTournamentIndexLocal(entries);
          const activeId = this.getActiveTournamentIdLocal() || entries[0].id;
          return { activeId, entries };
        }
      } catch (err) {
        console.warn('[Storage] Error reading index during migration:', err);
      }
    }

    // 2. Check if legacy singleton doc exists in Firestore or localStorage
    let legacyTourDoc: TournamentFirestoreDoc | null = null;
    let legacyPin = DEFAULT_ADMIN_PIN;

    if (isFirebaseConfigured && db) {
      try {
        const oldActiveSnap = await getDoc(doc(db, TOURNAMENT_COLLECTION, 'active'));
        if (oldActiveSnap.exists()) {
          const data = oldActiveSnap.data() as any;
          if (data && data.tournament) {
            legacyTourDoc = {
              tournament: data.tournament,
              players: data.players || [],
              matches: data.matches || [],
              playoffs: data.playoffs || {},
              rules: data.rules || DEFAULT_TOURNAMENT_RULES,
              updatedAt: data.updatedAt || new Date().toISOString(),
            };
            if (data.adminPin) {
              legacyPin = data.adminPin;
            }
          }
        }
      } catch (e) {
        console.warn('[Storage] Could not check old active doc:', e);
      }
    }

    if (!legacyTourDoc) {
      const legacyLocalTour = localStorage.getItem(STORAGE_KEYS.LEGACY_TOURNAMENT);
      if (legacyLocalTour) {
        try {
          legacyTourDoc = {
            tournament: JSON.parse(legacyLocalTour),
            players: JSON.parse(localStorage.getItem(STORAGE_KEYS.LEGACY_PLAYERS) || '[]'),
            matches: JSON.parse(localStorage.getItem(STORAGE_KEYS.LEGACY_MATCHES) || '[]'),
            playoffs: JSON.parse(localStorage.getItem(STORAGE_KEYS.LEGACY_PLAYOFFS) || '{}'),
            rules: JSON.parse(localStorage.getItem(STORAGE_KEYS.LEGACY_RULES) || 'null') || DEFAULT_TOURNAMENT_RULES,
            updatedAt: new Date().toISOString(),
          };
          legacyPin = localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || DEFAULT_ADMIN_PIN;
        } catch {
          // ignore
        }
      }
    }

    // 3. If legacy tournament data exists, migrate it to tournaments/{id}
    if (legacyTourDoc && legacyTourDoc.tournament && legacyTourDoc.tournament.id) {
      const tour = legacyTourDoc.tournament;
      console.log(`[Storage] Migrating legacy tournament "${tour.tournament_name}" (${tour.id}) to multi-tournament architecture...`);
      
      await this.saveTournamentState(tour.id, {
        tournament: tour,
        players: legacyTourDoc.players || [],
        matches: legacyTourDoc.matches || [],
        playoffs: legacyTourDoc.playoffs || {},
        rules: legacyTourDoc.rules || DEFAULT_TOURNAMENT_RULES,
      });

      const initialEntry: TournamentIndexEntry = {
        id: tour.id,
        tournament_name: tour.tournament_name || 'eFootball Championship',
        status: tour.status || 'SETUP',
        created_at: tour.created_at || new Date().toISOString(),
        logo_url: tour.logo_url,
      };
      const entries = [initialEntry];
      await this.saveTournamentIndex(entries);
      await this.setAdminPin(legacyPin);
      this.setActiveTournamentIdLocal(tour.id);

      // Clean up legacy singleton doc and keys
      if (isFirebaseConfigured && db) {
        try {
          await deleteDoc(doc(db, TOURNAMENT_COLLECTION, 'active'));
        } catch {
          // ignore
        }
      }
      localStorage.removeItem(STORAGE_KEYS.LEGACY_TOURNAMENT);
      localStorage.removeItem(STORAGE_KEYS.LEGACY_PLAYERS);
      localStorage.removeItem(STORAGE_KEYS.LEGACY_MATCHES);
      localStorage.removeItem(STORAGE_KEYS.LEGACY_PLAYOFFS);

      return { activeId: tour.id, entries };
    }

    // 4. If nothing exists at all, seed initial tournament into index and under its own id
    console.log('[Storage] Initializing first tournament into multi-tournament store...');
    const seedId = defaultTournament.id;
    await this.saveTournamentState(seedId, {
      tournament: defaultTournament,
      players: [],
      matches: [],
      playoffs: {},
      rules: DEFAULT_TOURNAMENT_RULES,
    });
    const firstEntry: TournamentIndexEntry = {
      id: seedId,
      tournament_name: defaultTournament.tournament_name,
      status: defaultTournament.status,
      created_at: defaultTournament.created_at,
    };
    const entries = [firstEntry];
    await this.saveTournamentIndex(entries);
    await this.setAdminPin(DEFAULT_ADMIN_PIN);
    this.setActiveTournamentIdLocal(seedId);

    return { activeId: seedId, entries };
  },

  // ==========================================
  // MASTER ROSTER PERSISTENCE (Global)
  // ==========================================
  loadMasterRosterLocal(): MasterPlayer[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MASTER_ROSTER);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveMasterRosterLocal(players: MasterPlayer[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MASTER_ROSTER, JSON.stringify(players));
    } catch (e) {
      console.warn('[Storage] Failed to save master roster to localStorage:', e);
    }
  },

  async loadMasterRoster(): Promise<MasterPlayer[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(getRosterDocRef());
        if (snap.exists() && Array.isArray(snap.data()?.players)) {
          const remote = snap.data().players as MasterPlayer[];
          this.saveMasterRosterLocal(remote);
          return remote;
        }
      } catch (err) {
        console.error('[Storage] Error loading master roster from Firestore:', err);
      }
    }
    return this.loadMasterRosterLocal();
  },

  async saveMasterRoster(players: MasterPlayer[]): Promise<void> {
    this.saveMasterRosterLocal(players);

    if (isFirebaseConfigured && db) {
      try {
        const payload = removeUndefinedDeep({
          players,
          updatedAt: new Date().toISOString(),
        });
        await setDoc(getRosterDocRef(), payload, { merge: true });
      } catch (err) {
        console.error('[Storage] Error saving master roster to Firestore:', err);
        throw err;
      }
    }
  },

  subscribeMasterRoster(
    onUpdate: (players: MasterPlayer[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    if (isFirebaseConfigured && db) {
      try {
        return onSnapshot(
          getRosterDocRef(),
          (snapshot) => {
            if (snapshot.exists() && Array.isArray(snapshot.data()?.players)) {
              const remote = snapshot.data().players as MasterPlayer[];
              this.saveMasterRosterLocal(remote);
              onUpdate(remote);
            } else {
              onUpdate(this.loadMasterRosterLocal());
            }
          },
          (err) => {
            console.error('[Storage] Master roster subscription error:', err);
            onUpdate(this.loadMasterRosterLocal());
            onError?.(err);
          }
        );
      } catch (err) {
        console.error('[Storage] Failed to attach master roster listener:', err);
        onUpdate(this.loadMasterRosterLocal());
        onError?.(err as Error);
      }
    }

    onUpdate(this.loadMasterRosterLocal());
    return () => {};
  },

  // ==========================================
  // HALL OF FAME PERSISTENCE (Global)
  // ==========================================
  loadHallOfFameLocal(): SeasonRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.HALL_OF_FAME);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveHallOfFameLocal(records: SeasonRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.HALL_OF_FAME, JSON.stringify(records));
    } catch (e) {
      console.warn('[Storage] Failed to save hall of fame to localStorage:', e);
    }
  },

  async seedHallOfFameIfEmpty(): Promise<SeasonRecord[]> {
    const currentLocal = this.loadHallOfFameLocal();
    if (currentLocal.length > 0) return currentLocal;

    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(getHallOfFameDocRef());
        if (snap.exists() && Array.isArray(snap.data()?.records) && snap.data().records.length > 0) {
          const remote = snap.data().records as SeasonRecord[];
          this.saveHallOfFameLocal(remote);
          return remote;
        }
      } catch (err) {
        console.warn('[Storage] Could not check Firestore for hall of fame seed:', err);
      }
    }

    const seeded: SeasonRecord[] = SEED_HALL_OF_FAME.map((item, index) => ({
      ...item,
      id: `hof_seed_${index + 1}`,
      created_at: new Date().toISOString(),
    }));

    await this.saveHallOfFame(seeded);
    console.log('[Storage] Seeded initial Hall of Fame records.');
    return seeded;
  },

  async loadHallOfFame(): Promise<SeasonRecord[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(getHallOfFameDocRef());
        if (snap.exists() && Array.isArray(snap.data()?.records)) {
          const remote = snap.data().records as SeasonRecord[];
          this.saveHallOfFameLocal(remote);
          return remote;
        }
      } catch (err) {
        console.error('[Storage] Error loading hall of fame from Firestore:', err);
      }
    }
    return this.loadHallOfFameLocal();
  },

  async saveHallOfFame(records: SeasonRecord[]): Promise<void> {
    this.saveHallOfFameLocal(records);

    if (isFirebaseConfigured && db) {
      try {
        const payload = removeUndefinedDeep({
          records,
          updatedAt: new Date().toISOString(),
        });
        await setDoc(getHallOfFameDocRef(), payload, { merge: true });
      } catch (err) {
        console.error('[Storage] Error saving hall of fame to Firestore:', err);
        throw err;
      }
    }
  },

  subscribeHallOfFame(
    onUpdate: (records: SeasonRecord[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    if (isFirebaseConfigured && db) {
      try {
        return onSnapshot(
          getHallOfFameDocRef(),
          (snapshot) => {
            if (snapshot.exists() && Array.isArray(snapshot.data()?.records)) {
              const remote = snapshot.data().records as SeasonRecord[];
              this.saveHallOfFameLocal(remote);
              onUpdate(remote);
            } else {
              onUpdate(this.loadHallOfFameLocal());
            }
          },
          (err) => {
            console.error('[Storage] Hall of fame subscription error:', err);
            onUpdate(this.loadHallOfFameLocal());
            onError?.(err);
          }
        );
      } catch (err) {
        console.error('[Storage] Failed to attach hall of fame listener:', err);
        onUpdate(this.loadHallOfFameLocal());
        onError?.(err as Error);
      }
    }

    onUpdate(this.loadHallOfFameLocal());
    return () => {};
  },
};
