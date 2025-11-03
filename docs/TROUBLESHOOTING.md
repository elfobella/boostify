# Supabase Entegrasyonu Sorun Giderme

## Email/Password Kayıt Production'da Çalışmıyor

### Olası Nedenler ve Çözümler

### 1. Supabase Service Role Key Kontrolü
**En yaygın sorun:** `SUPABASE_SERVICE_ROLE_KEY` environment variable'ı eksik veya yanlış.

**Kontrol:**
- Vercel Dashboard → Settings → Environment Variables
- `SUPABASE_SERVICE_ROLE_KEY`'in tanımlı olduğundan emin olun
- Key'in doğru olduğunu doğrulayın (Supabase Dashboard → Settings → API)

**Test:**
Vercel Function Logs'da şu mesajı arayın:
- `[Supabase] Admin client not initialized` → Service role key eksik

### 2. Supabase Auth Email Ayarları
Supabase Dashboard → Authentication → Settings'de kontrol edin:
- Email confirmation: Eğer açıksa, `email_confirm: true` kullanıyoruz ama yine de kontrol edin
- Email template: Custom template'ler sorun çıkarabilir

### 3. RLS (Row Level Security) Politikaları
`users` tablosunda RLS aktif ama service role key ile çalışıyoruz, bu normalde sorun olmamalı. Yine de kontrol edin:
- Supabase Dashboard → Table Editor → users → Policies
- Service role için full access policy olmalı

### 4. Log Kontrolü
Production'da kayıt yaparken Vercel Function Logs'da şunları kontrol edin:

**Başarılı kayıt log'ları:**
```
[Register API] Received registration request
[Register API] Calling createUserWithPassword
[Supabase] Creating auth user with password
[Supabase] Auth user created successfully
[Supabase] Creating user record in users table
[Supabase] User record created successfully
[Register API] User created successfully
```

**Hata durumları:**
- `[Supabase] Admin client not initialized` → Environment variable eksik
- `[Supabase] Error creating auth user` → Auth API sorunu
- `[Supabase] Error creating user record` → Tablo/RLS sorunu

### 5. Manuel Test

**Supabase Dashboard'da:**
```sql
-- Son kayıtları kontrol edin
SELECT * FROM users 
WHERE provider = 'email'
ORDER BY created_at DESC 
LIMIT 10;

-- Auth users kontrol edin (Supabase Dashboard → Authentication → Users)
```

### 6. Yaygın Sorunlar

**Sorun:** "Failed to create user"
- **Olası neden:** Email zaten Supabase Auth'da kayıtlı ama users tablosunda yok
- **Çözüm:** Supabase Dashboard → Authentication → Users'dan kontrol edin

**Sorun:** "Server configuration error"
- **Olası neden:** SUPABASE_SERVICE_ROLE_KEY eksik
- **Çözüm:** Vercel environment variables'a ekleyin

**Sorun:** Auth user oluşuyor ama users tablosuna eklenmiyor
- **Olası neden:** RLS policy veya tablo constraint sorunu
- **Çözüm:** SQL schema'yı tekrar çalıştırın

## Google OAuth ile Giriş Yapıldığında Supabase'e Kayıt Olmuyor

### Olası Nedenler ve Çözümler

### 1. Environment Variables Kontrolü
Deploy ortamında (Vercel) aşağıdaki environment variable'ların tanımlı olduğundan emin olun:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**Kontrol:**
- Vercel Dashboard → Settings → Environment Variables
- Her değişkenin Production, Preview, Development ortamlarında tanımlı olduğundan emin olun

### 2. Supabase Tablo Kontrolü
`users` tablosunun oluşturulduğundan emin olun:
- Supabase Dashboard → SQL Editor
- `supabase_schema.sql` dosyasındaki kodu çalıştırın
- Tablonun oluşturulduğunu doğrulayın

### 3. Log Kontrolü
Deploy ortamında console log'ları kontrol edin:
- Vercel Dashboard → Deployments → Functions Logs
- Google ile giriş yaparken şu log'ları arayın:
  - `[NextAuth] Sign in with google:`
  - `[Supabase] Getting or creating user:`
  - `[Supabase] User created successfully:`

### 4. Google OAuth Email Scope
Google OAuth'ta email scope'unun ekli olduğundan emin olun. NextAuth v5 varsayılan olarak ekler ama kontrol edin.

### 5. Test Adımları

1. **Lokal Test:**
   ```bash
   npm run dev
   ```
   - Google ile giriş yapın
   - Browser console'da log'ları kontrol edin
   - Supabase Dashboard → Table Editor → users tablosunu kontrol edin

2. **Deploy Test:**
   - Vercel'e deploy edin
   - Google ile giriş yapın
   - Vercel Function Logs'u kontrol edin
   - Supabase Dashboard'da users tablosunu kontrol edin

### 6. Manuel Test

Supabase Dashboard → SQL Editor'da şu sorguyu çalıştırarak son kayıtları kontrol edin:

```sql
SELECT * FROM users 
ORDER BY created_at DESC 
LIMIT 10;
```

### 7. Hata Ayıklama

Eğer hala çalışmıyorsa, log'larda şunları kontrol edin:

- `[Supabase] Admin client not initialized` → Environment variable eksik
- `[Supabase] Cannot create user: email is required` → Google'dan email gelmiyor
- `[Supabase] Error creating user:` → Tablo veya constraint sorunu

### 8. Yaygın Sorunlar

**Sorun:** Google'dan email gelmiyor
- **Çözüm:** Google OAuth Console'da email scope'unun ekli olduğundan emin olun

**Sorun:** Supabase admin client null
- **Çözüm:** `SUPABASE_SERVICE_ROLE_KEY` environment variable'ının doğru olduğundan emin olun

**Sorun:** Tablo bulunamıyor
- **Çözüm:** SQL schema'yı Supabase'de çalıştırın

### 9. Manuel Kontrol

Deploy'dan sonra test etmek için:
1. Deploy edin
2. Google ile giriş yapın
3. Vercel Function Logs'u kontrol edin
4. Supabase Dashboard'da users tablosunu kontrol edin

Eğer log'larda hata görüyorsanız, hata mesajını paylaşın.

