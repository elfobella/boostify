"use client"

import { Suspense, useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Navbar } from "@/app/components/navbar"
import { Footer } from "@/app/components/footer"
import { MessageCircle, Loader2, ArrowLeft } from "lucide-react"
import { ChatWindow } from "@/app/components/chat"
import Image from "next/image"

interface Chat {
  id: string
  order_id: string
  customer_id: string
  booster_id: string
  created_at: string
  updated_at: string
  status: string
  order?: {
    id: string
    game: string
    service_category: string
    status: string
  }
  customer?: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  booster?: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

function ChatsListContent() {
  const { data: session, status } = useSession()
  const [chats, setChats] = useState<Chat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (session?.user) {
      fetchChats()
    }
  }, [session])

  const fetchChats = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/chats/users')
      if (response.ok) {
        const data = await response.json()
        setChats(data.chats || [])
        
        // Auto-select first chat if available
        if (data.chats && data.chats.length > 0 && !selectedChatId) {
          setSelectedChatId(data.chats[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching chats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getOtherParticipant = (chat: Chat) => {
    if (!session?.user?.email) return null
    
    if (chat.customer?.email === session.user.email) {
      return chat.booster
    } else {
      return chat.customer
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 mt-16 py-12">
          <div className="container px-4 mx-auto">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 mt-16 py-12">
          <div className="container px-4 mx-auto">
            <div className="text-center py-20">
              <p className="text-gray-400 mb-4">Please sign in to view chats</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Mobile: Show list or chat based on selected state
  const showMobileChat = selectedChatId && isMobile

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1 mt-16">
        <div className="container px-4 mx-auto h-[calc(100vh-4rem)]">
          {/* Mobile View */}
          <div className="md:hidden h-full">
            {showMobileChat ? (
              // Mobile Chat View
              <div className="h-full flex flex-col bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-gray-800 rounded-2xl shadow-xl overflow-hidden">
                {/* Mobile Header with Back Button */}
                <div className="p-3 border-b border-gray-800 flex items-center gap-3">
                  <button
                    onClick={() => setSelectedChatId(null)}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5 text-gray-300" />
                  </button>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {(() => {
                      const chat = chats.find(c => c.id === selectedChatId)
                      const otherParticipant = chat ? getOtherParticipant(chat) : null
                      return (
                        <>
                          {otherParticipant?.image ? (
                            <Image
                              src={otherParticipant.image}
                              alt={otherParticipant.name || 'User'}
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-white">
                                {(otherParticipant?.name?.[0] || 'U').toUpperCase()}
                              </span>
                            </div>
                          )}
                          <h2 className="font-semibold text-gray-100 truncate text-sm">
                            {otherParticipant?.name || otherParticipant?.email || 'Unknown User'}
                          </h2>
                        </>
                      )
                    })()}
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ChatWindow chatId={selectedChatId} />
                </div>
              </div>
            ) : (
              // Mobile List View
              <div className="h-full flex flex-col bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-gray-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-4 border-b border-gray-800">
                  <h1 className="text-xl font-bold text-gray-100">Chats</h1>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  {chats.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">No chats yet</p>
                      <p className="text-sm text-gray-600">
                        Start a conversation
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {chats.map((chat) => {
                        const otherParticipant = getOtherParticipant(chat)
                        return (
                          <button
                            key={chat.id}
                            onClick={() => setSelectedChatId(chat.id)}
                            className="w-full p-3 rounded-lg border bg-zinc-800/50 border-gray-700 hover:border-blue-500/50 hover:bg-zinc-800 transition-all text-left"
                          >
                            <div className="flex items-center gap-3">
                              {otherParticipant?.image ? (
                                <Image
                                  src={otherParticipant.image}
                                  alt={otherParticipant.name || 'User'}
                                  width={40}
                                  height={40}
                                  className="rounded-full"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center flex-shrink-0">
                                  <span className="text-sm font-bold text-white">
                                    {(otherParticipant?.name?.[0] || 'U').toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-100 truncate text-sm">
                                  {otherParticipant?.name || otherParticipant?.email || 'Unknown User'}
                                </h3>
                                {chat.order?.service_category && (
                                  <p className="text-xs text-gray-400 truncate mt-0.5">
                                    {chat.order.service_category}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Desktop View */}
          <div className="hidden md:flex gap-4 h-full py-4">
            {/* Sidebar - Chat List */}
            <div className="w-96 flex-shrink-0 flex flex-col bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-4 border-b border-gray-800">
                <h1 className="text-2xl font-bold text-gray-100 mb-1">Chats</h1>
                <p className="text-sm text-gray-400">Select a conversation</p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {chats.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No chats yet</p>
                    <p className="text-sm text-gray-600">
                      Start a conversation by claiming or placing an order
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {chats.map((chat) => {
                      const otherParticipant = getOtherParticipant(chat)
                      const isSelected = chat.id === selectedChatId
                      return (
                        <button
                          key={chat.id}
                          onClick={() => setSelectedChatId(chat.id)}
                          className={`w-full p-3 rounded-lg border transition-all text-left ${
                            isSelected 
                              ? 'bg-blue-600/20 border-blue-500' 
                              : 'bg-zinc-800/50 border-gray-700 hover:border-blue-500/50 hover:bg-zinc-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {otherParticipant?.image ? (
                              <Image
                                src={otherParticipant.image}
                                alt={otherParticipant.name || 'User'}
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-white">
                                  {(otherParticipant?.name?.[0] || 'U').toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-100 truncate text-sm">
                                  {otherParticipant?.name || otherParticipant?.email || 'Unknown User'}
                                </h3>
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                  chat.status === 'active' 
                                    ? 'text-green-400 bg-green-500/20' 
                                    : 'text-gray-400 bg-gray-500/20'
                                }`}>
                                  {chat.status}
                                </span>
                              </div>
                              {chat.order?.service_category && (
                                <p className="text-xs text-gray-400 truncate">
                                  {chat.order.service_category}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Main - Chat Window */}
            <div className="flex-1 flex flex-col min-w-0">
              {selectedChatId ? (
                <div className="h-full bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-gray-800 rounded-2xl shadow-xl overflow-hidden">
                  <ChatWindow chatId={selectedChatId} />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-gray-800 rounded-2xl shadow-xl">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No chat selected</p>
                    <p className="text-sm text-gray-600">
                      Select a conversation from the list to start chatting
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function ChatsListPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 mt-16 py-12">
          <div className="container px-4 mx-auto">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <ChatsListContent />
    </Suspense>
  )
}

