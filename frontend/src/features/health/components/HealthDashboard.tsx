import { useMemo } from 'react';
import {
  Dumbbell, Scale, TrendingUp, TrendingDown, Activity, Flame, Ruler, Minus
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useHealthStore } from '@/shared/stores/useHealthStore';
import type { HevyWorkout } from '../services/hevyApi';

interface HealthDashboardProps {
  onSelectHevyWorkout: (workout: HevyWorkout) => void;
  onNavigateTab: (tab: 'WORKOUTS' | 'WEIGHT') => void;
}

export default function HealthDashboard({
  onNavigateTab,
}: HealthDashboardProps) {
  const {
    workouts, weightEntries, bodyMeasurements, heightCm, weightTargetKg
  } = useHealthStore();

  // --- 1. EXERCISE CALCULATIONS (HOURS WITH DECIMALS & PERIOD COMPARISON) ---
  
  const exerciseStats = useMemo(() => {
    const today = new Date();
    
    // Last 7 days range
    const d7Ago = new Date();
    d7Ago.setDate(today.getDate() - 7);
    const d7AgoStr = d7Ago.toISOString().split('T')[0];

    // Days 8-14 range
    const d14Ago = new Date();
    d14Ago.setDate(today.getDate() - 14);
    const d14AgoStr = d14Ago.toISOString().split('T')[0];

    const current7dWorkouts = workouts.filter((w) => w.date >= d7AgoStr);
    const prev7dWorkouts = workouts.filter((w) => w.date >= d14AgoStr && w.date < d7AgoStr);

    const currentMins = current7dWorkouts.reduce((sum, w) => sum + w.durationMinutes, 0);
    const prevMins = prev7dWorkouts.reduce((sum, w) => sum + w.durationMinutes, 0);
    
    // Convert to hours with decimal
    const currentHours = (currentMins / 60).toFixed(1);
    const prevHours = (prevMins / 60).toFixed(1);
    const hoursDeltaNum = Number(currentHours) - Number(prevHours);
    const hoursDeltaStr = hoursDeltaNum >= 0 ? `+${hoursDeltaNum.toFixed(1)}` : hoursDeltaNum.toFixed(1);

    const currentCalories = current7dWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
    const prevCalories = prev7dWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
    const caloriesDelta = currentCalories - prevCalories;

    const currentCount = current7dWorkouts.length;
    const prevCount = prev7dWorkouts.length;
    const countDelta = currentCount - prevCount;

    return {
      currentHours,
      prevHours,
      hoursDeltaNum,
      hoursDeltaStr,
      currentCalories,
      caloriesDelta,
      currentCount,
      countDelta,
    };
  }, [workouts]);

  // Bar chart data for last 7 days (Hours with decimal)
  const workoutChartData = useMemo(() => {
    const workoutsMap: Record<string, { durationMins: number; dateStr: string }> = {};
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      workoutsMap[dateStr] = {
        durationMins: 0,
        dateStr: d.toLocaleDateString('ca-ES', { weekday: 'short' }),
      };
    }

    workouts.forEach((w) => {
      if (workoutsMap[w.date]) {
        workoutsMap[w.date].durationMins += w.durationMinutes;
      }
    });

    return Object.values(workoutsMap).map((item) => ({
      day: item.dateStr,
      'Hores': Number((item.durationMins / 60).toFixed(1)),
    }));
  }, [workouts]);

  // --- 2. WEIGHT & MEASUREMENTS CALCULATIONS & DELTA ---

  const weightStats = useMemo(() => {
    if (weightEntries.length === 0) {
      return {
        latestWeight: 64.2,
        prevWeight: 64.2,
        weightDelta: 0,
      };
    }

    const sorted = [...weightEntries].sort((a, b) => a.date.localeCompare(b.date));
    const latest = sorted[sorted.length - 1].weightKg;
    const prev = sorted.length > 1 ? sorted[sorted.length - 2].weightKg : latest;
    const delta = latest - prev;

    return {
      latestWeight: latest,
      prevWeight: prev,
      weightDelta: delta,
    };
  }, [weightEntries]);

  const heightM = heightCm / 100;
  const bmi = heightM > 0 ? (weightStats.latestWeight / (heightM * heightM)).toFixed(1) : '21.0';

  const bmiCategory = useMemo(() => {
    const b = parseFloat(bmi);
    if (b < 18.5) return { label: 'Sota pes', color: 'text-amber-500' };
    if (b < 25) return { label: 'Pes normal', color: 'text-emerald-500' };
    if (b < 30) return { label: 'Sobrepes', color: 'text-amber-500' };
    return { label: 'Obessitat', color: 'text-rose-500' };
  }, [bmi]);

  // Line chart data for weight
  const weightChartData = useMemo(() => {
    return weightEntries.map((w) => ({
      date: new Date(w.date).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' }),
      'Pes (kg)': w.weightKg,
      'Objectiu (kg)': weightTargetKg,
    }));
  }, [weightEntries, weightTargetKg]);

  const latestMeasurement = bodyMeasurements.length > 0 ? bodyMeasurements[0] : null;

  return (
    <div className="space-y-6 animate-fade-in pb-4">
      
      {/* ========================================== */}
      {/* SECCIÓ 1: EXERCICI & RENDIMENT FÍSIC          */}
      {/* ========================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
          <div>
            <h3 className="font-display font-bold text-base text-[var(--text-primary)] flex items-center gap-1.5">
              <Dumbbell className="text-brand-500" size={18} /> Exercici & Rendiment (Hores)
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('WORKOUTS')}
            className="text-xs font-bold text-brand-500 hover:underline"
          >
            Veure entrenaments
          </button>
        </div>

        {/* 3 Compact Metric Cards with INLINE Deltas next to the main number */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Card 1: Hores d'Exercici (7 dies) */}
          <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-xl p-3.5 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Hores Exercici (7 dies)</span>
              <div className="w-6 h-6 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center">
                <Dumbbell size={14} />
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-0.5">
              <p className="text-2xl font-display font-bold text-brand-500">{exerciseStats.currentHours} <span className="text-xs font-normal text-[var(--text-muted)]">h</span></p>
              
              {/* INLINE DELTA BADGE NEXT TO NUMBER */}
              <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                exerciseStats.hoursDeltaNum >= 0
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-500 border-red-500/20'
              }`}>
                {exerciseStats.hoursDeltaNum >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {exerciseStats.hoursDeltaStr} h
              </span>
            </div>
          </div>

          {/* Card 2: Sessions Realitzades */}
          <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-xl p-3.5 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Sessions Realitzades</span>
              <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Activity size={14} />
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-0.5">
              <p className="text-2xl font-display font-bold text-[var(--text-primary)]">{exerciseStats.currentCount} <span className="text-xs font-normal text-[var(--text-muted)]">sessions</span></p>
              
              {/* INLINE DELTA BADGE */}
              <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                exerciseStats.countDelta >= 0
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-500 border-red-500/20'
              }`}>
                {exerciseStats.countDelta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {exerciseStats.countDelta >= 0 ? `+${exerciseStats.countDelta}` : exerciseStats.countDelta}
              </span>
            </div>
          </div>

          {/* Card 3: Calories Cremades */}
          <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-xl p-3.5 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Calories Estimades</span>
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Flame size={14} />
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-0.5">
              <p className="text-2xl font-display font-bold text-amber-500">{exerciseStats.currentCalories} <span className="text-xs font-normal text-[var(--text-muted)]">kcal</span></p>
              
              {/* INLINE DELTA BADGE */}
              <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                exerciseStats.caloriesDelta >= 0
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-500 border-red-500/20'
              }`}>
                {exerciseStats.caloriesDelta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {exerciseStats.caloriesDelta >= 0 ? `+${exerciseStats.caloriesDelta}` : exerciseStats.caloriesDelta} kcal
              </span>
            </div>
          </div>

        </div>

        {/* Compact Bar Chart: Exercise Hours last 7 days */}
        <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-xl p-4 shadow-sm space-y-2">
          <h4 className="font-semibold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
            <Dumbbell size={14} className="text-brand-500" /> Hores d'Exercici Diàries (Últims 7 Dies)
          </h4>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 600, height: 140 }}>
              <BarChart data={workoutChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-raised)',
                    borderColor: 'var(--border-subtle)',
                    borderRadius: '10px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="Hores" fill="var(--color-brand-500)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>


      {/* ========================================== */}
      {/* SECCIÓ 2: MESURES I PES                    */}
      {/* ========================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
          <div>
            <h3 className="font-display font-bold text-base text-[var(--text-primary)] flex items-center gap-1.5">
              <Scale className="text-purple-500" size={18} /> Mesures Corporals & Pes
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('WEIGHT')}
            className="text-xs font-bold text-purple-500 hover:underline"
          >
            Ver silueta i mesures
          </button>
        </div>

        {/* 3 Compact Metric Cards with INLINE Deltas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Card 1: Pes Actual & Delta (GUANYAR PES = VERD, PERDRE PES = VERMELL) */}
          <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-xl p-3.5 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Tendència de Pes</span>
              <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Scale size={14} />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <p className="text-2xl font-display font-bold text-purple-500">{weightStats.latestWeight} <span className="text-xs font-normal text-[var(--text-muted)]">kg</span></p>

              {/* INLINE WEIGHT DELTA BADGE: GUANYAR PES = VERD, PERDRE PES = VERMELL */}
              <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                weightStats.weightDelta > 0
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : weightStats.weightDelta < 0
                  ? 'bg-red-500/10 text-red-500 border-red-500/20'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border-subtle)]'
              }`}>
                {weightStats.weightDelta > 0 ? (
                  <>
                    <TrendingUp size={11} />
                    <span>+{weightStats.weightDelta.toFixed(1)} kg</span>
                  </>
                ) : weightStats.weightDelta < 0 ? (
                  <>
                    <TrendingDown size={11} />
                    <span>{weightStats.weightDelta.toFixed(1)} kg</span>
                  </>
                ) : (
                  <>
                    <Minus size={11} />
                    <span>0.0 kg</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-[9px] text-[var(--text-muted)]">Objectiu: {weightTargetKg} kg</p>
          </div>

          {/* Card 2: Alçada */}
          <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-xl p-3.5 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Alçada Fixa</span>
              <div className="w-6 h-6 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center">
                <Ruler size={14} />
              </div>
            </div>
            
            <p className="text-2xl font-display font-bold text-[var(--text-primary)] pt-0.5">{heightCm} <span className="text-xs font-normal text-[var(--text-muted)]">cm</span></p>
            <p className="text-[9px] text-[var(--text-muted)]">Actualitzable en registrar pes</p>
          </div>

          {/* Card 3: IMC */}
          <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-xl p-3.5 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">IMC (Massa Corporal)</span>
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Activity size={14} />
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-0.5">
              <p className="text-2xl font-display font-bold text-[var(--text-primary)]">{bmi}</p>
              <span className={`text-[10px] font-bold ${bmiCategory.color}`}>{bmiCategory.label}</span>
            </div>
            <p className="text-[9px] text-[var(--text-muted)]">Pes / (Alçada)²</p>
          </div>

        </div>

        {/* Compact Weight Line Chart */}
        <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-xl p-4 shadow-sm space-y-2">
          <h4 className="font-semibold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
            <TrendingUp size={14} className="text-purple-500" /> Evolució del Pes (kg) vs. Objectiu
          </h4>
          <div className="h-36">
            {weightChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
                No s'ha enregistrat cap pes encara.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 600, height: 140 }}>
                <LineChart data={weightChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={10} domain={['auto', 'auto']} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-raised)',
                      borderColor: 'var(--border-subtle)',
                      borderRadius: '10px',
                      fontSize: '11px',
                    }}
                  />
                  <Line type="monotone" dataKey="Pes (kg)" stroke="#a855f7" strokeWidth={2.5} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="Objectiu (kg)" stroke="var(--text-muted)" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Latest Body Measurements Pill Row */}
        {latestMeasurement && (
          <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-xl p-3.5 shadow-sm flex items-center justify-between text-xs gap-2">
            <span className="font-semibold text-[var(--text-secondary)] text-[11px]">Darrers perímetres ({latestMeasurement.date}):</span>
            <div className="flex flex-wrap gap-1.5 text-[11px] justify-end">
              {latestMeasurement.chest_cm && (
                <span className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-lg">
                  Pit: <strong className="text-[var(--text-primary)]">{latestMeasurement.chest_cm} cm</strong>
                </span>
              )}
              {(latestMeasurement.left_bicep_cm || latestMeasurement.right_bicep_cm) && (
                <span className="bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded-lg text-brand-500">
                  Bíceps: <strong>{latestMeasurement.left_bicep_cm || '—'} / {latestMeasurement.right_bicep_cm || '—'} cm</strong>
                </span>
              )}
              {latestMeasurement.abdomen && (
                <span className="bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg text-amber-500">
                  Abdomen: <strong>{latestMeasurement.abdomen} cm</strong>
                </span>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
