import { 
  Tournament, 
  Player, 
  Match, 
  PlayoffBracketData, 
  TournamentBackup,
  TournamentRulesData
} from '../types/tournament';
import { DEFAULT_TOURNAMENT_RULES } from '../data/defaultRules';
import { db, isFirebaseConfigured } from './firebaseConfig';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  Unsubscribe 
} from 'firebase/firestore';

export interface TournamentFirestoreDoc {
  tournament: Tournament;
  players: Player[];
  matches: Match[];
  playoffs: PlayoffBracketData;
  rules?: TournamentRulesData;
  adminPin?: string;
  updatedAt: string;
}

const TOURNAMENT_COLLECTION = 'tournaments';
const ACTIVE_TOURNAMENT_DOC = 'active';

const STORAGE_KEYS = {
  TOURNAMENT: 'efootball_tournament_data',
  PLAYERS: 'efootball_players_data',
  MATCHES: 'efootball_matches_data',
  PLAYOFFS: 'efootball_playoffs_data',
  RULES: 'efootball_rules_data',
  ADMIN_PIN: 'efootball_admin_pin',
  ADMIN_AUTH: 'efootball_admin_logged_in',
};

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

/**
 * Helper to get active tournament doc reference
 */
function getActiveDocRef() {
  if (!db) throw new Error('Firestore is not initialized');
  return doc(db, TOURNAMENT_COLLECTION, ACTIVE_TOURNAMENT_DOC);
}

/**
 * Recursively removes any object keys whose value is undefined,
 * and strips undefined values from arrays.
 * This guarantees complete compatibility with Firestore SDK which rejects undefined anywhere in document trees.
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
 * Storage Service interfacing with Firebase Cloud Firestore
 * (with fallback to localStorage when Firebase credentials are not yet configured)
 */
