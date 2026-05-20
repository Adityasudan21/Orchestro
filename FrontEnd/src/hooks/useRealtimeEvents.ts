import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'

interface RealtimeEvent {
  type: 'NOTIFICATION' | 'COMMENT_ADDED' | 'STATUS_CHANGED'
  targetUsername: string | null
  entityType: string | null
  entityId: number | null
  parentId: number | null
}

function handleEvent(event: RealtimeEvent, queryClient: ReturnType<typeof useQueryClient>) {
  switch (event.type) {
    case 'NOTIFICATION':
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      break

    case 'COMMENT_ADDED':
      if (event.entityType && event.entityId != null) {
        queryClient.invalidateQueries({
          queryKey: ['comments', event.entityType.toLowerCase(), event.entityId],
        })
      }
      break

    case 'STATUS_CHANGED':
      if (event.entityType === 'TASK' && event.entityId != null) {
        queryClient.invalidateQueries({ queryKey: ['task', event.entityId] })
        if (event.parentId != null) {
          queryClient.invalidateQueries({ queryKey: ['tasks', event.parentId] })
        }
      } else if (event.entityType === 'STORY' && event.entityId != null) {
        queryClient.invalidateQueries({ queryKey: ['story', event.entityId] })
        if (event.parentId != null) {
          queryClient.invalidateQueries({ queryKey: ['stories', event.parentId] })
        }
      }
      break
  }
}

export function useRealtimeEvents() {
  const { user, isGuest } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!user || isGuest) return

    const creds = sessionStorage.getItem('orchestro_creds')
    if (!creds) return

    const controller = new AbortController()
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    async function connect() {
      try {
        const response = await fetch('/api/events/stream', {
          headers: { Authorization: `Basic ${creds}` },
          signal: controller.signal,
        })

        if (!response.ok || !response.body) return

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (line.startsWith('data:')) {
              const json = line.slice(5).trim()
              if (json) {
                try {
                  handleEvent(JSON.parse(json) as RealtimeEvent, queryClient)
                } catch {
                  // malformed event — ignore
                }
              }
            }
          }
        }
      } catch {
        // ignore AbortError on cleanup; reconnect on any other error
      }

      if (!controller.signal.aborted) {
        reconnectTimer = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      controller.abort()
      if (reconnectTimer) clearTimeout(reconnectTimer)
    }
  }, [user?.id, isGuest, queryClient])
}
