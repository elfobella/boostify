# 🔄 Gerçek Zamanlı Veri Çekme Rehberi

## 📋 Mevcut Durum

Şu anda projede:
- **Chat mesajları**: Polling (1.5 saniyede bir)
- **Orders**: Manuel fetch (sekme değişikliklerinde)
- **Chats list**: Manuel fetch (sekme değişikliklerinde)

## 🎯 Seçenekler

### 1. Supabase Realtime (Önerilen) ⭐

**Avantajlar:**
- Supabase zaten kullanılıyor
- Otomatik WebSocket yönetimi
- Database değişikliklerini otomatik dinler
- Ücretsiz tier'da mevcut

**Dezavantajlar:**
- NextAuth kullanıldığı için RLS ile çalışması için özel yapılandırma gerekir
- Service role key ile çalıştırılabilir (RLS bypass)

**Kullanım Senaryoları:**
- Chat mesajları
- Order status güncellemeleri
- Chat list güncellemeleri

---

### 2. Server-Sent Events (SSE)

**Avantajlar:**
- Next.js API routes ile kolay implementasyon
- Tek yönlü (server → client)
- HTTP üzerinden çalışır (firewall friendly)

**Dezavantajlar:**
- Tek yönlü (client → server için ayrı API call gerekir)
- Bazı proxy'ler SSE'yi desteklemez

**Kullanım Senaryoları:**
- Order notifications
- Chat mesajları (tek yönlü)

---

### 3. WebSocket (Socket.io)

**Avantajlar:**
- İki yönlü iletişim
- Düşük latency
- Özel server gerekir

**Dezavantajlar:**
- Ekstra server maliyeti
- Daha karmaşık implementasyon
- Scaling zorluğu

---

## 🚀 Implementasyon: Supabase Realtime

### Adım 1: Supabase Realtime'i Aktif Et

1. Supabase Dashboard → Project Settings → API
2. Realtime'in aktif olduğundan emin ol
3. Database → Replication → İlgili tabloları seç:
   - `messages` ✅
   - `chats` ✅
   - `orders` ✅

### Adım 2: Client-Side Hook Oluştur

```typescript
// hooks/useRealtimeChat.ts
"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from 'next-auth/react'

export function useRealtimeChat(chatId: string | null) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!chatId || !supabase) return

    // Initial fetch
    const fetchMessages = async () => {
      const response = await fetch(`/api/chats/${chatId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        setIsLoading(false)
      }
    }

    fetchMessages()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          // Yeni mesaj geldi
          setMessages((prev) => {
            // Duplicate check
            if (prev.some(m => m.id === payload.new.id)) {
              return prev
            }
            return [...prev, payload.new]
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
          // Mesaj güncellendi (örn: read_at)
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id ? payload.new : msg
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatId])

  return { messages, isLoading }
}
```

### Adım 3: Orders için Realtime Hook

```typescript
// hooks/useRealtimeOrders.ts
"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from 'next-auth/react'

export function useRealtimeOrders() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.email || !supabase) return

    // Initial fetch
    const fetchOrders = async () => {
      const response = await fetch('/api/orders/user')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
        setIsLoading(false)
      }
    }

    fetchOrders()

    // Subscribe to order updates
    const channel = supabase
      .channel(`orders:${session.user.email}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'orders',
          // Filter by user_id (email-based lookup needed)
        },
        async (payload) => {
          // Refresh orders list
          const response = await fetch('/api/orders/user')
          if (response.ok) {
            const data = await response.json()
            setOrders(data.orders || [])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session?.user?.email])

  return { orders, isLoading }
}
```

### Adım 4: Chats List için Realtime Hook

```typescript
// hooks/useRealtimeChats.ts
"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from 'next-auth/react'

export function useRealtimeChats() {
  const { data: session } = useSession()
  const [chats, setChats] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.email || !supabase) return

    // Initial fetch
    const fetchChats = async () => {
      const response = await fetch('/api/chats/users')
      if (response.ok) {
        const data = await response.json()
        // Remove duplicates logic...
        setChats(data.chats || [])
        setIsLoading(false)
      }
    }

    fetchChats()

    // Subscribe to chat updates
    const channel = supabase
      .channel(`chats:${session.user.email}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
        },
        async (payload) => {
          // Refresh chats list
          const response = await fetch('/api/chats/users')
          if (response.ok) {
            const data = await response.json()
            setChats(data.chats || [])
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          // Chat updated_at değişti, listeyi refresh et
          const response = await fetch('/api/chats/users')
          if (response.ok) {
            const data = await response.json()
            setChats(data.chats || [])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session?.user?.email])

  return { chats, isLoading }
}
```

---

## 🔧 RLS (Row Level Security) Sorunu

NextAuth kullandığınız için Supabase Auth session'ı yok. Bu durumda:

### Çözüm 1: Service Role Key ile Bypass (Önerilen)

Client-side'da anon key kullanın, ancak Realtime subscription'ları için özel bir API endpoint oluşturun:

```typescript
// app/api/realtime/token/route.ts
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth'

