import type { TicketStatus, TaskType } from '../types'

export const statusColors: Record<TicketStatus, string> = {
  TODO: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  IN_REVIEW: 'bg-purple-100 text-purple-700',
  DONE: 'bg-green-100 text-green-700',
  BLOCKED: 'bg-red-100 text-red-700',
  ASSIGNED_TO_AI: 'bg-yellow-100 text-yellow-700',
  NEEDS_MORE_INFO: 'bg-orange-100 text-orange-700',
}

export const statusLabel: Record<TicketStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
  BLOCKED: 'Blocked',
  ASSIGNED_TO_AI: 'Assign to AI',
  NEEDS_MORE_INFO: 'Needs Info',
}

export const typeColors: Record<TaskType, string> = {
  DEV: 'bg-indigo-100 text-indigo-700',
  DOC: 'bg-teal-100 text-teal-700',
  BUG: 'bg-red-100 text-red-700',
}
