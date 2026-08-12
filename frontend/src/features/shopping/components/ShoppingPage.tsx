import { useState } from 'react';
import { ShoppingCart, ClipboardList, BarChart3, Plus, Camera, History } from 'lucide-react';
import { useShoppingSync } from '@/features/shopping/hooks/useShoppingSync';
import { Button } from '@/shared/components/ui/Button';
import ShoppingList from './ShoppingList';
import QuickCatalog from './QuickCatalog';
import ShoppingAnalytics from './ShoppingAnalytics';
import ShoppingModal from './ShoppingModal';
import PastPurchases from './PastPurchases';
import TicketScannerModal from './TicketScannerModal';

type ActiveTab = 'LIST' | 'CATALOG' | 'PAST_PURCHASES' | 'ANALYTICS';

export default function ShoppingPage() {
  // Real-time synchronization
  useShoppingSync();

  const [activeTab, setActiveTab] = useState<ActiveTab>('LIST');
  const [modalOpen, setModalOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  return (
    <div className="w-full space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-[var(--text-primary)]">
            Llista de Compres
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Life Hub · Controla la teva llista del súper i despeses estimades.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setScannerOpen(true)} variant="secondary" className="flex items-center gap-1.5">
            <Camera size={16} /> Llegir Tiquet
          </Button>
          <Button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5">
            <Plus size={16} /> Nou Article
          </Button>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex overflow-x-auto pb-1 gap-1 border-b border-[var(--border-subtle)] -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-none">
        
        <button
          onClick={() => setActiveTab('LIST')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer border
            ${activeTab === 'LIST'
              ? 'bg-brand-500/12 text-brand-500 shadow-sm border-brand-500/10'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border-transparent'
            }`}
        >
          <ClipboardList size={14} />
          Llista Activa
        </button>

        <button
          onClick={() => setActiveTab('CATALOG')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer border
            ${activeTab === 'CATALOG'
              ? 'bg-brand-500/12 text-brand-500 shadow-sm border-brand-500/10'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border-transparent'
            }`}
        >
          <ShoppingCart size={14} />
          Catàleg de Freqüents
        </button>

        <button
          onClick={() => setActiveTab('PAST_PURCHASES')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer border
            ${activeTab === 'PAST_PURCHASES'
              ? 'bg-brand-500/12 text-brand-500 shadow-sm border-brand-500/10'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border-transparent'
            }`}
        >
          <History size={14} />
          Compres Passades (Packs)
        </button>

        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer border
            ${activeTab === 'ANALYTICS'
              ? 'bg-brand-500/12 text-brand-500 shadow-sm border-brand-500/10'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border-transparent'
            }`}
        >
          <BarChart3 size={14} />
          Estadístiques i Alertes
        </button>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'LIST' && <ShoppingList />}
        {activeTab === 'CATALOG' && <QuickCatalog />}
        {activeTab === 'PAST_PURCHASES' && <PastPurchases />}
        {activeTab === 'ANALYTICS' && <ShoppingAnalytics />}
      </div>

      {/* Detailed Modal to Add Item */}
      {modalOpen && (
        <ShoppingModal
          item={null}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* Ticket OCR Scanner Modal */}
      {scannerOpen && (
        <TicketScannerModal
          onClose={() => setScannerOpen(false)}
        />
      )}

    </div>
  );
}
