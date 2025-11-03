# "Invalid API key" Hatası Çözümü

## Sorun
Production'da email/password kayıt yaparken "Invalid API key" hatası alıyorsunuz.

## Olası Nedenler

### 1. Yanlış veya Eksik Environment Variable'lar
Vercel Dashboard → Settings → Environment Variables'da kontrol edin:

#### ✅ `NEXT_PUBLIC_SUPABASE_URL`
- **Format:** `https://xxxxx.supabase.co`
- **Nereden:** Supabase Dashboard → Settings → API → Project URL
- **Önemli:** `https://` ile başlamalı ve `.supabase.co` ile bitmeli

#### ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Format:** Çok uzun bir string (yaklaşık 200+ karakter)
- **Nereden:** Supabase Dashboard → Settings → API → anon public key
- **Önemli:** Tam olarak kopyalanmalı, kesilmiş olmamalı

#### ✅ `SUPABASE_SERVICE_ROLE_KEY` ⚠️ EN ÖNEMLİSİ
- **Format:** Çok uzun bir string (yaklaşık 250+ karakter)
- **Nereden:** Supabase Dashboard → Settings → API → service_role key
- **Önemli:** 
  - `NEXT_PUBLIC_` prefix'i OLMAMALI
  - Tam olarak kopyalanmalı
  - Başında/sonunda boşluk olmamalı

### 2. Key'lerin Kesilmiş Olması
Kopyalarken key'in tam olarak kopyalandığından emin olun:
- Key'in başı: `eyJ...` ile başlamalı
- Key'in sonu: `...` ile bitmeli (JWT formatı)
- Ortası kesilmiş olmamalı

### 3. Yanlış Key Kullanımı
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Client-side için
- `SUPABASE_SERVICE_ROLE_KEY` → Server-side için (NEXT_PUBLIC_ prefix'i YOK!)

## Çözüm Adımları

### Adım 1: Supabase Dashboard'dan Key'leri Yeniden Alın
1. https://app.supabase.com → Projeniz
2. Settings → API
3. Her key'i TAM OLARAK kopyalayın (sonuna kadar)

### Adım 2: Vercel'e Ekleyin
1. Vercel Dashboard → Settings → Environment Variables
2. Her key için:
   - Variable name: Tam olarak doğru (büyük/küçük harf duyarlı)
   - Value: Key'in tamamı (başından sonuna kadar)
   - Environment: Production (ve Preview/Development istiyorsanız)

### Adım 3: Kontrol Edin
Key'lerin doğru olduğunu kontrol edin:

**NEXT_PUBLIC_SUPABASE_URL:**
- ✅ `https://` ile başlar
- ✅ `.supabase.co` ile biter
- ✅ Arasında proje ID'si var

**NEXT_PUBLIC_SUPABASE_ANON_KEY:**
- ✅ `eyJ` ile başlar (JWT token formatı)
- ✅ Uzunluk: ~200-300 karakter
- ✅ Sonunda boşluk yok

**SUPABASE_SERVICE_ROLE_KEY:**
- ✅ `eyJ` ile başlar (JWT token formatı)
- ✅ Uzunluk: ~250-350 karakter
- ✅ `NEXT_PUBLIC_` prefix'i YOK
- ✅ Sonunda boşluk yok

### Adım 4: Redeploy
Environment variable'ları ekledikten sonra:
1. Vercel Dashboard → Deployments
2. En son deployment → "..." → "Redeploy"
3. Veya yeni bir commit push edin

## Debugging

Production'da kayıt yaparken Vercel Function Logs'da şunları kontrol edin:

**Hata: Invalid API key**
```
[Supabase] Error creating auth user: { message: 'Invalid API key', status: 401 }
```

**Service Role Key eksik/yanlış:**
```
[Register API] SUPABASE_SERVICE_ROLE_KEY is missing
```

**Key çok kısa (kesilmiş):**
```
[Register API] SUPABASE_SERVICE_ROLE_KEY seems too short (might be truncated): 50 chars
```

## Test

Kayıt yaparken artık şu hata mesajlarını görmemelisiniz:
- ❌ "Invalid API key"
- ❌ "Server configuration error"
- ❌ "Supabase admin client not initialized"

Başarılı durumda:
- ✅ "User created successfully"
- ✅ Kullanıcı Supabase Dashboard → Authentication → Users'da görünür
- ✅ Kullanıcı `users` tablosunda görünür

