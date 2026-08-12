import { useState, useEffect } from 'react';
import { X, BookOpen, Droplet, Heart, Flame, Home, Brain, Apple, Activity, Target } from 'lucide-react';
import { useHabitsStore, type Habit, type HabitGoalType, type HabitFrequency } from '@/shared/stores/useHabitsStore';
import { useHabitsActions } from '@/features/habits/hooks/useHabitsActions';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import toast from 'react-hot-toast';

interface HabitModalProps {
  habit: Habit | null;
  onClose: () => void;
}

const AVAILABLE_ICONS = ['Droplet', 'BookOpen', 'Heart', 'Flame', 'Home', 'Brain', 'Apple', 'Activity', 'Target'];
const COLOR_PALETTE = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9', '#14b8a6', '#64748b'];

export default function HabitModal({ habit, onClose }: HabitModalProps) {
  const actions = useHabitsActions();
  const { categories } = useHabitsStore();

  // Basic info states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Target');
  const [color, setColor] = useState('#3b82f6');
  const [categoryId, setCategoryId] = useState('');

  // Goal states
  const [goalType, setGoalType] = useState<HabitGoalType>('BINARY');
  const [goalValue, setGoalValue] = useState('1');
  const [unit, setUnit] = useState('vegada');

  // Frequency states
  const [frequency, setFrequency] = useState<HabitFrequency>('DAILY');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]); // default Mon-Fri
  const [frequencyInterval, setFrequencyInterval] = useState('2');

  // Extra metadata
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('EASY');
  const [estimatedMinutes, setEstimatedMinutes] = useState('10');
  const [notes, setNotes] = useState('');
  const [tagsText, setTagsText] = useState('');


  useEffect(() => {
    if (categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories]);

  useEffect(() => {
    if (habit) {
      setTitle(habit.title);
      setDescription(habit.description);
      setIcon(habit.icon);
      setColor(habit.color);
      setCategoryId(habit.categoryId);
      setGoalType(habit.goalType);
      setGoalValue(String(habit.goalValue));
      setUnit(habit.unit);
      setFrequency(habit.frequency);
      setDaysOfWeek(habit.daysOfWeek || []);
      setFrequencyInterval(String(habit.frequencyInterval || 2));
      setDifficulty(habit.difficulty);
      setEstimatedMinutes(String(habit.estimatedMinutes));
      setNotes(habit.notes || '');
      setTagsText(habit.tags.join(', '));
    }
  }, [habit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('El títol és obligatori');
      return;
    }

    const tags = tagsText.split(',').map(t => t.trim()).filter(Boolean);

    const habitData = {
      title,
      description,
      icon,
      color,
      categoryId,
      goalType,
      goalValue: parseFloat(goalValue) || 1,
      unit,
      frequency,
      daysOfWeek,
      frequencyInterval: frequency === 'INTERVAL' ? (parseInt(frequencyInterval) || 2) : null,
      startDate: habit?.startDate || new Date().toISOString().split('T')[0],
      reminders: [],
      notificationsEnabled: false,
      difficulty,
      estimatedMinutes: parseInt(estimatedMinutes) || 10,
      notes,
      tags,
    };

    try {
      if (habit) {
        await actions.updateHabit(habit.id, habitData);
        toast.success('Hàbit actualitzat correctament! ✏️');
      } else {
        await actions.addHabit(habitData);
        toast.success('Hàbit creat correctament! 🚀');
      }
      onClose();
    } catch (err) {
      toast.error('Error al desar l\'hàbit');
    }
  };

  const toggleDayOfWeek = (day: number) => {
    setDaysOfWeek(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-premium" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-in">
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-5 flex flex-col justify-between">
          <div className="space-y-5">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-3">
              <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                {habit ? 'Edita l\'Hàbit' : 'Crea un nou Hàbit'}
              </h3>
              <button type="button" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {/* Basic fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Títol</label>
                <Input
                  type="text"
                  placeholder="Beure aigua, Llegir, Meditar..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Categoria</label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full h-10 px-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all duration-150"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Descripció</label>
                <Input
                  type="text"
                  placeholder="Descripció breu per recordar el motiu..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Colors and Icons selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Icona</label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_ICONS.map(i => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIcon(i)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-all border cursor-pointer ${
                        icon === i ? 'bg-brand-500 text-white border-brand-500' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-brand-500/40'
                      }`}
                    >
                      {i === 'Droplet' && <Droplet size={14} />}
                      {i === 'BookOpen' && <BookOpen size={14} />}
                      {i === 'Heart' && <Heart size={14} />}
                      {i === 'Flame' && <Flame size={14} />}
                      {i === 'Home' && <Home size={14} />}
                      {i === 'Brain' && <Brain size={14} />}
                      {i === 'Apple' && <Apple size={14} />}
                      {i === 'Activity' && <Activity size={14} />}
                      {i === 'Target' && <Target size={14} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Color</label>
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_PALETTE.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-all border cursor-pointer ${
                        color === c ? 'ring-2 ring-offset-2 ring-brand-500 border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Goal setup */}
            <div className="border-t border-[var(--border-subtle)]/50 pt-4 space-y-4">
              <h4 className="text-[11px] font-bold text-[var(--text-primary)]">Configuració de l'Objectiu</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Tipus de fita</label>
                  <select
                    value={goalType}
                    onChange={e => {
                      const val = e.target.value as HabitGoalType;
                      setGoalType(val);
                      if (val === 'BINARY') {
                        setGoalValue('1');
                        setUnit('vegada');
                      } else if (val === 'DURATION') {
                        setGoalValue('30');
                        setUnit('minuts');
                      }
                    }}
                    className="w-full h-10 px-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all duration-150"
                  >
                    <option value="BINARY">Sí / No</option>
                    <option value="QUANTITY">Quantitat</option>
                    <option value="DURATION">Temps / Durada</option>
                    <option value="COUNTER">Comptador</option>
                    <option value="VALUE">Valor numèric</option>
                  </select>
                </div>

                {goalType !== 'BINARY' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Valor diari</label>
                      <Input
                        type="number"
                        placeholder="Ex: 2000"
                        value={goalValue}
                        onChange={e => setGoalValue(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Unitat de mesura</label>
                      <Input
                        type="text"
                        placeholder="Ex: ml, flexions, pàgines"
                        value={unit}
                        onChange={e => setUnit(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Frequency setup */}
            <div className="border-t border-[var(--border-subtle)]/50 pt-4 space-y-4">
              <h4 className="text-[11px] font-bold text-[var(--text-primary)]">Freqüència del seguiment</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Periodicitat</label>
                  <select
                    value={frequency}
                    onChange={e => setFrequency(e.target.value as HabitFrequency)}
                    className="w-full h-10 px-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all duration-150"
                  >
                    <option value="DAILY">Diari</option>
                    <option value="WORKDAYS">Dies laborables (Dl-Dv)</option>
                    <option value="WEEKENDS">Caps de setmana (Ds-Dg)</option>
                    <option value="SPECIFIC_DAYS">Dies de la setmana</option>
                    <option value="INTERVAL">Cada X dies</option>
                  </select>
                </div>

                {frequency === 'SPECIFIC_DAYS' && (
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Tria els dies</label>
                    <div className="flex gap-1">
                      {['Dg', 'Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds'].map((d, index) => {
                        const active = daysOfWeek.includes(index);
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => toggleDayOfWeek(index)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                              active ? 'bg-brand-500 text-white border-brand-500' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                            }`}
                          >
                            {d}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {frequency === 'INTERVAL' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Interval de dies</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-secondary)]">Cada</span>
                      <Input
                        type="number"
                        className="w-20"
                        value={frequencyInterval}
                        onChange={e => setFrequencyInterval(e.target.value)}
                      />
                      <span className="text-xs text-[var(--text-secondary)]">dies</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Extra Metadata setup */}
            <div className="border-t border-[var(--border-subtle)]/50 pt-4 space-y-4">
              <h4 className="text-[11px] font-bold text-[var(--text-primary)]">Detalls addicionals (Opcional)</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Dificultat</label>
                  <select
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value as 'EASY' | 'MEDIUM' | 'HARD')}
                    className="w-full h-10 px-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all duration-150"
                  >
                    <option value="EASY">Fàcil</option>
                    <option value="MEDIUM">Mitjana</option>
                    <option value="HARD">Difícil</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Temps estimat</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={estimatedMinutes}
                      onChange={e => setEstimatedMinutes(e.target.value)}
                    />
                    <span className="text-xs text-[var(--text-secondary)]">minuts</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Etiquetes (tags)</label>
                  <Input
                    type="text"
                    placeholder="Ex: matí, salut, llar"
                    value={tagsText}
                    onChange={e => setTagsText(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-[var(--border-subtle)] mt-5">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel·la
            </Button>
            <Button type="submit">
              {habit ? 'Desa els canvis' : 'Crea l\'hàbit'}
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
