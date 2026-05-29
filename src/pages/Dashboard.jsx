// ===== IMPORT STATEMENTS =====
// React hooks untuk state management (useState), side effects (useEffect), dan memoization (useMemo)
import { useEffect, useMemo, useState } from "react";

// Supabase client untuk akses database dan autentikasi
import { supabase } from "../lib/supabase";

// Router navigation untuk redirect ke halaman lain (contoh: halaman login)
import { useNavigate } from "react-router-dom";

// Component untuk menampilkan kartu statistik (Total Kegiatan, Menunggu, Sangat Prioritas)
import StatCard from "../components/StatCard";

// Component untuk menampilkan kartu task prioritas dengan detail kegiatan
import TaskCard from "../components/TaskCard";

// Import helper functions
import { daysLeft } from "../utils/dateHelpers";
import { getValue } from "../utils/taskHelpers";

// ===== MAIN DASHBOARD COMPONENT =====
/**
 * HALAMAN: Dashboard (Halaman utama aplikasi SINIGAS)
 * FUNGSI: Menampilkan ringkasan prioritas kegiatan/task user yang sedang berjalan
 * KONTEN:
 * 1. Header dengan judul "Dashboard"
 * 2. Statistik kegiatan (Total, Menunggu, Sangat Prioritas)
 * 3. Daftar kegiatan prioritas dengan urutan berdasarkan priority score
 * PENGGUNA: User yang sudah login dengan akun Supabase
 */
