import { useNavigate } from 'react-router-dom'
import { Clock, Calendar, CalendarDays, ChevronRight, CheckCircle2 } from 'lucide-react'
import { daysLeft, formatDate } from '../utils/dateHelpers'
import { getCategory } from '../utils/taskHelpers'
import {
  getPriorityClass,
  PRIORITY_BADGE_STYLES,
  PRIORITY_BOX_STYLES_400,
  PRIORITY_BOX_STYLES_500,
} from '../utils/priorityHelpers'

/**
 * Component reusable TaskCard yang menggabungkan visual dan fungsionalitas dari
 * PriorityTaskCard (Dashboard) dan KegiatanCard (Semua Kegiatan).
 *
 * @param {object} props
 * @param {object} props.row - Data kegiatan/task dari database
 * @param {string} [props.mode='kegiatan'] - Mode visual: 'priority' (kartu dashboard besar) atau 'kegiatan' (kartu daftar normal)
 * @param {boolean} [props.showDeadline=true] - Menampilkan informasi deadline (sisa hari + tanggal deadline)
 * @param {boolean} [props.showStatus=true] - Menampilkan badge status prioritas/selesai/terlambat
 * @param {boolean} [props.showDayBox=true] - Menampilkan kotak sisa hari prominent di sebelah kanan
 * @param {boolean} [props.clickable=true] - Jika true, memberikan hover effects dan cursor pointer
 * @param {function} [props.onClick] - Custom click handler. Jika kosong dan clickable=true, akan bernavigasi ke detail
 */
