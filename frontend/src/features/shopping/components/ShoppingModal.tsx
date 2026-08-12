import { useState, useEffect } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { type ShoppingItem } from '@/shared/stores/useShoppingStore';
import { useShoppingActions } from '@/features/shopping/hooks/useShoppingActions';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import toast from 'react-hot-toast';

interface ShoppingModalProps {
  item: ShoppingItem | null;
  onClose: () => void;
}

const CATEGORIES = ['Alimentació', 'Begudes', 'Neteja', 'Llar', 'Farmàcia i Salut', 'Altres'];
const UNITS = ['u', 'kg', 'l', 'pack', 'g'];

export default function ShoppingModal({ item, onClose }: ShoppingModalProps) {
  const actions = useShoppingActions();

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('u');
  const [category, setCategory] = useState('Alimentació');
  const [price, setPrice] = useState('0.00');
  const [important, setImportant] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (item) {
      setName(item.name);
      setQuantity(String(item.quantity));
      setUnit(item.unit);
      setCategory(item.category);
      setPrice(String(item.price));
      setImportant(item.important);
      setNotes(item.notes || '');
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Introdueix un nom per a l\'article');
      return;
    }

    const numQty = parseFloat(quantity) || 1;
    const numPrice = parseFloat(price) || 0;

    try {
      if (item) {
        await actions.updateItem(item.id, {
          name: name.trim(),
          quantity: numQty,
          unit,
          category,
          price: numPrice,
          important,
          notes: notes.trim(),
        });
        toast.success('Article actualitzat');
      } else {
        await actions.addItem({
          name: name.trim(),
          quantity: numQty,
          unit,
          category,
          price: numPrice,
          important,
          notes: notes.trim(),
        });
        toast.success('Article afegit a la llista! 🛒');
      }
      onClose();
    } catch {
      toast.error('Error al desar l\'article');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-premium" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <ShoppingBag size={16} />
            </div>
            <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
              {item ? 'Editar Article' : 'Afegir Article'}
            </h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-4">
          <Input
            id="shop-name"
            label="Nom de l'article"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Llet sencera, Màniga de pastisseria"
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="shop-qty"
              label="Quantitat"
              type="number"
              step="0.01"
              min="0.01"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              required
            />
            
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Unitat</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full h-10 px-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all duration-150"
              >
                {UNITS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Categoria</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full h-10 px-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all duration-150"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <Input
              id="shop-price"
              label="Preu estimat (€)"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={e => setPrice(e.target.value)}
            />
          </div>

          <Input
            id="shop-notes"
            label="Notes / Marca / Varietat"
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Ex: Hacendado, Desnatada"
          />

          {/* Important check */}
          <div className="flex items-center gap-2.5 py-1">
            <input
              type="checkbox"
              id="shop-important"
              checked={important}
              onChange={e => setImportant(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border-default)] text-brand-500 focus:ring-brand-500/20"
            />
            <label htmlFor="shop-important" className="text-xs font-semibold text-[var(--text-primary)] cursor-pointer">
              Marcar com a important / prioritari
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={onClose}>
              Cancel·lar
            </Button>
            <Button type="submit" fullWidth>
              Desar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
