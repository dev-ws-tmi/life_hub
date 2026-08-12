import { useState } from 'react';
import { useFinancesSync } from '../hooks/useFinancesSync';
import { useFinancesStore } from '@/shared/stores/useFinancesStore';
import AccountManager from './AccountManager';
import TransactionList from './TransactionList';
import TransactionModal from './TransactionModal';
import BudgetTracker from './BudgetTracker';
import GoalVisualizer from './GoalVisualizer';
import SubscriptionList from './SubscriptionList';
import DebtsAndLoans from './DebtsAndLoans';
import FinancesStats from './FinancesStats';
import { Wallet, ArrowUpRight, ArrowDownLeft, Landmark, Plus, BarChart3, Receipt, PiggyBank, Tv, RefreshCw, Scale } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';

type ActiveTab = 'RESUM' | 'TRANSACCIONS' | 'COMPTES' | 'PRESSUPOSTOS' | 'OBJECTIUS' | 'SUBSCRIPCIONS' | 'DEUTES' | 'ESTADISTIQUES';

export default function FinancesPage() {
  // Start real-time Firestore synchronization
  useFinancesSync();

  const { accounts, transactions } = useFinancesStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('RESUM');
  const [modalOpen, setModalOpen] = useState(false);

  // Total balance consolidat
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  // Incomes / Expenses in the current calendar month
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const monthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });

  const monthIncomes = monthTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpenses = monthTransactions
    .filter(t => t.amount < 0 && t.type !== 'TRANSFER')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const savingRate = monthIncomes > 0 ? ((monthIncomes - monthExpenses) / monthIncomes) * 100 : 0;

  const tabItems: { key: ActiveTab; label: string; icon: any }[] = [
    { key: 'RESUM', label: 'Resum', icon: Wallet },
    { key: 'TRANSACCIONS', label: 'Transaccions', icon: Receipt },
    { key: 'COMPTES', label: 'Comptes', icon: Landmark },
    { key: 'PRESSUPOSTOS', label: 'Pressupostos', icon: RefreshCw },
    { key: 'OBJECTIUS', label: 'Objectius', icon: PiggyBank },
    { key: 'SUBSCRIPCIONS', label: 'Subscripcions', icon: Tv },
    { key: 'DEUTES', label: 'Deutes', icon: Scale },
    { key: 'ESTADISTIQUES', label: 'Estadístiques', icon: BarChart3 },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-[var(--text-primary)]">
            Finances Personals
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Life Hub · Control total de la teva economia.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Nova Transacció
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto pb-1 gap-1 border-b border-[var(--border-subtle)] -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-none">
        {tabItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer border
                ${isActive
                  ? 'bg-brand-500/12 text-brand-500 shadow-sm border-brand-500/10'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border-transparent'
                }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      <div className="space-y-6">
        {activeTab === 'RESUM' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Financial Dashboard metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card p-5 bg-gradient-to-br from-brand-500/5 via-transparent to-transparent">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Balanç Consolidat</span>
                <h3 className="text-3xl font-display font-bold text-[var(--text-primary)] mt-1 tracking-tight">
                  {totalBalance.toLocaleString('ca-ES', { style: 'currency', currency: 'EUR' })}
                </h3>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Suma total de tots els comptes actius</p>
              </div>

              <div className="card p-5">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Ingressos ({new Date().toLocaleString('ca-ES', { month: 'short' })})</span>
                <h3 className="text-3xl font-display font-bold text-emerald-500 mt-1 tracking-tight">
                  +{monthIncomes.toLocaleString('ca-ES', { style: 'currency', currency: 'EUR' })}
                </h3>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Rebuts del mes actual</p>
              </div>

              <div className="card p-5">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Despeses ({new Date().toLocaleString('ca-ES', { month: 'short' })})</span>
                <h3 className="text-3xl font-display font-bold text-red-500 mt-1 tracking-tight">
                  -{monthExpenses.toLocaleString('ca-ES', { style: 'currency', currency: 'EUR' })}
                </h3>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Consum despesa del mes</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick status accounts */}
              <div className="card p-5 space-y-4 lg:col-span-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-sm text-[var(--text-primary)]">Resum de Comptes</h4>
                  <button onClick={() => setActiveTab('COMPTES')} className="text-xs text-brand-500 font-bold hover:underline">Gestionar</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {accounts.slice(0, 4).map(acc => (
                    <div key={acc.id} className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: acc.color }} />
                        <span className="text-xs font-semibold text-[var(--text-secondary)]">{acc.name}</span>
                      </div>
                      <span className="text-xs font-bold text-[var(--text-primary)]">{acc.balance.toFixed(2)}€</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly target saving rate widget */}
              <div className="card p-5 flex flex-col justify-between h-auto">
                <div>
                  <h4 className="font-semibold text-sm text-[var(--text-primary)]">Taxa d'Estalvi</h4>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Estalvi net respecte ingressos</p>
                </div>
                <div className="my-4 text-center">
                  <span className={`text-4xl font-display font-bold ${savingRate >= 20 ? 'text-emerald-500' : savingRate > 0 ? 'text-brand-500' : 'text-red-500'}`}>
                    {savingRate >= 0 ? `${savingRate.toFixed(0)}%` : '0%'}
                  </span>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">Objectiu general: 20% d'estalvi</p>
                </div>
                <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${savingRate >= 20 ? 'bg-emerald-500' : 'bg-brand-500'}`}
                    style={{ width: `${Math.max(0, Math.min(savingRate, 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Transactions log */}
            <div className="card p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-sm text-[var(--text-primary)]">Darrers Moviments</h4>
                <button onClick={() => setActiveTab('TRANSACCIONS')} className="text-xs text-brand-500 font-bold hover:underline">Veure tot</button>
              </div>
              <div className="space-y-2">
                {transactions.slice(0, 5).map(tx => {
                  const isIncome = tx.amount > 0;
                  return (
                    <div key={tx.id} className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs ${
                          isIncome ? 'bg-emerald-500' : 'bg-red-500'
                        }`}>
                          {isIncome ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[var(--text-primary)]">{tx.title}</p>
                          <span className="text-[9px] text-[var(--text-muted)]">{tx.date}</span>
                        </div>
                      </div>
                      <span className={`text-xs font-bold ${isIncome ? 'text-emerald-500' : 'text-red-500'}`}>
                        {isIncome ? '+' : ''}{tx.amount.toFixed(2)}€
                      </span>
                    </div>
                  );
                })}
                {transactions.length === 0 && (
                  <p className="text-xs text-[var(--text-muted)] text-center py-6">No hi ha transaccions registrades.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'TRANSACCIONS' && <TransactionList />}
        {activeTab === 'COMPTES' && <AccountManager />}
        {activeTab === 'PRESSUPOSTOS' && <BudgetTracker />}
        {activeTab === 'OBJECTIUS' && <GoalVisualizer />}
        {activeTab === 'SUBSCRIPCIONS' && <SubscriptionList />}
        {activeTab === 'DEUTES' && <DebtsAndLoans />}
        {activeTab === 'ESTADISTIQUES' && <FinancesStats />}
      </div>

      {/* Quick transaction modal */}
      {modalOpen && (
        <TransactionModal
          transaction={null}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
