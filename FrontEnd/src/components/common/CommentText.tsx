const MENTION_RE = /@[\w.]+/g

interface Props {
  content: string
  className?: string
}

export function CommentText({ content, className = 'text-sm text-gray-700 leading-relaxed mt-1 whitespace-pre-wrap' }: Props) {
  const parts: React.ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null

  MENTION_RE.lastIndex = 0
  while ((match = MENTION_RE.exec(content)) !== null) {
    if (match.index > last) {
      parts.push(content.slice(last, match.index))
    }
    parts.push(
      <span key={match.index} className="text-blue-600 font-medium">
        {match[0]}
      </span>
    )
    last = match.index + match[0].length
  }
  if (last < content.length) {
    parts.push(content.slice(last))
  }

  return <p className={className}>{parts}</p>
}
