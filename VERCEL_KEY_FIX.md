# Vercel'de "Invalid API key" Hatası Çözümü

## Sorun
Production'da "Invalid API key" hatası alıyorsunuz ama local'de `.env.local` dosyasında key'ler doğru görünüyor.

## Çözüm Adımları

### 1. Supabase Dashboard'dan Service Role Key'i Alın

1. https://app.supabase.com → Projeniz (`qoaqdxrzfyszzrrpytjz`)
2. **Settings** → **API**
3. **service_role** key'i bulun
4. **"Reveal"** butonuna tıklayın
5. **Key'in tamamını** seçin ve kopyalayın (başından sonuna kadar)
6. Key şöyle görünmeli:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvYXFkeHJ6ZnlzenpycnB5dGp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTk0NDQyMiwiZXhwIjoyMDc3NTIwNDIyfQ.w30ccXgbwWrRxZdTdP7ypJ7JxXOVJ1HttVrX7eO-UXo
   ```

### 2. Vercel'de Key'i Ekleyin/Güncelleyin

1. Vercel Dashboard → Projeniz → **Settings** → **Environment Variables**
2. **`SUPABASE_SERVICE_ROLE_KEY`** değişkenini bulun veya yeni ekleyin
3. **Value** kısmına key'in **TAMAMINI** yapıştırın
4. **Önemli kontrol noktaları:**
   - ✅ `NEXT_PUBLIC_` prefix'i OLMAMALI (sadece `SUPABASE_SERVICE_ROLE_KEY`)
   - ✅ Key'in başında/sonunda **boşluk olmamalı**
   - ✅ Key `eyJ` ile başlamalı
   - ✅ Key'in uzunluğu 200+ karakter olmalı
   - ✅ Environment: **Production** seçili olmalı (veya Production + Preview + Development)

### 3. Key Doğrulama

Vercel'de key'i ekledikten sonra kontrol edin:

**Doğru format:**
- Variable Name: `SUPABASE_SERVICE_ROLE_KEY` (tam olarak bu)
- Value: `eyJhbGci...` (çok uzun bir string)
- Length: ~220 karakter

**Yanlış formatlar:**
- ❌ `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` (prefix yanlış)
- ❌ Key kesilmiş (sadece başı veya sonu)
- ❌ Key'in başında/sonunda boşluk var
- ❌ Anon key ile service role key karıştırılmış

### 4. Redeploy

Environment variable'ı ekledikten/güncelledikten sonra:

1. Vercel Dashboard → **Deployments**
2. En son deployment'ın yanındaki **"..."** → **"Redeploy"**
3. Veya yeni bir commit push edin

### 5. Test ve Log Kontrolü

Production'da kayıt yaparken Vercel Function Logs'da şunları kontrol edin:

**Başarılı:**
```
[Supabase] Creating auth user with password
[Supabase] Auth user created successfully
[Supabase] User record created successfully
```

**Hata durumunda detaylı log'lar:**
```
[Supabase] Invalid API key detected
[Supabase] Service key length: 50  ← Key çok kısa (kesilmiş)
[Supabase] Key role: anon  ← Yanlış key (anon key kullanılmış)
```

## Olası Sorunlar ve Çözümleri

### Sorun 1: Key kesilmiş
**Belirti:** Log'da "Service key length: 50" gibi kısa bir uzunluk
**Çözüm:** Key'i yeniden kopyalayın, tamamını yapıştırın

### Sorun 2: Yanlış key kullanılmış
**Belirti:** Log'da "Key role: anon" görünüyor
**Çözüm:** Anon key yerine **service_role** key kullanın

### Sorun 3: Prefix yanlış
**Belirti:** `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` kullanılmış
**Çözüm:** Variable name'i `SUPABASE_SERVICE_ROLE_KEY` olarak değiştirin (NEXT_PUBLIC_ prefix'i YOK)

### Sorun 4: Boşluk/format sorunu
**Belirti:** Key doğru görünüyor ama hala hata veriyor
**Çözüm:** Key'i silin, Supabase'den yeniden kopyalayın ve Vercel'e ekleyin

## Hızlı Kontrol Listesi

- [ ] Supabase Dashboard'dan service_role key'i aldım
- [ ] Key'in tamamını (başından sonuna) kopyaladım
- [ ] Vercel'de variable name: `SUPABASE_SERVICE_ROLE_KEY` (NEXT_PUBLIC_ YOK)
- [ ] Key'in başında/sonunda boşluk yok
- [ ] Production environment seçili
- [ ] Redeploy yaptım
- [ ] Production'da test ettim

## Hala Sorun Varsa

Vercel Function Logs'da şu log'ları paylaşın:
- `[Supabase] Service key length: ...`
- `[Supabase] Key role: ...`
- `[Supabase] Error creating auth user: ...`

Bu log'lar sorunun tam olarak ne olduğunu gösterecek.

