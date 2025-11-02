# Gerçek Zamanlı Chat Sistemi - Booster & Müşteri İletişimi

## 📋 Genel Bakış

Bu dokümantasyon, bir order claim edildiğinde booster ve müşteri arasında otomatik olarak açılan gerçek zamanlı chat sisteminin teknik spesifikasyonlarını içerir.

## 🎯 Gereksinimler

1. **Order claim edildiğinde otomatik chat oluşturma**
2. **Gerçek zamanlı mesajlaşma** (Supabase Realtime)
3. **Booster ve müşteri chat erişimi**
4. **Mesaj geçmişi saklama**
5. **Yeni mesaj bildirimleri**
6. **Güvenli mesajlaşma** (RLS policies)

---

## 🗄️ Database Schema

### 1. `chats` Tablosu

Her order için bir chat kaydı. Order claim edildiğinde otomatik oluşturulur.

```sql
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booster_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  
  -- Unique constraint: bir order için sadece bir chat olabilir
  UNIQUE(order_id),
  
  -- Indexes
  INDEX idx_chats_order_id (order_id),
  INDEX idx_chats_customer_id (customer_id),
  INDEX idx_chats_booster_id (booster_id),
  INDEX idx_chats_status (status)
);

-- Trigger: updated_at otomatik güncelleme
CREATE TRIGGER update_chats_updated_at
  BEFORE UPDATE ON chats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. `messages` Tablosu

Chat içindeki mesajlar.

```sql
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_messages_chat_id (chat_id),
  INDEX idx_messages_sender_id (sender_id),
  INDEX idx_messages_created_at (created_at),
  INDEX idx_messages_read_at (read_at)
);

-- Full text search için (ileride)
CREATE INDEX idx_messages_content_search ON messages USING gin(to_tsvector('english', content));
```

### 3. `chat_participants` Tablosu (Opsiyonel - Şimdilik chats tablosu yeterli)

Eğer ileride grup chat'leri eklenirse kullanılabilir. Şu an için opsiyonel.

---

## 🔒 Row Level Security (RLS) Policies

### `chats` Tablosu

```sql
-- Chats tablosunu enable edelim
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- Policy: Müşteriler sadece kendi chat'lerini görebilir
CREATE POLICY "Customers can view own chats"
  ON chats FOR SELECT
  USING (
    customer_id::text = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role = 'customer'
      AND users.id = chats.customer_id
    )
  );

-- Policy: Boosters sadece kendi chat'lerini görebilir
CREATE POLICY "Boosters can view own chats"
  ON chats FOR SELECT
  USING (
    booster_id::text = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role = 'booster'
      AND users.id = chats.booster_id
    )
  );

-- Policy: Service role full access
CREATE POLICY "Service role full access to chats"
  ON chats FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
```

### `messages` Tablosu

```sql
-- Messages tablosunu enable edelim
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Kullanıcılar sadece kendi chat'lerindeki mesajları görebilir
CREATE POLICY "Users can view messages in own chats"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND (
        chats.customer_id::text = auth.uid()::text
        OR chats.booster_id::text = auth.uid()::text
      )
    )
  );

-- Policy: Kullanıcılar sadece kendi chat'lerine mesaj gönderebilir
CREATE POLICY "Users can insert messages in own chats"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND (
        chats.customer_id::text = auth.uid()::text
        OR chats.booster_id::text = auth.uid()::text
      )
      AND sender_id::text = auth.uid()::text
    )
  );

-- Policy: Kullanıcılar kendi mesajlarını güncelleyebilir (edit/delete)
CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (sender_id::text = auth.uid()::text)
  WITH CHECK (sender_id::text = auth.uid()::text);

-- Policy: Service role full access
CREATE POLICY "Service role full access to messages"
  ON messages FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
```

---

## 🔄 Otomatik Chat Oluşturma

### API Route: `/api/orders/claim/route.ts` Güncellemesi

Order claim edildiğinde otomatik olarak chat oluşturulmalı:

```typescript
// app/api/orders/claim/route.ts içinde

const { data: updatedOrder, error: updateError } = await supabaseAdmin
  .from('orders')
  .update({
    booster_id: userData.id,
    claimed_at: new Date().toISOString(),
    status: 'processing',
  })
  .eq('id', orderId)
  .eq('status', 'pending')
  .is('booster_id', null)
  .select()
  .single()

