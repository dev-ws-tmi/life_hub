import { useShoppingStore } from '@/shared/stores/useShoppingStore';
import { AlertTriangle, TrendingDown, ArrowRight, Landmark } from 'lucide-react';

interface PricePoint {
  supermarket: string;
  price: number;
  date: string;
}

interface PriceComparison {
  cleanName: string;
  originalName: string;
  points: PricePoint[];
  cheapest: PricePoint;
  expensive: PricePoint;
  percentDiff: number;
}

function cleanProductName(name: string): string {
  return name.toLowerCase()
    .replace(/\b(hacendado|milbona|terra i xufa|bonpreu|lidl|carrefour|bosque verde|w5|cien|fresc|frescos|fresca|del|de|la|el|la|sencera|desnatada|semi|mida|pack|u|12u|5l|unitats)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function ShoppingPriceAlerts() {
  const { purchases } = useShoppingStore();

  // Extract price list per product
  const productPrices: Record<string, { originalName: string; points: PricePoint[] }> = {};

  purchases.forEach(purchase => {
    purchase.items.forEach(item => {
      if (item.price <= 0) return;
      const clean = cleanProductName(item.name);
      if (clean.length < 3) return; // ignore short words

      if (!productPrices[clean]) {
        productPrices[clean] = {
          originalName: item.name,
          points: []
        };
      }

      // Add price point if not already added for this supermarket on this date
      const alreadyExists = productPrices[clean].points.some(
        p => p.supermarket === purchase.supermarket && p.price === item.price
      );
      if (!alreadyExists) {
        productPrices[clean].points.push({
          supermarket: purchase.supermarket,
          price: item.price,
          date: purchase.date
        });
      }
    });
  });

  // Build comparisons
  const comparisons: PriceComparison[] = [];

  Object.entries(productPrices).forEach(([cleanName, data]) => {
    // We need price points from at least 2 different supermarkets to compare
    const supermarkets = new Set(data.points.map(p => p.supermarket.toLowerCase()));
    if (supermarkets.size < 2) return;

    // Find cheapest and most expensive
    let cheapest = data.points[0];
    let expensive = data.points[0];

    data.points.forEach(p => {
      if (p.price < cheapest.price) cheapest = p;
      if (p.price > expensive.price) expensive = p;
    });

    const diff = expensive.price - cheapest.price;
    if (diff <= 0.05) return; // Ignore very minor differences

    const percentDiff = (diff / cheapest.price) * 100;

    comparisons.push({
      cleanName,
      originalName: data.originalName,
      points: data.points,
      cheapest,
      expensive,
      percentDiff
    });
  });

  // Sort comparisons by highest percentage difference
  comparisons.sort((a, b) => b.percentDiff - a.percentDiff);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-subtle)]">
        <AlertTriangle size={16} className="text-amber-500" />
        <h4 className="text-xs font-bold text-[var(--text-primary)]">Comparador i Alertes de Preus Actius</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {comparisons.map((comp) => (
          <div 
            key={comp.cleanName} 
            className="card p-4 border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-[var(--bg-raised)] to-transparent flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-[var(--text-primary)] capitalize">
                  {comp.cleanName}
                </span>
                <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-bold">
                  +{comp.percentDiff.toFixed(0)}% de diferència
                </span>
              </div>
              
              <p className="text-[10px] text-[var(--text-muted)]">
                Basat en les teves compres recents detectades a l'historial.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-[var(--border-subtle)]/50">
              <div className="space-y-1">
                <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider block">Més Barat</span>
                <div className="flex items-center gap-1.5">
                  <Landmark size={12} className="text-emerald-500" />
                  <span className="text-xs font-semibold text-[var(--text-primary)]">{comp.cheapest.supermarket}</span>
                </div>
                <span className="text-xs font-bold text-emerald-500">{comp.cheapest.price.toFixed(2)} €</span>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-red-500 font-bold uppercase tracking-wider block">Més Car</span>
                <div className="flex items-center gap-1.5">
                  <Landmark size={12} className="text-red-500" />
                  <span className="text-xs font-semibold text-[var(--text-primary)]">{comp.expensive.supermarket}</span>
                </div>
                <span className="text-xs font-bold text-red-500">{comp.expensive.price.toFixed(2)} €</span>
              </div>
            </div>

            <div className="mt-4 bg-[var(--bg-elevated)] p-2.5 rounded-xl border border-[var(--border-subtle)] flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
              <span className="flex items-center gap-1">
                <TrendingDown size={12} className="text-emerald-500" />
                Estalvies
              </span>
              <span className="font-bold text-emerald-500">
                {(comp.expensive.price - comp.cheapest.price).toFixed(2)} € per unitat
              </span>
              <ArrowRight size={10} />
              <span>Comprant a {comp.cheapest.supermarket}</span>
            </div>

          </div>
        ))}

        {comparisons.length === 0 && (
          <div className="col-span-2 text-center py-6 text-xs text-[var(--text-muted)] bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-xl">
            Encara no hi ha prou dades per comparar preus. 
            <p className="text-[10px] text-[var(--text-secondary)] mt-1">Escaneja tiquets de diferents supermercats per veure comparacions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
