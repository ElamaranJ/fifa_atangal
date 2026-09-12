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
              onUpdate(snapshot.data() as TournamentFirestoreDoc);
            } else {
              onUpdate(null);
            }
          },
          (err) => {
            console.error('[Firestore] Real-time onSnapshot error:', err);
            onError?.(err);
          }
        );
      } catch (err) {
        console.error('[Firestore] Failed to attach listener:', err);
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
          const initialDoc: TournamentFirestoreDoc = {
            tournament,
            players,
            matches,
            playoffs,
            adminPin: DEFAULT_ADMIN_PIN,
            updatedAt: new Date().toISOString(),
          };
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
    const payload: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };
    if (state.tournament !== undefined) payload.tournament = state.tournament;
    if (state.players !== undefined) payload.players = state.players;
    if (state.matches !== undefined) payload.matches = state.matches;
    if (state.playoffs !== undefined) payload.playoffs = state.playoffs;
    if (state.rules !== undefined) payload.rules = state.rules;

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(getActiveDocRef(), payload);
        return;
      } catch {
        await setDoc(getActiveDocRef(), payload, { merge: true });
        return;
      }
    }

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
  },

  async saveTournament(tournament: Tournament): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(getActiveDocRef(), {
          tournament,
          updatedAt: new Date().toISOString(),
        });
        return;
      } catch {
        // If document doesn't exist yet, use setDoc with merge
        await setDoc(getActiveDocRef(), {
          tournament,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        return;
      }
    }
    localStorage.setItem(STORAGE_KEYS.TOURNAMENT, JSON.stringify(tournament));
  },

  async loadTournament(): Promise<Tournament | null> {
    const docData = await this.loadTournamentDoc();
    return docData ? docData.tournament : null;
  },

  async savePlayers(players: Player[]): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(getActiveDocRef(), {
          players,
          updatedAt: new Date().toISOString(),
        });
        return;
      } catch {
        await setDoc(getActiveDocRef(), {
          players,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        return;
      }
    }
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
  },

  async loadPlayers(): Promise<Player[]> {
    const docData = await this.loadTournamentDoc();
    return docData ? docData.players : [];
  },

  async saveMatches(matches: Match[]): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(getActiveDocRef(), {
          matches,
          updatedAt: new Date().toISOString(),
        });
        return;
      } catch {
        await setDoc(getActiveDocRef(), {
          matches,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        return;
      }
    }
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
  },

  async loadMatches(): Promise<Match[]> {
    const docData = await this.loadTournamentDoc();
    return docData ? docData.matches : [];
  },

  async savePlayoffs(playoffs: PlayoffBracketData): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(getActiveDocRef(), {
          playoffs,
          updatedAt: new Date().toISOString(),
        });
        return;
      } catch {
        await setDoc(getActiveDocRef(), {
          playoffs,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        return;
      }
    }
    localStorage.setItem(STORAGE_KEYS.PLAYOFFS, JSON.stringify(playoffs));
  },

  async loadPlayoffs(): Promise<PlayoffBracketData> {
    const docData = await this.loadTournamentDoc();
    return docData ? docData.playoffs : {};
  },

  async saveRules(rules: TournamentRulesData): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(getActiveDocRef(), {
          rules,
          updatedAt: new Date().toISOString(),
        });
        return;
      } catch {
        await setDoc(getActiveDocRef(), {
          rules,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        return;
      }
    }
    localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules));
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
      } catch {
        await setDoc(getActiveDocRef(), { adminPin: pin }, { merge: true });
      }
    }
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
    return matches.map(m => ({
      ...m,
      player_1_score: null,
      player_2_score: null,
      status: 'UPCOMING',
      penalties_played: false,
      player_1_penalty_score: null,
      player_2_penalty_score: null,
      winner_id: null,
      completed_at: undefined,
    }));
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