export const StorageService = {
  /**
   * Real-time listener for multi-device live sync via Firestore onSnapshot
   */
  subscribeTournamentData(
    onUpdate: (data: TournamentFirestoreDoc | null) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = getActiveDocRef();
        return onSnapshot(
          docRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const docData = snapshot.data() as TournamentFirestoreDoc;
              // Mirror into localStorage for instant offline access and refresh safety
              try {
                StorageService.saveAllLocal(docData);
              } catch (e) {
                console.warn('[Storage] Failed to mirror to localStorage:', e);
              }
              onUpdate(docData);
            } else {
              onUpdate(null);
            }
          },
          (err) => {
            console.error('[Firestore] Real-time onSnapshot error:', err);
            // Fallback to local storage if Firestore encounters an error
            const localData = StorageService.loadAllLocal();
            if (localData) {
              onUpdate(localData);
            }
            onError?.(err);
          }
        );
      } catch (err) {
        console.error('[Firestore] Failed to attach listener:', err);
        const localData = StorageService.loadAllLocal();
        if (localData) onUpdate(localData);
        onError?.(err as Error);
      }
    }

    // Fallback: Read once from localStorage if Firebase is not active
    const localData = this.loadAllLocal();
    onUpdate(localData);
    return () => {};
  },

  /**
   * Seeds initial tournament data if Firestore document does not exist
   */
  async seedInitialDataIfEmpty(
    tournament: Tournament,
    players: Player[],
    matches: Match[],
    playoffs: PlayoffBracketData
  ): Promise<boolean> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = getActiveDocRef();
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          const initialDoc: TournamentFirestoreDoc = removeUndefinedDeep({
            tournament,
            players,
            matches,
            playoffs,
            adminPin: DEFAULT_ADMIN_PIN,
            updatedAt: new Date().toISOString(),
          });
          await setDoc(docRef, initialDoc);
          console.log('[Firestore] Seeded initial demo tournament to Firestore.');
          return true;
        }
        return false;
      } catch (err) {
        console.error('[Firestore] Error seeding initial data:', err);
        return false;
      }
    } else {
      // LocalStorage fallback
      if (!localStorage.getItem(STORAGE_KEYS.TOURNAMENT)) {
        this.saveAllLocal({
          tournament,
          players,
          matches,
          playoffs,
          adminPin: DEFAULT_ADMIN_PIN,
          updatedAt: new Date().toISOString(),
        });
        return true;
      }
      return false;
    }
  },

  /**
   * Reads complete tournament document once
   */
  async loadTournamentDoc(): Promise<TournamentFirestoreDoc | null> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(getActiveDocRef());
        if (snap.exists()) {
          return snap.data() as TournamentFirestoreDoc;
        }
        return null;
      } catch (err) {
        console.error('[Firestore] Error loading tournament document:', err);
        return null;
      }
    }
    return this.loadAllLocal();
  },

  /**
   * Atomically saves multiple tournament fields to Firestore / localStorage
   * in a single updateDoc / write operation to prevent race conditions in onSnapshot listeners.
   */
  async saveTournamentState(state: {
    tournament?: Tournament;
    players?: Player[];
    matches?: Match[];
    playoffs?: PlayoffBracketData;
    rules?: TournamentRulesData;
  }): Promise<void> {
    // 1. Immediately persist synchronously to localStorage for zero-latency refresh
    try {
      if (state.tournament !== undefined) {
        localStorage.setItem(STORAGE_KEYS.TOURNAMENT, JSON.stringify(state.tournament));
      }
      if (state.players !== undefined) {
        localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(state.players));
      }
      if (state.matches !== undefined) {
        localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(state.matches));
      }
      if (state.playoffs !== undefined) {
        localStorage.setItem(STORAGE_KEYS.PLAYOFFS, JSON.stringify(state.playoffs));
      }
      if (state.rules !== undefined) {
        localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(state.rules));
      }
    } catch (localErr) {
      console.warn('[Storage] LocalStorage write error in saveTournamentState:', localErr);
    }

    // 2. Persist to Firestore if configured
    if (isFirebaseConfigured && db) {
      const rawPayload: Record<string, any> = {
        updatedAt: new Date().toISOString(),
      };
      if (state.tournament !== undefined) rawPayload.tournament = state.tournament;
      if (state.players !== undefined) rawPayload.players = state.players;
      if (state.matches !== undefined) rawPayload.matches = state.matches;
      if (state.playoffs !== undefined) rawPayload.playoffs = state.playoffs;
      if (state.rules !== undefined) rawPayload.rules = state.rules;

      // Deep clean to eliminate any undefined values which Firestore SDK strictly rejects
      const payload = removeUndefinedDeep(rawPayload);

      try {
        await updateDoc(getActiveDocRef(), payload);
        return;
      } catch (updateErr) {
        console.warn('[Storage] updateDoc failed, attempting setDoc with merge:', updateErr);
        try {
          await setDoc(getActiveDocRef(), payload, { merge: true });
          return;
        } catch (setErr) {
          console.error('[Storage] setDoc failed in saveTournamentState:', setErr);
          throw setErr;
        }
      }
    }
  },

  async saveTournament(tournament: Tournament): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.TOURNAMENT, JSON.stringify(tournament));
    } catch (e) {
      console.warn('[Storage] LocalStorage saveTournament error:', e);
    }

    if (isFirebaseConfigured && db) {
      const payload = removeUndefinedDeep({
        tournament,
        updatedAt: new Date().toISOString(),
      });
      try {
        await updateDoc(getActiveDocRef(), payload);
        return;
      } catch {
        await setDoc(getActiveDocRef(), payload, { merge: true });
        return;
      }
    }
  },

  loadTournamentLocal(): Tournament | null {
    const tData = localStorage.getItem(STORAGE_KEYS.TOURNAMENT);
    if (!tData) return null;
    try {
      return JSON.parse(tData);
    } catch {
      return null;
    }
  },

  async loadTournament(): Promise<Tournament | null> {
    const docData = await this.loadTournamentDoc();
    return docData ? docData.tournament : this.loadTournamentLocal();
  },

  async savePlayers(players: Player[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
    } catch (e) {
      console.warn('[Storage] LocalStorage savePlayers error:', e);
    }

    if (isFirebaseConfigured && db) {
      const payload = removeUndefinedDeep({
        players,
        updatedAt: new Date().toISOString(),
      });
      try {
        await updateDoc(getActiveDocRef(), payload);
        return;
      } catch {
        await setDoc(getActiveDocRef(), payload, { merge: true });
        return;
      }
    }
  },

  loadPlayersLocal(): Player[] | null {
    const pData = localStorage.getItem(STORAGE_KEYS.PLAYERS);
    if (!pData) return null;
    try {
      return JSON.parse(pData);
    } catch {
      return null;
    }
  },

  async loadPlayers(): Promise<Player[]> {
    const docData = await this.loadTournamentDoc();
    return docData ? docData.players : (this.loadPlayersLocal() || []);
  },

  async saveMatches(matches: Match[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
    } catch (e) {
      console.warn('[Storage] LocalStorage saveMatches error:', e);
    }

    if (isFirebaseConfigured && db) {
      const payload = removeUndefinedDeep({
        matches,
        updatedAt: new Date().toISOString(),
      });
      try {
        await updateDoc(getActiveDocRef(), payload);
        return;
      } catch {
        await setDoc(getActiveDocRef(), payload, { merge: true });
        return;
      }
    }
  },

  loadMatchesLocal(): Match[] | null {
    const mData = localStorage.getItem(STORAGE_KEYS.MATCHES);
    if (!mData) return null;
    try {
      return JSON.parse(mData);
    } catch {
      return null;
    }
  },

  async loadMatches(): Promise<Match[]> {
    const docData = await this.loadTournamentDoc();
    return docData ? docData.matches : (this.loadMatchesLocal() || []);
  },

  async savePlayoffs(playoffs: PlayoffBracketData): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYOFFS, JSON.stringify(playoffs));
    } catch (e) {
      console.warn('[Storage] LocalStorage savePlayoffs error:', e);
    }

    if (isFirebaseConfigured && db) {
      const payload = removeUndefinedDeep({
        playoffs,
        updatedAt: new Date().toISOString(),
      });
      try {
        await updateDoc(getActiveDocRef(), payload);
        return;
      } catch {
        await setDoc(getActiveDocRef(), payload, { merge: true });
        return;
      }
    }
  },

  loadPlayoffsLocal(): PlayoffBracketData | null {
    const pData = localStorage.getItem(STORAGE_KEYS.PLAYOFFS);
    if (!pData) return null;
    try {
      return JSON.parse(pData);
    } catch {
      return null;
    }
  },

  async loadPlayoffs(): Promise<PlayoffBracketData> {
    const docData = await this.loadTournamentDoc();
    return docData ? docData.playoffs : (this.loadPlayoffsLocal() || {});
  },

  async saveRules(rules: TournamentRulesData): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules));
    } catch (e) {
      console.warn('[Storage] LocalStorage saveRules error:', e);
    }

    if (isFirebaseConfigured && db) {
      const payload = removeUndefinedDeep({
        rules,
        updatedAt: new Date().toISOString(),
      });
      try {
        await updateDoc(getActiveDocRef(), payload);
        return;
      } catch {
        await setDoc(getActiveDocRef(), payload, { merge: true });
        return;
      }
    }
  },

  async loadRules(): Promise<TournamentRulesData> {
    const docData = await this.loadTournamentDoc();
    if (docData?.rules) {
      return docData.rules;
    }
    const local = localStorage.getItem(STORAGE_KEYS.RULES);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {
        // fallback
      }
    }
    return DEFAULT_TOURNAMENT_RULES;
  },

  /**
   * Admin PIN: stored in Firestore so it's consistent across devices.
   * NOTE: Client-side PIN validation is an UI-level access control.
   * For strict production environments, configure Firebase Authentication
   * or Firestore Security Rules.
   */
  async getAdminPin(): Promise<string> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(getActiveDocRef());
        if (snap.exists() && snap.data()?.adminPin) {
          return snap.data().adminPin;
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
    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(getActiveDocRef(), {
          adminPin: pin,
          updatedAt: new Date().toISOString(),
        });
      } catch (updateErr: any) {
        try {
          await setDoc(
            getActiveDocRef(),
            {
              adminPin: pin,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (setErr: any) {
          console.error('[Storage] Failed to persist adminPin to Firestore:', setErr || updateErr);
          throw new Error(
            `Failed to persist admin PIN to database: ${setErr?.message || updateErr?.message || 'Unknown Firestore error'}`
          );
        }
      }
    }
    // Written only after Firestore confirms, or directly if Firebase is not configured (local fallback)
    localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, pin);
  },

  /**
   * Device-specific Admin Session:
   * Maintained in local browser session storage so one device logging in
   * does not automatically log in public spectator devices.
   */
  isAdminLoggedIn(): boolean {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  },

  setAdminLoggedIn(status: boolean): void {
    localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, String(status));
  },

  /**
   * Exports full tournament state to a JSON backup string
   */
  exportBackup(
    tournament: Tournament,
    players: Player[],
    matches: Match[],
    playoffs: PlayoffBracketData
  ): string {
    const backup: TournamentBackup = {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      tournament,
      players,
      matches,
      playoffs,
    };
    return JSON.stringify(backup, null, 2);
  },

  /**
   * Validates and imports a JSON backup string
   */
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

  /**
   * Resets results only (sets all completed scores back to null)
   */
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

  /**
   * Clears all tournament data in Firestore / localStorage
   */
  async clearAllData(): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(getActiveDocRef(), {
          tournament: null,
          players: [],
          matches: [],
          playoffs: {},
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('[Firestore] Error clearing tournament doc:', err);
      }
    }
    localStorage.removeItem(STORAGE_KEYS.TOURNAMENT);
    localStorage.removeItem(STORAGE_KEYS.PLAYERS);
    localStorage.removeItem(STORAGE_KEYS.MATCHES);
    localStorage.removeItem(STORAGE_KEYS.PLAYOFFS);
  },

  /**
   * Internal helpers for localStorage fallback
   */
  loadAllLocal(): TournamentFirestoreDoc | null {
    const tData = localStorage.getItem(STORAGE_KEYS.TOURNAMENT);
    if (!tData) return null;
    try {
      const rawRules = localStorage.getItem(STORAGE_KEYS.RULES);
      return {
        tournament: JSON.parse(tData),
        players: JSON.parse(localStorage.getItem(STORAGE_KEYS.PLAYERS) || '[]'),
        matches: JSON.parse(localStorage.getItem(STORAGE_KEYS.MATCHES) || '[]'),
        playoffs: JSON.parse(localStorage.getItem(STORAGE_KEYS.PLAYOFFS) || '{}'),
        rules: rawRules ? JSON.parse(rawRules) : DEFAULT_TOURNAMENT_RULES,
        adminPin: localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || DEFAULT_ADMIN_PIN,
        updatedAt: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  },

  saveAllLocal(data: TournamentFirestoreDoc): void {
    localStorage.setItem(STORAGE_KEYS.TOURNAMENT, JSON.stringify(data.tournament));
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(data.players));
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(data.matches));
    localStorage.setItem(STORAGE_KEYS.PLAYOFFS, JSON.stringify(data.playoffs));
    if (data.rules) {
      localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(data.rules));
    }
    if (data.adminPin) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, data.adminPin);
    }
  },
};
