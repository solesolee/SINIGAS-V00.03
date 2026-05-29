import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  Clock,
  Siren,
  TriangleAlert,
  Circle,
  CheckCheck,
  SlidersHorizontal,
  PartyPopper,
} from 'lucide-react'
import { daysLeft, timeAgo } from '../utils/dateHelpers'
import { getPriorityClass, NOTIF_VERY_HIGH_PRIORITY, NOTIF_HIGH_PRIORITY } from '../utils/priorityHelpers'



function generateNotifications(rows) {
  const notifs = []

  rows.forEach((row) => {
    const left  = daysLeft(row.deadline_at)
    const score = Number(row.total_priority_score || 0)
    const pc    = getPriorityClass(score, { veryHigh: NOTIF_VERY_HIGH_PRIORITY, high: NOTIF_HIGH_PRIORITY, medium: 0 })
    const title = row.judul

    if (row.status === 'selesai') return

    if (left !== null && left < 0) {
      notifs.push({
        id:       `overdue-${row.id}`,
        type:     'overdue',
        title:    'Kegiatan Terlambat',
        message:  `"${title}" sudah melewati deadline ${Math.abs(left)} hari yang lalu.`,
        tag:      'TERLAMBAT',
        tagColor: 'bg-slate-200 text-slate-600',
        icon:     <Clock size={18} />,
        iconBg:   'bg-slate-100 text-slate-500',
        border:   'border-slate-200',
        date:     row.deadline_at,
        isNew:    Math.abs(left) <= 1,
      })
      return
    }

    if (left !== null && left <= 1) {
      notifs.push({
        id:       `urgent-${row.id}`,
        type:     'urgent',
        title:    'Deadline Hari Ini!',
        message:  `"${title}" harus diselesaikan hari ini. Prioritas: ${pc}.`,
        tag:      'MENDESAK',
        tagColor: 'bg-red-100 text-red-600',
        icon:     <Siren size={18} />,
        iconBg:   'bg-red-50 text-red-500',
        border:   'border-red-200',
        date:     row.deadline_at,
        isNew:    true,
      })
      return
    }

    if (left !== null && left <= 3) {
      notifs.push({
        id:       `soon-${row.id}`,
        type:     'soon',
        title:    'Deadline Mendekat',
        message:  `"${title}" akan jatuh tempo dalam ${left} hari.`,
        tag:      'SEGERA',
        tagColor: 'bg-amber-100 text-amber-600',
        icon:     <TriangleAlert size={18} />,
        iconBg:   'bg-amber-50 text-amber-500',
        border:   'border-amber-200',
        date:     row.deadline_at,
        isNew:    false,
      })
      return
    }

    if (score > 74) {
      notifs.push({
        id:       `priority-${row.id}`,
        type:     'priority',
        title:    'Kegiatan Sangat Prioritas',
        message:  `"${title}" memiliki skor prioritas tinggi (${score}). Sisa ${left} hari.`,
        tag:      'PRIORITAS',
        tagColor: 'bg-red-100 text-red-600',
        icon:     <Circle size={18} className="fill-current" />,
        iconBg:   'bg-red-50 text-red-500',
        border:   'border-red-100',
        date:     row.created_at,
        isNew:    false,
      })
    }
  })

  return notifs.sort((a, b) => {
    if (a.isNew !== b.isNew) return a.isNew ? -1 : 1
    return new Date(a.date) - new Date(b.date)
  })
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function NotifCard({ notif, isRead, onRead }) {
  return (
    <div
      onClick={() => onRead(notif.id)}
      className={`relative border rounded-2xl px-6 py-5 cursor-pointer transition hover:shadow-md ${notif.border} ${isRead ? 'bg-white opacity-60' : 'bg-white'}`}
    >
      {!isRead && (
        <div className="absolute left-0 top-4 bottom-4 w-1 rounded-full bg-blue-950" />
      )}

      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${notif.iconBg}`}>
          {notif.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-bold ${isRead ? 'text-slate-500' : 'text-blue-950'}`}>
              {notif.title}
            </p>
            {notif.isNew && !isRead && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-950 text-white tracking-wide">
                BARU
              </span>
            )}
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${notif.tagColor}`}>
              {notif.tag}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">{notif.message}</p>
          <p className="mt-2 text-xs text-slate-400">{timeAgo(notif.date)}</p>
        </div>

        {!isRead && (
          <div className="w-2.5 h-2.5 rounded-full bg-blue-950 shrink-0 mt-1.5" />
        )}
      </div>
    </div>
  )
}

// ─── Filter chip ──────────────────────────────────────────────────────────────

function FilterChip({ label, active, onClick }) {
  return (
    <button onClick={onClick} type="button"
      className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition border ${
        active
          ? 'bg-blue-950 text-white border-blue-950'
          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
      }`}>
      {label}
    </button>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const FILTERS = [
  { key: 'semua',    label: 'Semua'     },
  { key: 'urgent',   label: 'Mendesak'  },
  { key: 'soon',     label: 'Segera'    },
  { key: 'overdue',  label: 'Terlambat' },
  { key: 'priority', label: 'Prioritas' },
]

