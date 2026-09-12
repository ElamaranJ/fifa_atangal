import { Tournament, Player, Match, PlayoffBracketData, TournamentBackup } from '../types/tournament';

const STORAGE_KEYS = {
  TOURNAMENT: 'efootball_tournament_data',
  PLAYERS: 'efootball_players_data',
  MATCHES: 'efootball_matches_data',
  PLAYOFFS: 'efootball_playoffs_data',
  ADMIN_PIN: 'efootball_admin_pin',
  ADMIN_AUTH: 'efootball_admin_logged_in',
};

export const DEFAULT_ADMIN_PIN = 'admin123';

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
        // Try webp first for maximum compression, fallback to jpeg
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
 * Storage helpers with LocalStorage persistence
 */
export const StorageService = {
  saveTournament(tournament: Tournament) {
    localStorage.setItem(STORAGE_KEYS.TOURNAMENT, JSON.stringify(tournament));
  },
  loadTournament(): Tournament | null {
    const data = localStorage.getItem(STORAGE_KEYS.TOURNAMENT);
    return data ? JSON.parse(data) : null;
  },

  savePlayers(players: Player[]) {
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
  },
  loadPlayers(): Player[] {
    const data = localStorage.getItem(STORAGE_KEYS.PLAYERS);
    return data ? JSON.parse(data) : [];
  },

  saveMatches(matches: Match[]) {
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
  },
  loadMatches(): Match[] {
    const data = localStorage.getItem(STORAGE_KEYS.MATCHES);
    return data ? JSON.parse(data) : [];
  },

  savePlayoffs(playoffs: PlayoffBracketData) {
    localStorage.setItem(STORAGE_KEYS.PLAYOFFS, JSON.stringify(playoffs));
  },
  loadPlayoffs(): PlayoffBracketData {
    const data = localStorage.getItem(STORAGE_KEYS.PLAYOFFS);
    return data ? JSON.parse(data) : {};
  },

  getAdminPin(): string {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || DEFAULT_ADMIN_PIN;
  },
  setAdminPin(pin: string) {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, pin);
  },

  isAdminLoggedIn(): boolean {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  },
  setAdminLoggedIn(status: boolean) {
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
   * 3-tier Reset options:
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

  clearAllData() {
    localStorage.removeItem(STORAGE_KEYS.TOURNAMENT);
    localStorage.removeItem(STORAGE_KEYS.PLAYERS);
    localStorage.removeItem(STORAGE_KEYS.MATCHES);
    localStorage.removeItem(STORAGE_KEYS.PLAYOFFS);
  }
};
