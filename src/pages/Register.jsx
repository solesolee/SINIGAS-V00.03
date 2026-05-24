import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, CheckCircle, XCircle } from 'lucide-react'

export default function Register() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  })

  const [loading, setLoading] = useState(false)
  const [toast, setToast]     = useState(null)

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (message, type = 'info') => setToast({ message, type })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleRegister = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      showToast('Konfirmasi password tidak sama', 'error')
      return
    }

    try {
      setLoading(true)
      const fakeEmail = `${formData.username}@sinigas.local`
      const { data, error } = await supabase.auth.signUp({
        email: fakeEmail,
        password: formData.password
      })

      if (error) { showToast(error.message, 'error'); return }

      const user = data.user
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({ id: user.id, username: formData.username })

        if (profileError) {
          console.error(profileError)
          showToast('Profile gagal dibuat', 'error')
          return
        }
      }

      showToast('Register berhasil', 'success')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      console.error(err)
      showToast('Terjadi kesalahan', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#eef3fa] flex items-center justify-center p-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className={`rounded-lg px-5 py-3 text-white shadow-lg flex items-center gap-3 ${
            toast.type === 'success' ? 'bg-emerald-500' :
            toast.type === 'error'   ? 'bg-red-500'     : 'bg-blue-500'
          }`}>
            {toast.type === 'success' && <CheckCircle size={20} />}
            {toast.type === 'error'   && <XCircle size={20} />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
        <div className="flex flex-col items-center mb-8">
          {/* Logo — ganti dari '+' ke UserPlus icon */}
          <div className="w-20 h-20 bg-blue-900 rounded-2xl flex items-center justify-center text-white mb-4">
            <UserPlus size={36} />
          </div>

          <h1 className="text-4xl font-bold text-blue-900">Daftar Akun</h1>
          <p className="text-gray-500 mt-2 text-center">Buat akun SINIGAS</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block mb-2 font-medium">Username</label>
            <input
              type="text"
              name="username"
              placeholder="Masukkan username"
              value={formData.username}
              onChange={handleChange}
              className="w-full border rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Masukkan password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Konfirmasi Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Ulangi password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full border rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-900 hover:bg-blue-950 text-white font-semibold p-4 rounded-xl transition"
          >
            {loading ? 'Loading...' : 'Daftar Sekarang'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-500">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-blue-900 font-semibold">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  )
}