"use client"

import { useState, FormEvent } from 'react'
import { Send, Loader2 } from 'lucide-react'

interface ChatInputProps {
  onSend: (content: string) => Promise<void>
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!message.trim() || isSending || disabled) return

    const messageToSend = message.trim()
    setMessage('')
    setIsSending(true)

    try {
      await onSend(messageToSend)
    } catch (error) {
      console.error('Failed to send message:', error)
      // Restore message if sending failed
      setMessage(messageToSend)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="border-t border-gray-800 p-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-zinc-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSending || disabled}
          maxLength={1000}
        />
        <button
          type="submit"
          disabled={!message.trim() || isSending || disabled}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center min-w-[100px]"
        >
          {isSending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send
            </>
          )}
        </button>
      </form>
    </div>
  )
}