export async function GET() {
  const session = await getServerSession()
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Create a temporary token for Realtime
  // Supabase Realtime works with anon key, but we need to verify user
  return Response.json({
    token: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    // Or create a custom JWT token
  })
}
```

### Çözüm 2: RLS Policies'i Gevşet (Güvenlik Riski)

```sql
-- Supabase SQL Editor'de çalıştır
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read messages"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chats
    WHERE chats.id = messages.chat_id
    AND (
      chats.customer_id IN (SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
      OR chats.booster_id IN (SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
    )
  )
);
```

**⚠️ Bu çözüm güvenlik riski taşır çünkü NextAuth session'ı Supabase'e aktarmak zor.**

---

## 🎯 Önerilen Yaklaşım: Hybrid

1. **Chat mesajları**: Supabase Realtime (anon key ile, RLS bypass)
2. **Orders**: Polling veya SSE (daha az kritik)
3. **Chats list**: Realtime (chat updates için)

### Implementasyon Adımları

1. ✅ Supabase Dashboard'da Realtime'i aktif et
2. ✅ `messages`, `chats`, `orders` tablolarını replicate et
3. ✅ `hooks/useRealtimeChat.ts` oluştur
4. ✅ `hooks/useChat.ts`'i güncelle (polling yerine Realtime)
5. ✅ `app/chats/page.tsx`'i güncelle
6. ✅ Test et

---

## 📊 Performans Karşılaştırması

| Yöntem | Latency | Server Load | Complexity | Cost |
|--------|---------|-------------|------------|------|
| Polling (Mevcut) | 1.5s | Yüksek | Düşük | Düşük |
| Supabase Realtime | <100ms | Düşük | Orta | Ücretsiz |
| SSE | <200ms | Orta | Orta | Düşük |
| WebSocket | <50ms | Düşük | Yüksek | Orta |

---

## 🚨 Önemli Notlar

1. **Rate Limiting**: Realtime subscription'ları rate limit'e tabi olabilir
2. **Connection Limits**: Supabase free tier'da connection limit var
3. **Error Handling**: Connection drop durumlarını handle et
4. **Reconnection**: Otomatik reconnect logic ekle

---

## 📝 Örnek: useChat Hook Güncellemesi

```typescript
// hooks/useChat.ts - Güncellenmiş versiyon
"use client"

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { supabase } from '@/lib/supabase'

export function useChat(chatId: string | null) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initial fetch
  useEffect(() => {
    if (!chatId || !session) return

    const fetchMessages = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/chats/${chatId}/messages`)
        if (!response.ok) throw new Error('Failed to load messages')
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

  // Realtime subscription
  useEffect(() => {
    if (!chatId || !supabase) return

    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload) => {
          // Fetch sender info
          const response = await fetch(`/api/chats/${chatId}/messages`)
          if (response.ok) {
            const data = await response.json()
            setMessages(data.messages || [])
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to chat:', chatId)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error:', chatId)
          setError('Connection error. Please refresh.')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatId])

  const sendMessage = useCallback(async (content: string) => {
    // ... existing sendMessage code ...
  }, [chatId, session])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    markAsRead,
  }
}
```

---

## ✅ Checklist

- [ ] Supabase Dashboard'da Realtime aktif
- [ ] Tablolar replicate edildi
- [ ] `useRealtimeChat` hook oluşturuldu
- [ ] `useChat` hook güncellendi
- [ ] Error handling eklendi
- [ ] Reconnection logic eklendi
- [ ] Test edildi

---

**Son Güncelleme:** Gerçek zamanlı veri çekme implementasyon rehberi

