import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import BookingList from './pages/BookingList'
import Kalender from './pages/Kalender'
import Klien from './pages/Klien'
import Keuangan from './pages/Keuangan'
import Laporan from './pages/Laporan'
import Pengaturan from './pages/Pengaturan'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#8B8299'
      }}>
        Memuat...
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/booking"
              element={
                <ProtectedRoute>
                  <BookingList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kalender"
              element={
                <ProtectedRoute>
                  <Kalender />
                </ProtectedRoute>
              }
            />
            <Route
              path="/klien"
              element={
                <ProtectedRoute>
                  <Klien />
                </ProtectedRoute>
              }
            />
            <Route
              path="/keuangan"
              element={
                <ProtectedRoute>
                  <Keuangan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/laporan"
              element={
                <ProtectedRoute>
                  <Laporan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pengaturan"
              element={
                <ProtectedRoute>
                  <Pengaturan />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
