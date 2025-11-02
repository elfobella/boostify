"use client"

import { Suspense, useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Navbar } from "@/app/components/navbar"
import { Footer } from "@/app/components/footer"
import { ChatWindow } from "@/app/components/chat"
import { Loader2 } from "lucide-react"

function ChatContent() {
  const params = useParams()
  const { data: session, status } = useSession()
  const chatId = params?.chatId as string

  if (status === "loading") {
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
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-100 mb-2">Chat</h1>
              <p className="text-gray-400">Communicate with your booster/customer</p>
            </div>
            
            <div className="bg-zinc-900 rounded-lg border border-gray-800 overflow-hidden" style={{ height: '600px' }}>
              <ChatWindow chatId={chatId} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function ChatPage() {
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
      <ChatContent />
    </Suspense>
  )
}

