import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { setCredentials, clearCredentials } from '../api/axios'
import { authApi } from '../api/auth.api'
import { useAuth } from '../context/AuthContext'

// Deterministic "score" rows for the brand canvas (tailwind-only colors).
// Each entry: [leftOffset%, width%, tailwindBg].
const ROWS: Array<[number, number, string]> = [
  [12, 48, 'bg-blue-400'],
  [34, 32, 'bg-blue-600'],
  [8, 64, 'bg-blue-400/40'],
  [22, 40, 'bg-blue-400/20'],
  [46, 28, 'bg-blue-400'],
  [18, 54, 'bg-blue-600'],
  [10, 44, 'bg-blue-400/40'],
  [38, 36, 'bg-blue-400/20'],
  [14, 58, 'bg-blue-400'],
  [30, 30, 'bg-blue-600'],
  [24, 50, 'bg-blue-400/40'],
  [42, 24, 'bg-blue-400/20'],
  [16, 46, 'bg-blue-400'],
  [28, 38, 'bg-blue-600'],
]

export function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true })
    return null
  }

  async function handleGuestLogin() {
    setError('')
    setGuestLoading(true)
    try {
      setCredentials('guest', 'guest123')
      const user = await authApi.login()
      login('guest', 'guest123', user)
      navigate('/projects', { replace: true })
    } catch {
      clearCredentials()
      setError('Guest login unavailable. Contact your admin.')
      setGuestLoading(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      setCredentials(username, password)
      const user = await authApi.login()
      login(username, password, user)
      navigate('/dashboard', { replace: true })
    } catch {
      clearCredentials()
      setError('Incorrect password')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* LEFT — brand canvas */}
      <aside className="relative overflow-hidden bg-slate-900 text-white px-8 py-10 md:w-[56%] md:px-14 md:py-14 flex flex-col justify-between min-h-[280px]">
        {/* Wordmark */}
        <div className="relative z-10 inline-flex items-center gap-2 font-bold tracking-tight text-xl">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <circle cx="16" cy="16" r="13" stroke="white" strokeWidth="2.5" />
            <circle cx="26" cy="16" r="2.5" fill="#7AA2FF" />
          </svg>
          <span>Orchestro</span>
        </div>

        {/* Score visual — fades out at the bottom so the tagline stays clean */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 right-0 top-0 px-8 pt-32 md:px-14 md:pt-36 flex flex-col gap-3.5 opacity-90"
          style={{
            height: 'calc(100% - 220px)',
            WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 75%, transparent 100%)',
            maskImage: 'linear-gradient(180deg, #000 0%, #000 75%, transparent 100%)',
          }}
        >
          {ROWS.map(([offset, width, bg], i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-7 text-[10px] font-mono text-white/35">
                {String(i + 1).padStart(2, '0')}
              </div>
              <div className="relative flex-1 h-[18px]">
                <div className="absolute top-2 left-0 right-0 h-px bg-white/10" />
                <div
                  className={`absolute top-0 h-[18px] rounded ${bg}`}
                  style={{ left: `${offset}%`, width: `${width}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Tagline */}
        <div className="relative z-10 max-w-[460px] mt-8 md:mt-0">
          <p className="m-0 text-xs md:text-[13px] uppercase tracking-[0.06em] font-mono text-white/55">
            <span className="text-emerald-400">●</span>{' '}
            Run #4,218 · 12 services · all green
          </p>
          <h2 className="mt-3 text-2xl md:text-4xl font-semibold leading-tight tracking-tight">
            Every team, every job, in the same score.
          </h2>
        </div>
      </aside>

      {/* RIGHT — form */}
      <main className="flex-1 flex items-center justify-center px-6 py-10 md:px-12 md:py-12">
        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Sign in</h1>
            <p className="mt-1.5 text-sm text-gray-500">Use your Orchestro credentials to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
              <input
                type="text"
                required
                autoFocus
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm shadow-sm shadow-slate-900/20 transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">or</span></div>
          </div>

          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={guestLoading}
            className="w-full border border-gray-300 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            {guestLoading ? 'Signing in…' : 'Continue as Guest'}
          </button>

          <p className="mt-6 text-xs text-gray-400">
            Need an account? Ask your workspace admin to create one.
          </p>
        </div>
      </main>
    </div>
  )
}
