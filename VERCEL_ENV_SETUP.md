# Vercel Environment Variables Setup

## ⚠️ Önemli: NextAuth v5 Değişikliği

NextAuth v5 artık `AUTH_SECRET` kullanıyor (eskiden `NEXTAUTH_SECRET`). 

## Environment Variables (Her ikisini de ekle!)

### 1. Vercel Dashboard'a Git
1. https://vercel.com/dashboard
2. `boostify` projeni seç
3. Settings → Environment Variables

### 2. Bu Değişkenleri Ekle

**Production, Preview ve Development için hepsini ekle:**

```env
# NextAuth (Her ikisi de!)
AUTH_SECRET=your-auth-secret-here
NEXTAUTH_SECRET=your-nextauth-secret-here

# NextAuth URL (Production için gerçek domain)
AUTH_URL=https://your-project.vercel.app
NEXTAUTH_URL=https://your-project.vercel.app

# Discord OAuth
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
```

## 🎯 OAuth Redirect URIs

### Discord:
1. https://discord.com/developers/applications
2. OAuth2 → Redirects
3. Şunu ekle: `https://your-project.vercel.app/api/auth/callback/discord`

### Google:
1. https://console.cloud.google.com/
2. OAuth 2.0 Client IDs → Edit
3. Authorized redirect URIs → Şunu ekle: `https://your-project.vercel.app/api/auth/callback/google`

## 🔄 Redeploy

1. Vercel Dashboard → Deployments
2. Son deployment'ın yanında "..." menüsü
3. "Redeploy"

## ✅ Test

1. Siteyi kontrol et
2. Login butonuna tıkla
3. Discord veya Google ile giriş yap
4. Stripe checkout test et

