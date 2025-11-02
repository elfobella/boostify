"use client"

import { Message } from '@/hooks/useChat'
import { useSession } from 'next-auth/react'
import Image from 'next/image'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { data: session } = useSession()
  const isOwnMessage = message.sender?.email === session?.user?.email

  // Format timestamp
  const timestamp = new Date(message.created_at).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  // Check if it's a system message
  const isSystemMessage = message.message_type === 'system'

  return (
    <div
      className={`flex w-full mb-4 ${
        isOwnMessage ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`flex max-w-[75%] ${
          isOwnMessage ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {/* Avatar */}
        {!isOwnMessage && !isSystemMessage && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden mr-2 mt-1">
            {message.sender?.image ? (
              <Image
                src={message.sender.image}
                alt={message.sender.name || 'User'}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                {(message.sender?.name?.[0] || 'U').toUpperCase()}
              </div>
            )}
          </div>
        )}

        {/* Message bubble */}
        <div className="flex flex-col">
          {/* Sender name */}
          {!isOwnMessage && !isSystemMessage && message.sender?.name && (
            <span className="text-xs text-gray-400 mb-1 px-2">
              {message.sender.name}
            </span>
          )}

          {/* Message content */}
          <div
            className={`px-4 py-2 rounded-lg ${
              isSystemMessage
                ? 'bg-gray-800/50 text-gray-400 border border-gray-700'
                : isOwnMessage
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-gray-100'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>

          {/* Timestamp */}
          <span
            className={`text-xs text-gray-500 mt-1 px-2 ${
              isOwnMessage ? 'text-right' : 'text-left'
            }`}
          >
            {timestamp}
          </span>
        </div>
      </div>
    </div>
  )
}

