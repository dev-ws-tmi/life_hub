import { useState, useMemo } from 'react';
import { Moon, Sparkles, Award } from 'lucide-react';
import { useHealthStore } from '@/shared/stores/useHealthStore';
import { Button } from '@/shared/components/ui/Button';
import toast from 'react-hot-toast';

export default function HealthSleepPage() {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const { sleepTargetHours, logSleep, getSleepToday, setSleepTarget } = useHealthStore();

  const sleepToday = getSleepToday(todayStr);

  const [sleepHoursInput, setSleepHoursInput] = useState(sleepToday ? sleepToday.hours : 7.5);
  const [sleepQualityInput, setSleepQualityInput] = useState(sleepToday ? sleepToday.quality : 4);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sleep Logger Section */}
        <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm space-y-5">
          <div>
            <h3 className="font-display font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
              <Moon className="text-indigo-500" size={18} /> Control de Son & Descans
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">Registra quantes hores has dormit i la qualitat del teu descans</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Hores dormides (avui)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="3"
                  max="12"
                  step="0.5"
                  value={sleepHoursInput}
                  onChange={(e) => setSleepHoursInput(Number(e.target.value))}
                  className="flex-1 accent-indigo-500"
                />
                <span className="text-lg font-bold text-indigo-500 w-16 text-right">{sleepHoursInput}h</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Qualitat del Son (1 a 5 estrelles)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSleepQualityInput(star)}
                    className={`p-3 rounded-xl border font-bold text-sm transition-all flex-1 ${
                      sleepQualityInput === star
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500 shadow-sm'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                    }`}
                  >
                    {star} ★
                  </button>
                ))}
              </div>
            </div>

            <Button
              fullWidth
              onClick={() => {
                logSleep({ date: todayStr, hours: sleepHoursInput, quality: sleepQualityInput });
                toast.success('Lectura de son guardada!');
              }}
            >
              <Sparkles size={16} /> Desat el Registre de Son
            </Button>
          </div>
        </div>

        {/* Sleep Goal & Metrics Settings */}
        <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm space-y-5">
          <div>
            <h3 className="font-display font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
              <Award className="text-indigo-500" size={18} /> Objectiu de Descans Nocturn
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">Estableix el teu objectiu d'hores de son diari</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Registre d'Avui</span>
              <span className="text-2xl font-display font-bold text-indigo-500">
                {sleepToday ? `${sleepToday.hours}h` : 'Sense registrar'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Objectiu Diari (Hores)</label>
              <input
                type="number"
                step="0.5"
                min="4"
                max="12"
                value={sleepTargetHours}
                onChange={(e) => setSleepTarget(Number(e.target.value))}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
