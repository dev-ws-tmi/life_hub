import { useState, useEffect } from 'react';
import { X, Star, AlertTriangle } from 'lucide-react';
import { useFinancesStore, type Transaction, type TransactionType } from '@/shared/stores/useFinancesStore';
import { useFinancesActions } from '@/features/finances/hooks/useFinancesActions';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import toast from 'react-hot-toast';

interface TransactionModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export default function TransactionModal({ transaction, onClose }: TransactionModalProps) {
  const { accounts, categories } = useFinancesStore();
  const actions = useFinancesActions();

  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [important, setImportant] = useState(false);
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    if (transaction) {
      setTitle(transaction.title);
      setAmount(Math.abs(transaction.amount).toString());
      setDate(transaction.date);
      setCategoryId(transaction.categoryId);
      setAccountId(transaction.accountId);
      setType(transaction.type);
      setDescription(transaction.description || '');
      setTags(transaction.tags || []);
      setImportant(!!transaction.important);
      setFavorite(!!transaction.favorite);
    } else {
      setTitle('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      // Set defaults if available
      if (categories.length > 0) setCategoryId(categories[0].id);
      if (accounts.length > 0) setAccountId(accounts[0].id);
      setType('EXPENSE');
      setDescription('');
      setTags([]);
      setImportant(false);
      setFavorite(false);
    }
  }, [transaction, accounts, categories]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !tags.includes(tag)) {
        setTags([...tags, tag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('El concepte és obligatori');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('L\'import ha de ser un número major que zero');
      return;
    }

    if (!accountId) {
      toast.error('Selecciona un compte');
      return;
    }

    if (!categoryId) {
      toast.error('Selecciona una categoria');
      return;
    }

    // Convert amount sign: Expense is negative, Income is positive
    const finalAmount = type === 'EXPENSE' ? -numAmount : numAmount;

    try {
      if (transaction) {
        await actions.updateTransaction(transaction.id, {
          title,
          amount: finalAmount,
          date,
          categoryId,
          accountId,
          type,
          description,
          tags,
          important,
          favorite,
        });
        toast.success('Transacció actualitzada');
      } else {
        await actions.addTransaction({
          title,
          amount: finalAmount,
          date,
          categoryId,
          accountId,
          type,
          description,
          tags,
          important,
          favorite,
        });
        toast.success('Transacció creada correctament! 💸');
      }
      onClose();
    } catch (err) {
      toast.error('Error al desar la transacció');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-premium" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
            {transaction ? 'Editar Transacció' : 'Afegir Transacció'}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)]">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Type Select buttons */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'EXPENSE'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Despesa (-)
            </button>
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'INCOME'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Ingrés (+)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="tx-amount"
              label="Import (€)"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
            <Input
              id="tx-date"
              label="Data"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <Input
            id="tx-title"
            label="Concepte / Títol"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Supermercat, Cafè, Nòmina"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Compte</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full h-10 px-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all duration-150"
                required
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Categoria</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-10 px-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all duration-150"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Descripció o Notes</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Afegeix detalls de la compra..."
              rows={2}
              className="w-full p-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-raised)] text-sm text-[var(--text-primary)] focus:outline-none resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Etiquetes (Tags)</label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Prem Enter per afegir etiqueta"
              className="w-full h-10 px-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-raised)] text-sm text-[var(--text-primary)] focus:outline-none"
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-500/10 text-brand-500 border border-brand-500/20">
                    {t}
                    <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-red-500">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Favorites & Importance */}
          <div className="flex gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={important}
                onChange={(e) => setImportant(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border-default)] accent-brand-500"
              />
              <span className="flex items-center gap-1"><AlertTriangle size={12} className="text-amber-500" /> Important</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={favorite}
                onChange={(e) => setFavorite(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border-default)] accent-brand-500"
              />
              <span className="flex items-center gap-1"><Star size={12} className="text-yellow-500 fill-yellow-500" /> Preferit</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" fullWidth onClick={onClose}>
              Cancel·lar
            </Button>
            <Button type="submit" fullWidth>
              Desar Transacció
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
