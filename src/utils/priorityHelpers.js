// Reusable constants for priority thresholds
export const VERY_HIGH_PRIORITY = 85
export const HIGH_PRIORITY = 75
export const MEDIUM_PRIORITY = 50

// Constants for notification specific thresholds
export const NOTIF_VERY_HIGH_PRIORITY = 85
export const NOTIF_HIGH_PRIORITY = 75

/**
 * Mengklasifikasikan level prioritas berdasarkan score.
 * @param {number} score - Skor prioritas kegiatan
 * @param {object} [thresholds] - Custom thresholds jika dibutuhkan
 * @param {boolean} [isTitleCase] - Jika true, mengembalikan format title-case ("Sangat Tinggi", dll.)
 * @returns {string} Label prioritas ('SANGAT TINGGI', 'TINGGI', 'SEDANG', 'RENDAH')
 */
export function getPriorityClass(
  score,
  thresholds = { veryHigh: VERY_HIGH_PRIORITY, high: HIGH_PRIORITY, medium: MEDIUM_PRIORITY },
  isTitleCase = false
) {
  let label = 'RENDAH'
  if (score >= thresholds.veryHigh) {
    label = 'SANGAT TINGGI'
  } else if (score >= thresholds.high) {
    label = 'TINGGI'
  } else if (score >= thresholds.medium) {
    label = 'SEDANG'
  }

  if (isTitleCase) {
    return label
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  }
  return label
}

// Reusable color mapping objects for TailwindCSS
export const PRIORITY_BADGE_STYLES = {
  'SANGAT TINGGI': 'bg-red-100 text-red-600',
  'TINGGI':        'bg-orange-100 text-orange-600',
  'SEDANG':        'bg-yellow-100 text-yellow-700',
  'RENDAH':        'bg-blue-100 text-blue-600',
  'SELESAI':       'bg-emerald-100 text-emerald-600',
  'TERLAMBAT':     'bg-slate-200 text-slate-500',
  'DEFAULT':       'bg-gray-100 text-gray-600',
}

// For Dashboard card (PriorityTaskCard style)
export const PRIORITY_BOX_STYLES_500 = {
  'SANGAT TINGGI': 'bg-red-500',
  'TINGGI':        'bg-orange-500',
  'SEDANG':        'bg-yellow-500',
  'RENDAH':        'bg-blue-500',
  'SELESAI':       'bg-green-500',
  'TERLAMBAT':     'bg-slate-500',
  'DEFAULT':       'bg-gray-500',
}

// For Semua Kegiatan card (KegiatanCard style)
export const PRIORITY_BOX_STYLES_400 = {
  'SANGAT TINGGI': 'bg-red-500',
  'TINGGI':        'bg-orange-400',
  'SEDANG':        'bg-yellow-400',
  'RENDAH':        'bg-blue-400',
  'SELESAI':       'bg-emerald-500',
  'TERLAMBAT':     'bg-slate-400',
  'DEFAULT':       'bg-gray-400',
}

// Theme colors configuration for Detail Page
export const PRIORITY_THEME = {
  'SANGAT TINGGI': {
    bg:     '#ef4444',
    badge:  { bg: 'rgba(255,255,255,0.25)', color: '#fff' },
  },
  TINGGI: {
    bg:     '#f97316',
    badge:  { bg: 'rgba(255,255,255,0.25)', color: '#fff' },
  },
  SEDANG: {
    bg:     '#eab308',
    badge:  { bg: 'rgba(0,0,0,0.15)', color: '#fff' },
  },
  RENDAH: {
    bg:     '#3b82f6',
    badge:  { bg: 'rgba(255,255,255,0.25)', color: '#fff' },
  },
  SELESAI: {
    bg:     '#10b981',
    badge:  { bg: 'rgba(255,255,255,0.25)', color: '#fff' },
  },
}
