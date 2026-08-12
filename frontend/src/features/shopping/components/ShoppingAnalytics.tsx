import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useShoppingStore } from '@/shared/stores/useShoppingStore';
import { ShoppingBag, TrendingUp, Info, Landmark } from 'lucide-react';
import ShoppingPriceAlerts from './ShoppingPriceAlerts';

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9', '#14b8a6', '#64748b'];

export default function ShoppingAnalytics() {
  const { items, purchases } = useShoppingStore();

  const totalCost = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const checkedCost = items.filter(i => i.checked).reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const pendingCost = totalCost - checkedCost;

  // Group by category for active items chart
  const categoryDataMap = items.reduce((acc, item) => {
    const cost = item.price * item.quantity;
    if (cost > 0) {
      acc[item.category] = (acc[item.category] || 0) + cost;
    }
    return acc;
  }, {} as Record<string, number>);

  const categoryChartData = Object.entries(categoryDataMap).map(([name, value]) => ({
    name,
    value,
  }));

  // Group by supermarket for past purchases chart
  const supermarketDataMap = purchases.reduce((acc, p) => {
    acc[p.supermarket] = (acc[p.supermarket] || 0) + p.total;
    return acc;
  }, {} as Record<string, number>);

  const supermarketChartData = Object.entries(supermarketDataMap).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="space-y-6">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 bg-[var(--bg-raised)] border border-[var(--border-subtle)]">
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Despesa Total Estimada</p>
          <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{totalCost.toFixed(2)} €</p>
          <span className="text-[9px] text-[var(--text-secondary)] block mt-2">Suma de tota la llista activa</span>
        </div>

        <div className="card p-5 bg-[var(--bg-raised)] border border-[var(--border-subtle)]">
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-emerald-500">Despesa a la Cistella</p>
          <p className="text-2xl font-bold text-emerald-500 mt-1">{checkedCost.toFixed(2)} €</p>
          <span className="text-[9px] text-[var(--text-secondary)] block mt-2">Articles ja marcats com a comprats</span>
        </div>

        <div className="card p-5 bg-[var(--bg-raised)] border border-[var(--border-subtle)]">
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-brand-500">Pendent de Comprar</p>
          <p className="text-2xl font-bold text-brand-500 mt-1">{pendingCost.toFixed(2)} €</p>
          <span className="text-[9px] text-[var(--text-secondary)] block mt-2">Balanç que falta per adquirir</span>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category Pie Chart */}
        <div className="lg:col-span-2 card p-5 bg-[var(--bg-raised)] border border-[var(--border-subtle)] space-y-4">
          <div>
            <h4 className="font-display font-bold text-sm text-[var(--text-primary)]">Distribució del Cost per Categoria</h4>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Percentatge del pressupost assignat a cada grup de productes actius</p>
          </div>

          <div className="h-64">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${Number(value || 0).toFixed(2)} €`, 'Cost estimat']}
                    contentStyle={{ backgroundColor: 'var(--bg-overlay)', borderColor: 'var(--border-subtle)', borderRadius: 'var(--radius-md)' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-[var(--text-secondary)]">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center flex-col text-center space-y-2">
                <ShoppingBag size={24} className="text-[var(--text-muted)]" />
                <p className="text-xs text-[var(--text-muted)]">No hi ha prou dades amb preus assignats per generar el gràfic.</p>
              </div>
            )}
          </div>
        </div>

        {/* Analytics Insights */}
        <div className="card p-5 bg-[var(--bg-raised)] border border-[var(--border-subtle)] space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="font-display font-bold text-xs text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2 flex items-center gap-2">
              <TrendingUp size={14} className="text-brand-500" /> Estadístiques d'Articles
            </h4>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--text-secondary)]">Total d'articles actius:</span>
                <span className="font-bold text-[var(--text-primary)]">{items.length}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--text-secondary)]">Marcats com a important:</span>
                <span className="font-bold text-red-500">{items.filter(i => i.important).length}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--text-secondary)]">Tiquets passats registrats:</span>
                <span className="font-bold text-brand-500">{purchases.length}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 items-start text-[10px] text-[var(--text-secondary)] bg-[var(--bg-elevated)] p-3 rounded-lg border border-[var(--border-subtle)] mt-4">
            <Info size={14} className="text-brand-500 flex-shrink-0 mt-0.5" />
            <span>Assigna preu i quantitat als teus articles per obtenir una estimació exacta de la llista abans de passar per caixa al supermercat.</span>
          </div>
        </div>

      </div>

      {/* Supermarket Spent Chart and Price Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Supermarket spent chart */}
        <div className="lg:col-span-1 card p-5 bg-[var(--bg-raised)] border border-[var(--border-subtle)] space-y-4">
          <div>
            <h4 className="font-display font-bold text-sm text-[var(--text-primary)]">Despesa per Supermercat</h4>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Total acumulat en tiquets passats</p>
          </div>

          <div className="h-64">
            {supermarketChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={supermarketChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} />
                  <YAxis stroke="var(--text-muted)" fontSize={10} />
                  <Tooltip 
                    formatter={(value: any) => [`${Number(value || 0).toFixed(2)} €`, 'Total gastat']}
                    contentStyle={{ backgroundColor: 'var(--bg-overlay)', borderColor: 'var(--border-subtle)', borderRadius: 'var(--radius-md)' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Bar dataKey="value" fill="var(--color-brand-500)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center flex-col text-center space-y-2">
                <Landmark size={24} className="text-[var(--text-muted)]" />
                <p className="text-xs text-[var(--text-muted)]">No hi ha compres passades registrades per generar el gràfic.</p>
              </div>
            )}
          </div>
        </div>

        {/* Price Alerts Comparer */}
        <div className="lg:col-span-2 card p-5 bg-[var(--bg-raised)] border border-[var(--border-subtle)] space-y-4">
          <ShoppingPriceAlerts />
        </div>

      </div>

    </div>
  );
}
