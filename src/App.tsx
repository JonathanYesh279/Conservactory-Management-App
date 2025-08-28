import { Routes, Route, Navigate } from 'react-router-dom'
import React, { Suspense } from 'react'
import { AuthProvider, useAuth } from './services/authContext.jsx'
import { SchoolYearProvider } from './services/schoolYearContext.jsx'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Teachers from './pages/Teachers'
import TheoryLessons from './pages/TheoryLessons'
import TheoryLessonDetails from './pages/TheoryLessonDetails'
import Orchestras from './pages/Orchestras'
import Rehearsals from './pages/Rehearsals'
import RehearsalDetails from './pages/RehearsalDetails'
import Bagruts from './pages/Bagruts'
import BagrutDetails from './pages/BagrutDetails'
import { lazy } from 'react'

// Lazy load StudentDetailsPage for code splitting
const StudentDetailsPage = lazy(() => import('./features/students/details/components/StudentDetailsPageSimple'))

// Lazy load TeacherDetailsPage for code splitting
const TeacherDetailsPage = lazy(() => import('./features/teachers/details/components/TeacherDetailsPage'))

// Lazy load OrchestraDetailsPage for code splitting
const OrchestraDetailsPage = lazy(() => import('./features/orchestras/details/components/OrchestraDetailsPage'))

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <div className="text-gray-600">טוען...</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
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
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/students"
          element={
            <ProtectedRoute>
              <Layout>
                <Students />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/students/:studentId"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={
                  <div className="flex items-center justify-center min-h-96">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                      <div className="text-gray-600">טוען פרטי תלמיד...</div>
                    </div>
                  </div>
                }>
                  <StudentDetailsPage />
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
  return (
    <AuthProvider>
      <SchoolYearProvider>
        <AppRoutes />
      </SchoolYearProvider>
    </AuthProvider>
  )
}

export default App