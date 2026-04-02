import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Charities from './pages/Charities'
import CharityProfile from './pages/CharityProfile'
import Draws from './pages/Draws'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminDraws from './pages/admin/AdminDraws'
import AdminUsers from './pages/admin/AdminUsers'
import AdminWinners from './pages/admin/AdminWinners'
import AdminCharities from './pages/admin/AdminCharities'
import AdminReports from './pages/admin/AdminReports'
import Profile from './pages/Profile'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Navbar />
        <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '2rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/charities" element={<Charities />} />
            <Route path="/charities/:id" element={<CharityProfile />} />
            <Route path="/draws" element={<Draws />} />

            {/* Protected — must be logged in */}
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />

            {/* Admin only */}
            <Route path="/admin" element={
              <AdminRoute><AdminDashboard /></AdminRoute>
            } />
            <Route path="/admin/draws" element={
              <AdminRoute><AdminDraws /></AdminRoute>
            } />
            <Route path="/admin/users" element={
              <AdminRoute><AdminUsers /></AdminRoute>
            } />
            <Route path="/admin/winners" element={
              <AdminRoute><AdminWinners /></AdminRoute>
            } />
            <Route path="/admin/charities" element={
              <AdminRoute><AdminCharities /></AdminRoute>
            } />
            <Route path="/admin/reports" element={
              <AdminRoute><AdminReports /></AdminRoute>
            } />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  )
}