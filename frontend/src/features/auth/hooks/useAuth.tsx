import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '@/shared/lib/firebase';

const DEFAULT_PROFILE = {
  uid: '',
  email: '',
  displayName: '',
  photoURL: null as string | null,
  role: 'USER' as const,
  plan: 'FREE' as const,
  university: '',
  degree: '',
  weeklyStudyHours: 0,
  weeklyObjective: 20,
  theme: 'system' as 'light' | 'dark' | 'system',
  accentColor: 'violet' as 'violet' | 'blue' | 'emerald' | 'amber' | 'rose',
  language: 'ca' as const,
  notifications: { push: true, email: true, inApp: true },
  currentCourse: 'DAW1',
  coursesList: ['DAW1', 'DAW2'],
  coursesConfig: {} as Record<string, { university: string; degree: string; weeklyObjective: number }>,
  moodleUrl: '',
  autoSync: true,
  normalizeTasks: true,
  detectExams: true,
  defaultWeights: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),
};

type UserProfile = typeof DEFAULT_PROFILE;

interface AuthContextValue {
  user: { uid: string; email: string | null; displayName: string | null } | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  clearError: () => void;
  setCurrentCourse: (course: string) => void;
  addCourse: (course: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Escolta els canvis d'estat d'autenticació de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setLoading(true);
      if (fUser) {
        setFirebaseUser(fUser);
        try {
          const userDocRef = doc(db, 'users', fUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          } else {
            // Crea un perfil nou a Firestore si no existeix
            const newProfile: UserProfile = {
              ...DEFAULT_PROFILE,
              uid: fUser.uid,
              email: fUser.email || '',
              displayName: fUser.displayName || fUser.email?.split('@')[0] || 'Estudiant',
              photoURL: fUser.photoURL || null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
          }
        } catch (err: any) {
          console.error("Error carregant el perfil de Firestore:", err);
          setError(err.message || "Error carregant dades d'usuari");
        }
      } else {
        setFirebaseUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Aplica el color d'accent dinàmicament
  useEffect(() => {
    if (!userProfile) return;
    const accent = userProfile.accentColor || 'violet';
    const root = document.documentElement;
    
    let hue = '290';
    let chroma = '0.22';
    
    switch (accent) {
      case 'blue':
        hue = '220';
        chroma = '0.16';
        break;
      case 'emerald':
        hue = '160';
        chroma = '0.16';
        break;
      case 'amber':
        hue = '80';
        chroma = '0.16';
        break;
      case 'rose':
        hue = '25';
        chroma = '0.22';
        break;
      case 'violet':
      default:
        hue = '290';
        chroma = '0.22';
        break;
    }
    
    root.style.setProperty('--brand-hue', hue);
    root.style.setProperty('--brand-chroma', chroma);
  }, [userProfile?.accentColor]);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // Crea el perfil immediatament a Firestore
      const userDocRef = doc(db, 'users', cred.user.uid);
      const newProfile: UserProfile = {
        ...DEFAULT_PROFILE,
        uid: cred.user.uid,
        email,
        displayName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, newProfile);
      setUserProfile(newProfile);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!firebaseUser) return;
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const updatedData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(userDocRef, updatedData);
      setUserProfile((prev) => prev ? { ...prev, ...updatedData } : null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const clearError = () => setError(null);

  const setCurrentCourse = (course: string) => {
    updateProfile({ currentCourse: course }).catch((err) => {
      console.error("Error actualitzant curs:", err);
    });
  };

  const addCourse = (course: string) => {
    if (!userProfile) return;
    const currentList = userProfile.coursesList || [];
    if (!currentList.includes(course)) {
      updateProfile({
        coursesList: [...currentList, course],
        currentCourse: course,
      }).catch((err) => {
        console.error("Error afegint curs:", err);
      });
    }
  };

  const user = firebaseUser
    ? { uid: firebaseUser.uid, email: firebaseUser.email, displayName: firebaseUser.displayName }
    : null;

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      error,
      login,
      loginWithGoogle,
      register,
      logout,
      resetPassword,
      updateProfile,
      clearError,
      setCurrentCourse,
      addCourse,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth ha de ser usat dins d\'AuthProvider');
  return ctx;
}
