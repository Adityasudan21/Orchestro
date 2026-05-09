import { statusColors, statusLabel } from '../../utils/statusColors'
import type { TicketStatus } from '../../types'

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[status]}`}>
      {statusLabel[status]}
    </span>
  )
}
