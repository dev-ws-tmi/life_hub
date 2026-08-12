import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Combina classes CSS amb suport per TailwindCSS merging */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formata una data en català */
export function formatDate(date: Date | null | undefined, format: 'short' | 'long' | 'relative' = 'short'): string {
  if (!date) return '—';

  const now = new Date();
  const d = new Date(date);

  if (format === 'relative') {
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Avui';
    if (days === 1) return 'Ahir';
    if (days === -1) return 'Demà';
    if (days < 0) return `D'aquí ${Math.abs(days)} dies`;
    if (days < 7) return `Fa ${days} dies`;
    if (days < 30) return `Fa ${Math.floor(days / 7)} setmanes`;
    return `Fa ${Math.floor(days / 30)} mesos`;
  }

  return d.toLocaleDateString('ca-ES', {
    day: 'numeric',
    month: format === 'long' ? 'long' : 'short',
    year: format === 'long' ? 'numeric' : undefined,
  });
}

/** Formata minuts a "Xh Ym" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Calcula la nota ponderada d'una assignatura */
export function calcWeightedAverage(
  notes: Array<{ grade: number; maxGrade: number; weight: number }>
): number {
  const totalWeight = notes.reduce((sum, n) => sum + n.weight, 0);
  if (totalWeight === 0) return 0;
  const weighted = notes.reduce((sum, n) => sum + (n.grade / n.maxGrade) * 10 * n.weight, 0);
  return Math.round((weighted / totalWeight) * 100) / 100;
}

/** Trunca text a una longitud màxima */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/** Genera un color d'avatar basat en les inicials */
export function getAvatarColor(name: string): string {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
    '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#3b82f6', '#06b6d4',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

/** Obté les inicials d'un nom */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

/** Calcula dies restants fins a una data */
export function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/** Debounce function */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

/** Genera un slug amigable des d'un text */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // Elimina accents
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-') // Espais a guionets
    .replace(/[^\w-]+/g, '') // Caràcters especials fora
    .replace(/--+/g, '-');
}

