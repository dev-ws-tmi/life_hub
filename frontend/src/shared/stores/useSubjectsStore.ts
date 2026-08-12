import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Types ─────────────────────────────────────────────────────────────────────
export type SubjectColor = string;

export const SUBJECT_COLORS: SubjectColor[] = [
  // Fila 1: Vermells, Taronges i Grocs (Warm colors & Light Green)
  '#ef4444', // Vermell
  '#ff7a59', // Coral
  '#f97316', // Taronja
  '#f59e0b', // Amber
  '#eab308', // Groc
  '#a3e635', // Llima clar
  '#84cc16', // Llima
  '#4ade80', // Verd clar
  '#22c55e', // Verd
  '#10b981', // Esmeralda
  // Fila 2: Verds, Teals, Cyans i Blaus (Cool colors)
  '#14b8a6', // Teal
  '#2dd4bf', // Teal clar
  '#06b6d4', // Cyan
  '#38bdf8', // Cyan clar
  '#0ea5e9', // Sky
  '#60a5fa', // Blau clar
  '#3b82f6', // Blau
  '#6366f1', // Indigo
  '#8b5cf6', // Purpura
  '#a855f7', // Violeta
  // Fila 3: Violetes, Roses i Neutres (Purples, Pinks & Neutrals)
  '#c084fc', // Violeta clar
  '#d946ef', // Fúcsia
  '#ec4899', // Rosa
  '#f472b6', // Rosa clar
  '#f43f5e', // Vermell rosa
  '#fb7185', // Rosa suau
  '#78716c', // Pedra (Stone)
  '#64748b', // Slate
  '#475569', // Slate fosc
  '#334155'  // Deep Slate
];

export type TopicStatus = 'PENDENT' | 'EN_PROGRES' | 'COMPLETAT';
export type ActivityType = 'EXAMEN' | 'PRACTICA' | 'PROJECTE' | 'EXERCICI' | 'TASCA';
export type ResourceType = 'PDF' | 'VIDEO' | 'ENLLAÇ' | 'APUNTS' | 'DOCUMENT';
export type DistributionMode = 'AUTOMATIC' | 'MANUAL';

export interface TopicActivity {
  id: string;
  name: string;
  type: ActivityType;
  date?: string;          // ISO Date
  grade?: number;         // 0-10
  weight: number;         // % dins del tema (0-100)
  completed: boolean;
  notes?: string;
}

export interface TopicResource {
  id: string;
  name: string;
  type: ResourceType;
  url: string;
  description?: string;
}

export interface Topic {
  id: string;
  name: string;
  description?: string;
  weight: number;                    // % dins de l'assignatura
  weightMode: DistributionMode;      // Mode de distribució de pes de les activitats
  status: TopicStatus;
  currentGrade?: number;             // Nota mitjana ponderada calculada
  targetGrade: number;               // Nota objectiu (0-10)
  activities: TopicActivity[];
  resources: TopicResource[];
}

export interface Subject {
  id: string;
  userId: string;
  courseId: string; // Ex: DAW1, DAW2, etc.
  name: string;
  code?: string;
  credits?: number; // Opcional ara
  professor?: string;
  color: SubjectColor;
  semester: string;
  academicYear: string;
  currentGrade?: number;
  targetGrade: number;
  weeklyHoursObjective?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  topics: Topic[];
  topicDistributionMode: DistributionMode; // Mode de distribució dels temes
}

export type CreateSubjectInput = Omit<Subject, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'topics' | 'topicDistributionMode'>;

