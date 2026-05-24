import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, CheckCircle, XCircle } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [toast, setToast]       = useState(null)

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (message, type = 'info') => setToast({ message, type })

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const fakeEmail = `${username}@sinigas.local`
      const { error } = await supabase.auth.signInWithPassword({ email: fakeEmail, password })
      if (error) { showToast('Username atau password salah', 'error'); return }
      showToast('Login berhasil', 'success')
      setTimeout(() => navigate('/dashboard'), 2000)
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
          {/* Logo — ganti dari '+' ke LogIn icon */}
          <div className="w-20 h-20 bg-blue-900 rounded-2xl flex items-center justify-center text-white mb-4">
            <LogIn size={36} />
          </div>

          <h1 className="text-4xl font-bold text-blue-900">Login</h1>
          <p className="text-gray-500 mt-2 text-center">Masuk ke akun SINIGAS</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block mb-2 font-medium">Username</label>
            <input
              type="text"
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Password</label>
            <input
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-900 hover:bg-blue-950 text-white font-semibold p-4 rounded-xl transition"
          >
            {loading ? 'Loading...' : 'Masuk'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-500">
          Belum punya akun?{' '}
          <Link to="/register" className="text-blue-900 font-semibold">
            Daftar di sini
          </Link>
        </p>
      </div>
    </div>
  )
}