# Vercel Environment Variables Checklist

## ✅ Supabase Variables (Gerekli)

Vercel Dashboard → Settings → Environment Variables'da şu 3 değişken olmalı:

### 1. `NEXT_PUBLIC_SUPABASE_URL`
- **Değer:** `https://your-project-id.supabase.co`
- **Nereden:** Supabase Dashboard → Settings → API → Project URL
- **Önemli:** `NEXT_PUBLIC_` prefix'i var, bu yüzden client-side'da kullanılabilir

### 2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Değer:** Supabase anon/public key (uzun bir string)
- **Nereden:** Supabase Dashboard → Settings → API → anon public key
- **Önemli:** `NEXT_PUBLIC_` prefix'i var, bu yüzden client-side'da kullanılabilir

### 3. `SUPABASE_SERVICE_ROLE_KEY` ⚠️ EN ÖNEMLİSİ
- **Değer:** Supabase service_role key (çok uzun bir string)
- **Nereden:** Supabase Dashboard → Settings → API → service_role key
- **Önemli:** 
  - `NEXT_PUBLIC_` prefix'i YOK (server-side only)
  - Bu key admin yetkilerine sahip, kesinlikle gizli tutulmalı
  - Email/password kayıt için MUTLAKA gerekli!

## ⚠️ Kritik Kontroller

### 1. Environment Scope (Production, Preview, Development)
- Her üç ortam için de (Production, Preview, Development) tanımlı olmalı
- Veya en azından Production için kesinlikle tanımlı olmalı

### 2. Key'lerin Doğruluğu
- Her key'in tam olduğundan emin olun (kesilmiş olmamalı)
- Boşluk veya özel karakter eklenmemiş olmalı

### 3. Redeploy Gerekli
- Environment variable'lar eklendikten sonra:
  - Vercel Dashboard → Deployments → En son deployment'a git
  - Üç nokta menü → "Redeploy" yap
  - Veya yeni bir commit push et

## 🔍 Test Etme

Production'da kayıt yaparken Vercel Function Logs'da kontrol edin:

**Başarılı durum:**
```
[Register API] Received registration request
[Register API] Calling createUserWithPassword
[Supabase] Creating auth user with password
[Supabase] Auth user created successfully
[Supabase] Creating user record in users table
[Supabase] User record created successfully
[Register API] User created successfully
```

**Hata durumu (Service Role Key eksik):**
```
[Supabase] Admin client not initialized. Check SUPABASE_SERVICE_ROLE_KEY environment variable.
[Register API] Supabase admin client not initialized
```

## 📝 Diğer Gerekli Variables (OAuth için)

Email/password kayıt için sadece Supabase variables yeterli, ama OAuth (Discord/Google) için de şunlar gerekli:

- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `AUTH_SECRET` veya `NEXTAUTH_SECRET`

