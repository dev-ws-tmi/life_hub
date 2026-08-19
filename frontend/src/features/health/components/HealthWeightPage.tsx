import { useMemo } from 'react';
import { Scale, Plus, Trash2, Activity, Ruler } from 'lucide-react';
import { useHealthStore } from '@/shared/stores/useHealthStore';
import { Button } from '@/shared/components/ui/Button';
import BodySilhouetteDiagram from './BodySilhouetteDiagram';
import toast from 'react-hot-toast';

interface HealthWeightPageProps {
  onOpenWeightModal: () => void;
}

export default function HealthWeightPage({ onOpenWeightModal }: HealthWeightPageProps) {
  const {
    weightEntries, bodyMeasurements, heightCm, deleteWeightEntry
  } = useHealthStore();

  const latestWeight = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weightKg : 64.2;
  const heightM = heightCm / 100;
  const bmi = heightM > 0 ? (latestWeight / (heightM * heightM)).toFixed(1) : '21.0';

  const bmiCategory = useMemo(() => {
    const b = parseFloat(bmi);
    if (b < 18.5) return { label: 'Sota pes (< 18.5)', color: 'text-amber-500' };
    if (b < 25) return { label: 'Pes normal (18.5 - 24.9)', color: 'text-emerald-500' };
    if (b < 30) return { label: 'Sobrepes (25 - 29.9)', color: 'text-amber-500' };
    return { label: 'Obessitat (>= 30)', color: 'text-rose-500' };
  }, [bmi]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 3 TOP METRIC CARDS: ULTIM PES, ALTURA, IMC */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 1. Ultim Pes Registrat */}
        <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Últim Pes Registrat</span>
            <h3 className="text-3xl font-display font-bold text-purple-500 mt-1">{latestWeight} kg</h3>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">
              {weightEntries.length > 0 ? `Data: ${weightEntries[weightEntries.length - 1].date}` : 'Sense dades'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
            <Scale size={24} />
          </div>
        </div>

        {/* 2. Alçada */}
        <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="flex-1 pr-3">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Alçada</span>
            <h3 className="text-3xl font-display font-bold text-[var(--text-primary)] mt-1">{heightCm} cm</h3>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">Registra un nou pes per modificar l'alçada</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold">
            <Ruler size={24} />
          </div>
        </div>

        {/* 3. IMC */}
        <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Índex de Massa Corporal (IMC)</span>
            <h3 className="text-3xl font-display font-bold text-[var(--text-primary)] mt-1">{bmi}</h3>
            <p className={`text-[11px] font-bold mt-1 ${bmiCategory.color}`}>{bmiCategory.label}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <Activity size={24} />
          </div>
        </div>

      </div>

      {/* RESUM DE COMPOSICIÓ AMB SILUETA D'UN COS HUMÀ */}
      <BodySilhouetteDiagram measurements={bodyMeasurements} />

      {/* WEIGHT & MEASUREMENTS HISTORY LIST */}
      <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div>
            <h3 className="font-display font-bold text-base text-[var(--text-primary)]">Historial de Registres i Mesures</h3>
            <p className="text-xs text-[var(--text-secondary)]">Lectures del pes i perímetres corporals per data</p>
          </div>
          <Button size="sm" onClick={onOpenWeightModal}>
            <Plus size={14} /> Afegir Lectura
          </Button>
        </div>

        <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
          {weightEntries.slice().reverse().map((w) => {
            const bm = bodyMeasurements.find((b) => b.date === w.date);
            const hasMeasures = bm && (bm.chest_cm || bm.left_bicep_cm || bm.right_bicep_cm || bm.left_forearm_cm || bm.right_forearm_cm || bm.abdomen || bm.left_thigh || bm.right_thigh || bm.left_calf || bm.right_calf);

            return (
              <div
                key={w.id}
                className="p-4 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl space-y-2"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      <Scale size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-base text-[var(--text-primary)]">{w.weightKg} kg</p>
                        {w.source === 'HEVY' && (
                          <span className="text-[9px] font-bold bg-brand-500/10 text-brand-500 px-2 py-0.5 rounded-full">
                            Hevy
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">{w.date}</p>
                      {w.notes && <p className="text-[11px] text-[var(--text-muted)] italic mt-0.5">"{w.notes}"</p>}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      deleteWeightEntry(w.id);
                      toast.success('Mesura eliminada.');
                    }}
                    className="text-[var(--text-muted)] hover:text-red-500 p-1.5 transition-all flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Inline Body Measurements Badges */}
                {hasMeasures && (
                  <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap gap-1.5 text-[11px]">
                    {bm.chest_cm && (
                      <span className="bg-[var(--bg-raised)] px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] font-medium text-[var(--text-secondary)]">
                        Pit: <strong className="text-[var(--text-primary)]">{bm.chest_cm} cm</strong>
                      </span>
                    )}
                    {(bm.left_bicep_cm || bm.right_bicep_cm) && (
                      <span className="bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20 font-medium text-brand-500">
                        Bíceps (E/D): <strong>{bm.left_bicep_cm || '—'} / {bm.right_bicep_cm || '—'} cm</strong>
                      </span>
                    )}
                    {(bm.left_forearm_cm || bm.right_forearm_cm) && (
                      <span className="bg-[var(--bg-raised)] px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] font-medium text-[var(--text-secondary)]">
                        Avantbraç: <strong>{bm.left_forearm_cm || '—'} / {bm.right_forearm_cm || '—'} cm</strong>
                      </span>
                    )}
                    {bm.abdomen && (
                      <span className="bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 font-medium text-amber-500">
                        Abdomen: <strong>{bm.abdomen} cm</strong>
                      </span>
                    )}
                    {(bm.left_thigh || bm.right_thigh) && (
                      <span className="bg-[var(--bg-raised)] px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] font-medium text-[var(--text-secondary)]">
                        Cuixa (E/D): <strong>{bm.left_thigh || '—'} / {bm.right_thigh || '—'} cm</strong>
                      </span>
                    )}
                    {(bm.left_calf || bm.right_calf) && (
                      <span className="bg-[var(--bg-raised)] px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] font-medium text-[var(--text-secondary)]">
                        Bessons (E/D): <strong>{bm.left_calf || '—'} / {bm.right_calf || '—'} cm</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {weightEntries.length === 0 && (
            <div className="text-center py-12 space-y-2">
              <p className="text-xs text-[var(--text-muted)]">No s'ha registrat cap mesura de pes encara.</p>
              <Button size="sm" onClick={onOpenWeightModal}>
                <Plus size={14} /> Registrar la primera mesura
              </Button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
