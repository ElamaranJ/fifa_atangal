export type TournamentStatus = 
  | 'SETUP' 
  | 'LEAGUE' 
  | 'QUALIFICATION' 
  | 'SEMI_FINALS' 
  | 'FINAL' 
  | 'COMPLETED';

export type GroupFormat = 'SINGLE' | 'TWO_GROUPS';

export type QualificationMethod = 
  | 'SINGLE_TOP_4'
  | 'TWO_GROUPS_TOP_2_EACH'
  | 'TWO_GROUPS_OVERALL_TOP_4'
  | 'TWO_GROUPS_CUSTOM';

export type MatchStatus = 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'POSTPONED';

export type MatchStage = 'LEAGUE' | 'SEMI_FINAL' | 'FINAL' | 'THIRD_PLACE';

export interface Tournament {
  id: string;
  tournament_name: string;
  status: TournamentStatus;
  group_format: GroupFormat;
  same_group_match_frequency: number;
  other_group_match_frequency: number;
  qualification_method: QualificationMethod;
  custom_qualify_group_a?: number;
  custom_qualify_group_b?: number;
  win_points: number;
  draw_points: number;
  loss_points: number;
  created_at: string;
  logo_url?: string;
}

export interface Player {
  id: string;
  tournament_id: string;
  player_name: string;
  player_photo?: string; // base64 or url
  group_name?: 'Group A' | 'Group B' | string;
  created_at: string;
}

export interface Match {
  id: string;
  tournament_id: string;
  player_1: string; // Player ID
  player_2: string; // Player ID
  group?: string; // 'Group A', 'Group B', 'Cross Group', 'League'
  round: number;
  match_number: number;
  player_1_score?: number | null;
  player_2_score?: number | null;
  status: MatchStatus;
  stage: MatchStage;
  date?: string;
  time?: string;
  location?: string;
  penalties_played?: boolean;
  player_1_penalty_score?: number | null;
  player_2_penalty_score?: number | null;
  winner_id?: string | null;
  completed_at?: string;
}

export interface PlayerStatistics {
  player_id: string;
  player_name: string;
  player_photo?: string;
  group_name?: string;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  total_goals: number;
  goals_per_match: number;
  win_percentage: number;
  rank: number;
  previous_rank?: number;
  rank_change?: 'UP' | 'DOWN' | 'SAME';
  golden_boot_rank: number;
  is_joint_golden_boot?: boolean;
  best_player_rating: number; // 0.0 to 10.0 scale
  is_qualified?: boolean;
  form: ('W' | 'D' | 'L')[];
}

export interface PlayoffBracketData {
  semi_final_1?: Match;
  semi_final_2?: Match;
  final?: Match;
  third_place?: Match;
  champion_player_id?: string;
  runner_up_player_id?: string;
  third_place_player_id?: string;
}

export interface DynamicTournamentStats {
  total_goals: number;
  total_matches: number;
  completed_matches: number;
  remaining_matches: number;
  highest_scorer?: PlayerStatistics;
  is_joint_highest_scorer?: boolean;
  current_leader?: PlayerStatistics;
  highest_goal_diff_player?: PlayerStatistics;
  average_goals_per_match: number;
}

export interface TournamentBackup {
  version: string;
  exported_at: string;
  tournament: Tournament;
  players: Player[];
  matches: Match[];
  playoffs: PlayoffBracketData;
}

export type RuleCategory = 'home' | 'college' | 'general';
export type RuleSeverity = 'critical' | 'warning' | 'info' | 'success';

export interface TournamentRuleItem {
  id: string;
  category: RuleCategory;
  title: string;
  description: string;
  badge?: string;
  severity: RuleSeverity;
  isHighlighted?: boolean;
}

export interface TournamentRulesData {
  lastUpdated?: string;
  homeRules: TournamentRuleItem[];
  collegeRules: TournamentRuleItem[];
  generalNotice?: string;
}
