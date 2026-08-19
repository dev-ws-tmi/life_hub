import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  fetchHevyWorkouts,
  fetchHevyBodyMeasurements,
  type HevyWorkout,
  type HevyBodyMeasurement,
} from '../../features/health/services/hevyApi';

export type WorkoutType = 'GYM' | 'RUNNING' | 'WALKING' | 'CYCLING' | 'YOGA' | 'SWIMMING' | 'OTHER';
export type WorkoutIntensity = 'LOW' | 'MEDIUM' | 'HIGH';
export type MoodType = 'EXCELLENT' | 'GOOD' | 'NEUTRAL' | 'TIRED' | 'STRESSED';

export interface Workout {
  id: string;
  date: string; // YYYY-MM-DD
  type: WorkoutType;
  name: string;
  durationMinutes: number;
  caloriesBurned?: number;
  intensity: WorkoutIntensity;
  notes?: string;
  source?: 'LOCAL' | 'HEVY';
  hevyDetails?: HevyWorkout;
}

export interface WeightEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  notes?: string;
  source?: 'LOCAL' | 'HEVY';
}

export interface SleepLog {
  date: string; // YYYY-MM-DD
  hours: number;
  quality: number; // 1-5
  bedtime?: string;
  wakeupTime?: string;
}

export interface MoodLog {
  date: string; // YYYY-MM-DD
  mood: MoodType;
  notes?: string;
}

interface HealthState {
  // Hevy API Config
  hevyApiKey: string;
  lastHevySync: string | null;
  setHevyApiKey: (key: string) => void;
  syncHevyWorkouts: () => Promise<{ workoutsCount: number; measurementsCount: number }>;

  // Targets / Configuration
  sleepTargetHours: number;
  weightTargetKg: number;
  heightCm: number;

  // Logs & History
  workouts: Workout[];
  weightEntries: WeightEntry[];
  bodyMeasurements: HevyBodyMeasurement[];
  sleepLogs: SleepLog[];
  moodLogs: MoodLog[];

  // Configuration Actions
  setSleepTarget: (hours: number) => void;
  setWeightTarget: (kg: number) => void;
  setHeightCm: (cm: number) => void;

  // Sleep Actions
  logSleep: (log: SleepLog) => void;
  getSleepToday: (date: string) => SleepLog | undefined;

  // Mood Actions
  logMood: (log: MoodLog) => void;
  getMoodToday: (date: string) => MoodLog | undefined;

  // Weight & Body Measurements Actions
  addWeightEntry: (weightKg: number, date?: string, notes?: string) => void;
  deleteWeightEntry: (id: string) => void;
  addBodyMeasurement: (measurement: Omit<HevyBodyMeasurement, 'id' | 'created_at'>) => void;

