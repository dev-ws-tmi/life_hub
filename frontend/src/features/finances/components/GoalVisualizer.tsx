import { useState } from 'react';
import { Plus, PiggyBank, Target, Calendar, ArrowUpRight, TrendingUp, Trash2 } from 'lucide-react';
import { useFinancesStore, type Goal } from '@/shared/stores/useFinancesStore';
import { useFinancesActions } from '@/features/finances/hooks/useFinancesActions';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import toast from 'react-hot-toast';

export default function GoalVisualizer() {
  const { goals } = useFinancesStore();
  const actions = useFinancesActions();

  const [modalOpen, setModalOpen] = useState(false);
  const [contributionModalOpen, setContributionModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [icon, setIcon] = useState('Target');

  // Contribution states
  const [contrAmount, setContrAmount] = useState('');
  const [contrNotes, setContrNotes] = useState('');

  const openAddModal = () => {
    setSelectedGoal(null);
    setName('');
    setTargetAmount('');
    setDeadline('');
    setColor('#3b82f6');
    setIcon('Target');
    setModalOpen(true);
  };

  const openContributionModal = (g: Goal) => {
    setSelectedGoal(g);
    setContrAmount('');
    setContrNotes('');
    setContributionModalOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const numTarget = parseFloat(targetAmount);
    if (!name.trim() || isNaN(numTarget) || numTarget <= 0 || !deadline) {
      toast.error('Completa correctament tots els camps');
      return;
    }

    try {
      if (selectedGoal) {
        await actions.updateGoal(selectedGoal.id, {
          name,
          targetAmount: numTarget,
          deadline,
          color,
          icon,
        });
        toast.success('Objectiu actualitzat');
      } else {
        await actions.addGoal({
          name,
          targetAmount: numTarget,
          deadline,
          color,
          icon,
        });
        toast.success('Objectiu d\'estalvi creat! 🎯');
      }
      setModalOpen(false);
    } catch {
      toast.error('Error al desar l\'objectiu');
    }
  };

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(contrAmount);
    if (!selectedGoal || isNaN(amount) || amount <= 0) {
      toast.error('Introdueix un import vàlid');
      return;
    }

    try {
      await actions.addGoalContribution(selectedGoal.id, amount, contrNotes);
      toast.success('Aportació registrada amb èxit! 🪙');
      setContributionModalOpen(false);
    } catch {
      toast.error('Error al registrar l\'aportació');
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!window.confirm('Estàs segur que vols eliminar aquest objectiu d\'estalvi?')) return;
    try {
      await actions.deleteGoal(id);
      toast.success('Objectiu eliminat');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  // Prediction calculations: how many days remaining vs progress rate
  const getGoalPrediction = (g: Goal) => {
    const remaining = g.targetAmount - g.currentAmount;
    if (remaining <= 0) return 'Completat! 🎉';

    const deadlineDate = new Date(g.deadline);
    const today = new Date();
    const msDiff = deadlineDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(msDiff / (1000 * 60 * 60 * 24));

    if (daysDiff <= 0) return 'Data límit vençuda';

    // Calculate saving rate based on contributions
    if (g.contributions.length === 0) {
      const dailyNeeded = remaining / daysDiff;
      return `Necessites estalviar: ${dailyNeeded.toFixed(2)}€ / dia`;
    }

    const firstContrDate = new Date(g.contributions[0].date);
    const activeDays = Math.ceil((today.getTime() - firstContrDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    const avgDailySaving = g.currentAmount / activeDays;

    if (avgDailySaving <= 0) {
      const dailyNeeded = remaining / daysDiff;
      return `Necessites estalviar: ${dailyNeeded.toFixed(2)}€ / dia`;
    }

    const estimatedDaysNeeded = remaining / avgDailySaving;
    const estDate = new Date();
    estDate.setDate(estDate.getDate() + estimatedDaysNeeded);

    const isOnTrack = estDate <= deadlineDate;

    return (
      <div className="text-[10px] space-y-0.5">
        <p className={isOnTrack ? 'text-emerald-500 font-bold' : 'text-amber-500 font-semibold'}>
          {isOnTrack ? '💪 Vas pel bon camí per assolir-ho!' : '⚠️ Necessites augmentar l\'estalvi per arribar a temps.'}
        </p>
        <p className="text-[var(--text-muted)]">
          Estalvi mitjà: <strong>{(avgDailySaving * 30).toFixed(1)}€ / mes</strong>
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-display font-bold text-[var(--text-primary)]">Objectius d'Estalvi</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">Estableix fites d'estalvi i fes un seguiment del teu progrés.</p>
        </div>
        <Button onClick={openAddModal} className="text-xs">
          <Plus size={14} /> Nou Objectiu
        </Button>
      </div>

      {/* Grid of Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((g) => {
          const pct = Math.min((g.currentAmount / g.targetAmount) * 100, 100);
          const remaining = Math.max(g.targetAmount - g.currentAmount, 0);

          return (
            <div key={g.id} className="card p-5 space-y-4 relative group">
              <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: g.color }} />
              
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: g.color }}>
                    <Target size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-[var(--text-primary)] leading-tight">{g.name}</h4>
                    <span className="text-[9px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5 font-semibold uppercase">
                      <Calendar size={10} /> Límit: {g.deadline}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1">
                  <button onClick={() => openContributionModal(g)} className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-brand-500 transition-all cursor-pointer" title="Afegir aportació">
                    <ArrowUpRight size={13} />
                  </button>
                  <button onClick={() => handleDeleteGoal(g.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Progress and status */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                  <span>Estalviat: <strong>{g.currentAmount.toFixed(2)}€</strong></span>
                  <span>Objectiu: <strong>{g.targetAmount.toFixed(2)}€</strong></span>
                </div>
                <div className="h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: g.color }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-[var(--text-muted)] font-medium">
                  <span>{pct.toFixed(0)}% assolit</span>
                  {remaining > 0 && <span>Falten {remaining.toFixed(2)}€</span>}
                </div>
              </div>

              {/* Prediction widget */}
              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-start gap-2">
                <TrendingUp size={14} className="text-brand-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {getGoalPrediction(g)}
                </div>
              </div>
            </div>
          );
        })}
        {goals.length === 0 && (
          <div className="col-span-full card p-12 text-center text-[var(--text-secondary)] text-sm">
            No tens cap objectiu d'estalvi actiu en aquest moment. Crea'n un per organitzar el teu futur!
          </div>
        )}
      </div>

      {/* Goal Creation/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-2xl p-6 shadow-2xl animate-scale-in">
            <h3 className="font-display font-bold text-lg text-[var(--text-primary)] mb-4">
              {selectedGoal ? 'Editar Objectiu' : 'Nou Objectiu d\'Estalvi'}
            </h3>
            <form onSubmit={handleSaveGoal} className="space-y-4">
              <Input
                id="goal-name"
                label="Què vols estalviar?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Ordinador nou, Viatge a Japó"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="goal-target"
                  label="Import total (€)"
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
                <Input
                  id="goal-deadline"
                  label="Data límit"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </div>

              {/* Color selector */}
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">Color identificatiu</label>
                <div className="flex gap-2">
                  {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-brand-500' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" fullWidth onClick={() => setModalOpen(false)}>
                  Cancel·lar
                </Button>
                <Button type="submit" fullWidth>
                  Desar Objectiu
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goal Contribution Modal */}
      {contributionModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setContributionModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-2xl p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500">
                <PiggyBank size={18} />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">Registrar estalvi</h3>
                <p className="text-[10px] text-[var(--text-muted)] font-medium">Objectiu: {selectedGoal.name}</p>
              </div>
            </div>
            <form onSubmit={handleAddContribution} className="space-y-4">
              <Input
                id="contr-amount"
                label="Import de l'aportació (€)"
                type="number"
                step="0.01"
                min="0.01"
                value={contrAmount}
                onChange={(e) => setContrAmount(e.target.value)}
                placeholder="0.00"
                required
              />
              <Input
                id="contr-notes"
                label="Comentari (opcional)"
                value={contrNotes}
                onChange={(e) => setContrNotes(e.target.value)}
                placeholder="Ex: Estalvi setmanal, Extra de feina"
              />

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" fullWidth onClick={() => setContributionModalOpen(false)}>
                  Cancel·lar
                </Button>
                <Button type="submit" fullWidth>
                  Confirmar Estalvi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
