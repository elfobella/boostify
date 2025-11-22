"use client"

import { useChat } from '@/hooks/useChat'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'

interface ChatWindowProps {
  chatId: string
}

export function ChatWindow({ chatId }: ChatWindowProps) {
  const { messages, isLoading, sendMessage } = useChat(chatId)
  const inputDisabled = isLoading && messages.length === 0

  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-lg border border-gray-800">
      <MessageList messages={messages} isLoading={isLoading} />
      <ChatInput onSend={sendMessage} disabled={inputDisabled} />
    </div>
  )
}

