import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Teachers from './pages/Teachers'
import CalendarDemo from './pages/CalendarDemo'

function App() {
  return (
    <div dir="rtl">
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <Layout>
            <Dashboard />
          </Layout>
        }
      />
      <Route
        path="/students"
        element={
          <Layout>
            <Students />
          </Layout>
        }
      />
      <Route
        path="/teachers"
        element={
          <Layout>
            <Teachers />
          </Layout>
        }
      />
      <Route
        path="/orchestras"
        element={
          <Layout>
            <div className="p-6" dir="rtl">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">תזמורות</h1>
              <p className="text-gray-600">ניהול הרכבי תזמורת והקצאות</p>
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-700">🎼 תכונות ניהול תזמורות בקרוב!</p>
              </div>
            </div>
          </Layout>
        }
      />
      <Route
        path="/rehearsals"
        element={
          <Layout>
            <CalendarDemo />
          </Layout>
        }
      />
      <Route
        path="/bagrut"
        element={
          <Layout>
            <div className="p-6" dir="rtl">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">מעקב בגרות</h1>
              <p className="text-gray-600">מעקב דרישות בגרות והתקדמות</p>
              <div className="mt-8 p-4 bg-green-50 rounded-lg">
                <p className="text-green-700">📋 תכונות מעקב בגרות בקרוב!</p>
              </div>
            </div>
          </Layout>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </div>
  )
}

export default App