import { useState } from 'react';
import { Plus, Edit2, Trash2, ShoppingCart, Info, AlertCircle, CheckSquare, Square } from 'lucide-react';
import { useShoppingStore, type ShoppingItem } from '@/shared/stores/useShoppingStore';
import { useShoppingActions } from '@/features/shopping/hooks/useShoppingActions';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import ShoppingModal from './ShoppingModal';
import toast from 'react-hot-toast';

export default function ShoppingList() {
  const { items, loading } = useShoppingStore();
  const actions = useShoppingActions();

  const [quickName, setQuickName] = useState('');
  const [selectedItem, setSelectedItem] = useState<ShoppingItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) return;

    // Basic parser for quantity (ex: "3 llet" -> qty: 3, name: "llet")
    let name = quickName.trim();
    let quantity = 1;
    const match = name.match(/^(\d+(?:\.\d+)?)\s+(.*)$/);
    if (match) {
      quantity = parseFloat(match[1]);
      name = match[2];
    }

    try {
      await actions.addItem({
        name,
        quantity,
        unit: 'u',
        category: 'Alimentació',
        price: 0,
        important: false,
        notes: '',
      });
      setQuickName('');
      toast.success(`Afegit: ${quantity}x ${name}`);
    } catch {
      toast.error('Error en afegir l\'article');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Vols eliminar "${name}" de la llista?`)) return;
    try {
      await actions.deleteItem(id);
      toast.success('Article eliminat');
    } catch {
      toast.error('Error al suprimir');
    }
  };

  const handleClearChecked = async () => {
    const checkedCount = items.filter(i => i.checked).length;
    if (checkedCount === 0) return;
    if (!window.confirm(`Vols treure de la llista els ${checkedCount} articles ja comprats?`)) return;
    try {
      await actions.clearCheckedItems();
      toast.success('Cistella buidada');
    } catch {
      toast.error('Error al buidar');
    }
  };

  // Calculations
  const activeItems = items.filter(i => !i.checked);
  const checkedItems = items.filter(i => i.checked);
  
  const totalEstimated = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const totalCart = checkedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  // Group active items by category
  const categories = Array.from(new Set(items.map(i => i.category)));

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-[var(--text-muted)] animate-pulse">
        Carregant la llista de la compra...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Quick Add Bar */}
      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <div className="flex-1">
          <Input
            id="quick-add-shop"
            value={quickName}
            onChange={e => setQuickName(e.target.value)}
            placeholder="Afegir article... (ex: '3 Llet', 'Formatge')"
            className="w-full"
          />
        </div>
        <Button type="submit">
          <Plus size={16} /> Afegir
        </Button>
      </form>

      {/* Main List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active items column */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex justify-between items-center pb-2 border-b border-[var(--border-subtle)]">
            <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
              Articles Pendents ({activeItems.length})
            </h3>
            <button 
              onClick={() => { setSelectedItem(null); setModalOpen(true); }}
              className="text-xs text-brand-500 font-bold hover:underline"
            >
              + Detalls complets
            </button>
          </div>

          <div className="space-y-4">
            {categories.map(cat => {
              const catItems = activeItems.filter(i => i.category === cat);
              if (catItems.length === 0) return null;

              return (
                <div key={cat} className="space-y-2">
                  <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider pl-1">
                    {cat}
                  </h4>
                  <div className="space-y-1">
                    {catItems.map(item => (
                      <div 
                        key={item.id}
                        className={`group p-3.5 bg-[var(--bg-raised)] border rounded-xl flex items-center justify-between transition-all hover:bg-[var(--bg-elevated)] ${
                          item.important ? 'border-red-500/20 bg-gradient-to-r from-red-500/2 to-transparent' : 'border-[var(--border-subtle)]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => actions.toggleItemChecked(item.id)}
                            className="text-[var(--text-secondary)] hover:text-brand-500 transition-colors cursor-pointer"
                          >
                            <Square size={18} className="stroke-[2.5]" />
                          </button>
                          
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-[var(--text-primary)] break-words">
                              {item.name}
                            </span>
                            {item.notes && (
                              <p className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate">{item.notes}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-right">
                            <span className="text-xs font-bold text-[var(--text-secondary)]">
                              {item.quantity} {item.unit}
                            </span>
                            {item.price > 0 && (
                              <p className="text-[10px] text-[var(--text-muted)]">
                                {(item.price * item.quantity).toFixed(2)}€
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setSelectedItem(item); setModalOpen(true); }}
                              className="p-1 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                              title="Editar"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.name)}
                              className="p-1 rounded hover:bg-red-500/10 text-red-500"
                              title="Eliminar"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {activeItems.length === 0 && (
              <div className="text-center py-10 card bg-[var(--bg-raised)] p-6 space-y-2">
                <ShoppingCart size={24} className="mx-auto text-[var(--text-muted)]" />
                <p className="text-xs text-[var(--text-muted)]">La llista de la compra està buida.</p>
                <p className="text-[10px] text-[var(--text-secondary)]">Afegeix algun producte a dalt per començar.</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart / Checked items column */}
        <div className="space-y-5">
          <div className="flex justify-between items-center pb-2 border-b border-[var(--border-subtle)]">
            <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
              Ja a la Cistella ({checkedItems.length})
            </h3>
            {checkedItems.length > 0 && (
              <button 
                onClick={handleClearChecked}
                className="text-xs text-red-500 font-semibold hover:underline"
              >
                Buidar cistella
              </button>
            )}
          </div>

          <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
            {checkedItems.map(item => (
              <div 
                key={item.id}
                className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-between opacity-60 transition-all hover:opacity-100"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => actions.toggleItemChecked(item.id)}
                    className="text-emerald-500 cursor-pointer"
                  >
                    <CheckSquare size={18} className="stroke-[2.5]" />
                  </button>
                  <span className="text-xs text-[var(--text-muted)] line-through truncate font-medium">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--text-muted)] font-semibold">
                    {item.quantity} {item.unit}
                  </span>
                  <button 
                    onClick={() => handleDelete(item.id, item.name)}
                    className="p-1 rounded text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}

            {checkedItems.length === 0 && (
              <p className="text-xs text-[var(--text-muted)] py-6 text-center">Encara no hi ha cap article a la cistella.</p>
            )}
          </div>

          {/* Budget Widget summary */}
          <div className="card p-5 bg-gradient-to-br from-brand-500/5 to-transparent space-y-4">
            <h4 className="font-display font-bold text-xs text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2 flex items-center gap-2">
              <Info size={14} className="text-brand-500" /> Resum del Pressupost
            </h4>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-secondary)]">Total a la cistella:</span>
                <span className="font-bold text-emerald-500">{totalCart.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-secondary)]">Total estimat llista:</span>
                <span className="font-bold text-[var(--text-primary)]">{totalEstimated.toFixed(2)} €</span>
              </div>
            </div>

            <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-500 rounded-full transition-all duration-300"
                style={{ width: `${totalEstimated > 0 ? (totalCart / totalEstimated) * 100 : 0}%` }}
              />
            </div>
            {totalEstimated > 0 && totalCart === totalEstimated && (
              <div className="flex gap-2 items-center text-[10px] text-emerald-500 bg-emerald-500/5 p-2 rounded-lg">
                <AlertCircle size={12} />
                <span>Tot comprat i llest per pagar!</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Shopping Form modal */}
      {modalOpen && (
        <ShoppingModal
          item={selectedItem}
          onClose={() => { setSelectedItem(null); setModalOpen(false); }}
        />
      )}

    </div>
  );
}
