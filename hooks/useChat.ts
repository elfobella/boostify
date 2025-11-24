"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { supabase } from '@/lib/supabase'

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
  const senderCacheRef = useRef<Map<string, Message['sender'] | undefined>>(new Map())

  const attachSenderInfo = useCallback(
    (message: Message): Message => {
      const cache = senderCacheRef.current
      let sender = message.sender

      if (!sender) {
        if (message.sender_id === session?.user?.id && session?.user) {
          sender = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.name || null,
            image: session.user.image || null,
            role: (session.user as any)?.role ?? null,
          }
        } else {
          sender = cache.get(message.sender_id) ?? undefined
        }
      }

      if (sender) {
        cache.set(message.sender_id, sender)
      }

      return { ...message, sender }
    },
    [session]
  )

  const fetchMessages = useCallback(async (showLoading = true) => {
    if (!chatId || !session) return
    if (showLoading) {
      setIsLoading(true)
    }
    setError(null)
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`)
      if (!response.ok) {
        throw new Error('Failed to load messages')
      }
      const data = await response.json()
      const fetchedMessages: Message[] = data.messages || []

      // Populate sender cache for realtime usage
      const cache = senderCacheRef.current
      cache.clear()
      fetchedMessages.forEach((msg) => {
        if (msg.sender) {
          cache.set(msg.sender_id, msg.sender)
        }
      })

      setMessages(fetchedMessages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages')
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }, [chatId, session])

  // Fetch initial messages
  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // Subscribe to realtime updates
  useEffect(() => {
    if (!chatId || !supabase || !session) return

    const client = supabase

    const channel = client
      .channel(`chat-messages:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMessage = attachSenderInfo(payload.new as Message)
          setMessages((prev) => {
            if (prev.some((msg) => msg.id === newMessage.id)) {
              return prev
            }
            return [...prev, newMessage].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const updatedMessage = attachSenderInfo(payload.new as Message)
          setMessages((prev) =>
            prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const deletedMessage = payload.old as Message
          setMessages((prev) => prev.filter((msg) => msg.id !== deletedMessage.id))
        }
      )
      .subscribe()

    return () => {
      client.removeChannel(channel)
    }
  }, [chatId, session, attachSenderInfo])

  // Polling fallback to ensure updates even if realtime misses events
  useEffect(() => {
    if (!chatId || !session) return

    const interval = setInterval(() => {
      fetchMessages(false)
    }, 4000) // every 4 seconds

    return () => {
      clearInterval(interval)
    }
  }, [chatId, session, fetchMessages])

  const sendMessage = useCallback(async (content: string) => {
    if (!chatId || !session) {
      throw new Error('Chat ID or session is missing')
    }

    const optimisticId = `temp-${Date.now()}`
    const createdAt = new Date().toISOString()
    const optimisticMessage: Message = attachSenderInfo({
      id: optimisticId,
      chat_id: chatId,
      sender_id: session.user.id,
      content: content.trim(),
      message_type: 'text',
      read_at: null,
      created_at: createdAt,
    } as Message)

    setMessages((prev) => [...prev, optimisticMessage])

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
      
      if (data.message) {
        const savedMessage = attachSenderInfo(data.message)
        setMessages((prev) =>
          prev.map((msg) => (msg.id === optimisticId ? savedMessage : msg))
        )
      }

      return data.message
    } catch (err) {
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
      setError(err instanceof Error ? err.message : 'Failed to send message')
      throw err
    }
  }, [chatId, session, attachSenderInfo])

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

