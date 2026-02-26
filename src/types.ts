export interface Task {
  id: string;
  name: string;
  timeSpent: number; // in seconds
  goalSeconds: number; // in seconds
  isIndefinite: boolean;
  isNotify: boolean;
  sortOrder: number;
}

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';
