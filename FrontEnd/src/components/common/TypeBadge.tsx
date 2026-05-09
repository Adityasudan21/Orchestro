import { typeColors } from '../../utils/statusColors'
import type { TaskType } from '../../types'

export function TypeBadge({ type }: { type: TaskType }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeColors[type]}`}>
      {type}
    </span>
  )
}