export default function TaskCard({
  row,
  mode = 'kegiatan',
  showDeadline = true,
  showStatus = true,
  showDayBox = true,
  clickable = true,
  onClick,
}) {
  const navigate = useNavigate()

  // Extract task properties
  const title = row?.judul || ''
  const deadline = row?.deadline_at
  const priorityScore = Number(row?.total_priority_score || 0)

  // Resolve classification using helpers
  const category = getCategory(row)
  const priorityClass = getPriorityClass(priorityScore)
  const left = daysLeft(deadline)

  const isPriorityMode = mode === 'priority'

  // 1. Build Styling Class Names based on Mode and Category
  let cardClass = ''
  let titleClass = ''
  let metaClass = ''
  let badgeStyle = ''
  let boxStyle = ''

  if (isPriorityMode) {
    // Styling exact to PriorityTaskCard
    cardClass = 'bg-white border border-blue-100 rounded-3xl p-7 shadow-sm transition'
    if (clickable) {
      cardClass += ' hover:shadow-md cursor-pointer'
    }
    titleClass = 'text-2xl font-bold text-blue-950'
    metaClass = 'flex flex-wrap items-center gap-8 mt-4 text-slate-600'
    badgeStyle = PRIORITY_BADGE_STYLES[priorityClass] || 'bg-gray-100 text-gray-600'
    boxStyle = PRIORITY_BOX_STYLES_500[priorityClass] || 'bg-gray-500'
  } else {
    // Styling exact to KegiatanCard
    const cardBgBorder = {
      selesai:      'bg-emerald-50 border-emerald-200',
      terlambat:    'bg-slate-100 border-slate-300',
      dalam_proses: 'bg-white border-blue-100',
    }[category] || 'bg-white border-blue-100'

    cardClass = `border rounded-2xl px-6 py-5 shadow-sm transition-all ${cardBgBorder}`
    if (clickable) {
      cardClass += ' hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
    }

    titleClass = {
      selesai:      'text-emerald-800',
      terlambat:    'text-slate-400 line-through',
      dalam_proses: 'text-blue-950',
    }[category] || 'text-blue-950'
    titleClass += ' text-lg font-bold truncate'

    metaClass = {
      selesai:      'text-emerald-500',
      terlambat:    'text-slate-400',
      dalam_proses: 'text-slate-500',
    }[category] || 'text-slate-500'
    metaClass += ' flex flex-wrap items-center gap-5 mt-3 text-sm'

    badgeStyle = PRIORITY_BADGE_STYLES[priorityClass] || 'bg-slate-100 text-slate-500'
    boxStyle = PRIORITY_BOX_STYLES_400[priorityClass] || 'bg-slate-400'
  }

  // Handle click action
  const handleClick = (e) => {
    if (!clickable) return
    if (onClick) {
      onClick(e)
    } else if (row?.id) {
      navigate(`/dashboard/detail/${row.id}`)
    }
  }

  // Keyboard accessibility
  const handleKeyDown = (e) => {
    if (clickable && e.key === 'Enter') {
      handleClick(e)
    }
  }

  // 2. Render badge status
  const renderBadge = () => {
    if (!showStatus) return null

    // For non-priority mode (kegiatan list), completed/overdue has unique badges
    if (!isPriorityMode) {
      if (category === 'selesai') {
        return (
          <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-emerald-100 text-emerald-600">
            Selesai
          </span>
        )
      }
      if (category === 'terlambat') {
        return (
          <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-slate-200 text-slate-500">
            Terlambat
          </span>
        )
      }
    }

    // Default priority badge
    return (
      <span
        className={`rounded-full uppercase tracking-wide font-bold ${
          isPriorityMode ? 'px-4 py-1 text-sm' : 'px-3 py-0.5 text-xs'
        } ${badgeStyle}`}
      >
        {priorityClass}
      </span>
    )
  }

  // 3. Render Right-Hand Side Days-Left Box (DayBox)
  const renderDayBox = () => {
    if (!showDayBox) return null

    if (!isPriorityMode) {
      if (category === 'selesai') {
        return (
          <div className="w-20 h-20 rounded-2xl bg-emerald-500 flex flex-col items-center justify-center text-white shrink-0">
            <CheckCircle2 size={28} strokeWidth={2.5} />
            <span className="text-[10px] font-semibold mt-1 opacity-90">selesai</span>
          </div>
        )
      }

      if (category === 'terlambat') {
        return (
          <div className="w-20 h-20 rounded-2xl bg-slate-400 flex flex-col items-center justify-center text-white shrink-0">
            <span className="text-3xl font-black leading-none">{left === null ? '?' : Math.abs(left)}</span>
            <span className="text-[10px] font-semibold mt-1 opacity-90">terlambat</span>
          </div>
        )
      }
    }

    // Priority mode or default active in-progress day box
    const boxSize = isPriorityMode ? 'w-24 h-24' : 'w-20 h-20'
    const textNumber = isPriorityMode ? 'text-4xl' : 'text-3xl'
    const textLabel = isPriorityMode ? 'text-xs mt-1' : 'text-[10px] mt-1'
    const finalBoxBg = isPriorityMode && category === 'selesai' ? 'bg-green-500' : boxStyle

    return (
      <div className={`${boxSize} rounded-2xl flex flex-col items-center justify-center text-white shrink-0 ${finalBoxBg}`}>
        <span className={`${textNumber} font-black leading-none`}>
          {left === null ? '?' : Math.abs(left)}
        </span>
        <span className={`${textLabel} font-semibold opacity-90`}>
          {left !== null && left < 0 ? 'terlambat' : 'hari'}
        </span>
      </div>
    )
  }

  return (
    <article
      onClick={handleClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? handleKeyDown : undefined}
      className={cardClass}
    >
      <div className="flex items-center justify-between gap-6">
        
        {/* Left details pane */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-4">
            <h3 className={titleClass}>{title}</h3>
            {renderBadge()}
          </div>

          {showDeadline && (
            <div className={metaClass}>
              <div className="flex items-center gap-2">
                <Clock size={isPriorityMode ? 18 : 14} className="shrink-0" />
                <span className={isPriorityMode ? 'text-base' : ''}>
                  {left === null
                    ? '-'
                    : left < 0
                      ? `Terlewat ${Math.abs(left)} hari`
                      : `Sisa ${left} hari`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isPriorityMode ? (
                  <CalendarDays size={18} className="shrink-0" />
                ) : (
                  <Calendar size={14} className="shrink-0" />
                )}
                <span className={isPriorityMode ? 'text-base' : ''}>
                  Deadline: {formatDate(deadline, isPriorityMode ? 'short' : 'short')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right decoration/DayBox pane */}
        <div className="flex items-center gap-3">
          {renderDayBox()}
          {!isPriorityMode && (
            <ChevronRight size={18} strokeWidth={2.5} className="text-slate-300 shrink-0" />
          )}
        </div>

      </div>
    </article>
  )
}
