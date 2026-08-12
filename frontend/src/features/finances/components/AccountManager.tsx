import React, { useState } from 'react';
import { Plus, Landmark, Coins, Smartphone, CreditCard, PiggyBank, Briefcase, Trash2, Edit2, ArrowLeftRight } from 'lucide-react';
import { useFinancesStore, type Account, type AccountType } from '@/shared/stores/useFinancesStore';
import { useFinancesActions } from '@/features/finances/hooks/useFinancesActions';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import toast from 'react-hot-toast';

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'BANK', label: 'Compte Bancari' },
  { value: 'CASH', label: 'Efectiu' },
  { value: 'BIZUM', label: 'Bizum' },
  { value: 'PAYPAL', label: 'PayPal' },
  { value: 'SAVINGS', label: 'Caixa d\'Estalvis' },
  { value: 'BUSINESS', label: 'Empresa / Negoci' },
];

const ACCOUNT_ICONS = [
  { name: 'Landmark', icon: Landmark },
  { name: 'Coins', icon: Coins },
  { name: 'Smartphone', icon: Smartphone },
  { name: 'CreditCard', icon: CreditCard },
  { name: 'PiggyBank', icon: PiggyBank },
  { name: 'Briefcase', icon: Briefcase },
];

const ACCOUNT_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#64748b', // Slate
];

