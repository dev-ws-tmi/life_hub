export interface HevySet {
  index: number;
  type: 'warmup' | 'normal' | 'drop_set' | 'failure' | string;
  weight_kg: number | null;
  reps: number | null;
  distance_meters: number | null;
  duration_seconds: number | null;
  rpe: number | null;
}

export interface HevyExercise {
  index: number;
  title: string;
  notes?: string;
  exercise_template_id: string;
  sets: HevySet[];
}

export interface HevyWorkout {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  updated_at: string;
  created_at: string;
  exercises: HevyExercise[];
}

export interface HevyWorkoutsResponse {
  page_count: number;
  workouts: HevyWorkout[];
}

export interface HevyBodyMeasurement {
  id: number;
  date: string;
  weight_kg?: number;
  neck_cm?: number;
  chest_cm?: number;
  left_bicep_cm?: number;
  right_bicep_cm?: number;
  left_forearm_cm?: number;
  right_forearm_cm?: number;
  abdomen?: number;
  waist?: number;
  left_thigh?: number;
  right_thigh?: number;
  left_calf?: number;
  right_calf?: number;
  created_at: string;
}

export interface HevyBodyMeasurementsResponse {
  page: number;
  page_count: number;
  body_measurements: HevyBodyMeasurement[];
}

const BASE_URL = 'https://api.hevyapp.com/v1';

export async function fetchHevyWorkouts(apiKey: string, page = 1, pageSize = 10): Promise<HevyWorkout[]> {
  if (!apiKey) {
    throw new Error('Cal una API Key de Hevy per sincronitzar.');
  }

  const validPageSize = Math.min(Math.max(1, pageSize), 10);

  const response = await fetch(`${BASE_URL}/workouts?page=${page}&pageSize=${validPageSize}`, {
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error en connectar amb Hevy: ${response.status} ${response.statusText} (${errorText})`);
  }

  const data: HevyWorkoutsResponse = await response.json();
  return data.workouts || [];
}

export async function fetchHevyBodyMeasurements(apiKey: string): Promise<HevyBodyMeasurement[]> {
  if (!apiKey) {
    return [];
  }

  try {
    const response = await fetch(`${BASE_URL}/body_measurements?page=1&pageSize=10`, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) return [];

    const data: HevyBodyMeasurementsResponse = await response.json();
    return data.body_measurements || [];
  } catch {
    return [];
  }
}