  // Workout Actions
  addWorkout: (workout: Omit<Workout, 'id'>) => void;
  deleteWorkout: (id: string) => void;
}

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      hevyApiKey: '6bd67b23-be75-4046-ab5a-3c8c00e6ff7a',
      lastHevySync: null,

      sleepTargetHours: 8,
      weightTargetKg: 70,
      heightCm: 175,

      workouts: [],
      weightEntries: [],
      bodyMeasurements: [],
      sleepLogs: [],
      moodLogs: [],

      setHevyApiKey: (key) => set({ hevyApiKey: key }),

      syncHevyWorkouts: async () => {
        const apiKey = get().hevyApiKey;
        if (!apiKey) throw new Error('Cal introduir una API Key de Hevy.');

        // 1. Fetch Hevy Workouts
        const hevyList = await fetchHevyWorkouts(apiKey, 1, 10);

        const convertedWorkouts: Workout[] = hevyList.map((hw) => {
          const startDate = new Date(hw.start_time);
          const endDate = new Date(hw.end_time);
          const durationMins = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
          const dateStr = startDate.toISOString().split('T')[0];

          let totalSets = 0;
          hw.exercises.forEach((ex) => {
            ex.sets.forEach(() => totalSets++);
          });

          const estCalories = Math.round(durationMins * 7);

          return {
            id: `hevy_${hw.id}`,
            date: dateStr,
            type: 'GYM',
            name: hw.title || 'Entrenament de Hevy',
            durationMinutes: durationMins,
            caloriesBurned: estCalories,
            intensity: totalSets > 15 ? 'HIGH' : totalSets > 8 ? 'MEDIUM' : 'LOW',
            notes: hw.description || undefined,
            source: 'HEVY',
            hevyDetails: hw,
          };
        });

        // Merge keeping existing local non-hevy workouts
        const currentWorkouts = get().workouts;
        const nonHevyWorkouts = currentWorkouts.filter((w) => w.source !== 'HEVY');
        const mergedWorkouts = [...convertedWorkouts, ...nonHevyWorkouts].sort((a, b) => b.date.localeCompare(a.date));

        // 2. Fetch Hevy Body Measurements
        const hevyMeasurements = await fetchHevyBodyMeasurements(apiKey);

        // Convert weight measurements to weightEntries
        const hevyWeightEntries: WeightEntry[] = hevyMeasurements
          .filter((bm) => bm.weight_kg !== undefined && bm.weight_kg > 0)
          .map((bm) => ({
            id: `hevy_w_${bm.id}`,
            date: bm.date,
            weightKg: Number(bm.weight_kg),
            notes: undefined,
            source: 'HEVY',
          }));

        const currentWeightEntries = get().weightEntries;
        const nonHevyWeights = currentWeightEntries.filter((w) => w.source !== 'HEVY');
        const mergedWeightEntries = [...hevyWeightEntries, ...nonHevyWeights].sort((a, b) => a.date.localeCompare(b.date));

        set({
          workouts: mergedWorkouts,
          bodyMeasurements: hevyMeasurements.sort((a, b) => b.date.localeCompare(a.date)),
          weightEntries: mergedWeightEntries,
          lastHevySync: new Date().toISOString(),
        });

        return {
          workoutsCount: convertedWorkouts.length,
          measurementsCount: hevyMeasurements.length,
        };
      },

      setSleepTarget: (hours) => set({ sleepTargetHours: hours }),
      setWeightTarget: (kg) => set({ weightTargetKg: kg }),
      setHeightCm: (cm) => set({ heightCm: cm }),

      logSleep: (log) => {
        set((state) => {
          const idx = state.sleepLogs.findIndex((l) => l.date === log.date);
          let updated = [...state.sleepLogs];
          if (idx >= 0) {
            updated[idx] = log;
          } else {
            updated.push(log);
          }
          return { sleepLogs: updated };
        });
      },

      getSleepToday: (date) => {
        return get().sleepLogs.find((l) => l.date === date);
      },

      logMood: (log) => {
        set((state) => {
          const idx = state.moodLogs.findIndex((l) => l.date === log.date);
          let updated = [...state.moodLogs];
          if (idx >= 0) {
            updated[idx] = log;
          } else {
            updated.push(log);
          }
          return { moodLogs: updated };
        });
      },

      getMoodToday: (date) => {
        return get().moodLogs.find((l) => l.date === date);
      },

      addWeightEntry: (weightKg, dateStr, notes) => {
        const date = dateStr || new Date().toISOString().split('T')[0];
        const newEntry: WeightEntry = {
          id: `w_${Date.now()}`,
          date,
          weightKg,
          notes,
          source: 'LOCAL',
        };
        set((state) => ({
          weightEntries: [...state.weightEntries.filter((w) => w.date !== date), newEntry].sort((a, b) => a.date.localeCompare(b.date)),
        }));
      },

      deleteWeightEntry: (id) => {
        set((state) => ({
          weightEntries: state.weightEntries.filter((w) => w.id !== id),
        }));
      },

      addBodyMeasurement: (measurement) => {
        const newMeasurement: HevyBodyMeasurement = {
          ...measurement,
          id: Date.now(),
          created_at: new Date().toISOString(),
        };
        set((state) => ({
          bodyMeasurements: [newMeasurement, ...state.bodyMeasurements],
        }));
      },

      addWorkout: (workout) => {
        const newWorkout: Workout = {
          ...workout,
          id: `wo_${Date.now()}`,
          source: 'LOCAL',
        };
        set((state) => ({
          workouts: [newWorkout, ...state.workouts],
        }));
      },

      deleteWorkout: (id) => {
        set((state) => ({
          workouts: state.workouts.filter((w) => w.id !== id),
        }));
      },
    }),
    { name: 'estudi360-health' }
  )
);
