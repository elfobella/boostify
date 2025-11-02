"use client"

import { Suspense, useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/app/components/navbar"
import { Footer } from "@/app/components/footer"
import { MessageCircle, Loader2, Package } from "lucide-react"
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
  const router = useRouter()
  const [chats, setChats] = useState<Chat[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
      }
    } catch (error) {
      console.error('Error fetching chats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } else if (days < 7) {
      return `${days}d ago`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1 mt-16 py-12">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-100 mb-2">My Chats</h1>
              <p className="text-gray-400">Communicate with your customers and boosters</p>
            </div>

            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-gray-800 rounded-2xl p-8 md:p-12 shadow-xl">
              {chats.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No chats yet</p>
                  <p className="text-sm text-gray-600">
                    Start a conversation by claiming or placing an order
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {chats.map((chat) => {
                    const otherParticipant = getOtherParticipant(chat)
                    return (
                      <button
                        key={chat.id}
                        onClick={() => router.push(`/chat/${chat.id}`)}
                        className="w-full p-4 bg-zinc-800/50 border border-gray-700 rounded-lg hover:border-blue-500/50 hover:bg-zinc-800 transition-all text-left"
                      >
                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          {otherParticipant?.image ? (
                            <Image
                              src={otherParticipant.image}
                              alt={otherParticipant.name || 'User'}
                              width={48}
                              height={48}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-lg font-bold text-white">
                                {(otherParticipant?.name?.[0] || 'U').toUpperCase()}
                              </span>
                            </div>
                          )}

                          {/* Chat Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-100 truncate">
                                {otherParticipant?.name || otherParticipant?.email || 'Unknown User'}
                              </h3>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${chat.status === 'active' ? 'text-green-400 bg-green-500/20' : 'text-gray-400 bg-gray-500/20'}`}>
                                {chat.status}
                              </span>
                            </div>
                            {chat.order?.service_category && (
                              <p className="text-sm text-gray-400 truncate">
                                {chat.order.service_category}
                              </p>
                            )}
                          </div>

                          {/* Timestamp */}
                          <div className="text-right text-xs text-gray-500">
                            {formatDate(chat.updated_at)}
                          </div>
                        </div>
                      </button>
                    )
                  })}
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

