import { useState, useRef, useEffect } from 'react'

interface Option {
  id: number
  username: string
  role: string
}

interface Props {
  value: number | null
  options: Option[]
  onChange: (id: number) => void
  disabled?: boolean
}

function initials(name: string) {
  return name[0].toUpperCase()
}

export function AssigneeSelect({ value, options, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const current = options.find((u) => u.id === value)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-gray-200 bg-white hover:border-gray-300 text-xs text-gray-900 transition-colors disabled:opacity-50"
      >
        <span className="w-5 h-5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center font-bold text-[10px]">
          {initials(current?.username ?? '?')}
        </span>
        <span className="max-w-[100px] truncate">{current?.username ?? 'Unassigned'}</span>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="opacity-60">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 w-52 rounded-lg border border-gray-200 bg-white shadow-lg shadow-slate-900/10 py-1 overflow-hidden">
          {options.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => { onChange(u.id); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-slate-50 transition-colors ${u.id === value ? 'bg-slate-50 font-semibold' : 'text-gray-700'}`}
            >
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center font-bold text-[10px]">
                {initials(u.username)}
              </span>
              <span className="flex-1 truncate">{u.username}</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">{u.role}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