if (updateError || !updatedOrder) {
  // Error handling...
}

// ✅ Order başarıyla claim edildi, şimdi chat oluştur
const { data: chat, error: chatError } = await supabaseAdmin
  .from('chats')
  .insert({
    order_id: updatedOrder.id,
    customer_id: updatedOrder.user_id,
    booster_id: userData.id,
    status: 'active',
  })
  .select()
  .single()

if (chatError) {
  console.error('[Orders API] Failed to create chat:', chatError)
  // Chat oluşturulamadı ama order claim edildi, warning log
}

// İlk mesaj: Booster order'ı claim etti
await supabaseAdmin
  .from('messages')
  .insert({
    chat_id: chat.id,
    sender_id: userData.id,
    content: `I've claimed your order. I'll start working on it soon!`,
    message_type: 'system',
  })

return NextResponse.json({
  message: 'Order claimed successfully',
  order: updatedOrder,
  chatId: chat?.id, // Frontend'e chat ID gönder
}, { status: 200 })
```

---

## 📡 Gerçek Zamanlı Mesajlaşma

### Supabase Realtime Setup

#### 1. Database'de Realtime Enable

```sql
-- Messages tablosunu realtime için enable et
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Chats tablosunu realtime için enable et (status değişiklikleri için)
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
```

#### 2. Frontend: React Hook for Real-time Messages

```typescript
// hooks/useChat.ts

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from 'next-auth/react'

