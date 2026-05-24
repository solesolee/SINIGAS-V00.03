import { useEffect, useMemo, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  Bell,
  LayoutDashboard,
  FilePlus,
  ListChecks,
  BarChart2,
  LogOut,
} from 'lucide-react'

function daysLeft(deadline) {
  if (!deadline) return null
  const d = new Date(deadline)
  const now = new Date()
  const diff = d.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function countUnread(rows) {
  let readIds
  try { readIds = new Set(JSON.parse(localStorage.getItem('sinigas_read_notifs') || '[]')) }
  catch { readIds = new Set() }

  let count = 0
  rows.forEach((row) => {
    if (row.status === 'selesai') return
    const left  = daysLeft(row.deadline_at)
    const score = Number(row.total_priority_score || 0)
    let id = null
    if (left !== null && left < 0)       id = `overdue-${row.id}`
    else if (left !== null && left <= 1) id = `urgent-${row.id}`
    else if (left !== null && left <= 3) id = `soon-${row.id}`
    else if (score >= 80)                id = `priority-${row.id}`
    if (id && !readIds.has(id)) count++
  })
  return count
}

export default function DashboardLayout() {
  const navigate = useNavigate()
  const [userName, setUserName]   = useState('User')
  const [userEmail, setUserEmail] = useState('')
  const [rows, setRows]           = useState([])

  useEffect(() => {
    let alive = true
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user
      if (!user) { navigate('/login'); return }
      if (alive) setUserEmail(user.email || '')

      const { data: profileData } = await supabase
        .from('profiles').select('username').eq('id', user.id).maybeSingle()
      if (alive && profileData?.username) setUserName(profileData.username)

      const { data } = await supabase
        .from('view_priority_tasks')
        .select('id, status, deadline_at, total_priority_score')
        .eq('user_id', user.id)
      if (alive) setRows(data || [])
    }
    load()
    return () => { alive = false }
  }, [navigate])

  const unreadCount = useMemo(() => countUnread(rows), [rows])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navItems = [
    { to: '/dashboard',            label: 'Dashboard',         icon: LayoutDashboard, end: true        },
    { to: '/dashboard/input',      label: 'Input Kegiatan',    icon: FilePlus                          },
    { to: '/dashboard/semua',      label: 'Semua Kegiatan',    icon: ListChecks                        },
    { to: '/dashboard/notifikasi', label: 'Notifikasi',        icon: Bell,            badge: unreadCount },
    { to: '/dashboard/analitik',   label: 'Dashboard Analitik',icon: BarChart2                         },
  ]

  return (
    <div className="h-screen overflow-hidden bg-slate-100 text-slate-800 flex">

      {/* ── Sidebar ── */}
      <aside className="hidden lg:flex w-72 flex-col justify-between bg-white border-r border-slate-200 px-6 py-8 flex-shrink-0 overflow-y-auto">
        <div>
          <div className="mb-10">
            <h1 className="text-3xl font-black tracking-tight text-blue-950">SINIGAS ireng</h1>
            <p className="text-sm text-slate-500 mt-1">Sistem Notifikasi Prioritas Tugas</p>
          </div>

          <nav className="space-y-2 text-[15px]">
            {navItems.map(({ to, label, icon: Icon, end, badge }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center justify-between gap-3 rounded-2xl px-4 py-3 font-medium transition ${
                    isActive
                    ? 'bg-blue-950 text-amber-300 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="flex items-center gap-3">
                      <Icon size={18} className={isActive ? 'text-amber-300' : 'text-slate-400'} />
                      {label}
                    </span>
                    {badge > 0 && (
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="space-y-2 border-t border-slate-200 pt-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left font-semibold text-red-500 hover:bg-red-50 transition"
            type="button"
          >
            <LogOut size={18} />
            Keluar
          </button>
        </div>
      </aside>

      {/* ── Content area ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Header */}
        <header className="flex-shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur z-10">
          <div className="flex items-center justify-between px-6 py-4 lg:px-10">
            <div>
              <p className="text-sm text-slate-500">SINIGAS</p>
              <h2 className="text-lg font-semibold text-slate-700">
                Selamat datang kembali, {userName}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              {/* Bell icon dengan badge */}
              <NavLink to="/dashboard/notifikasi" className="relative p-2 rounded-xl hover:bg-slate-100 transition">
                <Bell size={22} className="text-slate-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </NavLink>

              <div className="hidden md:block text-right">
                <p className="font-semibold text-blue-950">{userName}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-950 text-sm font-bold text-white">
                {String(userName || 'U').slice(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

      </div>
    </div>
  )
}