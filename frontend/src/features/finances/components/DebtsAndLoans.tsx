import { useState } from 'react';
import { Plus, ArrowDownLeft, ArrowUpRight, CheckCircle, Trash2, Calendar } from 'lucide-react';
import { useFinancesStore, type Debt, type DebtType } from '@/shared/stores/useFinancesStore';
import { useFinancesActions } from '@/features/finances/hooks/useFinancesActions';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import toast from 'react-hot-toast';

export default function DebtsAndLoans() {
  const { debts } = useFinancesStore();
  const actions = useFinancesActions();

  const [modalOpen, setModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<DebtType>('DEBT_TO_USER');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Payment states
  const [payAmount, setPayAmount] = useState('');

  const openAddModal = () => {
    setSelectedDebt(null);
    setTitle('');
    setAmount('');
    setType('DEBT_TO_USER');
    setDueDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setModalOpen(true);
  };

  const openPaymentModal = (d: Debt) => {
    setSelectedDebt(d);
    setPayAmount('');
    setPaymentModalOpen(true);
  };

  const handleSaveDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0 || !dueDate) {
      toast.error('Completa correctament els camps');
      return;
    }

    try {
      if (selectedDebt) {
        await actions.updateDebt(selectedDebt.id, {
          title,
          amount: numAmount,
          type,
          dueDate,
          notes,
        });
        toast.success('Préstec/Deute actualitzat');
      } else {
        await actions.addDebt({
          title,
          amount: numAmount,
          type,
          dueDate,
          notes,
        });
        toast.success('Préstec/Deute registrat correctament');
      }
      setModalOpen(false);
    } catch {
      toast.error('Error al desar');
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payAmount);
    if (!selectedDebt || isNaN(amt) || amt <= 0) {
      toast.error('Introdueix un import vàlid');
      return;
    }

    try {
      await actions.addDebtPayment(selectedDebt.id, amt);
      toast.success('Pagament parcial registrat! 💳');
      setPaymentModalOpen(false);
    } catch {
      toast.error('Error al registrar el pagament');
    }
  };

  const handleDeleteDebt = async (id: string) => {
    if (!window.confirm('Vols eliminar aquest préstec/deute del teu historial?')) return;
    try {
      await actions.deleteDebt(id);
      toast.success('Eliminat correctament');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  // Calculations
  const owerDebts = debts.filter(d => d.type === 'DEBT_TO_USER' && d.status !== 'PAID');
  const userDebts = debts.filter(d => d.type === 'USER_DEBT' && d.status !== 'PAID');

  const totalOwedToUser = owerDebts.reduce((sum, d) => {
    const paid = d.payments.reduce((pSum, p) => pSum + p.amount, 0);
    return sum + (d.amount - paid);
  }, 0);

  const totalOwedByUser = userDebts.reduce((sum, d) => {
    const paid = d.payments.reduce((pSum, p) => pSum + p.amount, 0);
    return sum + (d.amount - paid);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Em deuen (Actius)</span>
            <p className="text-2xl font-bold text-emerald-500 mt-1">+{totalOwedToUser.toFixed(2)}€</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <ArrowUpRight size={20} />
          </div>
        </div>
        <div className="card p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Jo dec (Passius)</span>
            <p className="text-2xl font-bold text-red-500 mt-1">-{totalOwedByUser.toFixed(2)}€</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
            <ArrowDownLeft size={20} />
          </div>
        </div>
      </div>

      {/* List Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-display font-bold text-[var(--text-primary)]">Deutes i Préstecs</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">Fes seguiment dels diners que has prestat o que t'han deixat.</p>
        </div>
        <Button onClick={openAddModal} className="text-xs">
          <Plus size={14} /> Nou Préstec/Deute
        </Button>
      </div>

      {/* List of Debts */}
      <div className="space-y-2.5">
        {debts.map((d) => {
          const totalPaid = d.payments.reduce((sum, p) => sum + p.amount, 0);
          const remaining = d.amount - totalPaid;
          const isLent = d.type === 'DEBT_TO_USER';

          return (
            <div key={d.id} className="card p-4 flex items-center justify-between gap-3 hover:translate-x-0.5 transition-all">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${isLent ? 'bg-emerald-500' : 'bg-red-500'}`}>
                  {isLent ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-sm text-[var(--text-primary)] leading-tight">{d.title}</h4>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--text-muted)] flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      d.status === 'PAID' ? 'bg-emerald-500/15 text-emerald-500' : d.status === 'PARTIAL' ? 'bg-amber-500/15 text-amber-500' : 'bg-red-500/15 text-red-500'
                    }`}>
                      {d.status === 'PAID' ? 'PAGAT' : d.status === 'PARTIAL' ? 'PAGAT PARCIAL' : 'PENDENT'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      Venciment: {d.dueDate}
                    </span>
                  </div>
                  {d.notes && <p className="text-[10px] text-[var(--text-secondary)] mt-1 italic">{d.notes}</p>}
                </div>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <p className={`font-bold text-sm ${isLent ? 'text-emerald-500' : 'text-red-500'}`}>
                    {isLent ? '+' : '-'}{remaining.toFixed(2)}€
                  </p>
                  {totalPaid > 0 && (
                    <p className="text-[9px] text-[var(--text-muted)]">
                      de {d.amount.toFixed(2)}€ (pagat {totalPaid.toFixed(2)}€)
                    </p>
                  )}
                </div>

                <div className="flex gap-0.5">
                  {d.status !== 'PAID' && (
                    <button onClick={() => openPaymentModal(d)} className="p-2 rounded-lg bg-brand-500/10 text-brand-500 hover:bg-brand-500 hover:text-white transition-all cursor-pointer" title="Registrar pagament parcial">
                      <CheckCircle size={12} />
                    </button>
                  )}
                  <button onClick={() => handleDeleteDebt(d.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-all cursor-pointer">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {debts.length === 0 && (
          <div className="card p-12 text-center text-[var(--text-secondary)] text-sm">
            No hi ha cap deute o préstec registrat. Estàs al dia!
          </div>
        )}
      </div>

      {/* Debt Creation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-2xl p-6 shadow-2xl animate-scale-in">
            <h3 className="font-display font-bold text-lg text-[var(--text-primary)] mb-4">
              {selectedDebt ? 'Editar Registre' : 'Registrar deute o préstec'}
            </h3>
            <form onSubmit={handleSaveDebt} className="space-y-4">
              {/* Type selector buttons */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl">
                <button
                  type="button"
                  onClick={() => setType('DEBT_TO_USER')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    type === 'DEBT_TO_USER'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Em deuen (+)
                </button>
                <button
                  type="button"
                  onClick={() => setType('USER_DEBT')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    type === 'USER_DEBT'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Jo dec (-)
                </button>
              </div>

              <Input
                id="debt-title"
                label="Concepte / Persona"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Préstec a Joan, Deute sopar"
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="debt-amount"
                  label="Import total (€)"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
                <Input
                  id="debt-duedate"
                  label="Data venciment"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Notes o comentari</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalls de la transacció..."
                  rows={2}
                  className="w-full p-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-raised)] text-sm text-[var(--text-primary)] focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" fullWidth onClick={() => setModalOpen(false)}>
                  Cancel·lar
                </Button>
                <Button type="submit" fullWidth>
                  Registrar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Entry Modal */}
      {paymentModalOpen && selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPaymentModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-2xl p-6 shadow-2xl animate-scale-in">
            <h3 className="font-display font-bold text-base text-[var(--text-primary)] mb-1">
              Registrar pagament
            </h3>
            <p className="text-[10px] text-[var(--text-muted)] mb-4">Deute: {selectedDebt.title}</p>
            <form onSubmit={handleAddPayment} className="space-y-4">
              <Input
                id="pay-amount"
                label="Import rebut / pagat (€)"
                type="number"
                step="0.01"
                min="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="0.00"
                required
              />

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" fullWidth onClick={() => setPaymentModalOpen(false)}>
                  Cancel·lar
                </Button>
                <Button type="submit" fullWidth>
                  Confirmar Pagament
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
