import { daysLeft } from './dateHelpers'

/**
 * Menentukan kategori status dari task berdasarkan status dan sisa hari.
 * @param {object} row - Object data kegiatan
 * @returns {string} Kategori ('selesai', 'terlambat', 'dalam_proses')
 */
export function getCategory(row) {
  if (!row) return 'dalam_proses'
  if (row.status === 'selesai') return 'selesai'
  const left = daysLeft(row.deadline_at)
  if (left !== null && left < 0) return 'terlambat'
  return 'dalam_proses'
}

/**
 * Menerjemahkan status teknis ke label status bahasa Indonesia yang mudah dipahami.
 * @param {string} status - Status teknis dari database ('belum_selesai', 'selesai', 'terlambat')
 * @returns {string} Label status bahasa Indonesia
 */
export function getStatusLabel(status) {
  return {
    belum_selesai: 'Dalam Proses',
    selesai:       'Selesai',
    terlambat:     'Terlambat',
  }[status] ?? status
}

/**
 * Mengambil nilai dari object dengan opsi fallback keys yang berurutan.
 * @param {object} row - Object data
 * @param {string[]} keys - Daftar key yang dicari secara berurutan
 * @param {any} [fallback='-'] - Nilai default jika tidak ditemukan
 * @returns {any} Nilai field pertama yang valid atau fallback
 */
export function getValue(row, keys, fallback = '-') {
  if (!row) return fallback
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return fallback
}
export default {
  getCategory,
  getStatusLabel,
  getValue
}
