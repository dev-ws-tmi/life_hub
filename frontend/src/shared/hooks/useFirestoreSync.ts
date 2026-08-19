import { useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSubjectsStore, type Subject, type Topic, type TopicActivity } from '@/shared/stores/useSubjectsStore';
import { useTasksStore, type Task } from '@/shared/stores/useTasksStore';

export function useFirestoreSync() {
  const { userProfile } = useAuth();

  useEffect(() => {
    if (!userProfile?.uid) return;

    const uid = userProfile.uid;

    const qSubjects = query(collection(db, 'subjects'), where('userId', '==', uid));
    const qTopics = query(collection(db, 'topics'), where('userId', '==', uid));
    const qActivities = query(collection(db, 'activities'), where('userId', '==', uid));

    let localSubjects: any[] = [];
    let localTopics: any[] = [];
    let localActivities: any[] = [];

    const assembleAndSync = () => {
      // 1. Sync Subjects Store
      const assembledSubjects: Subject[] = localSubjects.map((subDoc) => {
        const subId = subDoc.id;
        
        // Find topics for this subject
        const topics = localTopics
          .filter((tDoc) => tDoc.subjectId === subId)
          .map((tDoc) => {
            const topicId = tDoc.id;
            
            // Find activities for this topic
            const activities: TopicActivity[] = localActivities
              .filter((aDoc) => aDoc.topicId === topicId)
              .map((aDoc) => ({
                id: aDoc.id,
                name: aDoc.title || aDoc.name || 'Activitat',
                type: aDoc.type || 'TASCA',
                date: aDoc.dueDate || aDoc.date || undefined,
                grade: aDoc.grade !== undefined ? Number(aDoc.grade) : undefined,
                weight: aDoc.weight !== undefined ? Number(aDoc.weight) : 0,
                completed: aDoc.status === 'COMPLETADA' || aDoc.completed === true,
                notes: aDoc.notes || '',
              }));

            return {
              id: topicId,
              name: tDoc.name || 'Tema',
              description: tDoc.description || '',
              weight: tDoc.weight !== undefined ? Number(tDoc.weight) : 0,
              weightMode: tDoc.autoWeight === false ? 'MANUAL' : 'AUTOMATIC',
              status: tDoc.status || 'PENDENT',
              targetGrade: tDoc.targetGrade || 7,
              activities,
              resources: [],
            } as Topic;
          });

        return {
          id: subId,
          userId: subDoc.userId,
          courseId: subDoc.courseId || '',
          name: subDoc.name || '',
          professor: subDoc.teacher || subDoc.professor || '',
          color: subDoc.color || '#3b82f6',
          semester: subDoc.semester || '1',
          academicYear: subDoc.academicYear || '2025-2026',
          currentGrade: subDoc.currentGrade !== undefined ? Number(subDoc.currentGrade) : undefined,
          targetGrade: subDoc.targetGrade || 7,
          isActive: subDoc.status === 'ACTIVA' || subDoc.isActive !== false,
          topics,
          topicDistributionMode: subDoc.topicDistributionMode || 'AUTOMATIC',
          createdAt: subDoc.createdAt || new Date().toISOString(),
          updatedAt: subDoc.updatedAt || new Date().toISOString(),
        } as Subject;
      });

      useSubjectsStore.setState({ subjects: assembledSubjects });

      // 2. Sync Tasks Store
      const mappedTasks: Task[] = localActivities.map((aDoc) => {
        let status: 'PENDENT' | 'EN_PROGRES' | 'COMPLETADA' | 'ARXIVADA' = 'PENDENT';
        if (aDoc.status === 'COMPLETADA' || aDoc.completed === true) {
          status = 'COMPLETADA';
        } else if (aDoc.status === 'EN_PROGRES') {
          status = 'EN_PROGRES';
        } else if (aDoc.status === 'ARXIVADA') {
          status = 'ARXIVADA';
        }

        return {
          id: aDoc.id,
          userId: aDoc.userId,
          subjectId: aDoc.subjectId || undefined,
          title: aDoc.title || aDoc.name || 'Tasca',
          description: aDoc.description || aDoc.notes || '',
          priority: (aDoc.priority || 'NORMAL') as any,
          status,
          dueDate: aDoc.dueDate || aDoc.date || undefined,
          estimatedMinutes: aDoc.estimatedMinutes || 0,
          actualMinutes: aDoc.actualMinutes || 0,
          tags: aDoc.tags || [],
          completedAt: aDoc.completedAt || (status === 'COMPLETADA' ? aDoc.updatedAt || new Date().toISOString() : undefined),
          createdAt: aDoc.createdAt || new Date().toISOString(),
          updatedAt: aDoc.updatedAt || new Date().toISOString(),
        };
      });

      useTasksStore.setState({ tasks: mappedTasks });
    };

    const handleSyncError = (name: string) => (error: any) => {
      if (error.code === 'permission-denied') return;
      console.error(`Error syncing ${name}:`, error);
    };

    const unsubSubjects = onSnapshot(qSubjects, (snapshot) => {
      localSubjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      assembleAndSync();
    }, handleSyncError('subjects'));

    const unsubTopics = onSnapshot(qTopics, (snapshot) => {
      localTopics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      assembleAndSync();
    }, handleSyncError('topics'));

    const unsubActivities = onSnapshot(qActivities, (snapshot) => {
      localActivities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      assembleAndSync();
    }, handleSyncError('activities'));

    return () => {
      unsubSubjects();
      unsubTopics();
      unsubActivities();
    };
  }, [userProfile?.uid]);
}