export default function Dashboard() {
  // Hook untuk navigasi ke halaman lain (digunakan: redirect ke /login atau /dashboard/semua)
  const navigate = useNavigate();

  // STATE 1: loading - Menunjukkan apakah data sedang dimuat dari database
  // DIGUNAKAN: Untuk menampilkan loading message saat fetch data dari Supabase
  const [loading, setLoading] = useState(true);

  // STATE 2: rows - Menyimpan daftar kegiatan prioritas dari database
  // DIGUNAKAN: Untuk menampilkan kartu-kartu kegiatan dan menghitung statistik
  const [rows, setRows] = useState([]);

  // STATE 3: error - Menyimpan pesan error jika terjadi kesalahan saat fetch data
  // DIGUNAKAN: Untuk menampilkan pesan error ke user jika query database gagal
  const [error, setError] = useState("");

  // ===== EFFECT: FETCH DATA DARI DATABASE =====
  /**
   * EFFECT: useEffect untuk mengambil data kegiatan dari Supabase saat component mount
   * KAPAN DIJALANKAN:
   * - Saat component pertama kali render
   * - Setiap kali jumlah rows berubah (dependency: rows.length)
   * LANGKAH-LANGKAH:
   * 1. Cek apakah user sudah login (getUser dari Supabase auth)
   * 2. Jika belum login, redirect ke halaman /login
   * 3. Query database view_priority_tasks dengan filter:
   *    - status ≠ 'selesai' (hanya kegiatan yang belum selesai)
   *    - user_id = user yang login (kegiatan milik user saja)
   *    - Urutkan berdasarkan total_priority_score (prioritas tinggi di atas)
   * 4. Simpan hasil ke state rows, atau tampilkan error message
   * 5. Set loading = false setelah selesai
   * CLEANUP: Mengubah flag 'alive' untuk membatalkan update state jika component unmount
   */
  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      setError("");

      // Cek user authentication status
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) {
        navigate("/login");
        return;
      }

      // Query data kegiatan dari view_priority_tasks di Supabase
      const { data, error } = await supabase
        .from("view_priority_tasks")
        .select("*")
        .not("status", "eq", "selesai")
        .eq("user_id", user.id)
        .order("total_priority_score", { ascending: false, nullsFirst: false });

      if (!alive) return;

      if (error) {
        setError(error.message || "Gagal mengambil data dashboard");
        setRows([]);
      } else {
        setRows(data || []);
      }

      setLoading(false);
    };

    load();
    return () => {
      alive = false;
    };
  }, [rows.length]);

  //statcard
  /**
   * MEMO: useMemo untuk menghitung 3 statistik kegiatan
   * DIGUNAKAN: Menampilkan di 3 StatCard di bagian atas dashboard
   * DIHITUNG ULANG: Hanya saat rows berubah (dependency: rows)
   *
   * STATISTIK YANG DIHITUNG:
   * 1. total: Jumlah total kegiatan yang belum selesai
   * 2. urgent: Jumlah kegiatan dengan priority score ≥ 74 (sangat prioritas)
   * 3. dueSoon: Jumlah kegiatan yang deadline-nya dalam 0-3 hari ke depan
   */
  const stats = useMemo(() => {
    // Statistik 1: Total kegiatan (semua yang ditampilkan)
    const total = rows.length;

    // Statistik 2: Kegiatan sangat prioritas (priority score > 74)
    const urgent = rows.filter(
      (row) => Number(row.total_priority_score || 0) > 85,
    ).length;

    // statistik 3: Kegiatan yang sudah terlambat
    const lateAssignments = rows.filter((row) => {
      const left = daysLeft(row["deadline_at"]);
      return left !== null && left < 0;
    }).length;

    return { total, urgent, lateAssignments };
  }, [rows]);

  // ===== RENDER DASHBOARD UI =====
  return (
    // Container utama dashboard dengan padding responsive
    <section className="px-6 py-8 lg:px-10">
      {/* BAGIAN 1: HEADER DASHBOARD */}
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight text-blue-950">
          Dashboard
        </h1>
        <p className="mt-2 text-slate-600">Ringkasan prioritas tugas anda.</p>
      </div>

      {/* BAGIAN 2: KARTU STATISTIK KEGIATAN */}
      {/* Menampilkan 3 kartu: Total Kegiatan, Menunggu (≤3 hari), Sangat Prioritas */}
      {/* Layout: 1 kolom di mobile, 2 kolom di tablet, 3 kolom di desktop */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Kartu 1: Total kegiatan (semua status) */}
        <StatCard
          title="Total Kegiatan"
          value={stats.total}
          accent="text-blue-500"
        />

        {/* Kartu 2: Kegiatan dengan deadline yang sudah lewat (late) */}
        <StatCard
          title="Terlambat"
          value={stats.lateAssignments}
          accent="text-slate-500"
        />

        {/* Kartu 3: Kegiatan dengan priority score sangat tinggi (urgent) */}
        <StatCard
          title="Prioritas Sangat Tinggi"
          value={stats.urgent}
          accent="text-red-600"
        />
      </div>

      {/* BAGIAN 3: HEADER DAFTAR KEGIATAN + TOMBOL LIHAT SEMUA */}
      <div className="mt-10 flex items-center justify-between">
        <h3 className="text-2xl font-bold text-blue-950">Kegiatan Prioritas</h3>

        {/* Tombol untuk redirect ke halaman /dashboard/semua (melihat semua kegiatan) */}
        <button
          onClick={() => navigate("/dashboard/semua")}
          className="text-sm font-semibold text-blue-950 hover:underline"
          type="button"
        >
          Lihat Semua →
        </button>
      </div>

      {/* BAGIAN 4: DAFTAR KEGIATAN PRIORITAS */}
      {/* Menampilkan berbagai kondisi: loading, error, empty state, atau list kegiatan */}
      <div className="mt-5 space-y-4">
        {/* KONDISI 1: LOADING STATE */}
        {/* Tampil saat data sedang diambil dari database */}
        {loading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-500 shadow-sm">
            Memuat data prioritas...
          </div>
        )}

        {/* KONDISI 2: ERROR STATE */}
        {/* Tampil jika terjadi error saat query database */}
        {!loading && error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        )}

        {/* KONDISI 3: EMPTY STATE */}
        {/* Tampil jika tidak ada data kegiatan (tabel view_priority_tasks kosong) */}
        {!loading && !error && rows.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-500 shadow-sm">
            Belum ada data pada view_priority_tasks.
          </div>
        )}

        {/* KONDISI 4: DAFTAR KEGIATAN */}
        {/* Render PriorityTaskCard untuk setiap kegiatan yang didapat dari database */}
        {/* Diurutkan berdasarkan total_priority_score (tinggi ke rendah) */}
        {!loading &&
          !error &&
          rows.map((row) => (
            <TaskCard key={row.id} row={row} mode="priority" />
          ))}
      </div>
    </section>
  );
}