export default function Notifikasi() {
  const [rows, setRows]                 = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [activeFilter, setActiveFilter] = useState('semua')
  const [showFilter, setShowFilter]     = useState(false)
  const [readIds, setReadIds]           = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('sinigas_read_notifs') || '[]')) }
    catch { return new Set() }
  })

  useEffect(() => {
    let alive = true
    const load = async () => {
      setLoading(true)
      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user
      if (!user) return

      const { data, error } = await supabase
        .from('view_priority_tasks')
        .select('*')
        .eq('user_id', user.id)

      if (!alive) return
      if (error) { setError(error.message); setRows([]) }
      else setRows(data || [])
      setLoading(false)
    }
    load()
    return () => { alive = false }
  }, [])

  const notifications = useMemo(() => generateNotifications(rows), [rows])

  const filtered = useMemo(() => {
    if (activeFilter === 'semua') return notifications
    return notifications.filter(n => n.type === activeFilter)
  }, [notifications, activeFilter])

  const unreadCount = useMemo(
    () => notifications.filter(n => !readIds.has(n.id)).length,
    [notifications, readIds]
  )

  const markRead = (id) => {
    setReadIds(prev => {
      const next = new Set(prev)
      next.add(id)
      localStorage.setItem('sinigas_read_notifs', JSON.stringify([...next]))
      return next
    })
  }

  const markAllRead = () => {
    const allIds = notifications.map(n => n.id)
    setReadIds(new Set(allIds))
    localStorage.setItem('sinigas_read_notifs', JSON.stringify(allIds))
  }

  const todayNotifs  = filtered.filter(n => n.isNew)
  const olderNotifs  = filtered.filter(n => !n.isNew)

  return (
    <section className="px-6 py-8 lg:px-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-blue-950">Notifikasi Anda</h1>
          <p className="mt-2 text-slate-600">Kelola semua informasi penting, tugas mendesak, dan pembaruan kegiatan</p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button onClick={markAllRead} type="button"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-950 text-white text-sm font-semibold hover:bg-blue-900 transition">
              <CheckCheck size={16} />
              Tandai Semua Dibaca
            </button>
          )}
          <button onClick={() => setShowFilter(f => !f)} type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition">
            <SlidersHorizontal size={16} />
            Filter
          </button>
        </div>
      </div>

      {/* Filter chips */}
      {showFilter && (
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map(f => (
            <FilterChip key={f.key} label={f.label}
              active={activeFilter === f.key} onClick={() => setActiveFilter(f.key)} />
          ))}
        </div>
      )}

      {/* Unread count */}
      {unreadCount > 0 && (
        <div className="flex items-center gap-2 mb-6">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-950 inline-block" />
          <span className="text-sm font-semibold text-blue-950">{unreadCount} notifikasi belum dibaca</span>
        </div>
      )}

      {/* States */}
      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-400">
          Memuat notifikasi...
        </div>
      )}
      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
          <div className="flex justify-center mb-3 text-slate-300">
            <PartyPopper size={40} />
          </div>
          <p className="font-semibold">Tidak ada notifikasi</p>
          <p className="text-sm mt-1">Semua kegiatan dalam kondisi baik</p>
        </div>
      )}

      {/* Hari Ini */}
      {!loading && !error && todayNotifs.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Hari Ini</p>
          <div className="space-y-3">
            {todayNotifs.map(n => (
              <NotifCard key={n.id} notif={n} isRead={readIds.has(n.id)} onRead={markRead} />
            ))}
          </div>
        </div>
      )}

      {/* Sebelumnya */}
      {!loading && !error && olderNotifs.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Sebelumnya</p>
          <div className="space-y-3">
            {olderNotifs.map(n => (
              <NotifCard key={n.id} notif={n} isRead={readIds.has(n.id)} onRead={markRead} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}