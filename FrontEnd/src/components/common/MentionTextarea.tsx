import { useState, useRef, useEffect } from 'react'

interface UserOption {
  id: number
  username: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void
  placeholder?: string
  rows?: number
  className?: string
  users?: UserOption[]
}

export function MentionTextarea({ value, onChange, onSubmit, placeholder, rows = 2, className, users = [] }: Props) {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionStart, setMentionStart] = useState(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const filteredUsers = mentionQuery !== null
    ? users.filter(u => u.username.toLowerCase().startsWith(mentionQuery.toLowerCase())).slice(0, 6)
    : []

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMentionQuery(null)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    onChange(val)
    const cursor = e.target.selectionStart ?? val.length
    const textUpToCursor = val.slice(0, cursor)
    const match = textUpToCursor.match(/@([\w.]*)$/)
    if (match && users.length > 0) {
      setMentionQuery(match[1])
      setMentionStart(cursor - match[0].length)
      setActiveIndex(0)
    } else {
      setMentionQuery(null)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionQuery !== null && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex(i => (i + 1) % filteredUsers.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex(i => (i - 1 + filteredUsers.length) % filteredUsers.length)
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertMention(filteredUsers[activeIndex].username)
      } else if (e.key === 'Escape') {
        setMentionQuery(null)
      }
      return
    }
    if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
      e.preventDefault()
      onSubmit()
    }
  }

  function insertMention(username: string) {
    const cursorEnd = mentionStart + (mentionQuery?.length ?? 0) + 1
    const before = value.slice(0, mentionStart)
    const after = value.slice(cursorEnd)
    const newValue = `${before}@${username} ${after}`
    onChange(newValue)
    setMentionQuery(null)
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const pos = mentionStart + username.length + 2
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(pos, pos)
      }
    })
  }

  return (
    <div ref={containerRef} className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={className}
      />
      {mentionQuery !== null && filteredUsers.length > 0 && (
        <div className="absolute bottom-full mb-1 left-0 z-50 w-52 bg-white border border-gray-200 rounded-lg shadow-lg py-1 overflow-hidden">
          <p className="px-3 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Mention</p>
          {filteredUsers.map((u, i) => (
            <button
              key={u.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertMention(u.username) }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors ${
                i === activeIndex ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                {u.username[0].toUpperCase()}
              </span>
              {u.username}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
