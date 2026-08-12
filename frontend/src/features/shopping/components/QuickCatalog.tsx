import { Plus, Coffee, Apple, ShoppingCart, HelpCircle } from 'lucide-react';
import { useShoppingStore } from '@/shared/stores/useShoppingStore';
import { useShoppingActions } from '@/features/shopping/hooks/useShoppingActions';
import toast from 'react-hot-toast';

interface CatalogItemTemplate {
  name: string;
  category: string;
  unit: string;
  price: number;
}

const DEFAULT_CATALOG: CatalogItemTemplate[] = [
  // Alimentacio
  { name: 'Llet sencera', category: 'Alimentació', unit: 'u', price: 1.10 },
  { name: 'Ous de gallina (Dotzena)', category: 'Alimentació', unit: 'pack', price: 2.80 },
  { name: 'Pa fresc / Baguette', category: 'Alimentació', unit: 'u', price: 0.90 },
  { name: 'Plàtans', category: 'Alimentació', unit: 'kg', price: 1.95 },
  { name: 'Arròs blanc', category: 'Alimentació', unit: 'kg', price: 1.30 },
  { name: 'Pasta (Macarrons)', category: 'Alimentació', unit: 'pack', price: 0.95 },
  { name: 'Pit de pollastre', category: 'Alimentació', unit: 'kg', price: 6.90 },
  { name: 'Formatge ratllat', category: 'Alimentació', unit: 'u', price: 1.60 },

  // Begudes
  { name: 'Aigua mineral (Garrafa 5L)', category: 'Begudes', unit: 'u', price: 1.25 },
  { name: 'Cafè molt', category: 'Begudes', unit: 'pack', price: 2.20 },
  { name: 'Suc de taronja', category: 'Begudes', unit: 'l', price: 1.80 },

  // Neteja & Llar
  { name: 'Detergent líquid', category: 'Neteja', unit: 'u', price: 5.50 },
  { name: 'Sabó de rentavaixelles', category: 'Neteja', unit: 'u', price: 1.90 },
  { name: 'Paper higiènic (12 rodes)', category: 'Llar', unit: 'pack', price: 3.20 },
  { name: 'Bosses d\'escombraries', category: 'Llar', unit: 'pack', price: 1.50 },

  // Farmacia
  { name: 'Pasta de dents', category: 'Farmàcia i Salut', unit: 'u', price: 1.80 },
  { name: 'Xampú familiar', category: 'Farmàcia i Salut', unit: 'u', price: 2.50 },
];

export default function QuickCatalog() {
  const { items } = useShoppingStore();
  const actions = useShoppingActions();

  const handleAddFromCatalog = async (item: CatalogItemTemplate) => {
    // Check if item already exists in the active list
    const existing = items.find(i => i.name.toLowerCase() === item.name.toLowerCase() && !i.checked);

    try {
      if (existing) {
        // Increment quantity by 1
        await actions.updateItem(existing.id, {
          quantity: existing.quantity + 1,
        });
        toast.success(`Incrementada quantitat de: ${item.name} (+1)`);
      } else {
        // Add new item
        await actions.addItem({
          name: item.name,
          quantity: 1,
          unit: item.unit,
          category: item.category,
          price: item.price,
          important: false,
          notes: 'Afegit del Catàleg',
        });
        toast.success(`Afegit a la llista: ${item.name}`);
      }
    } catch {
      toast.error('Error al afegir article del catàleg');
    }
  };

  const categories = Array.from(new Set(DEFAULT_CATALOG.map(i => i.category)));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">Catàleg d'Articles Freqüents</h3>
        <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
          Fes clic sobre qualsevol article per afegir-lo o incrementar-ne la quantitat a la teva llista activa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map(cat => {
          const catItems = DEFAULT_CATALOG.filter(i => i.category === cat);
          return (
            <div key={cat} className="card p-5 bg-[var(--bg-raised)] border border-[var(--border-subtle)] space-y-4">
              <h4 className="font-display font-bold text-xs text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2 flex items-center gap-2">
                {cat === 'Alimentació' && <Apple size={14} className="text-amber-500" />}
                {cat === 'Begudes' && <Coffee size={14} className="text-brand-500" />}
                {cat === 'Neteja' && <ShoppingCart size={14} className="text-emerald-500" />}
                {cat === 'Llar' && <ShoppingCart size={14} className="text-cyan-500" />}
                {cat === 'Farmàcia i Salut' && <ShoppingCart size={14} className="text-red-500" />}
                {!['Alimentació', 'Begudes', 'Neteja', 'Llar', 'Farmàcia i Salut'].includes(cat) && <HelpCircle size={14} />}
                {cat}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {catItems.map(item => {
                  const isActive = items.some(i => i.name.toLowerCase() === item.name.toLowerCase() && !i.checked);

                  return (
                    <button
                      key={item.name}
                      onClick={() => handleAddFromCatalog(item)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all hover:bg-[var(--bg-elevated)] cursor-pointer ${
                        isActive 
                          ? 'border-brand-500/20 bg-brand-500/5 text-brand-500 font-semibold' 
                          : 'border-[var(--border-subtle)] text-[var(--text-secondary)] bg-[var(--bg-elevated)]/40'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs truncate">{item.name}</p>
                        <span className="text-[9px] text-[var(--text-muted)] block">
                          {item.price.toFixed(2)}€ / {item.unit}
                        </span>
                      </div>
                      <Plus size={14} className="flex-shrink-0 ml-2" />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
