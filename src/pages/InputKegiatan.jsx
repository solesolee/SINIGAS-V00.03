import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "belum_selesai", label: "Belum Selesai" },
  { value: "selesai",       label: "Selesai" },
  { value: "terlambat",     label: "Terlambat" },
];

const PRIORITY_VARIABLES = [
  {
    id: 1,
    label: "Jenis Kegiatan",
    options: [
      { id: 1,  label: "Individu" },
      { id: 2,  label: "Kelompok" },
      { id: 3,  label: "Quiz" },
      { id: 4,  label: "Ujian" },
    ],
  },
  {
    id: 2,
    label: "Dampak Nilai",
    options: [
      { id: 5,  label: "Besar" },
      { id: 6,  label: "Sedang" },
      { id: 7,  label: "Kecil" },
    ],
  },
  {
    id: 3,
    label: "Konsekuensi Telat",
    options: [
      { id: 8,  label: "Besar" },
      { id: 9,  label: "Sedang" },
      { id: 10, label: "Kecil" },
    ],
  },
  {
    id: 4,
    label: "Tingkat Kesulitan",
    options: [
      { id: 11, label: "Sulit" },
      { id: 12, label: "Sedang" },
      { id: 13, label: "Mudah" },
    ],
  },
];

// ─── Database Helpers ─────────────────────────────────────────────────────────

