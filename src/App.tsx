import { Routes, Route, Navigate } from 'react-router-dom'
import React, { Suspense, useEffect } from 'react'
import { AuthProvider, useAuth } from './services/authContext.jsx'
import { SchoolYearProvider } from './services/schoolYearContext.jsx'
import { BagrutProvider } from './contexts/BagrutContext'
import { QueryProvider } from './providers/QueryProvider'
import Layout from './components/Layout'
import Login from './pages/Login'
import { lazyWithRetry, initializeBundleOptimizations } from './utils/bundleOptimization'

// Lazy load all pages with retry mechanism for better reliability
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'), 'Dashboard')
const Students = lazyWithRetry(() => import('./pages/Students'), 'Students')
const Teachers = lazyWithRetry(() => import('./pages/Teachers'), 'Teachers')
const TheoryLessons = lazyWithRetry(() => import('./pages/TheoryLessons'), 'TheoryLessons')
const TheoryLessonDetails = lazyWithRetry(() => import('./pages/TheoryLessonDetails'), 'TheoryLessonDetails')
const Orchestras = lazyWithRetry(() => import('./pages/Orchestras'), 'Orchestras')
const Rehearsals = lazyWithRetry(() => import('./pages/Rehearsals'), 'Rehearsals')
const RehearsalDetails = lazyWithRetry(() => import('./pages/RehearsalDetails'), 'RehearsalDetails')
const Bagruts = lazyWithRetry(() => import('./pages/Bagruts'), 'Bagruts')
const BagrutDetails = lazyWithRetry(() => import('./pages/BagrutDetails'), 'BagrutDetails')
import { lazy } from 'react'

// Lazy load detail pages with optimization
const StudentDetailsPageOptimized = lazyWithRetry(
  () => import('./features/students/details/components/StudentDetailsPageOptimized'), 
  'StudentDetailsPageOptimized'
)
const TeacherDetailsPage = lazyWithRetry(
  () => import('./features/teachers/details/components/TeacherDetailsPage'), 
  'TeacherDetailsPage'
)
const OrchestraDetailsPage = lazyWithRetry(
  () => import('./features/orchestras/details/components/OrchestraDetailsPage'), 
  'OrchestraDetailsPage'
)

// Enhanced loading component with better UX
const PageLoadingFallback: React.FC<{ message?: string }> = ({ message = 'טוען עמוד...' }) => (
  <div className="flex items-center justify-center min-h-96">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
      <div className="text-gray-600">{message}</div>
    </div>
  </div>
)

// Higher-order component for protected routes with lazy loading
function createProtectedRoute(Component: React.ComponentType, loadingMessage: string) {
  return (
    <ProtectedRoute>
      <Layout>
        <Suspense fallback={<PageLoadingFallback message={loadingMessage} />}>
          <Component />
        </Suspense>
      </Layout>
    </ProtectedRoute>
  )
}

// Protected Route Component with improved authentication handling
interface ProtectedRouteProps {
  children: React.ReactNode
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, authError, checkAuthStatus } = useAuth()
  const [retryAttempts, setRetryAttempts] = React.useState(0)
  const maxRetries = 2

  // Auto-retry on auth errors (up to maxRetries)
  React.useEffect(() => {
    if (authError && retryAttempts < maxRetries) {
      const retryTimeout = setTimeout(() => {
        console.log(`🔄 ProtectedRoute - Retrying authentication (${retryAttempts + 1}/${maxRetries})`);
        checkAuthStatus(true);
        setRetryAttempts(prev => prev + 1);
      }, 1000 * (retryAttempts + 1)); // Exponential backoff
      
      return () => clearTimeout(retryTimeout);
    }
  }, [authError, retryAttempts, checkAuthStatus]);

  // Reset retry attempts on successful authentication
  React.useEffect(() => {
    if (isAuthenticated && retryAttempts > 0) {
      setRetryAttempts(0);
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <div className="text-gray-600">מאמת הרשאות...</div>
          {authError && retryAttempts > 0 && (
            <div className="mt-2 text-sm text-amber-600">
              מנסה שוב ({retryAttempts}/{maxRetries})...
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// App Routes Component
function AppRoutes() {
  return (
    <div dir="rtl">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<PageLoadingFallback message="טוען דשבורד..." />}>
                  <Dashboard />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/students"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<PageLoadingFallback message="טוען רשימת תלמידים..." />}>
                  <Students />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/students/:studentId"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<PageLoadingFallback message="טוען פרטי תלמיד..." />}>
                  <StudentDetailsPageOptimized />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teachers"
          element={
            <ProtectedRoute>
              <Layout>
                <Teachers />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teachers/:teacherId"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={
                  <div className="flex items-center justify-center min-h-96">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                      <div className="text-gray-600">טוען פרטי מורה...</div>
                    </div>
                  </div>
                }>
                  <TeacherDetailsPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/theory-lessons"
          element={
            <ProtectedRoute>
              <Layout>
                <TheoryLessons />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/theory-lessons/:theoryId"
          element={
            <ProtectedRoute>
              <Layout>
                <TheoryLessonDetails />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orchestras"
          element={
            <ProtectedRoute>
              <Layout>
                <Orchestras />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orchestras/:orchestraId"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={
                  <div className="flex items-center justify-center min-h-96">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                      <div className="text-gray-600">טוען פרטי תזמורת...</div>
                    </div>
                  </div>
                }>
                  <OrchestraDetailsPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rehearsals"
          element={
            <ProtectedRoute>
              <Layout>
                <Rehearsals />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rehearsals/:rehearsalId"
          element={
            <ProtectedRoute>
              <Layout>
                <RehearsalDetails />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bagruts"
          element={
            <ProtectedRoute>
              <Layout>
                <Bagruts />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bagruts/:bagrutId"
          element={
            <ProtectedRoute>
              <Layout>
                <BagrutDetails />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bagruts/:bagrutId/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <div className="p-6" dir="rtl">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">עריכת בגרות</h1>
                  <p className="text-gray-600">עריכת פרטי הבגרות והתקדמות</p>
                  <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                    <p className="text-blue-700">🔧 עמוד עריכת בגרות בפיתוח - בינתיים ניתן לערוך דרך עמוד הפרטים</p>
                  </div>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bagrut"
          element={<Navigate to="/bagruts" replace />}
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  )
}

function App() {
  // Initialize bundle optimizations on mount
  useEffect(() => {
    initializeBundleOptimizations()
  }, [])
  
  return (
    <QueryProvider>
      <AuthProvider>
        <SchoolYearProvider>
          <BagrutProvider>
            <AppRoutes />
          </BagrutProvider>
        </SchoolYearProvider>
      </AuthProvider>
    </QueryProvider>
  )
}

export default App