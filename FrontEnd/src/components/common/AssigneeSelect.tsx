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
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  // Focus the search input whenever the dropdown opens.
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0)
    else setQuery('')
  }, [open])

  const current = options.find((u) => u.id === value)

  // Show all options until 2 chars typed, then filter.
  const filtered = query.length >= 2
    ? options.filter((u) => u.username.toLowerCase().includes(query.toLowerCase()))
    : options

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
        <div className="absolute right-0 top-full mt-1 z-20 w-56 rounded-lg border border-gray-200 bg-white shadow-lg shadow-slate-900/10 overflow-hidden">
          {/* Search input */}
          <div className="px-2 pt-2 pb-1 border-b border-gray-100">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50 border border-gray-200 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100 transition">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" className="text-gray-400 flex-shrink-0">
                <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search member…"
                className="flex-1 bg-transparent text-xs outline-none placeholder-gray-400 text-gray-900"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
            {query.length === 1 && (
              <p className="text-[10px] text-gray-400 mt-1 px-1">Type one more character to search…</p>
            )}
          </div>

          {/* Options list */}
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 px-3 py-2 italic">No members found.</p>
            ) : (
              filtered.map((u) => (
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
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
