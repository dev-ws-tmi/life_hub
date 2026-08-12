import { useState } from 'react';
import { Plus, Tv, Calendar, DollarSign, Trash2, Edit2, Play } from 'lucide-react';
import { useFinancesStore, type Subscription } from '@/shared/stores/useFinancesStore';
import { useFinancesActions } from '@/features/finances/hooks/useFinancesActions';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import toast from 'react-hot-toast';

export default function SubscriptionList() {
  const { subscriptions, accounts } = useFinancesStore();
  const actions = useFinancesActions();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [nextBillingDate, setNextBillingDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('cat_subscriptions');

  const openAddModal = () => {
    setSelectedSub(null);
    setName('');
    setCost('');
    setBillingCycle('MONTHLY');
    setNextBillingDate(new Date().toISOString().split('T')[0]);
    if (accounts.length > 0) setAccountId(accounts[0].id);
    setCategoryId('cat_subscriptions');
    setModalOpen(true);
  };

  const openEditModal = (s: Subscription) => {
    setSelectedSub(s);
    setName(s.name);
    setCost(s.cost.toString());
    setBillingCycle(s.billingCycle);
    setNextBillingDate(s.nextBillingDate);
    setAccountId(s.accountId);
    setCategoryId(s.categoryId);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const numCost = parseFloat(cost);
    if (!name.trim() || isNaN(numCost) || numCost <= 0 || !accountId || !categoryId) {
      toast.error('Completa correctament tots els camps');
      return;
    }

    try {
      if (selectedSub) {
        await actions.updateSubscription(selectedSub.id, {
          name,
          cost: numCost,
          billingCycle,
          nextBillingDate,
          accountId,
          categoryId,
        });
        toast.success('Subscripció actualitzada');
      } else {
        await actions.addSubscription({
          name,
          cost: numCost,
          billingCycle,
          nextBillingDate,
          accountId,
          categoryId,
        });
        toast.success('Subscripció afegida correctament! 📱');
      }
      setModalOpen(false);
    } catch {
      toast.error('Error al desar la subscripció');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Vols eliminar aquesta subscripció?')) return;
    try {
      await actions.deleteSubscription(id);
      toast.success('Subscripció eliminada');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  // Trigger subscription payment manually (simulates actual billing transaction)
  const handleTriggerPayment = async (sub: Subscription) => {
    try {
      // Add transaction representing the payment
      await actions.addTransaction({
        title: `Pagament: ${sub.name}`,
        description: `Cobrament automàtic recurrent (${sub.billingCycle === 'MONTHLY' ? 'Mensual' : 'Anual'})`,
        amount: -sub.cost,
        date: new Date().toISOString().split('T')[0],
        categoryId: sub.categoryId,
        accountId: sub.accountId,
        type: 'EXPENSE',
      });

      // Update next billing date automatically by adding 1 month or 1 year
      const nextDate = new Date(sub.nextBillingDate);
      if (sub.billingCycle === 'MONTHLY') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }

      await actions.updateSubscription(sub.id, {
        nextBillingDate: nextDate.toISOString().split('T')[0],
      });

      toast.success(`Pagament de ${sub.name} registrat correctament! 💳`);
    } catch {
      toast.error('Error al registrar el pagament');
    }
  };

  // Calculations
  const activeSubs = subscriptions.filter(s => s.isActive);
  const totalMonthlyCost = activeSubs.reduce((sum, s) => {
    if (s.billingCycle === 'MONTHLY') return sum + s.cost;
    return sum + (s.cost / 12);
  }, 0);
  const totalAnnualCost = totalMonthlyCost * 12;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Cost Mensual Total</span>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{totalMonthlyCost.toFixed(2)}€ / mes</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500">
            <Tv size={20} />
          </div>
        </div>
        <div className="card p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Cost Anual Projectat</span>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{totalAnnualCost.toFixed(2)}€ / any</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <DollarSign size={20} />
          </div>
        </div>
      </div>

      {/* List Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-display font-bold text-[var(--text-primary)]">Subscripcions i Pagaments Recurrents</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">Controla els teus serveis mensuals i anuals en actiu.</p>
        </div>
        <Button onClick={openAddModal} className="text-xs">
          <Plus size={14} /> Nova Subscripció
        </Button>
      </div>

      {/* Subscription List */}
      <div className="space-y-2.5">
        {subscriptions.map((sub) => {
          const acc = accounts.find(a => a.id === sub.accountId);
          const isOverdue = new Date(sub.nextBillingDate) <= new Date();

          return (
            <div key={sub.id} className="card p-4 flex items-center justify-between gap-3 hover:translate-x-0.5 transition-all">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-secondary)]">
                  <Tv size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-sm text-[var(--text-primary)] leading-tight">{sub.name}</h4>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--text-muted)] flex-wrap">
                    <span className="bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                      {acc?.name || 'Compte general'}
                    </span>
                    <span className="flex items-center gap-1 font-semibold">
                      <Calendar size={10} />
                      Cobrament: <span className={isOverdue ? 'text-red-500 font-bold' : ''}>{sub.nextBillingDate}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <p className="font-bold text-sm text-[var(--text-primary)]">
                    {sub.cost.toFixed(2)}€
                  </p>
                  <p className="text-[9px] text-[var(--text-muted)]">
                    {sub.billingCycle === 'MONTHLY' ? 'Mensual' : 'Anual'}
                  </p>
                </div>

                <div className="flex gap-0.5">
                  <button onClick={() => handleTriggerPayment(sub)} className="p-2 rounded-lg bg-brand-500/10 text-brand-500 hover:bg-brand-500 hover:text-white transition-all cursor-pointer" title="Registrar pagament ara">
                    <Play size={12} fill="currentColor" />
                  </button>
                  <button onClick={() => openEditModal(sub)} className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => handleDelete(sub.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-all cursor-pointer">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {subscriptions.length === 0 && (
          <div className="card p-12 text-center text-[var(--text-secondary)] text-sm">
            No tens cap subscripció registrada en aquest moment. Registra el teu Spotify, Netflix o gimnàs per controlar la teva despesa fixa.
          </div>
        )}
      </div>

      {/* Modal Add/Edit Subscription */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-2xl p-6 shadow-2xl animate-scale-in">
            <h3 className="font-display font-bold text-lg text-[var(--text-primary)] mb-4">
              {selectedSub ? 'Editar Subscripció' : 'Nova Subscripció'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <Input
                id="sub-name"
                label="Nom del servei"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Netflix, Spotify, Gimnàs"
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="sub-cost"
                  label="Cost del rebut (€)"
                  type="number"
                  step="0.01"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0.00"
                  required
                />
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Cicle de cobrament</label>
                  <select
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value as 'MONTHLY' | 'ANNUAL')}
                    className="w-full h-10 px-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-raised)] text-sm text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="MONTHLY">Mensual</option>
                    <option value="ANNUAL">Anual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="sub-billing-date"
                  label="Proper cobrament"
                  type="date"
                  value={nextBillingDate}
                  onChange={(e) => setNextBillingDate(e.target.value)}
                  required
                />
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Compte de càrrec</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-raised)] text-sm text-[var(--text-primary)] focus:outline-none"
                    required
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" fullWidth onClick={() => setModalOpen(false)}>
                  Cancel·lar
                </Button>
                <Button type="submit" fullWidth>
                  Desar Subscripció
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
