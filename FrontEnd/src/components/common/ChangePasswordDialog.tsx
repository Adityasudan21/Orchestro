import { useState } from 'react'
import { usersApi } from '../../api/users.api'
import { useAuth } from '../../context/AuthContext'

interface Props {
  open: boolean
  onClose: () => void
}

type VerifyStatus = 'idle' | 'checking' | 'valid' | 'invalid'

export function ChangePasswordDialog({ open, onClose }: Props) {
  const { updateCredentials } = useAuth()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [pending, setPending] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<VerifyStatus>('idle')

  if (!open) return null

  function validate(): string {
    if (!current || !next || !confirm) return 'All fields are required.'
    if (next.length < 6) return 'New password must be at least 6 characters.'
    if (next === current) return 'New password must differ from the current one.'
    if (next !== confirm) return 'New passwords do not match.'
    return ''
  }

  async function handleCurrentBlur() {
    if (!current) return
    setCurrentStatus('checking')
    try {
      await usersApi.verifyCurrentPassword(current)
      setCurrentStatus('valid')
    } catch (err: any) {
      setCurrentStatus(err?.response?.status === 400 ? 'invalid' : 'idle')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const msg = validate()
    if (msg) { setError(msg); return }
    setPending(true)
    setError('')
    try {
      await usersApi.changePassword(current, next)
      updateCredentials(next)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setCurrent(''); setNext(''); setConfirm('')
        setCurrentStatus('idle')
        onClose()
      }, 1200)
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 400) {
        setError('Current password is incorrect.')
        setCurrentStatus('invalid')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setPending(false)
    }
  }

  function handleClose() {
    setCurrent(''); setNext(''); setConfirm(''); setError(''); setSuccess(false)
    setCurrentStatus('idle')
    onClose()
  }

  function onCurrentChange(v: string) {
    setCurrent(v)
    setError('')
    setCurrentStatus('idle')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Change Password</h2>

        {success ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">Password updated successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type="password"
                  autoFocus
                  value={current}
                  onChange={(e) => onCurrentChange(e.target.value)}
                  onBlur={handleCurrentBlur}
                  className={`w-full border rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 ${
                    currentStatus === 'invalid'
                      ? 'border-red-400 focus:ring-red-400'
                      : currentStatus === 'valid'
                      ? 'border-green-400 focus:ring-green-400'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2">
                  {currentStatus === 'checking' && (
                    <svg className="w-4 h-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeDasharray="40 20" />
                    </svg>
                  )}
                  {currentStatus === 'valid' && (
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {currentStatus === 'invalid' && (
                    <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </span>
              </div>
              {currentStatus === 'invalid' && (
                <p className="text-[11px] text-red-600 mt-1">Current password is incorrect.</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">New Password</label>
              <input
                type="password"
                value={next}
                onChange={(e) => { setNext(e.target.value); setError('') }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError('') }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={pending}
                className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
              >
                {pending ? 'Saving…' : 'Update Password'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
