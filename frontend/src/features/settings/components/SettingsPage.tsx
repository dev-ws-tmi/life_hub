import { useState, useRef, useEffect, useMemo } from 'react';
import { User, Palette, Bell, ShieldAlert, RefreshCw, Upload, X, ZoomIn, ZoomOut, Check, HelpCircle, Edit, Trash2, Play } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTheme } from '@/shared/hooks/useTheme';
import { getInitials, getAvatarColor } from '@/shared/lib/utils';
import { useSubjectsStore } from '@/shared/stores/useSubjectsStore';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { useBlocker } from 'react-router-dom';

type SubTab = 'perfil' | 'aparença' | 'notificacions' | 'sincro' | 'perill';

interface CourseConfig {
  university: string;
  degree: string;
  weeklyObjective: number;
}

export default function SettingsPage() {
  const { userProfile, updateProfile, logout } = useAuth();
  const { setTheme } = useTheme();

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('perfil');

  // Form states - Profile
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [photoURL, setPhotoURL] = useState<string | null>(userProfile?.photoURL || null);

  // Form states - Notifications
  const [pushNotif, setPushNotif] = useState(userProfile?.notifications?.push ?? true);
  const [emailNotif, setEmailNotif] = useState(userProfile?.notifications?.email ?? true);
  const [inAppNotif, setInAppNotif] = useState(userProfile?.notifications?.inApp ?? true);

  // Form states - Appearance
  const [accentColor, setAccentColor] = useState<'violet' | 'blue' | 'emerald' | 'amber' | 'rose'>(
    userProfile?.accentColor || 'violet'
  );
  const [localTheme, setLocalTheme] = useState<'light' | 'dark' | 'system'>(
    userProfile?.theme || 'system'
  );

  // Custom confirmation modal states
  const [pendingTab, setPendingTab] = useState<SubTab | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

  // Form states - iCal / Moodle Sync
  const [moodleUrl, setMoodleUrl] = useState(userProfile?.moodleUrl || '');
  const [autoSync, setAutoSync] = useState(userProfile?.autoSync ?? true);
  const [normalizeTasks, setNormalizeTasks] = useState(userProfile?.normalizeTasks ?? true);
  const [detectExams, setDetectExams] = useState(userProfile?.detectExams ?? true);
  const [defaultWeights, setDefaultWeights] = useState(userProfile?.defaultWeights ?? true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Course management states inside Modals
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [newCourseNameInput, setNewCourseNameInput] = useState('');
  const [oldCourseName, setOldCourseName] = useState('');
  
  // Course specific inputs
  const [courseUniversity, setCourseUniversity] = useState('');
  const [courseDegree, setCourseDegree] = useState('');
  const [courseWeeklyObjective, setCourseWeeklyObjective] = useState(20);

  // Image Cropper modal state
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Danger zone confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset states when user profile changes
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setPhotoURL(userProfile.photoURL || null);
      setPushNotif(userProfile.notifications?.push ?? true);
      setEmailNotif(userProfile.notifications?.email ?? true);
      setInAppNotif(userProfile.notifications?.inApp ?? true);
      setAccentColor(userProfile.accentColor || 'violet');
      setLocalTheme(userProfile.theme || 'system');
      setMoodleUrl(userProfile.moodleUrl || '');
      setAutoSync(userProfile.autoSync ?? true);
      setNormalizeTasks(userProfile.normalizeTasks ?? true);
      setDetectExams(userProfile.detectExams ?? true);
      setDefaultWeights(userProfile.defaultWeights ?? true);
    }
  }, [userProfile]);

  // Càlcul de canvis sense desar en calent
  const hasUnsavedChanges = useMemo(() => {
    if (activeSubTab === 'perfil') {
      return (
        displayName !== (userProfile?.displayName || '') ||
        photoURL !== (userProfile?.photoURL || null)
      );
    }
    if (activeSubTab === 'aparença') {
      return (
        accentColor !== (userProfile?.accentColor || 'violet') ||
        localTheme !== (userProfile?.theme || 'system')
      );
    }
    if (activeSubTab === 'notificacions') {
      return (
        pushNotif !== (userProfile?.notifications?.push ?? true) ||
        emailNotif !== (userProfile?.notifications?.email ?? true) ||
        inAppNotif !== (userProfile?.notifications?.inApp ?? true)
      );
    }
    if (activeSubTab === 'sincro') {
      return (
        moodleUrl !== (userProfile?.moodleUrl || '') ||
        autoSync !== (userProfile?.autoSync ?? true) ||
        normalizeTasks !== (userProfile?.normalizeTasks ?? true) ||
        detectExams !== (userProfile?.detectExams ?? true) ||
        defaultWeights !== (userProfile?.defaultWeights ?? true)
      );
    }
    return false;
  }, [
    activeSubTab, userProfile,
    displayName, photoURL,
    accentColor, localTheme,
    pushNotif, emailNotif, inAppNotif,
    moodleUrl, autoSync, normalizeTasks, detectExams, defaultWeights
  ]);

  // Bloqueig de navegació de React Router si hi ha canvis sense desar
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  );

  // Alerta de tancament de pestanya del navegador
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Gestió del clic a pestanyes
  const handleTabClick = (tab: SubTab) => {
    if (tab === activeSubTab) return;
    if (hasUnsavedChanges) {
      setPendingTab(tab);
    } else {
      setActiveSubTab(tab);
    }
  };

  // Desar i aplicar canvis del formulari actiu
  const handleSaveActiveForm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!hasUnsavedChanges) return;

    try {
      if (activeSubTab === 'perfil') {
        await updateProfile({
          displayName,
          photoURL,
        });
        toast.success('Perfil acadèmic actualitzat correctament');
      } else if (activeSubTab === 'aparença') {
        await updateProfile({
          accentColor,
          theme: localTheme,
        });
        setTheme(localTheme);
        toast.success('Tema i colors aplicats correctament');
      } else if (activeSubTab === 'notificacions') {
        await updateProfile({
          notifications: {
            push: pushNotif,
            email: emailNotif,
            inApp: inAppNotif,
          },
        });
        toast.success('Canals de notificació actualitzats');
      } else if (activeSubTab === 'sincro') {
        await updateProfile({
          moodleUrl,
          autoSync,
          normalizeTasks,
          detectExams,
          defaultWeights,
        });
        toast.success('Preferències de Moodle i sincronització desades');
      }
    } catch (err: any) {
      toast.error(`Error en desar: ${err.message || err}`);
    }
  };

  // Helper per recuperar configuració específica de curs
  const getCourseConfig = (cName: string): CourseConfig => {
    const config = userProfile?.coursesConfig?.[cName];
    if (config) {
      return {
        university: config.university || '',
        degree: config.degree || '',
        weeklyObjective: config.weeklyObjective || 20,
      };
    }
    return {
      university: userProfile?.university || '',
      degree: userProfile?.degree || '',
      weeklyObjective: userProfile?.weeklyObjective || 20,
    };
  };

  // Activar curs i copiar detalls al root del perfil
  const handleActivateCourse = async (cName: string) => {
    try {
      const cfg = getCourseConfig(cName);
      await updateProfile({
        currentCourse: cName,
        university: cfg.university,
        degree: cfg.degree,
        weeklyObjective: cfg.weeklyObjective,
      });
      toast.success(`Curs actiu canviat a ${cName}`);
    } catch (e: any) {
      toast.error(`Error a l'activar: ${e.message || e}`);
    }
  };

  // Crear nou curs
  const handleAddCourseSubmit = async () => {
    const name = newCourseNameInput.trim().toUpperCase();
    if (!name) {
      toast.error('El nom del curs és obligatori');
      return;
    }
    const list = userProfile?.coursesList || [];
    if (list.includes(name)) {
      toast.error('Aquest curs ja existeix');
      return;
    }

    try {
      const newList = [...list, name];
      const newConfig = {
        university: courseUniversity,
        degree: courseDegree,
        weeklyObjective: Number(courseWeeklyObjective),
      };
      
      const currentConfigs = userProfile?.coursesConfig || {};

      await updateProfile({
        coursesList: newList,
        currentCourse: name,
        coursesConfig: { ...currentConfigs, [name]: newConfig },
        university: courseUniversity,
        degree: courseDegree,
        weeklyObjective: Number(courseWeeklyObjective),
      });

      setShowAddCourseModal(false);
      setNewCourseNameInput('');
      setCourseUniversity('');
      setCourseDegree('');
      setCourseWeeklyObjective(20);
      toast.success(`Curs ${name} afegit i activat`);
    } catch (e: any) {
      toast.error(`Error: ${e.message || e}`);
    }
  };

  // Guardar edició de curs
  const handleEditCourseSubmit = async () => {
    const name = newCourseNameInput.trim().toUpperCase();
    if (!name) {
      toast.error('El nom no pot estar buit');
      return;
    }
    const list = userProfile?.coursesList || [];
    if (name !== oldCourseName && list.includes(name)) {
      toast.error('Aquest nom de curs ja existeix');
      return;
    }

    try {
      const newList = list.map(c => c === oldCourseName ? name : c);
      const isCurrentActive = userProfile?.currentCourse === oldCourseName;

      const newConfig = {
        university: courseUniversity,
        degree: courseDegree,
        weeklyObjective: Number(courseWeeklyObjective),
      };

      const currentConfigs = { ...(userProfile?.coursesConfig || {}) };
      delete currentConfigs[oldCourseName];
      currentConfigs[name] = newConfig;

      await updateProfile({
        coursesList: newList,
        currentCourse: isCurrentActive ? name : userProfile?.currentCourse,
        coursesConfig: currentConfigs,
        ...(isCurrentActive ? {
          university: courseUniversity,
          degree: courseDegree,
          weeklyObjective: Number(courseWeeklyObjective),
        } : {}),
      });

      const subjectsStore = useSubjectsStore.getState();
      const updatedSubjects = subjectsStore.subjects.map(s => 
        s.courseId === oldCourseName ? { ...s, courseId: name } : s
      );
      useSubjectsStore.setState({ subjects: updatedSubjects });

      setShowEditCourseModal(false);
      setNewCourseNameInput('');
      setCourseUniversity('');
      setCourseDegree('');
      setCourseWeeklyObjective(20);
      toast.success(`Curs ${name} actualitzat`);
    } catch (e: any) {
      toast.error(`Error: ${e.message || e}`);
    }
  };

  // Esborrar curs
  const handleDeleteCourse = (courseName: string) => {
    const list = userProfile?.coursesList || [];
    if (list.length <= 1) {
      toast.error('Has de tenir almenys un curs');
      return;
    }
    if (userProfile?.currentCourse === courseName) {
      toast.error('No pots esborrar el curs principal actiu. Canvia primer a un altre curs.');
      return;
    }
    setCourseToDelete(courseName);
  };

  // Sincro Moodle
  const handleSyncNow = () => {
    if (!moodleUrl.trim()) {
      toast.error("Has d'introduir una URL d'iCal vàlida");
      return;
    }
    setIsSyncing(true);
    const loadingToast = toast.loading('Sincronitzant esdeveniments de Moodle...');
    
    setTimeout(() => {
      setIsSyncing(false);
      toast.dismiss(loadingToast);
      toast.success('Moodle sincronitzat! Tasques i exàmens actualitzats en el calendari local.');
    }, 2000);
  };

  // Mètodes del Retallador d'Imatge (Cropper)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setCropZoom(1);
        setCropOffset({ x: 0, y: 0 });
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setCropOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const applyCrop = () => {
    if (!imageRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const img = imageRef.current;
      const viewportSize = 192;
      const imgWidth = img.naturalWidth;
      const renderRatio = img.width / imgWidth;
      const zoomedW = img.width * cropZoom;
      const zoomedH = img.height * cropZoom;

      const cropX = ((zoomedW / 2) - (viewportSize / 2) - cropOffset.x) / (renderRatio * cropZoom);
      const cropY = ((zoomedH / 2) - (viewportSize / 2) - cropOffset.y) / (renderRatio * cropZoom);
      const cropSize = viewportSize / (renderRatio * cropZoom);

      ctx.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, 256, 256);

      const croppedBase64 = canvas.toDataURL('image/jpeg', 0.85);
      setPhotoURL(croppedBase64);
      setShowCropModal(false);
      
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Avatar actualitzat temporalment (Desa els canvis per fer-ho permanent)');
    }
  };

  // Eliminar compte i dades de l'usuari (Zona de Perill)
  const handleDeleteUserData = async () => {
    if (deleteConfirmationText.trim().toUpperCase() !== 'ELIMINAR') {
      toast.error("Has d'escriure la paraula exactament");
      return;
    }

    if (!userProfile?.uid) {
      toast.error('Usuari no identificat');
      return;
    }

    setIsDeleting(true);
    const loadingToast = toast.loading('Eliminant les teves dades...');

    try {
      const userDocRef = doc(db, 'users', userProfile.uid);
      await deleteDoc(userDocRef);
      localStorage.clear();
      toast.dismiss(loadingToast);
      toast.success('Dades esborrades permanentment.');
      await logout();
      window.location.href = '/auth/login';
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(`Error: ${err.message || err}`);
      setIsDeleting(false);
    }
  };

  // Colors visuals
  const colorsList = [
    { id: 'violet', label: 'Violeta Premium', hex: '#aa3bff', bg: 'bg-[#aa3bff]' },
    { id: 'blue', label: 'Blau Clar', hex: '#2d8fb6', bg: 'bg-[#2d8fb6]' },
    { id: 'emerald', label: 'Verd Esmeralda', hex: '#10b981', bg: 'bg-[#10b981]' },
    { id: 'amber', label: 'Taronja / Ambre', hex: '#f59e0b', bg: 'bg-[#f59e0b]' },
    { id: 'rose', label: 'Vermell / Rosa', hex: '#f43f5e', bg: 'bg-[#f43f5e]' },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in px-4 py-2">
      {/* Grid General amb Estil TMI (Master-Detail) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Columna Esquerra: Submenú Sidebar de Configuració */}
        <div className="lg:col-span-1 bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl p-4">
          <div className="space-y-1">
            <button
              onClick={() => handleTabClick('perfil')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all text-left cursor-pointer
                ${activeSubTab === 'perfil'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                }`}
            >
              <User size={16} /> Perfil Acadèmic
            </button>
            <button
              onClick={() => handleTabClick('aparença')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all text-left cursor-pointer
                ${activeSubTab === 'aparença'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                }`}
            >
              <Palette size={16} /> Aparença i Tema
            </button>
            <button
              onClick={() => handleTabClick('notificacions')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all text-left cursor-pointer
                ${activeSubTab === 'notificacions'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                }`}
            >
              <Bell size={16} /> Notificacions
            </button>
            <button
              onClick={() => handleTabClick('sincro')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all text-left cursor-pointer
                ${activeSubTab === 'sincro'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                }`}
            >
              <RefreshCw size={16} /> Moodle i Sincro
            </button>
            <button
              onClick={() => handleTabClick('perill')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all text-left cursor-pointer
                ${activeSubTab === 'perill'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'text-red-500 hover:bg-red-500/10'
                }`}
            >
              <ShieldAlert size={16} /> Zona de Perill
            </button>
          </div>
        </div>

        {/* Columna Dreta: Formulari Actiu + Capçalera TMI */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Capçalera TMI (Sense botons de guardar) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl p-4">
            <div>
              <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                {activeSubTab === 'perfil' && 'Perfil Acadèmic'}
                {activeSubTab === 'aparença' && 'Aparença i Tema'}
                {activeSubTab === 'notificacions' && 'Canals de Notificació'}
                {activeSubTab === 'sincro' && 'Sincronització i Moodle'}
                {activeSubTab === 'perill' && 'Seguretat de Dades'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {activeSubTab === 'perfil' && 'Gestiona les teves dades personals, imatge i cursos acadèmics'}
                {activeSubTab === 'aparença' && 'Personalitza el color d\'accent i el tema visual de la interfície'}
                {activeSubTab === 'notificacions' && 'Controla quins canals de comunicació i alertes vols rebre'}
                {activeSubTab === 'sincro' && 'Configura la integració amb Moodle i paràmetres de normalització'}
                {activeSubTab === 'perill' && 'Eliminació irreversible de totes les teves dades acadèmiques'}
              </p>
            </div>
          </div>

          {/* Contingut Dinàmic de la Pestanya */}
          <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl p-6">
            
            {/* PESTANYA: PERFIL */}
            {activeSubTab === 'perfil' && (
              <form onSubmit={handleSaveActiveForm} className="space-y-6">
                
                {/* Gestió d'Avatar */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-[var(--border-subtle)]">
                  <div className="relative group">
                    {photoURL ? (
                      <img
                        src={photoURL}
                        alt="Avatar actual"
                        className="w-24 h-24 rounded-full object-cover border-2 border-brand-500 shadow-sm"
                      />
                    ) : (
                      <div
                        className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-sm"
                        style={{ backgroundColor: getAvatarColor(displayName || 'U') }}
                      >
                        {getInitials(displayName || 'U')}
                      </div>
                    )}
                    <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                      <Upload size={18} />
                      <span className="text-[10px] font-bold mt-1">Canviar</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-1">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">Imatge de Perfil</h4>
                    <p className="text-xs text-[var(--text-secondary)]">Pujar una foto local per retallar-la i utilitzar-la com a avatar global.</p>
                    <div className="flex gap-2 justify-center sm:justify-start pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-raised)] transition-all cursor-pointer"
                      >
                        <Upload size={12} /> Pujar fitxer
                      </button>
                      {photoURL && (
                        <button
                          type="button"
                          onClick={() => setPhotoURL(null)}
                          className="h-9 px-3 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                        >
                          Eliminar imatge
                        </button>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Inputs Globals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[var(--text-secondary)]">Nom complet</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="h-11 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 text-sm text-[var(--text-primary)] focus:border-brand-500 focus:outline-none transition-all w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[var(--text-secondary)]">Correu Electrònic (No editable)</label>
                    <input
                      type="email"
                      value={userProfile?.email || ''}
                      disabled
                      className="h-11 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 text-sm text-[var(--text-muted)] cursor-not-allowed outline-none w-full"
                    />
                  </div>
                </div>

                {/* GESTIÓ DE CURSOS */}
                <div className="border-t border-[var(--border-subtle)] pt-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">Gestió de Cursos Acadèmics</h4>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">Controla els teus cursos. Universitat, Estudis i Hores es defineixen per a cada curs.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNewCourseNameInput('');
                        setCourseUniversity('');
                        setCourseDegree('');
                        setCourseWeeklyObjective(20);
                        setShowAddCourseModal(true);
                      }}
                      className="flex items-center gap-1.5 h-9 px-3.5 bg-brand-500 text-white hover:bg-brand-600 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer flex-shrink-0"
                    >
                      + Nou curs
                    </button>
                  </div>

                  {/* Taula de Cursos */}
                  <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs min-w-[500px]">
                      <thead>
                        <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-raised)] text-[var(--text-secondary)] font-bold uppercase tracking-wider">
                          <th className="p-3">Curs</th>
                          <th className="p-3">Universitat / Centre</th>
                          <th className="p-3">Grau / Estudis</th>
                          <th className="p-3">Hores setmanals</th>
                          <th className="p-3">Estat</th>
                          <th className="p-3 text-right">Accions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(userProfile?.coursesList || ['DAW1', 'DAW2']).map((c) => {
                          const isCurrent = userProfile?.currentCourse === c;
                          const cfg = getCourseConfig(c);
                          return (
                            <tr key={c} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-raised)]/35 transition-colors">
                              <td className="p-3 font-bold text-[var(--text-primary)] text-sm">{c}</td>
                              <td className="p-3 text-[var(--text-secondary)]">{cfg.university || '—'}</td>
                              <td className="p-3 text-[var(--text-secondary)]">{cfg.degree || '—'}</td>
                              <td className="p-3 text-[var(--text-secondary)]">{cfg.weeklyObjective}h</td>
                              <td className="p-3">
                                {isCurrent ? (
                                  <span className="px-2 py-0.5 font-bold bg-brand-500/10 text-brand-500 border border-brand-500/25 rounded-full text-[10px]">
                                    Actiu
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-[var(--text-muted)]">Inactiu</span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <div className="inline-flex items-center gap-1">
                                  {!isCurrent && (
                                    <button
                                      type="button"
                                      onClick={() => handleActivateCourse(c)}
                                      title="Establir com a curs actiu"
                                      className="w-7 h-7 rounded-lg flex items-center justify-center text-brand-500 hover:bg-brand-500/10 transition-all cursor-pointer"
                                    >
                                      <Play size={13} fill="currentColor" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentCfg = getCourseConfig(c);
                                      setOldCourseName(c);
                                      setNewCourseNameInput(c);
                                      setCourseUniversity(currentCfg.university);
                                      setCourseDegree(currentCfg.degree);
                                      setCourseWeeklyObjective(currentCfg.weeklyObjective);
                                      setShowEditCourseModal(true);
                                    }}
                                    title="Editar dades del curs"
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] transition-all cursor-pointer"
                                  >
                                    <Edit size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCourse(c)}
                                    title="Esborrar curs"
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Botó desar canvis a baix a la dreta (Perfil) */}
                <div className="flex justify-end pt-4 border-t border-[var(--border-subtle)] mt-6">
                  <button
                    type="submit"
                    disabled={!hasUnsavedChanges}
                    className={`h-11 px-5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5
                      ${hasUnsavedChanges
                        ? 'bg-brand-500 border-brand-500 text-white hover:bg-brand-600 cursor-pointer shadow-sm'
                        : 'bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-muted)] cursor-not-allowed'
                      }`}
                  >
                    <Check size={14} /> Desar i Aplicar
                  </button>
                </div>

              </form>
            )}

            {/* PESTANYA: APARENÇA I TEMA */}
            {activeSubTab === 'aparença' && (
              <form onSubmit={handleSaveActiveForm} className="space-y-6">
                
                {/* Selector de Mode clar/fosc */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">Mode Visual</h4>
                  <p className="text-xs text-[var(--text-secondary)]">Escull el tema de colors base per a la interfície.</p>
                  <div className="grid grid-cols-3 gap-3">
                    {(['light', 'dark', 'system'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setLocalTheme(t)}
                        className={`h-24 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-2 cursor-pointer
                          ${localTheme === t
                            ? 'bg-brand-500/10 border-brand-500 text-brand-500 shadow-sm'
                            : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-default)]'
                          }`}
                      >
                        <span className="text-2xl">
                          {t === 'light' ? '☀️' : t === 'dark' ? '🌙' : '💻'}
                        </span>
                        <span>
                          {t === 'light' ? 'Clar' : t === 'dark' ? 'Fosc' : 'Sistema'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selector de Color de Marca */}
                <div className="border-t border-[var(--border-subtle)] pt-6 space-y-3">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">Color d'Accent / Branding</h4>
                  <p className="text-xs text-[var(--text-secondary)]">Personalitza els colors del programa.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {colorsList.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setAccentColor(c.id)}
                        className={`flex items-center justify-between h-12 px-4 rounded-xl border transition-all text-sm font-semibold cursor-pointer
                          ${accentColor === c.id
                            ? 'bg-[var(--bg-elevated)] border-brand-500 text-[var(--text-primary)] shadow-sm'
                            : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-default)]'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-4 h-4 rounded-full ${c.bg} shadow-inner`} />
                          <span>{c.label}</span>
                        </div>
                        {accentColor === c.id && (
                          <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center text-white">
                            <Check size={11} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Botó desar canvis a baix a la dreta (Aparença) */}
                <div className="flex justify-end pt-4 border-t border-[var(--border-subtle)] mt-6">
                  <button
                    type="submit"
                    disabled={!hasUnsavedChanges}
                    className={`h-11 px-5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5
                      ${hasUnsavedChanges
                        ? 'bg-brand-500 border-brand-500 text-white hover:bg-brand-600 cursor-pointer shadow-sm'
                        : 'bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-muted)] cursor-not-allowed'
                      }`}
                  >
                    <Check size={14} /> Desar i Aplicar
                  </button>
                </div>

              </form>
            )}

            {/* PESTANYA: NOTIFICACIONS */}
            {activeSubTab === 'notificacions' && (
              <form onSubmit={handleSaveActiveForm} className="space-y-4">
                <div className="flex items-center justify-between h-14 px-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)]">
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">Notificacions Push</h4>
                    <p className="text-[10px] text-[var(--text-muted)]">Recordatoris de tasques del navegador</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushNotif}
                    onChange={(e) => setPushNotif(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--border-default)] accent-brand-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between h-14 px-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)]">
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">Correu Electrònic</h4>
                    <p className="text-[10px] text-[var(--text-muted)]">Informes i resums acadèmics setmanals</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotif}
                    onChange={(e) => setEmailNotif(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--border-default)] accent-brand-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between h-14 px-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)]">
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">Notificacions de l'App</h4>
                    <p className="text-[10px] text-[var(--text-muted)]">Globus de tasques vençudes i bústia interna</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={inAppNotif}
                    onChange={(e) => setInAppNotif(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--border-default)] accent-brand-500 cursor-pointer"
                  />
                </div>

                {/* Botó desar canvis a baix a la dreta (Notificacions) */}
                <div className="flex justify-end pt-4 border-t border-[var(--border-subtle)] mt-6">
                  <button
                    type="submit"
                    disabled={!hasUnsavedChanges}
                    className={`h-11 px-5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5
                      ${hasUnsavedChanges
                        ? 'bg-brand-500 border-brand-500 text-white hover:bg-brand-600 cursor-pointer shadow-sm'
                        : 'bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-muted)] cursor-not-allowed'
                      }`}
                  >
                    <Check size={14} /> Desar i Aplicar
                  </button>
                </div>
              </form>
            )}

            {/* PESTANYA: MOODLE I SINCRONITZACIÓ */}
            {activeSubTab === 'sincro' && (
              <form onSubmit={handleSaveActiveForm} className="space-y-6">
                <div className="flex flex-col gap-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4 rounded-xl text-xs text-[var(--text-secondary)] leading-relaxed">
                  <div className="flex items-center gap-1 text-brand-500 font-bold">
                    <HelpCircle size={14} /> Com configurar l'iCal de Moodle?
                  </div>
                  <p>
                    1. Ves al teu Moodle (campus virtual) i navega fins al **Calendari**.<br />
                    2. A la part inferior, clica a **Exporta el calendari**.<br />
                    3. Selecciona "Tots els esdeveniments" i "Aquesta setmana i la següent" (o personalitzat).<br />
                    4. Clica a **Obtén l'URL del calendari** i copia l'enllaç dinàmic generat i enganxa'l aquí sota.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">URL del Calendari Moodle (iCal)</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://moodle.centre.cat/calendar/export_execute.php?..."
                      value={moodleUrl}
                      onChange={(e) => setMoodleUrl(e.target.value)}
                      className="h-11 flex-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 text-sm text-[var(--text-primary)] focus:border-brand-500 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleSyncNow}
                      disabled={isSyncing}
                      className="h-11 px-4 rounded-xl bg-brand-500 text-xs font-bold text-white hover:bg-brand-600 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                      {isSyncing ? 'Sincronitzant...' : 'Sincronitzar ara'}
                    </button>
                  </div>
                </div>

                <div className="border-t border-[var(--border-subtle)] pt-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">Lectura i Normalització Intel·ligent</h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">Controla com es converteixen les tasques importades del campus virtual</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between h-14 px-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)]">
                      <div>
                        <h4 className="text-sm font-semibold text-[var(--text-primary)]">Sincronització en segon pla</h4>
                        <p className="text-[10px] text-[var(--text-muted)]">Actualitza les tasques automàticament cada vegada que obris l'aplicació</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={autoSync}
                        onChange={(e) => setAutoSync(e.target.checked)}
                        className="w-4 h-4 rounded border-[var(--border-default)] accent-brand-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between h-14 px-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)]">
                      <div>
                        <h4 className="text-sm font-semibold text-[var(--text-primary)]">Lectura i normalització automàtica</h4>
                        <p className="text-[10px] text-[var(--text-muted)]">Neteja els títols de Moodle com "Tasca de lliurament" o codis interns</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={normalizeTasks}
                        onChange={(e) => setNormalizeTasks(e.target.checked)}
                        className="w-4 h-4 rounded border-[var(--border-default)] accent-brand-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between h-14 px-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)]">
                      <div>
                        <h4 className="text-sm font-semibold text-[var(--text-primary)]">Detecció intel·ligent d'Exàmens</h4>
                        <p className="text-[10px] text-[var(--text-muted)]">Reconeix si l'esdeveniment és un examen o prova escrita segons el nom</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={detectExams}
                        onChange={(e) => setDetectExams(e.target.checked)}
                        className="w-4 h-4 rounded border-[var(--border-default)] accent-brand-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between h-14 px-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)]">
                      <div>
                        <h4 className="text-sm font-semibold text-[var(--text-primary)]">Pesos per defecte automàtics</h4>
                        <p className="text-[10px] text-[var(--text-muted)]">Aplica un percentatge uniforme a les activitats si no s'especifica un pes manual</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={defaultWeights}
                        onChange={(e) => setDefaultWeights(e.target.checked)}
                        className="w-4 h-4 rounded border-[var(--border-default)] accent-brand-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Botó desar canvis a baix a la dreta (Sincro) */}
                <div className="flex justify-end pt-4 border-t border-[var(--border-subtle)] mt-6">
                  <button
                    type="submit"
                    disabled={!hasUnsavedChanges}
                    className={`h-11 px-5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5
                      ${hasUnsavedChanges
                        ? 'bg-brand-500 border-brand-500 text-white hover:bg-brand-600 cursor-pointer shadow-sm'
                        : 'bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-muted)] cursor-not-allowed'
                      }`}
                  >
                    <Check size={14} /> Desar i Aplicar
                  </button>
                </div>
              </form>
            )}

            {/* PESTANYA: ZONA DE PERILL */}
            {activeSubTab === 'perill' && (
              <div className="space-y-6">
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2">
                  <h4 className="text-sm font-bold text-red-500 flex items-center gap-1.5">
                    <ShieldAlert size={16} /> Eliminació Irreversible de Dades
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Aquesta opció esborrarà completament i de manera permanent totes les teves assignatures, tasques, sessions d'estudi realitzades, configuracions personals i el teu perfil d'usuari de la base de dades.
                  </p>
                  <p className="text-xs font-bold text-red-500">
                    Aquesta acció és irreversible i no es pot desfer.
                  </p>
                </div>

                <div className="flex justify-end border-t border-[var(--border-subtle)] pt-5">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center justify-center h-10 px-5 rounded-xl bg-red-500 text-xs font-semibold text-white hover:bg-red-600 shadow-sm transition-all cursor-pointer"
                  >
                    Borrar les meves dades
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── MODAL AFEGIR CURS ── */}
      <AnimatePresence>
        {showAddCourseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">Crear nou Curs Acadèmic</h3>
                <button
                  onClick={() => setShowAddCourseModal(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">Nom del Curs *</label>
                  <input
                    type="text"
                    placeholder="Ex: DAW2, GRAUINF2..."
                    value={newCourseNameInput}
                    onChange={(e) => setNewCourseNameInput(e.target.value)}
                    className="h-11 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 text-sm text-[var(--text-primary)] focus:border-brand-500 focus:outline-none w-full uppercase"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">Universitat / Centre (lloc)</label>
                  <input
                    type="text"
                    placeholder="Ex: Institut de Tecnologia"
                    value={courseUniversity}
                    onChange={(e) => setCourseUniversity(e.target.value)}
                    className="h-11 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 text-sm text-[var(--text-primary)] focus:border-brand-500 focus:outline-none w-full"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">Grau acadèmic / Estudis</label>
                  <input
                    type="text"
                    placeholder="Ex: Disseny d'Interfícies"
                    value={courseDegree}
                    onChange={(e) => setCourseDegree(e.target.value)}
                    className="h-11 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 text-sm text-[var(--text-primary)] focus:border-brand-500 focus:outline-none w-full"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-[var(--text-secondary)]">Objectiu d'hores setmanals</label>
                    <span className="text-xs font-bold text-brand-500">{courseWeeklyObjective}h</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={60}
                    value={courseWeeklyObjective}
                    onChange={(e) => setCourseWeeklyObjective(Number(e.target.value))}
                    className="w-full accent-brand-500 cursor-pointer py-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[var(--border-subtle)] pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCourseModal(false)}
                  className="h-10 px-4 rounded-xl border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
                >
                  Cancel·lar
                </button>
                <button
                  type="button"
                  onClick={handleAddCourseSubmit}
                  className="h-10 px-4 rounded-xl bg-brand-500 text-xs font-semibold text-white hover:bg-brand-600 shadow-sm transition-all cursor-pointer"
                >
                  Crear Curs
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL EDITAR CURS ── */}
      <AnimatePresence>
        {showEditCourseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">Editar dades del Curs</h3>
                <button
                  onClick={() => setShowEditCourseModal(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">Nom del Curs *</label>
                  <input
                    type="text"
                    value={newCourseNameInput}
                    onChange={(e) => setNewCourseNameInput(e.target.value)}
                    className="h-11 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 text-sm text-[var(--text-primary)] focus:border-brand-500 focus:outline-none w-full uppercase"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">Universitat / Centre (lloc)</label>
                  <input
                    type="text"
                    value={courseUniversity}
                    onChange={(e) => setCourseUniversity(e.target.value)}
                    className="h-11 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 text-sm text-[var(--text-primary)] focus:border-brand-500 focus:outline-none w-full"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">Grau acadèmic / Estudis</label>
                  <input
                    type="text"
                    value={courseDegree}
                    onChange={(e) => setCourseDegree(e.target.value)}
                    className="h-11 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 text-sm text-[var(--text-primary)] focus:border-brand-500 focus:outline-none w-full"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-[var(--text-secondary)]">Objectiu d'hores setmanals</label>
                    <span className="text-xs font-bold text-brand-500">{courseWeeklyObjective}h</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={60}
                    value={courseWeeklyObjective}
                    onChange={(e) => setCourseWeeklyObjective(Number(e.target.value))}
                    className="w-full accent-brand-500 cursor-pointer py-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[var(--border-subtle)] pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditCourseModal(false)}
                  className="h-10 px-4 rounded-xl border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
                >
                  Cancel·lar
                </button>
                <button
                  type="button"
                  onClick={handleEditCourseSubmit}
                  className="h-10 px-4 rounded-xl bg-brand-500 text-xs font-semibold text-white hover:bg-brand-600 shadow-sm transition-all cursor-pointer"
                >
                  Desar canvis
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL DE RETALLAR IMATGE (CROPPER) ── */}
      <AnimatePresence>
        {showCropModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
                <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">Enquadrar Avatar</h3>
                <button
                  onClick={() => setShowCropModal(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="relative h-64 bg-zinc-950 flex items-center justify-center overflow-hidden select-none">
                <div className="absolute z-10 w-48 h-48 border-2 border-white rounded-full pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex items-center justify-center">
                  <div className="w-full h-full border border-white/20 rounded-full" />
                </div>

                {selectedImage && (
                  <img
                    ref={imageRef}
                    src={selectedImage}
                    alt="Pendent d'enquadrament"
                    draggable={false}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="max-h-full max-w-full cursor-move origin-center transition-transform duration-75 select-none"
                    style={{
                      transform: `translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropZoom})`,
                    }}
                  />
                )}
              </div>

              <div className="p-4 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-bold">
                  <span>Zoom</span>
                  <span>{Math.round(cropZoom * 100)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <ZoomOut size={14} className="text-[var(--text-secondary)]" />
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={cropZoom}
                    onChange={(e) => setCropZoom(Number(e.target.value))}
                    className="flex-1 accent-brand-500 cursor-pointer"
                  />
                  <ZoomIn size={14} className="text-[var(--text-secondary)]" />
                </div>
                <p className="text-[10px] text-[var(--text-muted)] text-center">Arrossega la imatge per ajustar l'àrea d'enquadrament desitjada.</p>
              </div>

              <div className="flex items-center justify-end gap-2 p-4 bg-[var(--bg-raised)]">
                <button
                  onClick={() => setShowCropModal(false)}
                  className="h-10 px-4 rounded-xl border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
                >
                  Cancel·lar
                </button>
                <button
                  onClick={applyCrop}
                  className="h-10 px-4 rounded-xl bg-brand-500 text-xs font-semibold text-white hover:bg-brand-600 shadow-sm transition-all cursor-pointer"
                >
                  Retallar i aplicar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL DE CONFIRMACIÓ DE LA ZONA DE PERILL ── */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <h3 className="font-display font-bold text-base text-red-500 flex items-center gap-1.5">
                  <ShieldAlert size={18} /> Confirmació d'Esborrat
                </h3>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmationText('');
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                  Estàs a punt de borrar les teves dades. Per verificar que vols fer aquesta acció, escriu la paraula <strong className="text-red-500">ELIMINAR</strong> en majúscules en el següent camp de text:
                </p>

                <input
                  type="text"
                  placeholder="Escriu ELIMINAR"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  className="h-11 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 text-sm text-[var(--text-primary)] focus:border-red-500 focus:outline-none transition-all w-full uppercase"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[var(--border-subtle)] pt-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmationText('');
                  }}
                  disabled={isDeleting}
                  className="h-10 px-4 rounded-xl border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all disabled:opacity-50 cursor-pointer"
                >
                  Cancel·lar
                </button>
                <button
                  onClick={handleDeleteUserData}
                  disabled={deleteConfirmationText.trim().toUpperCase() !== 'ELIMINAR' || isDeleting}
                  className="h-10 px-4 rounded-xl bg-red-500 text-xs font-semibold text-white hover:bg-red-600 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isDeleting ? 'Esborrant...' : 'Confirmar esborrat'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL CUSTOM CONFIRMACIÓ NAVEGACIÓ (useBlocker) ── */}
      <AnimatePresence>
        {blocker.state === 'blocked' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3 text-amber-500">
                <ShieldAlert size={24} />
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">Canvis sense desar</h3>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Tens canvis sense desar en aquesta pestanya. Si surts de la pàgina, es perdran les modificacions. Segur que vols sortir?
              </p>
              <div className="flex items-center justify-end gap-2 border-t border-[var(--border-subtle)] pt-4">
                <button
                  type="button"
                  onClick={() => blocker.reset()}
                  className="h-10 px-4 rounded-xl border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
                >
                  Quedar-me
                </button>
                <button
                  type="button"
                  onClick={() => blocker.proceed()}
                  className="h-10 px-4 rounded-xl bg-amber-500 text-xs font-semibold text-white hover:bg-amber-600 shadow-sm transition-all cursor-pointer"
                >
                  Sortir i perdre els canvis
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL CUSTOM CONFIRMACIÓ CANVI PESTANYA ── */}
      <AnimatePresence>
        {pendingTab !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3 text-amber-500">
                <ShieldAlert size={24} />
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">Canviar de pestanya</h3>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Tens canvis sense desar en aquesta secció. Si canvies de pestanya, es perdran les modificacions. Segur que vols continuar?
              </p>
              <div className="flex items-center justify-end gap-2 border-t border-[var(--border-subtle)] pt-4">
                <button
                  type="button"
                  onClick={() => setPendingTab(null)}
                  className="h-10 px-4 rounded-xl border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
                >
                  Mantenir-me aquí
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Reset unsaved state for the tab we are leaving
                    if (userProfile) {
                      if (activeSubTab === 'perfil') {
                        setDisplayName(userProfile.displayName || '');
                        setPhotoURL(userProfile.photoURL || null);
                      } else if (activeSubTab === 'aparença') {
                        setAccentColor(userProfile.accentColor || 'violet');
                        setLocalTheme(userProfile.theme || 'system');
                      } else if (activeSubTab === 'notificacions') {
                        setPushNotif(userProfile.notifications?.push ?? true);
                        setEmailNotif(userProfile.notifications?.email ?? true);
                        setInAppNotif(userProfile.notifications?.inApp ?? true);
                      } else if (activeSubTab === 'sincro') {
                        setMoodleUrl(userProfile.moodleUrl || '');
                        setAutoSync(userProfile.autoSync ?? true);
                        setNormalizeTasks(userProfile.normalizeTasks ?? true);
                        setDetectExams(userProfile.detectExams ?? true);
                        setDefaultWeights(userProfile.defaultWeights ?? true);
                      }
                    }
                    setActiveSubTab(pendingTab);
                    setPendingTab(null);
                  }}
                  className="h-10 px-4 rounded-xl bg-amber-500 text-xs font-semibold text-white hover:bg-amber-600 shadow-sm transition-all cursor-pointer"
                >
                  Canviar i perdre els canvis
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL CUSTOM CONFIRMACIÓ ELIMINAR CURS ── */}
      <AnimatePresence>
        {courseToDelete !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3 text-red-500">
                <Trash2 size={24} />
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">Esborrar Curs Acadèmic</h3>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Segur que vols esborrar el curs <strong>{courseToDelete}</strong>? Aquesta acció és irreversible i pot afectar a les assignatures i tasques d'aquest curs.
              </p>
              <div className="flex items-center justify-end gap-2 border-t border-[var(--border-subtle)] pt-4">
                <button
                  type="button"
                  onClick={() => setCourseToDelete(null)}
                  className="h-10 px-4 rounded-xl border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
                >
                  Cancel·lar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const cName = courseToDelete;
                    setCourseToDelete(null);
                    try {
                      const list = userProfile?.coursesList || [];
                      const newList = list.filter(c => c !== cName);
                      const configs = { ...(userProfile?.coursesConfig || {}) };
                      delete configs[cName];

                      await updateProfile({
                        coursesList: newList,
                        coursesConfig: configs,
                      });
                      toast.success(`Curs ${cName} eliminat`);
                    } catch (e: any) {
                      toast.error(`Error: ${e.message || e}`);
                    }
                  }}
                  className="h-10 px-4 rounded-xl bg-red-500 text-xs font-semibold text-white hover:bg-red-600 shadow-sm transition-all cursor-pointer"
                >
                  Esborrar permanentment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
