import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Dumbbell, Scale, Plus
} from 'lucide-react';
import { useHealthStore } from '@/shared/stores/useHealthStore';
import { Button } from '@/shared/components/ui/Button';

import HealthDashboard from './HealthDashboard';
import HealthWorkoutsPage from './HealthWorkoutsPage';
import HealthWeightPage from './HealthWeightPage';

import WorkoutModal from './WorkoutModal';
import WeightModal from './WeightModal';
import HevyDetailsModal from './HevyDetailsModal';
import type { HevyWorkout } from '../services/hevyApi';

export type HealthSubTab = 'DASHBOARD' | 'WORKOUTS' | 'WEIGHT';

export default function HealthPage() {
  const [activeTab, setActiveTab] = useState<HealthSubTab>('DASHBOARD');
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [selectedHevyWorkout, setSelectedHevyWorkout] = useState<HevyWorkout | null>(null);

  const { syncHevyWorkouts } = useHealthStore();

  // Auto-sync Hevy workouts and body measurements on opening Health page
  useEffect(() => {
    syncHevyWorkouts().catch(() => {
      // Graceful fallback if offline
    });
  }, [syncHevyWorkouts]);

  const subTabs = [
    { key: 'DASHBOARD' as const, label: 'Tauler', icon: LayoutDashboard },
    { key: 'WORKOUTS' as const, label: 'Exercicis & Rutines', icon: Dumbbell },
    { key: 'WEIGHT' as const, label: 'Mesures & Pes', icon: Scale },
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in pb-10">
      
      {/* Module Title & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-[var(--text-primary)]">
            Salut & Benestar
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Life Hub · Entrenaments de Hevy, mesures corporals i pes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsWeightModalOpen(true)}>
            <Scale size={14} /> Registrar Pes
          </Button>
          <Button size="sm" onClick={() => setIsWorkoutModalOpen(true)}>
            <Plus size={14} /> Nou Entrenament
          </Button>
        </div>
      </div>

      {/* Subpage Navigation Bar */}
      <div className="flex overflow-x-auto pb-1 gap-1 border-b border-[var(--border-subtle)] -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-none">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer border ${
                isActive
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

      {/* Active Subpage View */}
      <div className="space-y-6">
        {activeTab === 'DASHBOARD' && (
          <HealthDashboard
            onSelectHevyWorkout={(w) => setSelectedHevyWorkout(w)}
            onNavigateTab={(t) => setActiveTab(t)}
          />
        )}

        {activeTab === 'WORKOUTS' && (
          <HealthWorkoutsPage
            onOpenWorkoutModal={() => setIsWorkoutModalOpen(true)}
            onSelectHevyWorkout={(w) => setSelectedHevyWorkout(w)}
          />
        )}

        {activeTab === 'WEIGHT' && (
          <HealthWeightPage
            onOpenWeightModal={() => setIsWeightModalOpen(true)}
          />
        )}
      </div>

      {/* Global Modals */}
      <WorkoutModal isOpen={isWorkoutModalOpen} onClose={() => setIsWorkoutModalOpen(false)} />
      <WeightModal isOpen={isWeightModalOpen} onClose={() => setIsWeightModalOpen(false)} />
      <HevyDetailsModal workout={selectedHevyWorkout} onClose={() => setSelectedHevyWorkout(null)} />

    </div>
  );
}
