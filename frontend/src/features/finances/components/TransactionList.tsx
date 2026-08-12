import { useState } from 'react';
import { Search, Filter, Edit2, Trash2, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Download, Star, AlertTriangle } from 'lucide-react';
import { useFinancesStore, type Transaction } from '@/shared/stores/useFinancesStore';
import { useFinancesActions } from '@/features/finances/hooks/useFinancesActions';
import TransactionModal from './TransactionModal';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import toast from 'react-hot-toast';

export default function TransactionList() {
  const { transactions, categories, accounts } = useFinancesStore();
  const actions = useFinancesActions();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterAccount, setFilterAccount] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterFavs, setFilterFavs] = useState<boolean>(false);
  const [filterImportants, setFilterImportants] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState(false);

  // Editing state
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleEdit = (tx: Transaction) => {
    setSelectedTx(tx);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Vols eliminar aquesta transacció? El saldo del compte es recalcularà.')) return;
    try {
      await actions.deleteTransaction(id);
      toast.success('Transacció eliminada');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast.error('No hi ha transaccions per exportar');
      return;
    }

    const headers = ['Data', 'Títol', 'Descripció', 'Import', 'Tipus', 'Compte', 'Categoria', 'Tags'];
    const rows = filteredTransactions.map(tx => [
      tx.date,
      `"${tx.title.replace(/"/g, '""')}"`,
      `"${(tx.description || '').replace(/"/g, '""')}"`,
      tx.amount,
      tx.type,
      `"${accounts.find(a => a.id === tx.accountId)?.name || 'Desconegut'}"`,
      `"${categories.find(c => c.id === tx.categoryId)?.name || 'Desconegut'}"`,
      `"${(tx.tags || []).join(', ')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `estudi360_finances_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exportat correctament a CSV 📂');
  };

  // Filter logic
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.title.toLowerCase().includes(search.toLowerCase()) || 
                          (tx.description || '').toLowerCase().includes(search.toLowerCase()) ||
                          (tx.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()));

    const matchesType = filterType === 'ALL' ||
                        (filterType === 'INCOME' && tx.amount > 0) ||
                        (filterType === 'EXPENSE' && tx.amount < 0) ||
                        (filterType === 'TRANSFER' && tx.type === 'TRANSFER');

    const matchesAccount = filterAccount === 'ALL' || tx.accountId === filterAccount || tx.destinationAccountId === filterAccount;
    const matchesCategory = filterCategory === 'ALL' || tx.categoryId === filterCategory;
    const matchesFav = !filterFavs || !!tx.favorite;
    const matchesImp = !filterImportants || !!tx.important;

    return matchesSearch && matchesType && matchesAccount && matchesCategory && matchesFav && matchesImp;
  });

  return (
    <div className="space-y-4">
      {/* Header and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-display font-bold text-[var(--text-primary)]">Historial de Transaccions</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            S'han trobat {filteredTransactions.length} transaccions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowFilters(!showFilters)} variant="secondary" className="text-xs">
            <Filter size={14} /> Filtres
          </Button>
          <Button onClick={handleExportCSV} variant="secondary" className="text-xs">
            <Download size={14} /> Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-[var(--bg-elevated)] animate-fade-in">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Tipus</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-raised)] text-xs text-[var(--text-primary)] focus:outline-none"
            >
              <option value="ALL">Tots els moviments</option>
              <option value="INCOME">Ingressos (+)</option>
              <option value="EXPENSE">Despeses (-)</option>
              <option value="TRANSFER">Transferències</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Compte</label>
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-raised)] text-xs text-[var(--text-primary)] focus:outline-none"
            >
              <option value="ALL">Tots els comptes</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Categoria</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-raised)] text-xs text-[var(--text-primary)] focus:outline-none"
            >
              <option value="ALL">Totes les categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3 pt-4 sm:pt-0">
            <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterFavs}
                onChange={(e) => setFilterFavs(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border-default)] accent-brand-500"
              />
              <span className="flex items-center gap-1"><Star size={12} className="text-yellow-500 fill-yellow-500" /> Preferits</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterImportants}
                onChange={(e) => setFilterImportants(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border-default)] accent-brand-500"
              />
              <span className="flex items-center gap-1"><AlertTriangle size={12} className="text-amber-500" /> Importants</span>
            </label>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <Input
        id="search-transactions"
        placeholder="Cerca per concepte, notes o etiquetes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        leftIcon={Search}
      />

      {/* List */}
      <div className="space-y-2">
        {filteredTransactions.length === 0 ? (
          <div className="card p-12 text-center text-[var(--text-muted)] text-sm">
            No s'ha trobat cap moviment amb els filtres aplicats.
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const cat = categories.find((c) => c.id === tx.categoryId);
            const acc = accounts.find((a) => a.id === tx.accountId);
            const isIncome = tx.amount > 0;
            const destAcc = tx.type === 'TRANSFER' && tx.destinationAccountId ? accounts.find(a => a.id === tx.destinationAccountId) : null;

            return (
              <div key={tx.id} className="card px-4 py-3 flex items-center justify-between gap-3 hover:translate-x-0.5 transition-all">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Icon of Transaction Type */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white ${
                    tx.type === 'TRANSFER'
                      ? 'bg-blue-500'
                      : isIncome ? 'bg-emerald-500' : 'bg-red-500'
                  }`}>
                    {tx.type === 'TRANSFER' ? <ArrowLeftRight size={18} /> : isIncome ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs">{cat?.emoji || '📦'}</span>
                      <h4 className="font-semibold text-sm text-[var(--text-primary)] truncate leading-snug">{tx.title}</h4>
                      {tx.favorite && <Star size={11} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                      {tx.important && <AlertTriangle size={11} className="text-amber-500 flex-shrink-0" />}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-medium mt-0.5 flex-wrap">
                      <span>{tx.date}</span>
                      <span>•</span>
                      <span className="bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded-md border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                        {acc?.name}
                        {destAcc && ` → ${destAcc.name}`}
                      </span>
                      {tx.tags && tx.tags.map(t => (
                        <span key={t} className="text-brand-500 font-semibold">#{t}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className={`font-bold text-sm text-right ${isIncome ? 'text-emerald-500' : 'text-red-500'}`}>
                    {isIncome ? '+' : ''}{tx.amount.toLocaleString('ca-ES', { style: 'currency', currency: 'EUR' })}
                  </span>

                  <div className="flex gap-0.5">
                    <button onClick={() => handleEdit(tx)} className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => handleDelete(tx.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-all">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Editing Modal */}
      {modalOpen && (
        <TransactionModal
          transaction={selectedTx}
          onClose={() => {
            setModalOpen(false);
            setSelectedTx(null);
          }}
        />
      )}
    </div>
  );
}
