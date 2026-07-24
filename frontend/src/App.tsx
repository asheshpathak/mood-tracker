import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from '@/app/hooks';
import { AppShell } from '@/components/layout/AppShell';
import { Spinner } from '@/components/ui/Button';
import { LoginPage, RegisterPage } from '@/pages/AuthPages';
import { TodayPage } from '@/pages/TodayPage';

// Everything past the home screen is split out — the first paint on a phone
// only needs Today.
const TimelinePage = lazy(() =>
  import('@/pages/TimelinePage').then((m) => ({ default: m.TimelinePage })),
);
const InsightsPage = lazy(() =>
  import('@/pages/InsightsPage').then((m) => ({ default: m.InsightsPage })),
);
const ObservationsPage = lazy(() =>
  import('@/pages/ObservationsPage').then((m) => ({ default: m.ObservationsPage })),
);
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<TodayPage />} />
          <Route
            path="timeline"
            element={
              <Lazy>
                <TimelinePage />
              </Lazy>
            }
          />
          <Route
            path="insights"
            element={
              <Lazy>
                <InsightsPage />
              </Lazy>
            }
          />
          <Route
            path="observations"
            element={
              <Lazy>
                <ObservationsPage />
              </Lazy>
            }
          />
          <Route
            path="settings"
            element={
              <Lazy>
                <SettingsPage />
              </Lazy>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster
        position="top-center"
        offset={12}
        toastOptions={{
          className:
            '!rounded-2xl !border-line !bg-surface !text-ink !shadow-lift !font-sans !text-[0.875rem]',
        }}
      />
    </>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

function Lazy({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20 text-ink-faint">
          <Spinner className="size-5" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