// ── Store ─────────────────────────────────────────────────────────────────────
interface SubjectsState {
  subjects: Subject[];
  addSubject: (userId: string, data: CreateSubjectInput) => Subject;
  updateSubject: (id: string, data: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  toggleActive: (id: string) => void;
  getSubjectById: (id: string) => Subject | undefined;
  getActiveSubjects: () => Subject[];
  
  // Temes
  addTopic: (subjectId: string, name: string, description?: string, targetGrade?: number) => void;
  updateTopic: (subjectId: string, topicId: string, data: Partial<Omit<Topic, 'id' | 'activities' | 'resources'>>) => void;
  deleteTopic: (subjectId: string, topicId: string) => void;
  
  // Activitats
  addActivity: (subjectId: string, topicId: string, activity: Omit<TopicActivity, 'id'>) => void;
  updateActivity: (subjectId: string, topicId: string, activityId: string, data: Partial<TopicActivity>) => void;
  deleteActivity: (subjectId: string, topicId: string, activityId: string) => void;
  
  // Recursos
  addResource: (subjectId: string, topicId: string, resource: Omit<TopicResource, 'id'>) => void;
  deleteResource: (subjectId: string, topicId: string, resourceId: string) => void;
}

// ── Helper per recalcular pesos i notes en cascada ────────────────────────────
function computeSubjectCalculations(subj: Subject): Subject {
  // 1. Recalcular activitats i nota de cada tema
  const updatedTopics = subj.topics.map((topic) => {
    let activities = [...topic.activities];
    
    // Repartir pes si és automàtic
    if (topic.weightMode === 'AUTOMATIC' && activities.length > 0) {
      const uniformWeight = Math.round((100 / activities.length) * 100) / 100;
      activities = activities.map((act) => ({ ...act, weight: uniformWeight }));
    }

    // Calcular nota mitjana ponderada del tema basat en les completades amb nota
    const completedGraded = activities.filter((a) => a.completed && a.grade !== undefined);
    let currentGrade: number | undefined = undefined;

    if (completedGraded.length > 0) {
      const totalWeight = completedGraded.reduce((sum, a) => sum + a.weight, 0);
      if (totalWeight > 0) {
        const weightedSum = completedGraded.reduce((sum, a) => sum + ((a.grade ?? 0) * a.weight), 0);
        currentGrade = Math.round((weightedSum / totalWeight) * 100) / 100;
      }
    }

    // Percentatge de progés/estat automàtic si escau
    let status = topic.status;
    if (activities.length > 0) {
      const completedCount = activities.filter(a => a.completed).length;
      if (completedCount === activities.length) {
        status = 'COMPLETAT';
      } else if (completedCount > 0) {
        status = 'EN_PROGRES';
      } else {
        status = 'PENDENT';
      }
    }

    return {
      ...topic,
      activities,
      currentGrade,
      status,
    };
  });

  // 2. Repartir pes dels temes si és automàtic
  let topicsWithWeights = [...updatedTopics];
  if (subj.topicDistributionMode === 'AUTOMATIC' && topicsWithWeights.length > 0) {
    const uniformWeight = Math.round((100 / topicsWithWeights.length) * 100) / 100;
    topicsWithWeights = topicsWithWeights.map((t) => ({ ...t, weight: uniformWeight }));
  }

  // 3. Calcular nota global de l'assignatura
  const topicsWithGrades = topicsWithWeights.filter((t) => t.currentGrade !== undefined);
  let globalGrade: number | undefined = undefined;

  if (topicsWithGrades.length > 0) {
    const totalWeight = topicsWithGrades.reduce((sum, t) => sum + t.weight, 0);
    if (totalWeight > 0) {
      const weightedSum = topicsWithGrades.reduce((sum, t) => sum + ((t.currentGrade ?? 0) * t.weight), 0);
      globalGrade = Math.round((weightedSum / totalWeight) * 100) / 100;
    }
  }

  return {
    ...subj,
    topics: topicsWithWeights,
    currentGrade: globalGrade !== undefined ? globalGrade : subj.currentGrade,
  };
}

export const useSubjectsStore = create<SubjectsState>()(
  persist(
    (set, get) => ({
      subjects: [],

      addSubject: (userId, data) => {
        const subject: Subject = {
          ...data,
          id: `subj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          topics: [],
          topicDistributionMode: 'AUTOMATIC',
        };
        set((s) => ({ subjects: [...s.subjects, subject] }));
        return subject;
      },

      updateSubject: (id, data) => {
        set((s) => ({
          subjects: s.subjects.map((subj) => {
            if (subj.id === id) {
              const updated = { ...subj, ...data, updatedAt: new Date().toISOString() };
              return computeSubjectCalculations(updated);
            }
            return subj;
          }),
        }));
      },

      deleteSubject: (id) => {
        set((s) => ({ subjects: s.subjects.filter((s) => s.id !== id) }));
      },

      toggleActive: (id) => {
        set((s) => ({
          subjects: s.subjects.map((subj) =>
            subj.id === id ? { ...subj, isActive: !subj.isActive } : subj
          ),
        }));
      },

      getSubjectById: (id) => get().subjects.find((s) => s.id === id),

      getActiveSubjects: () => get().subjects.filter((s) => s.isActive),

      // ── Mètodes dels Temes ──────────────────────────────────────────────────
      addTopic: (subjectId, name, description, targetGrade) => {
        set((s) => ({
          subjects: s.subjects.map((subj) => {
            if (subj.id === subjectId) {
              const newTopic: Topic = {
                id: `topic_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
                name,
                description,
                weight: 0,
                weightMode: 'AUTOMATIC',
                status: 'PENDENT',
                targetGrade: targetGrade || subj.targetGrade,
                activities: [],
                resources: [],
              };
              const updated = {
                ...subj,
                topics: [...subj.topics, newTopic],
                updatedAt: new Date().toISOString(),
              };
              return computeSubjectCalculations(updated);
            }
            return subj;
          }),
        }));
      },

      updateTopic: (subjectId, topicId, data) => {
        set((s) => ({
          subjects: s.subjects.map((subj) => {
            if (subj.id === subjectId) {
              const updatedTopics = subj.topics.map((t) =>
                t.id === topicId ? { ...t, ...data } : t
              );
              const updated = {
                ...subj,
                topics: updatedTopics,
                updatedAt: new Date().toISOString(),
              };
              return computeSubjectCalculations(updated);
            }
            return subj;
          }),
        }));
      },

      deleteTopic: (subjectId, topicId) => {
        set((s) => ({
          subjects: s.subjects.map((subj) => {
            if (subj.id === subjectId) {
              const updated = {
                ...subj,
                topics: subj.topics.filter((t) => t.id !== topicId),
                updatedAt: new Date().toISOString(),
              };
              return computeSubjectCalculations(updated);
            }
            return subj;
          }),
        }));
      },

      // ── Mètodes de les Activitats ───────────────────────────────────────────
      addActivity: (subjectId, topicId, activity) => {
        set((s) => ({
          subjects: s.subjects.map((subj) => {
            if (subj.id === subjectId) {
              const updatedTopics = subj.topics.map((topic) => {
                if (topic.id === topicId) {
                  const newAct: TopicActivity = {
                    ...activity,
                    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
                    completed: activity.completed ?? false,
                  };
                  return {
                    ...topic,
                    activities: [...topic.activities, newAct],
                  };
                }
                return topic;
              });
              const updated = {
                ...subj,
                topics: updatedTopics,
                updatedAt: new Date().toISOString(),
              };
              return computeSubjectCalculations(updated);
            }
            return subj;
          }),
        }));
      },

      updateActivity: (subjectId, topicId, activityId, data) => {
        set((s) => ({
          subjects: s.subjects.map((subj) => {
            if (subj.id === subjectId) {
              const updatedTopics = subj.topics.map((topic) => {
                if (topic.id === topicId) {
                  const updatedActs = topic.activities.map((a) =>
                    a.id === activityId ? { ...a, ...data } : a
                  );
                  return {
                    ...topic,
                    activities: updatedActs,
                  };
                }
                return topic;
              });
              const updated = {
                ...subj,
                topics: updatedTopics,
                updatedAt: new Date().toISOString(),
              };
              return computeSubjectCalculations(updated);
            }
            return subj;
          }),
        }));
      },

      deleteActivity: (subjectId, topicId, activityId) => {
        set((s) => ({
          subjects: s.subjects.map((subj) => {
            if (subj.id === subjectId) {
              const updatedTopics = subj.topics.map((topic) => {
                if (topic.id === topicId) {
                  return {
                    ...topic,
                    activities: topic.activities.filter((a) => a.id !== activityId),
                  };
                }
                return topic;
              });
              const updated = {
                ...subj,
                topics: updatedTopics,
                updatedAt: new Date().toISOString(),
              };
              return computeSubjectCalculations(updated);
            }
            return subj;
          }),
        }));
      },

      // ── Mètodes dels Recursos ────────────────────────────────────────────────
      addResource: (subjectId, topicId, resource) => {
        set((s) => ({
          subjects: s.subjects.map((subj) => {
            if (subj.id === subjectId) {
              const updatedTopics = subj.topics.map((topic) => {
                if (topic.id === topicId) {
                  const newRes: TopicResource = {
                    ...resource,
                    id: `res_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
                  };
                  return {
                    ...topic,
                    resources: [...topic.resources, newRes],
                  };
                }
                return topic;
              });
              return {
                ...subj,
                topics: updatedTopics,
                updatedAt: new Date().toISOString(),
              };
            }
            return subj;
          }),
        }));
      },

      deleteResource: (subjectId, topicId, resourceId) => {
        set((s) => ({
          subjects: s.subjects.map((subj) => {
            if (subj.id === subjectId) {
              const updatedTopics = subj.topics.map((topic) => {
                if (topic.id === topicId) {
                  return {
                    ...topic,
                    resources: topic.resources.filter((r) => r.id !== resourceId),
                  };
                }
                return topic;
              });
              return {
                ...subj,
                topics: updatedTopics,
                updatedAt: new Date().toISOString(),
              };
            }
            return subj;
          }),
        }));
      },
    }),
    { name: 'estudi360-subjects' }
  )
);
