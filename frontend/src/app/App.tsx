import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AppLayout, AuthLayout } from '@/shared/components/layout/AppLayout';
import { PageLoader } from '@/shared/components/ui/PageLoader';

// Auth pages
const LoginPage = lazy(() => import('@/features/auth/components/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/components/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/components/ForgotPasswordPage'));

// App pages
const DashboardPage = lazy(() => import('@/features/dashboard/components/DashboardPage'));
const SubjectsPage = lazy(() => import('@/features/subjects/components/SubjectsPage'));
const TasksPage = lazy(() => import('@/features/tasks/components/TasksPage'));
const PomodoroPage = lazy(() => import('@/features/pomodoro/components/PomodoroPage'));
const CalendarPage = lazy(() => import('@/features/calendar/components/CalendarPage'));
const StatsPage = lazy(() => import('@/features/stats/components/StatsPage'));
const SettingsPage = lazy(() => import('@/features/settings/components/SettingsPage'));
const SubjectDetailPage = lazy(() => import('@/features/subjects/components/SubjectDetailPage'));
const FinancesPage = lazy(() => import('@/features/finances/components/FinancesPage'));
const PlaceholderPage = lazy(() => import('@/shared/components/ui/PlaceholderPage'));
const HabitsPage = lazy(() => import('@/features/habits/components/HabitsPage'));
const ShoppingPage = lazy(() => import('@/features/shopping/components/ShoppingPage'));

// ── Route guard ───────────────────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// ── router configuration ──────────────────────────────────────────────────────
const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/auth/login',
        element: <PublicRoute><LoginPage /></PublicRoute>,
      },
      {
        path: '/auth/registre',
        element: <PublicRoute><RegisterPage /></PublicRoute>,
      },
      {
        path: '/auth/recuperar',
        element: <PublicRoute><ForgotPasswordPage /></PublicRoute>,
      },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/assignatures',
        element: <SubjectsPage />,
      },
      {
        path: '/:courseId/assignatures/:subjectSlug',
        element: <SubjectDetailPage />,
      },
      {
        path: '/tasques',
        element: <TasksPage />,
      },
      {
        path: '/pomodoro',
        element: <PomodoroPage />,
      },
      {
        path: '/calendari',
        element: <CalendarPage />,
      },
      {
        path: '/estadistiques',
        element: <StatsPage />,
      },
      {
        path: '/configuracio',
        element: <SettingsPage />,
      },
      {
        path: '/finances/*',
        element: <FinancesPage />,
      },
      {
        path: '/habits/*',
        element: <HabitsPage />,
      },
      {
        path: '/compres/*',
        element: <ShoppingPage />,
      },
      {
        path: '/salut',
        element: <PlaceholderPage title="Salut" />,
      },
      {
        path: '/documents',
        element: <PlaceholderPage title="Documents" />,
      },
      {
        path: '/objectius',
        element: <PlaceholderPage title="Objectius" />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);

// ── App Router ────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
