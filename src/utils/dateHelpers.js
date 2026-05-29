/**
 * Menghitung sisa hari hingga deadline.
 * @param {string|Date} deadline - Tanggal deadline dari database
 * @returns {number|null} Jumlah hari tersisa (positif/negatif) atau null jika tidak ada deadline
 */

// "11-11-2024" -> 11 November 2024
export function daysLeft(deadline) {
  if (!deadline) return null;
  const d = new Date(deadline);
  const now = new Date();

  // different => jarak antara deadline dan sekarang dalam milidetik
  const diff = d.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Memformat tanggal menjadi format Indonesia yang mudah dibaca.
 * @param {string|Date} value - Tanggal input
 * @param {string} monthFormat - Format bulan ('short' atau 'long')
 * @returns {string} Tanggal terformat (contoh: "15 Jan 2024" atau "15 Januari 2024")
 */
export function formatDate(value, monthFormat = "short") {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: monthFormat,
    year: "numeric",
  });
}

/**
 * Memformat selisih waktu dari tanggal input hingga saat ini dalam format relatif.
 * @param {string|Date} dateStr - Tanggal input
 * @returns {string} Waktu relatif (contoh: "Baru saja", "5 menit yang lalu")
 */
export function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit yang lalu`;
  if (hours < 24) return `${hours} jam yang lalu`;
  return `${days} hari yang lalu`;
}