export default function AccountManager() {
  const { accounts } = useFinancesStore();
  const actions = useFinancesActions();

  const [modalOpen, setModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [editAcc, setEditAcc] = useState<Account | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('BANK');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [icon, setIcon] = useState('Landmark');

  // Transfer states
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTitle, setTransferTitle] = useState('Transferència interna');

  const openAddModal = () => {
    setEditAcc(null);
    setName('');
    setType('BANK');
    setBalance('');
    setColor('#3b82f6');
    setIcon('Landmark');
    setModalOpen(true);
  };

  const openEditModal = (acc: Account) => {
    setEditAcc(acc);
    setName(acc.name);
    setType(acc.type);
    setBalance(acc.balance.toString());
    setColor(acc.color);
    setIcon(acc.icon);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('El nom és obligatori');
      return;
    }
    const numBalance = parseFloat(balance) || 0;

    try {
      if (editAcc) {
        await actions.updateAccount(editAcc.id, {
          name,
          type,
          balance: numBalance,
          color,
          icon,
        });
        toast.success('Compte actualitzat correctament');
      } else {
        await actions.addAccount({
          name,
          type,
          balance: numBalance,
          currency: 'EUR',
          color,
          icon,
          status: 'ACTIVE',
          order: accounts.length,
        });
        toast.success('Compte creat correctament');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error('Error al desar el compte');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Estàs segur que vols eliminar aquest compte? S\'eliminaran totes les transaccions associades.')) return;
    try {
      await actions.deleteAccount(id);
      toast.success('Compte eliminat');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferAmount);
    if (!fromAccount || !toAccount) {
      toast.error('Selecciona ambdós comptes');
      return;
    }
    if (fromAccount === toAccount) {
      toast.error('Els comptes de destí i origen han de ser diferents');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      toast.error('Introdueix un import vàlid major que zero');
      return;
    }

    try {
      // Create negative transaction in source (origin)
      await actions.addTransaction({
        title: transferTitle || 'Transferència interna',
        description: `Enviament a ${accounts.find(a => a.id === toAccount)?.name}`,
        amount: -amount,
        date: new Date().toISOString().split('T')[0],
        categoryId: 'cat_others',
        accountId: fromAccount,
        destinationAccountId: toAccount,
        type: 'TRANSFER',
      });

      toast.success('Transferència interna completada');
      setTransferModalOpen(false);
      setTransferAmount('');
    } catch {
      toast.error('Error al realitzar la transferència');
    }
  };

  const getIconComponent = (iconName: string) => {
    const found = ACCOUNT_ICONS.find(i => i.name === iconName);
    return found ? found.icon : Landmark;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-display font-bold text-[var(--text-primary)]">Els meus Comptes</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">Gestiona els teus comptes bancaris, efectiu i altres mitjans de pagament.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setTransferModalOpen(true)} variant="secondary" className="text-xs">
            <ArrowLeftRight size={14} /> Transferència
          </Button>
          <Button onClick={openAddModal} className="text-xs">
            <Plus size={14} /> Nou Compte
          </Button>
        </div>
      </div>

      {/* Grid of Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          const IconComp = getIconComponent(acc.icon);
          return (
            <div key={acc.id} className="card p-5 relative overflow-hidden flex flex-col justify-between h-40">
              <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: acc.color }} />
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: acc.color }}>
                    <IconComp size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--text-primary)] leading-tight">{acc.name}</h4>
                    <span className="text-[10px] text-[var(--text-muted)] tracking-wider uppercase font-semibold">
                      {ACCOUNT_TYPES.find(t => t.value === acc.type)?.label}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditModal(acc)} className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => handleDelete(acc.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                  {acc.balance.toLocaleString('ca-ES', { style: 'currency', currency: 'EUR' })}
                </p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Saldo actual disponible</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add/Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 backdrop-blur-premium" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-2xl p-6 shadow-2xl animate-scale-in">
            <h3 className="font-display font-bold text-lg text-[var(--text-primary)] mb-4">
              {editAcc ? 'Editar Compte' : 'Nou Compte'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <Input
                id="acc-name"
                label="Nom del compte"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Compte Corrent, Efectiu Diari"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Tipus</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AccountType)}
                    className="w-full h-10 px-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all duration-150"
                  >
                    {ACCOUNT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <Input
                  id="acc-balance"
                  label="Saldo inicial"
                  type="number"
                  step="0.01"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {/* Icon Selector */}
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">Icona</label>
                <div className="flex gap-2.5">
                  {ACCOUNT_ICONS.map((ico) => {
                    const IcoComponent = ico.icon;
                    return (
                      <button
                        key={ico.name}
                        type="button"
                        onClick={() => setIcon(ico.name)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                          icon === ico.name
                            ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                            : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                        }`}
                      >
                        <IcoComponent size={16} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Selector */}
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">Color</label>
                <div className="flex gap-2">
                  {ACCOUNT_COLORS.map((c) => (
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
                  Desar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 backdrop-blur-premium" onClick={() => setTransferModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-2xl p-6 shadow-2xl animate-scale-in">
            <h3 className="font-display font-bold text-lg text-[var(--text-primary)] mb-4">
              Transferència interna de fons
            </h3>
            <form onSubmit={handleTransfer} className="space-y-4">
              <Input
                id="transfer-title"
                label="Concepte"
                value={transferTitle}
                onChange={(e) => setTransferTitle(e.target.value)}
                placeholder="Ex: Enviar efectiu a Bizum"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Origen</label>
                  <select
                    value={fromAccount}
                    onChange={(e) => setFromAccount(e.target.value)}
                    className="w-full h-10 px-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all duration-150"
                    required
                  >
                    <option value="">Selecciona origen</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} ({a.balance.toFixed(2)}€)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Destí</label>
                  <select
                    value={toAccount}
                    onChange={(e) => setToAccount(e.target.value)}
                    className="w-full h-10 px-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all duration-150"
                    required
                  >
                    <option value="">Selecciona destí</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} ({a.balance.toFixed(2)}€)</option>
                    ))}
                  </select>
                </div>
              </div>

              <Input
                id="transfer-amount"
                label="Import de la transferència"
                type="number"
                step="0.01"
                min="0.01"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="0.00"
                required
              />

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" fullWidth onClick={() => setTransferModalOpen(false)}>
                  Cancel·lar
                </Button>
                <Button type="submit" fullWidth>
                  Executar transferència
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
