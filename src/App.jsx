import { Routes, Route, Navigate } from 'react-router-dom'

import Login from './pages/Login'
import Register from './pages/Register'
import DashboardLayout from './pages/DashboardLayout'
import Dashboard from './pages/Dashboard'
import SemualKegiatan from './pages/SemualKegiatan'
import DetailKegiatan from './pages/DetailKegiatan'
import DashboardAnalitik from './pages/DashboardAnalitik'
import Notifikasi from './pages/Notifikasi'
import InputKegiatan from './pages/InputKegiatan'

// Tambahkan import halaman lain di sini seiring perkembangan:
// import ProfilUser from './pages/ProfilUser'

export default function App() {
  return (
    <Routes>
      {/* Redirect root ke login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Auth pages */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Dashboard — semua halaman di dalam pakai DashboardLayout */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index                  element={<Dashboard />} />
        <Route path="input"           element={<InputKegiatan />} />
        <Route path="semua"           element={<SemualKegiatan />} />
        <Route path="detail/:id"      element={<DetailKegiatan />} />
        <Route path="analitik"        element={<DashboardAnalitik />} />
        <Route path="notifikasi"      element={<Notifikasi />} />

        {/* Tambahkan route baru di sini: */}
        {/* <Route path="profil"      element={<ProfilUser />} /> */}
      </Route>

      {/* Fallback — redirect ke login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
