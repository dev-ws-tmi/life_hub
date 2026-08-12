import React, { useState } from 'react';
import { Plus, Edit2, AlertTriangle, CheckCircle, Flame } from 'lucide-react';
import { useFinancesStore, type Budget } from '@/shared/stores/useFinancesStore';
import { useFinancesActions } from '@/features/finances/hooks/useFinancesActions';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import toast from 'react-hot-toast';

export default function BudgetTracker() {
  const { budgets, categories } = useFinancesStore();
  const actions = useFinancesActions();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  // Form states
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const openAddModal = () => {
    setSelectedBudget(null);
    if (categories.length > 0) setCategoryId(categories[0].id);
    setAmount('');
    setModalOpen(true);
  };

  const openEditModal = (b: Budget) => {
    setSelectedBudget(b);
    setCategoryId(b.categoryId);
    setAmount(b.amount.toString());
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Introdueix un import vàlid');
      return;
    }
    if (!categoryId) {
      toast.error('Selecciona una categoria');
      return;
    }

    try {
      if (selectedBudget) {
        await actions.updateBudget(selectedBudget.id, {
          categoryId,
          amount: numAmount,
        });
        toast.success('Pressupost actualitzat');
      } else {
        // Check if budget for this category already exists this month
        const exists = budgets.some(b => b.categoryId === categoryId && b.month === currentMonth && b.year === currentYear);
        if (exists) {
          toast.error('Ja existeix un pressupost per a aquesta categoria aquest mes');
          return;
        }

        await actions.addBudget({
          categoryId,
          amount: numAmount,
          period: 'MONTHLY',
          year: currentYear,
          month: currentMonth,
        });
        toast.success('Pressupost creat');
      }
      setModalOpen(false);
    } catch {
      toast.error('Error al desar');
    }
  };

  // Get status color and message based on spending percentage
  const getBudgetStatus = (spent: number, limit: number) => {
    const pct = (spent / limit) * 100;
    if (pct >= 100) return { pct, color: 'text-red-500', barColor: 'bg-red-500', label: 'Superat! ⚠️', icon: Flame };
    if (pct >= 90) return { pct, color: 'text-orange-500', barColor: 'bg-orange-500', label: 'Alerta! 90% 🚨', icon: AlertTriangle };
    if (pct >= 75) return { pct, color: 'text-amber-500', barColor: 'bg-amber-500', label: 'Compte! 75% ⚠️', icon: AlertTriangle };
    if (pct >= 50) return { pct, color: 'text-yellow-500', barColor: 'bg-yellow-500', label: 'Mitja part! 50%', icon: AlertTriangle };
    return { pct, color: 'text-emerald-500', barColor: 'bg-emerald-500', label: 'Controlat', icon: CheckCircle };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-display font-bold text-[var(--text-primary)]">Pressupostos Mensuals</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Mes actiu: <strong>{new Date().toLocaleString('ca-ES', { month: 'long', year: 'numeric' })}</strong>
          </p>
        </div>
        <Button onClick={openAddModal} className="text-xs">
          <Plus size={14} /> Establir Límit
        </Button>
      </div>

      {/* List of Budgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.filter(b => b.month === currentMonth && b.year === currentYear).map((b) => {
          const cat = categories.find(c => c.id === b.categoryId);
          const status = getBudgetStatus(b.spent, b.amount);
          const StatusIcon = status.icon;

          return (
            <div key={b.id} className="card p-5 space-y-3 relative group">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cat?.emoji || '📦'}</span>
                  <div>
                    <h4 className="font-semibold text-sm text-[var(--text-primary)] leading-tight">{cat?.name || 'Categoria'}</h4>
                    <span className={`text-[10px] font-bold flex items-center gap-1 ${status.color} mt-0.5`}>
                      <StatusIcon size={10} /> {status.label}
                    </span>
                  </div>
                </div>
                <button onClick={() => openEditModal(b)} className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                  <Edit2 size={12} />
                </button>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                  <span>Despesa: <strong>{b.spent.toFixed(2)}€</strong></span>
                  <span>Límit: <strong>{b.amount.toFixed(2)}€</strong></span>
                </div>
                <div className="h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${status.barColor}`}
                    style={{ width: `${Math.min(status.pct, 100)}%` }}
                  />
                </div>
                <div className="text-right text-[9px] text-[var(--text-muted)]">
                  {status.pct.toFixed(0)}% del pressupost consumit
                </div>
              </div>
            </div>
          );
        })}
        {budgets.filter(b => b.month === currentMonth && b.year === currentYear).length === 0 && (
          <div className="col-span-full card p-12 text-center text-[var(--text-secondary)] text-sm">
            Encara no has establert cap pressupost per a aquest mes. Comença ara mateix!
          </div>
        )}
      </div>

      {/* Modal setting budget */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-2xl p-6 shadow-2xl animate-scale-in">
            <h3 className="font-display font-bold text-lg text-[var(--text-primary)] mb-4">
              {selectedBudget ? 'Editar Pressupost' : 'Nou Pressupost Mensual'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Categoria de despesa</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-raised)] text-sm text-[var(--text-primary)] focus:outline-none"
                  required
                  disabled={!!selectedBudget}
                >
                  {categories.filter(c => c.monthlyLimit !== null || c.id !== 'cat_salary').map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
                  ))}
                </select>
              </div>

              <Input
                id="budget-amount"
                label="Límit màxim despesa mensual (€)"
                type="number"
                step="5"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex: 300"
                required
              />

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" fullWidth onClick={() => setModalOpen(false)}>
                  Cancel·lar
                </Button>
                <Button type="submit" fullWidth>
                  Establir Pressupost
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
