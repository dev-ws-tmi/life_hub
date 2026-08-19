import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { useFinancesStore } from '@/shared/stores/useFinancesStore';
import { BarChart3, TrendingUp, DollarSign, Wallet } from 'lucide-react';

export default function FinancesStats() {
  const { transactions, categories, accounts } = useFinancesStore();

  // 1. Process data for evolution of balance over the last 30 days
  const balanceEvolutionData = useMemo(() => {
    const today = new Date();

    // Get starting balance: total balance of all accounts right now
    let currentTotalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

    // Group transactions by date
    const txByDate: Record<string, number> = {};
    transactions.forEach(tx => {
      txByDate[tx.date] = (txByDate[tx.date] || 0) + tx.amount;
    });

    // Go backwards for 30 days
    const result = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateString = d.toISOString().split('T')[0];

      result.unshift({
        date: d.toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' }),
        rawDate: dateString,
        balance: parseFloat(currentTotalBalance.toFixed(2))
      });

      // Subtract the day's transactions to get the previous day's balance
      const dayNet = txByDate[dateString] || 0;
      currentTotalBalance -= dayNet;
    }

    return result;
  }, [transactions, accounts]);

  // 2. Spending by category data
  const categorySpendingData = useMemo(() => {
    const spendingMap: Record<string, { name: string, value: number, color: string }> = {};

    transactions
      .filter(tx => tx.amount < 0 && tx.type !== 'TRANSFER')
      .forEach(tx => {
        const cat = categories.find(c => c.id === tx.categoryId);
        const catId = tx.categoryId;
        const catName = cat?.name || 'Altres';
        const catColor = cat?.color || '#64748b';

        if (!spendingMap[catId]) {
          spendingMap[catId] = { name: catName, value: 0, color: catColor };
        }
        spendingMap[catId].value += Math.abs(tx.amount);
      });

    return Object.values(spendingMap).map(item => ({
      ...item,
      value: parseFloat(item.value.toFixed(2))
    })).sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  // 3. Monthly Incomes vs Expenses (last 6 months)
  const monthlyComparisonData = useMemo(() => {
    const monthlyMap: Record<string, { income: number; expense: number; monthName: string }> = {};
    const today = new Date();

    // Prepare slots for last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = {
        income: 0,
        expense: 0,
        monthName: d.toLocaleString('ca-ES', { month: 'short', year: '2-digit' })
      };
    }

    transactions.forEach(tx => {
      const txMonth = tx.date.substring(0, 7); // YYYY-MM
      if (monthlyMap[txMonth]) {
        if (tx.amount > 0) {
          monthlyMap[txMonth].income += tx.amount;
        } else if (tx.type !== 'TRANSFER') {
          monthlyMap[txMonth].expense += Math.abs(tx.amount);
        }
      }
    });

    return Object.entries(monthlyMap).map(([_, val]) => ({
      month: val.monthName,
      Ingressos: parseFloat(val.income.toFixed(2)),
      Despeses: parseFloat(val.expense.toFixed(2)),
    }));
  }, [transactions]);

  // General aggregates
  const totalIncome30d = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    return transactions
      .filter(tx => tx.date >= dateStr && tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  const totalExpense30d = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    return transactions
      .filter(tx => tx.date >= dateStr && tx.amount < 0 && tx.type !== 'TRANSFER')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* 30 Day overview metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Ingressos (Darrers 30 dies)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-500 mt-2">+{totalIncome30d.toFixed(2)}€</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Despeses (Darrers 30 dies)</span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
              <TrendingUp size={16} className="rotate-180" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-500 mt-2">-{totalExpense30d.toFixed(2)}€</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Estalvi Net (Darrers 30 dies)</span>
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-500">
              <Wallet size={16} />
            </div>
          </div>
          <p className={`text-2xl font-bold mt-2 ${totalIncome30d - totalExpense30d >= 0 ? 'text-brand-500' : 'text-red-500'}`}>
            {(totalIncome30d - totalExpense30d).toFixed(2)}€
          </p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Balance Evolution */}
        <div className="card p-5 space-y-4">
          <h4 className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <TrendingUp size={16} className="text-brand-500" /> Evolució del Saldo (Darrers 30 dies)
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={balanceEvolutionData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-brand-500)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--color-brand-500)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-raised)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px'
                  }}
                />
                <Area type="monotone" dataKey="balance" name="Saldo" stroke="var(--color-brand-500)" strokeWidth={2} fillOpacity={1} fill="url(#colorBalance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incomes vs Expenses (6 months) */}
        <div className="card p-5 space-y-4">
          <h4 className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <BarChart3 size={16} className="text-brand-500" /> Ingressos vs Despeses (Últims 6 mesos)
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={monthlyComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-raised)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px'
                  }}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Ingressos" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despeses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="card p-5 space-y-4 lg:col-span-2">
          <h4 className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <DollarSign size={16} className="text-brand-500" /> Distribució de Despeses per Categoria
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-56">
              {categorySpendingData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
                  Sense dades de despesa
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={categorySpendingData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categorySpendingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--bg-raised)',
                        borderColor: 'var(--border-default)',
                        color: 'var(--text-primary)',
                        borderRadius: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Legend list */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-2">
              {categorySpendingData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[var(--text-secondary)] font-medium truncate">{item.name}</span>
                  </div>
                  <span className="font-bold text-[var(--text-primary)] flex-shrink-0">
                    {item.value.toLocaleString('ca-ES', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
              ))}
              {categorySpendingData.length === 0 && (
                <div className="text-center text-xs text-[var(--text-muted)] py-8">
                  No s'ha registrat cap despesa encara
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
