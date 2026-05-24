import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// Import helpers from src/utils/
import { daysLeft, formatDate } from '../utils/dateHelpers'
import { getPriorityClass, PRIORITY_THEME } from '../utils/priorityHelpers'
import { getStatusLabel } from '../utils/taskHelpers'

// ─── Database fetchers ────────────────────────────────────────────────────────

async function fetchTaskDetail(taskId) {
  const { data, error } = await supabase
    .from('view_priority_tasks')
    .select('*')
    .eq('id', taskId)
    .single()
  if (error) throw error
  return data
}

async function fetchTaskSelections(taskId) {
  const { data, error } = await supabase
    .from('tasks_selection')
    .select(`
      variabel_penilaian_id,
      opsi_nilai_bobot_id,
      variabel_penilaian ( nama_variabel ),
      opsi_nilai_bobot_variabel ( label, nilai_bobot )
    `)
    .eq('task_id', taskId)
  if (error) throw error
  return data || []
}

async function markTaskSelesai(taskId) {
  const { error } = await supabase
    .from('tasks')
    .update({ status: 'selesai' })
    .eq('id', taskId)
  if (error) throw error
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DetailKegiatan() {
  const { id }     = useParams()
  const navigate   = useNavigate()

  const [task,       setTask]       = useState(null)
  const [selections, setSelections] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [marking,    setMarking]    = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  useEffect(() => {
    if (!id) return
    let alive = true

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [taskData, selData] = await Promise.all([
          fetchTaskDetail(id),
          fetchTaskSelections(id),
        ])
        if (!alive) return
        setTask(taskData)
        setSelections(selData)
      } catch (err) {
        if (!alive) return
        setError(err.message || 'Gagal memuat data kegiatan.')
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [id])

  async function handleMarkSelesai() {
    if (!task || task.status === 'selesai') return
    setMarking(true)
    try {
      await markTaskSelesai(id)
      setTask((prev) => ({ ...prev, status: 'selesai' }))
    } catch (err) {
      alert(err.message || 'Gagal menandai selesai.')
    } finally {
      setMarking(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Yakin ingin menghapus tugas ini?')) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
      navigate(-1)
    } catch (err) {
      alert(err.message || 'Gagal menghapus tugas.')
      setDeleting(false)
    }
  }

  // ── Derived state ────────────────────────────────────────────────────────────
  const isSelesai     = task?.status === 'selesai'
  const priorityScore = Number(task?.total_priority_score || 0)
  const priorityClass = isSelesai ? 'SELESAI' : getPriorityClass(priorityScore)
  const theme         = PRIORITY_THEME[priorityClass] || PRIORITY_THEME['RENDAH']
  const left          = daysLeft(task?.deadline_at)

  // Find specific variables from selections
  const getSelection = (variabelId) =>
    selections.find((s) => s.variabel_penilaian_id === variabelId)

  const dampakNilai      = getSelection(2)
  const tingkatKesulitan = getSelection(4)

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) return <LoadingState />
  if (error)   return <ErrorState message={error} onBack={() => navigate(-1)} />
  if (!task)   return null

  return (
    <>
      <style>{css}</style>
      <div className="dk-page">

        {/* Back */}
        <button className="dk-back" onClick={() => navigate(-1)}>
          ← Kembali ke Semua Kegiatan
        </button>

        {/* ── Hero header card ── */}
        <div
          className="dk-hero"
          style={{ background: theme.bg }}
        >
          {/* Priority badge */}
          <span
            className="dk-priority-badge"
            style={{ background: theme.badge.bg, color: theme.badge.color }}
          >
            {priorityClass}
          </span>

          {/* Title */}
          <h1 className="dk-hero-title">{task.judul}</h1>

          {/* Meta row */}
          <div className="dk-hero-meta">
            <span className="dk-hero-meta-item">
              <ClockIcon />
              {isSelesai
                ? 'Selesai'
                : left === null
                ? '-'
                : left < 0
                ? `Terlambat ${Math.abs(left)} hari`
                : `Sisa ${left} hari`}
            </span>
            <span className="dk-hero-meta-item">
              <CalendarIcon />
              Deadline: {formatDate(task.deadline_at, 'long')}
            </span>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="dk-stats">
          <StatCard
            label="DAMPAK NILAI"
            value={dampakNilai?.opsi_nilai_bobot_variabel?.label ?? '-'}
            sub={dampakNilai?.opsi_nilai_bobot_variabel?.nilai_bobot != null
              ? `Bobot: ${dampakNilai.opsi_nilai_bobot_variabel.nilai_bobot}`
              : undefined}
          />
          <StatCard
            label="TINGKAT KESULITAN"
            value={tingkatKesulitan?.opsi_nilai_bobot_variabel?.label ?? '-'}
          />
          <StatCard
            label="STATUS"
            value={getStatusLabel(task.status)}
            valueStyle={
              isSelesai ? { color: '#10b981' }
              : task.status === 'terlambat' ? { color: '#ef4444' }
              : { color: '#1a237e' }
            }
          />
        </div>

        {/* ── All priority variables ── */}
        <div className="dk-section">
          <h2 className="dk-section-title">
            <AssessIcon /> Penilaian Prioritas
          </h2>
          <div className="dk-vars-grid">
            {selections.map((sel) => (
              <div key={sel.variabel_penilaian_id} className="dk-var-chip">
                <span className="dk-var-name">
                  {sel.variabel_penilaian?.nama_variabel}
                </span>
                <span className="dk-var-value">
                  {sel.opsi_nilai_bobot_variabel?.label}
                </span>
              </div>
            ))}
            <div className="dk-var-chip dk-var-score">
              <span className="dk-var-name">Skor Total</span>
              <span className="dk-var-value" style={{ color: theme.bg, fontWeight: 800 }}>
                {priorityScore.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Deskripsi ── */}
        {task.deskripsi && (
          <div className="dk-section">
            <h2 className="dk-section-title">
              <DocIcon /> Deskripsi Kegiatan
            </h2>
            <div className="dk-note">
              {task.deskripsi}
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="dk-actions">
          <button
            className="dk-btn-primary"
            onClick={handleMarkSelesai}
            disabled={isSelesai || marking}
            style={isSelesai ? { background: '#10b981', cursor: 'default' } : {}}
          >
            {marking ? 'Menyimpan...' : isSelesai ? '✓ Sudah Selesai' : 'Tandai Selesai'}
          </button>
          <button
            className="dk-btn-secondary"
            onClick={handleDelete}
            disabled={deleting}
            style={{ color: '#ef4444', borderColor: '#ef4444' }}
          >
            {deleting ? 'Menghapus...' : 'Hapus Tugas'}
          </button>
        </div>

      </div>
    </>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, valueStyle = {} }) {
  return (
    <div className="dk-stat-card">
      <span className="dk-stat-label">{label}</span>
      <span className="dk-stat-value" style={valueStyle}>{value}</span>
      {sub && <span className="dk-stat-sub">{sub}</span>}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="dk-page">
      <div className="dk-loading">
        <div className="dk-loading-spinner" />
        <p>Memuat detail kegiatan...</p>
      </div>
    </div>
  )
}

function ErrorState({ message, onBack }) {
  return (
    <div className="dk-page">
      <div className="dk-error-box">
        <p className="dk-error-msg">⚠ {message}</p>
        <button className="dk-btn-secondary" onClick={onBack}>← Kembali</button>
      </div>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const DocIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
)

const AssessIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)

// ─── Styles ───────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  @keyframes dk-spin { to { transform: rotate(360deg); } }
  @keyframes dk-fadein {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .dk-page {
    min-height: 100vh;
    background: #eef2f7;
    padding: 32px 24px 80px;
    font-family: 'Inter', 'Segoe UI', sans-serif;
    max-width: 860px;
    margin: 0 auto;
    animation: dk-fadein 0.3s ease;
  }

  .dk-back {
    background: none;
    border: none;
    color: #6b7280;
    font-size: 13px;
    font-family: inherit;
    font-weight: 500;
    cursor: pointer;
    padding: 0 0 20px;
    display: block;
    transition: color 0.15s;
  }
  .dk-back:hover { color: #1a237e; }

  /* ── Hero ── */
  .dk-hero {
    border-radius: 18px;
    padding: 32px 36px;
    margin-bottom: 16px;
    color: #fff;
  }

  .dk-priority-badge {
    display: inline-block;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 4px 12px;
    border-radius: 999px;
    margin-bottom: 14px;
  }

  .dk-hero-title {
    font-size: clamp(22px, 4vw, 32px);
    font-weight: 900;
    margin: 0 0 16px;
    line-height: 1.2;
    letter-spacing: -0.3px;
  }

  .dk-hero-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    font-size: 13.5px;
    font-weight: 500;
    opacity: 0.92;
  }

  .dk-hero-meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* ── Stats ── */
  .dk-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }

  @media (max-width: 540px) {
    .dk-stats { grid-template-columns: 1fr 1fr; }
    .dk-hero  { padding: 24px 22px; }
  }

  .dk-stat-card {
    background: #fff;
    border-radius: 14px;
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }

  .dk-stat-label {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #9ca3af;
  }

  .dk-stat-value {
    font-size: 20px;
    font-weight: 800;
    color: #1e293b;
    line-height: 1.2;
  }

  .dk-stat-sub {
    font-size: 11px;
    color: #9ca3af;
    font-weight: 500;
  }

  /* ── Section ── */
  .dk-section {
    background: #fff;
    border-radius: 14px;
    padding: 24px 26px;
    margin-bottom: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }

  .dk-section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 700;
    color: #1a237e;
    margin: 0 0 16px;
  }

  .dk-desc {
    font-size: 14.5px;
    color: #374151;
    line-height: 1.75;
    margin: 0;
  }

  /* ── Variables grid ── */
  .dk-vars-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .dk-var-chip {
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    padding: 10px 14px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 130px;
    flex: 1;
  }

  .dk-var-score {
    border-style: dashed;
  }

  .dk-var-name {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #9ca3af;
  }

  .dk-var-value {
    font-size: 15px;
    font-weight: 700;
    color: #1e293b;
  }

  /* ── Note ── */
  .dk-note {
    font-size: 14px;
    color: #374151;
    line-height: 1.7;
    padding: 14px 18px;
    border-left: 3px solid #eab308;
    background: #fefce8;
    border-radius: 0 10px 10px 0;
  }

  /* ── Actions ── */
  .dk-actions {
    display: flex;
    gap: 12px;
    margin-top: 4px;
  }

  .dk-btn-primary {
    flex: 1;
    background: #1a237e;
    color: #fff;
    border: none;
    border-radius: 12px;
    padding: 14px 24px;
    font-size: 15px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.18s, transform 0.1s;
  }
  .dk-btn-primary:hover:not(:disabled) { background: #283593; }
  .dk-btn-primary:active:not(:disabled) { transform: scale(0.99); }
  .dk-btn-primary:disabled { opacity: 0.75; cursor: default; }

  .dk-btn-secondary {
    background: #fff;
    color: #374151;
    border: 1.5px solid #d1d5db;
    border-radius: 12px;
    padding: 14px 24px;
    font-size: 15px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.18s, border-color 0.18s;
    white-space: nowrap;
  }
  .dk-btn-secondary:hover { background: #f9fafb; border-color: #9ca3af; }

  /* ── Loading / Error ── */
  .dk-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 80px 0;
    color: #6b7280;
    font-size: 14px;
  }

  .dk-loading-spinner {
    width: 36px; height: 36px;
    border: 3px solid #e2e8f0;
    border-top-color: #1a237e;
    border-radius: 50%;
    animation: dk-spin 0.8s linear infinite;
  }

  .dk-error-box {
    background: #fef2f2;
    border: 1px solid #fca5a5;
    border-radius: 14px;
    padding: 32px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .dk-error-msg {
    color: #dc2626;
    font-size: 14px;
    font-weight: 500;
    margin: 0;
  }
`
