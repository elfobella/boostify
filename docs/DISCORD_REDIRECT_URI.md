# Discord OAuth Redirect URI

## Geliştirme Ortamı (Local)
```
http://localhost:3000/api/auth/callback/discord
```

## Üretim Ortamı (Production)
Deployment domain'inize göre değişir. Örnek:
```
https://yourdomain.com/api/auth/callback/discord
```

## Vercel Deployment için
```
https://your-project-name.vercel.app/api/auth/callback/discord
```

## Discord Developer Portal'da Nasıl Ekleme Yapılır?

1. **Discord Developer Portal'a Git**
   - https://discord.com/developers/applications

2. **Uygulamanızı Seçin**
   - Client ID: `1433573862754353292`

3. **OAuth2 bölümüne gidin**
   - Sol menüden "OAuth2" sekmesine tıklayın

4. **Redirects Bölümü**
   - "Redirects" başlığının altındaki "Add Redirect" butonuna tıklayın

5. **Aşağıdaki URL'yi ekleyin:**
   ```
   http://localhost:3000/api/auth/callback/discord
   ```

6. **Kaydedin ve değişiklikleri kaydedin**

## Önemli Notlar

### Next.js 16 ve NextAuth.js
NextAuth.js v4 kullanıyorsunuz ve Next.js 16 ile bazı uyumluluk sorunları olabilir.

### Ayar Gereksinimleri
- Client ID ve Client Secret zaten `.env.local` dosyasında mevcut
- Callback URL'i Discord Developer Portal'a eklemeniz gerekiyor
- OAuth2 URL Generator kullanabilirsiniz

### Gerekli Scopes (İzinler)
```
identify
email
```

### Production için
Deployment yaptığınızda production URL'sini de ekleyin.

