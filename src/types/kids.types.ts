export type KidGender = 'boy' | 'girl';

export interface PendingCompletion {
  id: string;
  choreId: string;
  choreName: string;
  choreValue: number;
  goalId?: string;
  submittedDate: string; // ISO YYYY-MM-DD
}

export interface Goal {
  id: string;
  name: string;
  emoji: string;
  targetAmount: number;
  currentAmount: number;
}

export type ChoreFrequency = 'daily' | 'weekly' | 'monthly';

export interface Chore {
  id: string;
  name: string;
  value: number;
  frequency: ChoreFrequency;
  completedDates: string[];  // ISO date strings (YYYY-MM-DD)
}

export interface KidProfile {
  id: string;
  nickname: string;
  gender: KidGender;
  goals: Goal[];
  chores: Chore[];
  pendingCompletions: PendingCompletion[];
}

export const BOY_THEME = {
  primary: '#1E88E5',    // bright blue
  accent: '#29B6F6',     // sky blue
  accentLight: '#81D4FA',
  badge: '#FF8F00',      // amber
  bg: '#0A1929',         // deep navy background
  card: '#0D2137',
  label: 'BOY',
};

export const GIRL_THEME = {
  primary: '#E91E8C',    // hot pink
  accent: '#FF80AB',     // light pink
  accentLight: '#F8BBD0',
  badge: '#CE93D8',      // lavender
  bg: '#1A0A1E',         // deep plum background
  card: '#2D0F35',
  label: 'GIRL',
};

export function getKidTheme(gender: KidGender) {
  return gender === 'boy' ? BOY_THEME : GIRL_THEME;
}
