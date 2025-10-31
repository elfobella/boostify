# Supabase Setup Guide

## 1. SQL Tablosu Oluşturma

Supabase Dashboard'da **SQL Editor**'a gidin ve `supabase_schema.sql` dosyasındaki SQL kodunu çalıştırın.

### Adımlar:
1. Supabase Dashboard'a gidin: https://app.supabase.com
2. Projenizi seçin
3. Sol menüden **SQL Editor**'ı açın
4. **New Query** butonuna tıklayın
5. `supabase_schema.sql` dosyasındaki tüm SQL kodunu yapıştırın
6. **Run** butonuna tıklayın

## 2. Environment Variables

`.env.local` dosyanıza aşağıdaki değişkenleri ekleyin:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Bu değerleri nereden bulacaksınız?
1. Supabase Dashboard → Proje ayarları
2. **Settings** → **API**
3. **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
4. **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Gizli tutun, sadece server-side kullanın)

## 3. Özellikler

✅ **OAuth Girişleri (Discord, Google)**
- Kullanıcılar otomatik olarak `users` tablosuna kaydedilir
- İlk girişte kayıt, sonraki girişlerde güncelleme yapılır

✅ **Email/Password Kayıt ve Giriş**
- Yeni kullanıcılar `users` tablosuna kaydedilir
- Şifreler Supabase Auth ile güvenli bir şekilde hash'lenir

✅ **Otomatik Kayıt Takibi**
- Her girişte `last_login` alanı güncellenir
- Kullanıcı bilgileri (name, image) otomatik güncellenir

## 4. Tablo Yapısı

```sql
users
├── id (UUID, Primary Key)
├── email (TEXT, Unique)
├── name (TEXT)
├── image (TEXT)
├── provider (discord | google | email)
├── provider_id (TEXT)
├── password_hash (TEXT, nullable)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
└── last_login (TIMESTAMP)
```

## 5. Test Etme

1. Discord/Google ile giriş yapın → `users` tablosunda görünmeli
2. Email/Password ile kayıt olun → `users` tablosunda görünmeli
3. Email/Password ile giriş yapın → `last_login` güncellenmeli

## 6. Güvenlik Notları

⚠️ **Önemli:** `SUPABASE_SERVICE_ROLE_KEY` sadece server-side kodda kullanılmalıdır. Bu key tüm veritabanına tam erişim sağlar.

✅ **RLS (Row Level Security)** tabloda aktif. Kullanıcılar sadece kendi verilerini görebilir.

