"use client"

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export interface Message {
  id: string
  chat_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'image' | 'file' | 'system'
  read_at: string | null
  created_at: string
  sender?: {
    id: string
    email: string
    name: string | null
    image: string | null
    role: string | null
  }
}

export function useChat(chatId: string | null) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch initial messages
  useEffect(() => {
    if (!chatId || !session) return

    const fetchMessages = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/chats/${chatId}/messages`)
        if (!response.ok) {
          throw new Error('Failed to load messages')
        }
        const data = await response.json()
        setMessages(data.messages || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load messages')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMessages()
  }, [chatId, session])

  // Poll for new messages (since we don't use Supabase Auth, Realtime won't work with RLS)
  useEffect(() => {
    if (!chatId || !session) return

    let isPageVisible = true
    
    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const pollInterval = setInterval(async () => {
      // Only poll if page is visible
      if (!isPageVisible) return
      
      try {
        const response = await fetch(`/api/chats/${chatId}/messages`)
        if (response.ok) {
          const data = await response.json()
          setMessages(data.messages || [])
        }
      } catch (err) {
        // Silently handle errors during polling
      }
    }, 1500) // Poll every 1.5 seconds

    return () => {
      clearInterval(pollInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [chatId, session])

  const sendMessage = useCallback(async (content: string) => {
    if (!chatId || !session) {
      throw new Error('Chat ID or session is missing')
    }

    try {
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          message_type: 'text',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }

      const data = await response.json()
      
      // Message will be added via polling
      return data.message
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
      throw err
    }
  }, [chatId, session])

  const markAsRead = useCallback(async (messageId: string) => {
    // TODO: Implement read receipts
    console.log('Mark as read:', messageId)
  }, [])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    markAsRead,
  }
}

