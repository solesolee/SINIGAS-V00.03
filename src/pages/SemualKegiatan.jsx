import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Search, Inbox, SlidersHorizontal } from 'lucide-react'

// Import helper functions & components
import TaskCard from '../components/TaskCard'
import { getPriorityClass } from '../utils/priorityHelpers'
import { getCategory } from '../utils/taskHelpers'

function TabButton({ label, count, active, onClick, countColor = 'bg-slate-200 text-slate-600' }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition
        ${active
          ? 'bg-blue-950 text-white shadow'
          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
    >
      {label}
      {count !== undefined && (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : countColor}`}>
          {count}
        </span>
      )}
    </button>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = ['semua', 'dalam_proses', 'terlambat', 'selesai']

const TAB_LABELS = {
  semua:        'Semua',
  dalam_proses: 'Dalam Proses',
  terlambat:    'Terlambat',
  selesai:      'Selesai',
}

const TAB_COUNT_COLORS = {
  semua:        'bg-blue-100 text-blue-700',
  dalam_proses: 'bg-blue-100 text-blue-700',
  terlambat:    'bg-red-100 text-red-600',
  selesai:      'bg-emerald-100 text-emerald-700',
}

const PRIORITY_OPTIONS = ['Semua Prioritas', 'SANGAT TINGGI', 'TINGGI', 'SEDANG', 'RENDAH']

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SemualKegiatan() {
  const navigate = useNavigate()

  const [loading, setLoading]               = useState(true)
  const [rows, setRows]                     = useState([])
  const [error, setError]                   = useState('')
  const [activeTab, setActiveTab]           = useState('semua')
  const [search, setSearch]                 = useState('')
  const [priorityFilter, setPriorityFilter] = useState('Semua Prioritas')

  useEffect(() => {
    let alive = true
    const load = async () => {
      setLoading(true)
      setError('')
      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user
      if (!user) return

      const { data, error } = await supabase
        .from('view_priority_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('total_priority_score', { ascending: false, nullsFirst: false })

      if (!alive) return
      if (error) { setError(error.message || 'Gagal mengambil data'); setRows([]) }
      else setRows(data || [])
      setLoading(false)
    }
    load()
    return () => { alive = false }
  }, [])

  const counts = useMemo(() => {
    const result = { semua: 0, dalam_proses: 0, terlambat: 0, selesai: 0 }
    rows.forEach((row) => {
      const cat = getCategory(row)
      result[cat] = (result[cat] || 0) + 1
      if (cat === 'dalam_proses') result.semua += 1
    })
    return result
  }, [rows])

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const cat = getCategory(row)
      if (activeTab === 'semua' && cat !== 'dalam_proses') return false
      if (activeTab !== 'semua' && cat !== activeTab) return false
      if (search.trim() && !String(row.judul || '').toLowerCase().includes(search.toLowerCase()))
        return false
      if (
        priorityFilter !== 'Semua Prioritas' &&
        getPriorityClass(Number(row.total_priority_score || 0)) !== priorityFilter
      ) return false
      return true
    })
  }, [rows, activeTab, search, priorityFilter])

  return (
    <section className="px-6 py-8 lg:px-10">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight text-blue-950">Semua Kegiatan</h1>
        <p className="mt-2 text-slate-600">Kelola dan pantau semua kegiatan tugas anda</p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            size={16}
            strokeWidth={2}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Cari kegiatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <div className="relative">
          <SlidersHorizontal
            size={15}
            strokeWidth={2}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="pl-9 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer appearance-none"
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((tab) => (
          <TabButton
            key={tab}
            label={TAB_LABELS[tab]}
            count={counts[tab]}
            active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            countColor={TAB_COUNT_COLORS[tab]}
          />
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-500 shadow-sm">
            Memuat data kegiatan...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 shadow-sm">
            <div className="flex justify-center mb-4">
              <Inbox size={40} strokeWidth={1.5} className="text-slate-300" />
            </div>
            <p className="font-semibold text-slate-500">Tidak ada kegiatan ditemukan</p>
            <p className="text-sm mt-1">Coba ubah filter atau kata kunci pencarian</p>
          </div>
        )}

        {!loading && !error && filtered.map((row) => (
          <TaskCard
            key={row.id}
            row={row}
            mode="kegiatan"
            onClick={() => navigate(`/dashboard/detail/${row.id}`)}
          />
        ))}
      </div>
    </section>
  )
}