interface Message {
  id: string
  chat_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'image' | 'file' | 'system'
  read_at: string | null
  created_at: string
  sender?: {
    email: string
    name: string
    role: string
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
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:users!messages_sender_id_fkey (
              email,
              name,
              role
            )
          `)
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true })

        if (error) throw error
        setMessages(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load messages')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMessages()
  }, [chatId, session])

  // Subscribe to real-time updates
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
          // Yeni mesaj geldi, sender bilgisini al
          const { data: sender } = await supabase
            .from('users')
            .select('email, name, role')
            .eq('id', payload.new.sender_id)
            .single()

          const newMessage: Message = {
            ...payload.new,
            sender: sender || undefined,
          }

          setMessages((prev) => [...prev, newMessage])

          // Bildirim göster (sadece başka birinden gelen mesajlar için)
          if (newMessage.sender_id !== session?.user?.id) {
            // Notification logic...
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatId, session])

  const sendMessage = async (content: string) => {
    if (!chatId || !session) return

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: session.user.id, // Supabase auth'dan alınmalı
          content: content.trim(),
          message_type: 'text',
        })
        .select()
        .single()

      if (error) throw error
      
      // State güncellenir (realtime subscription sayesinde)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
      throw err
    }
  }

  const markAsRead = async (messageId: string) => {
    // Read at güncellemesi
  }

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

## 🎨 UI Components

### 1. Chat Component Structure

```
app/
  components/
    chat/
      ChatWindow.tsx          # Ana chat penceresi
      MessageList.tsx          # Mesaj listesi
      MessageBubble.tsx        # Tek bir mesaj
      ChatInput.tsx           # Mesaj input alanı
      ChatHeader.tsx          # Chat başlığı (order bilgileri)
      ChatList.tsx            # Kullanıcının chat listesi
```

### 2. Chat Window Example

```typescript
// app/components/chat/ChatWindow.tsx

"use client"

import { useChat } from '@/hooks/useChat'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { ChatHeader } from './ChatHeader'

interface ChatWindowProps {
  chatId: string
  orderId: string
}

export function ChatWindow({ chatId, orderId }: ChatWindowProps) {
  const { messages, isLoading, sendMessage } = useChat(chatId)

  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-lg border border-gray-800">
      <ChatHeader orderId={orderId} />
      <MessageList messages={messages} isLoading={isLoading} />
      <ChatInput onSend={sendMessage} />
    </div>
  )
}
```

---

## 📍 Chat Erişim Noktaları

### 1. Booster Dashboard

Booster'lar claim ettikleri order'lar için chat'e erişebilir:

```
/booster/dashboard → My Orders → [Order Card] → Chat Button
```

### 2. Customer Profile

Müşteriler profil sayfalarından order'ları için chat'e erişebilir:

```
/profile → Recent Orders → [Order Card] → Chat Button
```

### 3. Chat Route

```
/chat/[chatId]  → Tek bir chat sayfası
/chats          → Kullanıcının tüm chat'leri listesi
```

---

## 🔔 Bildirimler (İleride)

1. **Yeni mesaj bildirimleri** (browser notifications)
2. **Unread message count** (header'da badge)
3. **Email notifications** (opsiyonel, kritik mesajlar için)

---

## 🔐 Güvenlik Notları

1. **RLS Policies**: Tüm tablolarda aktif
2. **Sender Validation**: Mesaj gönderirken sender_id kontrolü
3. **Chat Access Control**: Sadece chat'in participant'ları erişebilir
4. **Content Validation**: Mesaj içeriği sanitize edilmeli
5. **Rate Limiting**: Spam önleme için API route'larda rate limit

---

## 📊 Database Indexes (Performance)

```sql
-- Hızlı sorgular için kritik indexler
CREATE INDEX idx_messages_chat_created ON messages(chat_id, created_at DESC);
CREATE INDEX idx_chats_customer_updated ON chats(customer_id, updated_at DESC);
CREATE INDEX idx_chats_booster_updated ON chats(booster_id, updated_at DESC);
CREATE INDEX idx_messages_unread ON messages(chat_id, read_at) WHERE read_at IS NULL;
```

---

## 🚀 Implementation Steps

### Phase 1: Database Setup
1. ✅ `chats` tablosu oluştur
2. ✅ `messages` tablosu oluştur
3. ✅ RLS policies ekle
4. ✅ Indexes oluştur
5. ✅ Realtime enable et

### Phase 2: Backend Integration
1. ✅ `/api/orders/claim` route'una chat oluşturma ekle
2. ✅ `/api/chats/[chatId]/messages` route'u (mesaj gönderme)
3. ✅ `/api/chats/[chatId]` route'u (chat detayları)
4. ✅ `/api/chats/user` route'u (kullanıcının chat listesi)

### Phase 3: Frontend Components
1. ✅ `useChat` hook'u oluştur
2. ✅ `ChatWindow` component
3. ✅ `MessageList` ve `MessageBubble` components
4. ✅ `ChatInput` component
5. ✅ Booster Dashboard'a chat butonu ekle
6. ✅ Profile page'e chat butonu ekle

### Phase 4: Real-time Integration
1. ✅ Supabase Realtime subscription setup
2. ✅ Message updates real-time
3. ✅ Read receipts (opsiyonel)
4. ✅ Typing indicators (opsiyonel, ileride)

### Phase 5: Polish & UX
1. ✅ Loading states
2. ✅ Error handling
3. ✅ Empty states
4. ✅ Mobile responsive
5. ✅ Scroll to bottom on new message
6. ✅ Auto-scroll behavior

---

## 📝 SQL Migration File

Tüm SQL komutlarını `supabase_chat_schema.sql` dosyasında toplayacağız.

---

## 🧪 Testing Checklist

- [ ] Order claim edildiğinde chat otomatik oluşuyor
- [ ] Booster chat'e erişebiliyor
- [ ] Customer chat'e erişebiliyor
- [ ] Mesajlar gerçek zamanlı geliyor
- [ ] RLS policies çalışıyor (başka kullanıcı chat'lerine erişemiyor)
- [ ] Mesaj geçmişi doğru yükleniyor
- [ ] Mobile responsive
- [ ] Error states düzgün handle ediliyor

---

## 🔮 Gelecek Özellikler (Opsiyonel)

1. **File Attachments**: Resim/dosya paylaşımı
2. **Typing Indicators**: "Booster typing..." göstergesi
3. **Read Receipts**: Mesaj okundu bilgisi
4. **Emoji Reactions**: Mesajlara emoji tepkisi
5. **Message Editing**: Mesaj düzenleme
6. **Group Chats**: Birden fazla booster ile chat
7. **Voice Messages**: Ses mesajları
8. **Translation**: Çoklu dil desteği

---

**Not**: Bu dokümantasyon, chat sisteminin temel yapısını ve gereksinimlerini içerir. Implementation sırasında detaylar netleşecektir.

