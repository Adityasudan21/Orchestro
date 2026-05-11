import { useState, useRef, useEffect } from 'react'
import { statusLabel } from '../../utils/statusColors'
import type { TicketStatus } from '../../types'

const STATUSES: TicketStatus[] = [
  'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED', 'ASSIGNED_TO_AI', 'NEEDS_MORE_INFO',
]

const statusDot: Record<TicketStatus, string> = {
  TODO: 'bg-gray-400',
  IN_PROGRESS: 'bg-blue-500',
  IN_REVIEW: 'bg-purple-500',
  DONE: 'bg-green-500',
  BLOCKED: 'bg-red-500',
  ASSIGNED_TO_AI: 'bg-yellow-500',
  NEEDS_MORE_INFO: 'bg-orange-500',
}

const statusPillBg: Record<TicketStatus, string> = {
  TODO: 'bg-gray-100 text-gray-700 border-gray-200 hover:border-gray-300',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-300',
  IN_REVIEW: 'bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-300',
  DONE: 'bg-green-50 text-green-700 border-green-200 hover:border-green-300',
  BLOCKED: 'bg-red-50 text-red-700 border-red-200 hover:border-red-300',
  ASSIGNED_TO_AI: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:border-yellow-300',
  NEEDS_MORE_INFO: 'bg-orange-50 text-orange-700 border-orange-200 hover:border-orange-300',
}

interface Props {
  value: TicketStatus
  onChange: (s: TicketStatus) => void
  disabled?: boolean
  disabledStatuses?: TicketStatus[]
}

export function StatusSelect({ value, onChange, disabled, disabledStatuses = [] }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-colors disabled:opacity-50 ${statusPillBg[value]}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${statusDot[value]}`} />
        {statusLabel[value]}
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="opacity-60">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 w-52 rounded-lg border border-gray-200 bg-white shadow-lg shadow-slate-900/10 py-1 overflow-hidden">
          {STATUSES.map((s) => {
            const isLocked = disabledStatuses.includes(s)
            return (
              <button
                key={s}
                type="button"
                disabled={isLocked}
                onClick={() => { onChange(s); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors
                  ${isLocked ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50'}
                  ${s === value ? 'bg-slate-50 font-semibold text-slate-900' : 'text-gray-700'}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusDot[s]}`} />
                <span className="flex-1">{statusLabel[s]}</span>
                {isLocked && (
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" className="text-gray-400">
                    <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
                {s === value && !isLocked && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6.5L5 9.5L10 3" stroke="#3B5BDB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