async function insertTask({ userId, judul, deskripsi, deadlineAt, status }) {
  const { data, error } = await supabase
    .from("tasks")
    .insert({ user_id: userId, judul, deskripsi, deadline_at: deadlineAt, status })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function insertTaskSelections(taskId, selections) {
  const rows = selections.map(({ variabelId, opsiId }) => ({
    task_id:               taskId,
    variabel_penilaian_id: variabelId,
    opsi_nilai_bobot_id:   opsiId,
  }));
  const { error } = await supabase.from("tasks_selection").insert(rows);
  if (error) throw error;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InputKegiatan() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    judul:      "",
    deskripsi:  "",
    deadlineAt: "",
    status:     "belum_selesai",
  });
  const [selections, setSelections] = useState({});
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  function handleFieldChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSelectionChange(variabelId, opsiId) {
    setSelections((prev) => ({ ...prev, [variabelId]: opsiId }));
  }

  function validate() {
    if (!form.judul.trim()) return "Nama kegiatan tidak boleh kosong.";
    if (!form.deadlineAt)   return "Deadline harus diisi.";
    const allSelected = PRIORITY_VARIABLES.every((v) => selections[v.id] != null);
    if (!allSelected)       return "Semua variabel penilaian prioritas harus dipilih.";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi telah berakhir. Silakan login kembali.");

      const taskId = await insertTask({
        userId:     user.id,
        judul:      form.judul.trim(),
        deskripsi:  form.deskripsi.trim(),
        deadlineAt: form.deadlineAt,
        status:     form.status,
      });

      const selectionRows = PRIORITY_VARIABLES.map((v) => ({
        variabelId: v.id,
        opsiId:     selections[v.id],
      }));
      await insertTaskSelections(taskId, selectionRows);

      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{css}</style>

      <div className="ik-page">
        {/* Page heading */}
        <div className="ik-heading">
          <h1 className="ik-title">Input Kegiatan Baru</h1>
          <p className="ik-subtitle">Tambahkan kegiatan baru ke dalam sistem SINIGAS</p>
        </div>

        {/* Form card */}
        <div className="ik-card">
          <form onSubmit={handleSubmit} noValidate>

            {/* Nama Kegiatan */}
            <div className="ik-field">
              <label className="ik-label" htmlFor="judul">
                Nama Kegiatan <span className="ik-req">*</span>
              </label>
              <input
                id="judul"
                name="judul"
                type="text"
                className="ik-input"
                placeholder="Contoh: Monitoring Wilayah Terpadu"
                value={form.judul}
                onChange={handleFieldChange}
                maxLength={200}
              />
            </div>

            {/* Deadline + Status row */}
            <div className="ik-row">
              <div className="ik-field">
                <label className="ik-label" htmlFor="deadlineAt">
                  Deadline <span className="ik-req">*</span>
                </label>
                <input
                  id="deadlineAt"
                  name="deadlineAt"
                  type="date"
                  className="ik-input"
                  value={form.deadlineAt}
                  onChange={handleFieldChange}
                />
              </div>

              <div className="ik-field">
                <label className="ik-label" htmlFor="status">
                  Status <span className="ik-req">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  className="ik-input ik-select"
                  value={form.status}
                  onChange={handleFieldChange}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority Variables — each as its own labeled dropdown */}
            <div className="ik-row">
              {PRIORITY_VARIABLES.map((variable) => (
                <div className="ik-field" key={variable.id}>
                  <label className="ik-label">
                    {variable.label} <span className="ik-req">*</span>
                  </label>
                  <select
                    className="ik-input ik-select"
                    value={selections[variable.id] ?? ""}
                    onChange={(e) =>
                      handleSelectionChange(variable.id, Number(e.target.value))
                    }
                  >
                    <option value="" disabled>Pilih opsi...</option>
                    {variable.options.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Deskripsi */}
            <div className="ik-field">
              <label className="ik-label" htmlFor="deskripsi">
                Deskripsi Kegiatan <span className="ik-req">*</span>
              </label>
              <textarea
                id="deskripsi"
                name="deskripsi"
                className="ik-input ik-textarea"
                placeholder="Jelaskan detail kegiatan yang akan dilakukan..."
                value={form.deskripsi}
                onChange={handleFieldChange}
                rows={5}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="ik-error" role="alert">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="ik-actions">
              <button
                type="submit"
                className="ik-btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <><SpinnerIcon /> Menyimpan...</>
                ) : (
                  <><PlusIcon /> Simpan Kegiatan</>
                )}
              </button>
              <button
                type="button"
                className="ik-btn-secondary"
                onClick={() => navigate("/dashboard")}
                disabled={loading}
              >
                Batal
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <span style={{
      display: "inline-block", width: 16, height: 16,
      border: "2px solid rgba(255,255,255,0.35)",
      borderTop: "2px solid #fff",
      borderRadius: "50%",
      animation: "ik-spin 0.7s linear infinite",
      marginRight: 8,
    }} />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  @keyframes ik-spin { to { transform: rotate(360deg); } }

  .ik-page {
    min-height: 100vh;
    background: #eef2f7;
    padding: 40px 24px 80px;
    font-family: 'Inter', 'Segoe UI', sans-serif;
    color: #1a1a2e;
    box-sizing: border-box;
  }

  .ik-heading {
    max-width: 800px;
    margin: 0 auto 24px;
  }

  .ik-title {
    font-size: 30px;
    font-weight: 800;
    color: #1a237e;
    margin: 0 0 6px;
    letter-spacing: -0.4px;
  }

  .ik-subtitle {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
  }

  .ik-card {
    background: #ffffff;
    border-radius: 16px;
    padding: 36px 40px;
    max-width: 800px;
    margin: 0 auto;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.04);
  }

  .ik-field {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin-bottom: 20px;
  }

  .ik-label {
    font-size: 13.5px;
    font-weight: 600;
    color: #374151;
  }

  .ik-req { color: #ef4444; }

  .ik-input {
    width: 100%;
    box-sizing: border-box;
    padding: 11px 14px;
    font-size: 14px;
    font-family: inherit;
    color: #111827;
    background: #ffffff;
    border: 1.5px solid #d1d5db;
    border-radius: 10px;
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s;
  }

  .ik-input::placeholder { color: #9ca3af; }

  .ik-input:focus {
    border-color: #1a237e;
    box-shadow: 0 0 0 3px rgba(26,35,126,0.1);
  }

  .ik-select {
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24'%3E%3Cpath stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 38px;
    cursor: pointer;
  }

  .ik-textarea {
    resize: vertical;
    min-height: 120px;
    line-height: 1.6;
  }

  /* 2-col grid for rows */
  .ik-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  @media (max-width: 560px) {
    .ik-row { grid-template-columns: 1fr; }
    .ik-card { padding: 24px 18px; }
    .ik-title { font-size: 24px; }
  }

  .ik-error {
    background: #fef2f2;
    border: 1px solid #fca5a5;
    color: #dc2626;
    border-radius: 10px;
    padding: 11px 14px;
    font-size: 13.5px;
    margin-bottom: 18px;
  }

  .ik-actions {
    display: flex;
    gap: 12px;
    margin-top: 4px;
  }

  .ik-btn-primary {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #1a237e;
    color: #ffffff;
    border: none;
    border-radius: 10px;
    padding: 13px 24px;
    font-size: 15px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.18s, transform 0.1s;
  }

  .ik-btn-primary:hover:not(:disabled) { background: #283593; }
  .ik-btn-primary:active:not(:disabled) { transform: scale(0.99); }
  .ik-btn-primary:disabled { opacity: 0.65; cursor: wait; }

  .ik-btn-secondary {
    background: #ffffff;
    color: #374151;
    border: 1.5px solid #d1d5db;
    border-radius: 10px;
    padding: 13px 28px;
    font-size: 15px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.18s, border-color 0.18s;
    white-space: nowrap;
  }

  .ik-btn-secondary:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #9ca3af;
  }

  .ik-btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
`;
