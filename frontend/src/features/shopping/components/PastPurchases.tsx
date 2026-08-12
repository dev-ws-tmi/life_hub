import { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, Trash2, Landmark, RefreshCw } from 'lucide-react';
import { useShoppingStore, type Purchase } from '@/shared/stores/useShoppingStore';
import { useShoppingActions } from '../hooks/useShoppingActions';
import toast from 'react-hot-toast';

export default function PastPurchases() {
  const { purchases, loading } = useShoppingStore();
  const actions = useShoppingActions();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleDelete = async (e: React.MouseEvent, id: string, supermarket: string, date: string) => {
    e.stopPropagation();
    if (!window.confirm(`Vols eliminar el tiquet de ${supermarket} del dia ${date}?`)) return;
    try {
      await actions.deletePurchase(id);
      toast.success('Compra eliminada de l\'historial');
    } catch {
      toast.error('Error al suprimir el tiquet');
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-[var(--text-muted)] animate-pulse">
        Carregant historial de compres...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">Historial de Compres Passades</h3>
        <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
          Consulta tots els tiquets registrats amb el desglossament de productes i supermercat.
        </p>
      </div>

      <div className="space-y-3">
        {purchases.map((purchase: Purchase) => {
          const isExpanded = expandedId === purchase.id;
          return (
            <div 
              key={purchase.id} 
              className="card bg-[var(--bg-raised)] border border-[var(--border-subtle)] overflow-hidden transition-all"
            >
              {/* Header card info */}
              <div 
                onClick={() => toggleExpand(purchase.id)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-elevated)]/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                    <Landmark size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-primary)]">{purchase.supermarket}</h4>
                    <div className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] mt-0.5">
                      <Calendar size={10} />
                      <span>{purchase.date}</span>
                      <span>·</span>
                      <span>{purchase.items.length} articles</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-[var(--text-primary)]">
                    {purchase.total.toFixed(2)} €
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleDelete(e, purchase.id, purchase.supermarket, purchase.date)}
                      className="p-1.5 rounded hover:bg-red-500/10 text-red-500"
                      title="Eliminar tiquet"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button className="text-[var(--text-tertiary)]">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Collapsed breakdown */}
              {isExpanded && (
                <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]/20 p-4 space-y-3">
                  <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-subtle)] pb-1.5">
                    Desglossament del Tiquet
                  </div>
                  
                  <div className="space-y-1.5">
                    {purchase.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs py-0.5">
                        <div className="min-w-0">
                          <span className="font-semibold text-[var(--text-primary)]">{item.name}</span>
                          <span className="text-[10px] text-[var(--text-muted)] ml-2">({item.category})</span>
                        </div>
                        <div className="text-[var(--text-secondary)] font-medium">
                          {item.quantity} x {item.price.toFixed(2)}€ = <span className="font-semibold text-[var(--text-primary)]">{(item.price * item.quantity).toFixed(2)}€</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-2 border-t border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)]">
                    <span>Total pagat: {purchase.total.toFixed(2)} €</span>
                  </div>
                </div>
              )}

            </div>
          );
        })}

        {purchases.length === 0 && (
          <div className="text-center py-10 card bg-[var(--bg-raised)] p-6 space-y-2">
            <RefreshCw size={24} className="mx-auto text-[var(--text-muted)] animate-pulse" />
            <p className="text-xs text-[var(--text-muted)]">No hi ha compres passades registrades.</p>
            <p className="text-[10px] text-[var(--text-secondary)]">Escaneja un tiquet a dalt per desar el primer tiquet.</p>
          </div>
        )}
      </div>

    </div>
  );
}
