import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './services/authContext.jsx'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Teachers from './pages/Teachers'
import TheoryLessons from './pages/TheoryLessons'
import CalendarDemo from './pages/CalendarDemo'

// Protected Route Component
function ProtectedRoute({ children }) {
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
          path="/orchestras"
          element={
            <ProtectedRoute>
              <Layout>
                <div className="p-6" dir="rtl">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">תזמורות</h1>
                  <p className="text-gray-600">ניהול הרכבי תזמורת והקצאות</p>
                  <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                    <p className="text-blue-700">🎼 תכונות ניהול תזמורות בקרוב!</p>
                  </div>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rehearsals"
          element={
            <ProtectedRoute>
              <Layout>
                <CalendarDemo />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bagrut"
          element={
            <ProtectedRoute>
              <Layout>
                <div className="p-6" dir="rtl">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">מעקב בגרות</h1>
                  <p className="text-gray-600">מעקב דרישות בגרות והתקדמות</p>
                  <div className="mt-8 p-4 bg-green-50 rounded-lg">
                    <p className="text-green-700">📋 תכונות מעקב בגרות בקרוב!</p>
                  </div>
                </div>
              </Layout>
            </ProtectedRoute>
          }
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
      <AppRoutes />
    </AuthProvider>
  )
}

export default App