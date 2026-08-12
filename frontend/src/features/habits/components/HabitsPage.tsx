import { useState } from 'react';
import { useHabitsSync } from '../hooks/useHabitsSync';
import { useHabitsStore, type Habit } from '@/shared/stores/useHabitsStore';
import { useHabitsActions } from '@/features/habits/hooks/useHabitsActions';
import HabitTodayList from './HabitTodayList';
import HabitStats from './HabitStats';
import HabitHeatmap from './HabitHeatmap';
import HabitGoalsTracker from './HabitGoalsTracker';
import HabitModal from './HabitModal';
import { CheckSquare, BarChart3, Target, Plus, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import toast from 'react-hot-toast';

type ActiveTab = 'TODAY' | 'STATS' | 'GOALS' | 'MANAGE';

export default function HabitsPage() {
  // Start real-time Firestore sync
  useHabitsSync();

  const { habits } = useHabitsStore();
  const actions = useHabitsActions();
  const [activeTab, setActiveTab] = useState<ActiveTab>('TODAY');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  const handleEdit = (h: Habit) => {
    setSelectedHabit(h);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Segur que vols esborrar aquest hàbit? Això eliminarà tots els logs registrats fins ara.')) {
      try {
        await actions.deleteHabit(id);
        toast.success('Hàbit esborrat correctament');
      } catch (err) {
        toast.error('Error al esborrar l\'hàbit');
      }
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-[var(--text-primary)]">
            Seguiment d'Hàbits
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Life Hub · Construeix rutines i controla la teva constància.
          </p>
        </div>
        <Button onClick={() => { setSelectedHabit(null); setModalOpen(true); }}>
          <Plus size={16} /> Nou Hàbit
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto pb-1 gap-1 border-b border-[var(--border-subtle)] -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-none">
        <button
          onClick={() => setActiveTab('TODAY')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer border
            ${activeTab === 'TODAY'
              ? 'bg-brand-500/12 text-brand-500 shadow-sm border-brand-500/10'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border-transparent'
            }`}
        >
          <CheckSquare size={14} />
          Avui
        </button>

        <button
          onClick={() => setActiveTab('STATS')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer border
            ${activeTab === 'STATS'
              ? 'bg-brand-500/12 text-brand-500 shadow-sm border-brand-500/10'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border-transparent'
            }`}
        >
          <BarChart3 size={14} />
          Estadístiques i Heatmap
        </button>

        <button
          onClick={() => setActiveTab('GOALS')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer border
            ${activeTab === 'GOALS'
              ? 'bg-brand-500/12 text-brand-500 shadow-sm border-brand-500/10'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border-transparent'
            }`}
        >
          <Target size={14} />
          Fites i Objectius
        </button>

        <button
          onClick={() => setActiveTab('MANAGE')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer border
            ${activeTab === 'MANAGE'
              ? 'bg-brand-500/12 text-brand-500 shadow-sm border-brand-500/10'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border-transparent'
            }`}
        >
          <ShieldAlert size={14} />
          Gestionar Hàbits
        </button>
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        {activeTab === 'TODAY' && <HabitTodayList />}
        {activeTab === 'STATS' && (
          <div className="space-y-6 animate-fade-in">
            <HabitStats />
            <HabitHeatmap />
          </div>
        )}
        {activeTab === 'GOALS' && <HabitGoalsTracker />}
        {activeTab === 'MANAGE' && (
          <div className="card p-5 space-y-4 animate-fade-in">
            <h4 className="font-semibold text-sm text-[var(--text-primary)]">Llista de tots els Hàbits actius</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                    <th className="pb-2.5 font-semibold">Hàbit</th>
                    <th className="pb-2.5 font-semibold">Freqüència</th>
                    <th className="pb-2.5 font-semibold">Fita diària</th>
                    <th className="pb-2.5 font-semibold">Dificultat</th>
                    <th className="pb-2.5 font-semibold text-right">Accions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]/40 text-[var(--text-secondary)]">
                  {habits.map((h) => (
                    <tr key={h.id} className="hover:bg-[var(--bg-elevated)]/30 transition-colors">
                      <td className="py-3 pr-4 font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: h.color }} />
                        {h.title}
                      </td>
                      <td className="py-3 pr-4 uppercase text-[10px] font-bold tracking-wider">{h.frequency}</td>
                      <td className="py-3 pr-4">{h.goalType === 'BINARY' ? 'Sí / No' : `${h.goalValue} ${h.unit}`}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                          h.difficulty === 'EASY' ? 'bg-emerald-500/10 text-emerald-500' :
                          h.difficulty === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {h.difficulty}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleEdit(h)}
                          className="p-1 hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)] rounded-lg cursor-pointer inline-flex"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(h.id)}
                          className="p-1 hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:text-red-500 rounded-lg cursor-pointer inline-flex"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {habits.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-[var(--text-muted)]">No hi ha hàbits actius. Crea'n un per començar!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <HabitModal
          habit={selectedHabit}
          onClose={() => { setModalOpen(false); setSelectedHabit(null); }}
        />
      )}
    </div>
  );
}
