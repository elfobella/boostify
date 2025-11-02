"use client"

import { useEffect, useRef, useState } from 'react'
import { Message } from '@/hooks/useChat'
import { MessageBubble } from './MessageBubble'
import { Loader2, ChevronDown } from 'lucide-react'

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const prevMessagesLengthRef = useRef<number>(0)
  const [showScrollButton, setShowScrollButton] = useState(false)

  const isNearBottom = () => {
    if (!scrollContainerRef.current) return true
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    return distanceFromBottom < 100
  }

  const scrollToBottom = (smooth = true) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      })
    }
  }

  // Auto-scroll when new messages arrive (only if user is near bottom)
  useEffect(() => {
    const newMessagesLength = messages.length
    const prevMessagesLength = prevMessagesLengthRef.current
    
    if (newMessagesLength > prevMessagesLength && isNearBottom()) {
      scrollToBottom()
    }
    
    prevMessagesLengthRef.current = newMessagesLength
  }, [messages])

  // Check scroll position
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      setShowScrollButton(!isNearBottom())
    }

    container.addEventListener('scroll', handleScroll)
    handleScroll() // Initial check
    
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Initial scroll to bottom
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      scrollToBottom(false) // Instant scroll on initial load
    }
  }, [isLoading])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          <p className="text-sm text-gray-400">Loading messages...</p>
        </div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-gray-400">No messages yet</p>
          <p className="text-xs text-gray-500 mt-2">
            Start the conversation!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 relative overflow-hidden">
      <div 
        ref={scrollContainerRef}
        className="h-full overflow-y-auto px-4 py-4 space-y-2"
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-4 right-4 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all hover:scale-110 z-10"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}

