# 🚀 Production Deployment Checklist

## ⚠️ KRİTİK: Environment Variables (Vercel)

### 1. Supabase Variables (Zorunlu)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Production Supabase URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - ⚠️ EN ÖNEMLİSİ (server-side only, NO NEXT_PUBLIC_ prefix)
- [ ] **Environment Scope:** Production, Preview, Development için tümü seçili olmalı

### 2. Stripe Variables (Zorunlu)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Live key (`pk_live_...`)
- [ ] `STRIPE_SECRET_KEY` - Live secret key (`sk_live_...`)
- [ ] `STRIPE_WEBHOOK_SECRET` - Production webhook secret
- [ ] ⚠️ **Test key'lerini kaldırın, sadece live key'leri kullanın**

### 3. NextAuth Variables (Zorunlu)
- [ ] `NEXTAUTH_URL` - Production domain (örn: `https://yourdomain.com`)
- [ ] `NEXTAUTH_SECRET` - Güçlü random secret (generate: `openssl rand -base64 32`)
- [ ] `DISCORD_CLIENT_ID` - Discord OAuth client ID
- [ ] `DISCORD_CLIENT_SECRET` - Discord OAuth client secret
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth client ID
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

### 4. OAuth Redirect URIs (Production)
Discord Developer Portal ve Google Cloud Console'da production redirect URI'ları ekleyin:
- [ ] Discord: `https://yourdomain.com/api/auth/callback/discord`
- [ ] Google: `https://yourdomain.com/api/auth/callback/google`

---

## 🔒 Security & Configuration

### 1. Stripe Configuration
- [ ] Stripe Dashboard'da production mode'a geçin
- [ ] Webhook endpoint ekleyin: `https://yourdomain.com/api/webhook/stripe`
- [ ] Webhook events seçin:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.refunded`
  - `account.updated` (Stripe Connect için)
- [ ] Test mode'u kapatın (production'da)

### 2. Supabase Configuration
- [ ] Production Supabase project kullanın (test project değil)
- [ ] RLS (Row Level Security) policies kontrol edin
- [ ] Database migrations'ları production'a uygulayın
- [ ] Backup stratejisi ayarlayın

### 3. Domain & SSL
- [ ] Custom domain bağlayın (Vercel'de)
- [ ] SSL sertifikası otomatik olarak verilecek (Vercel)
- [ ] DNS ayarları doğru yapılandırılmış

### 4. API Security
- [ ] Rate limiting kontrol edin (Vercel Pro plan gerekebilir)
- [ ] CORS ayarları kontrol edin
- [ ] Environment variable'ların production scope'unda olduğundan emin olun

---

## 🧪 Testing (Production'a Geçmeden Önce)

### 1. Critical User Flows
- [ ] User registration (email/password)
- [ ] User login (email/password, Discord, Google)
- [ ] Order creation flow
- [ ] Payment processing (Stripe test mode ile)
- [ ] Order status updates
- [ ] Chat functionality

### 2. Payment Testing
- [ ] Test payment with Stripe test cards
- [ ] Payment success flow
- [ ] Payment failure handling
- [ ] Refund process (eğer varsa)
- [ ] Stripe Connect onboarding (booster için)

### 3. Mobile Testing
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Touch interactions
- [ ] Mobile payment methods (Apple Pay, Google Pay)
- [ ] Mobile browser compatibility

### 4. Error Handling
- [ ] Network errors
- [ ] API errors
- [ ] Payment failures
- [ ] Form validation errors
- [ ] 404/500 error pages

---

## 📊 Monitoring & Analytics

### 1. Error Tracking
- [ ] Sentry veya benzeri error tracking kurulumu
- [ ] Production error logs monitoring
- [ ] Vercel Function Logs takibi

### 2. Analytics
- [ ] Google Analytics veya alternatif kurulumu
- [ ] Conversion tracking
- [ ] User behavior tracking

### 3. Performance Monitoring
- [ ] Vercel Analytics aktif
- [ ] Core Web Vitals takibi
- [ ] API response time monitoring

---

## 🎨 SEO & Meta Tags

### 1. Meta Tags
- [ ] Title tags optimize edilmiş
- [ ] Meta descriptions eklenmiş
- [ ] Open Graph tags (Facebook, LinkedIn)
- [ ] Twitter Card tags
- [ ] Canonical URLs

### 2. Sitemap & Robots
- [ ] `sitemap.xml` oluşturulmuş
- [ ] `robots.txt` yapılandırılmış
- [ ] Google Search Console'a eklenmiş

### 3. Structured Data
- [ ] Schema.org markup (eğer gerekliyse)
- [ ] JSON-LD structured data

---

## 🚀 Performance Optimization

### 1. Build Optimization
- [ ] Production build hatasız (`npm run build`)
- [ ] Bundle size analizi
- [ ] Image optimization (Next.js Image component kullanılıyor)
- [ ] Code splitting kontrol edilmiş

### 2. Caching
- [ ] Static page caching
- [ ] API response caching (gerekliyse)
- [ ] CDN caching (Vercel otomatik)

### 3. Database
- [ ] Database indexes kontrol edilmiş
- [ ] Query optimization
- [ ] Connection pooling (Supabase otomatik)

---

## 📧 Email & Notifications

### 1. Email Configuration
- [ ] Supabase email templates customize edilmiş
- [ ] Email delivery test edilmiş
- [ ] Transactional emails (order confirmation, etc.)

### 2. Notification System
- [ ] Order status notifications
- [ ] Payment confirmations
- [ ] Error notifications (admin için)

---

## 💳 Payment & Financial

### 1. Stripe Production Setup
- [ ] Live API keys kullanılıyor
- [ ] Webhook signature verification aktif
- [ ] Payment methods test edilmiş (card, Apple Pay, Google Pay)
- [ ] Refund policy belirlenmiş

### 2. Stripe Connect (Booster Payments)
- [ ] Connect onboarding flow test edilmiş
- [ ] Payout settings yapılandırılmış
- [ ] Transfer/payout logic test edilmiş

### 3. Financial Compliance
- [ ] Terms of Service sayfası
- [ ] Privacy Policy sayfası
- [ ] Refund Policy sayfası
- [ ] Legal compliance (GDPR, vb. gerekliyse)

---

## 🔧 Technical Setup

### 1. Vercel Configuration
- [ ] Production branch ayarlanmış (genelde `main`)
- [ ] Auto-deploy aktif
- [ ] Preview deployments ayarlanmış
- [ ] Environment variables tüm ortamlar için ayarlanmış

### 2. Database
- [ ] Production database backup stratejisi
- [ ] Migration scripts production'a uygulanmış
- [ ] Database connection limits kontrol edilmiş

### 3. Third-party Services
- [ ] Supabase production project
- [ ] Stripe production account
- [ ] OAuth providers (Discord, Google) production credentials

---

## 📱 Mobile App Configuration (PWA)

### 1. Manifest
- [ ] `manifest.json` yapılandırılmış ✅ (zaten var)
- [ ] Icons tüm boyutlarda mevcut
- [ ] Theme color ayarlanmış

### 2. Service Worker (eğer varsa)
- [ ] Offline support
- [ ] Cache strategy

---

## 🐛 Pre-Launch Checks

### 1. Content Review
- [ ] Tüm metinler production-ready
- [ ] Placeholder content kaldırılmış
- [ ] Test data temizlenmiş

### 2. Links & Navigation
- [ ] Tüm internal links çalışıyor
- [ ] External links doğru
- [ ] 404 pages test edilmiş

### 3. Forms
- [ ] Form validations çalışıyor
- [ ] Error messages kullanıcı dostu
- [ ] Success messages gösteriliyor

---

## 🚨 Post-Launch Monitoring

### 1. First 24 Hours
- [ ] Error rates monitoring
- [ ] Payment success rates
- [ ] User registration success
- [ ] API response times

### 2. First Week
- [ ] User feedback toplama
- [ ] Performance metrics analizi
- [ ] Error patterns tespit etme
- [ ] Optimization opportunities

---

## 📋 Quick Pre-Launch Checklist

### Must-Have (Kritik)
- [ ] ✅ Tüm environment variables production'da ayarlanmış
- [ ] ✅ Stripe live keys kullanılıyor
- [ ] ✅ OAuth redirect URIs production domain'e ayarlanmış
- [ ] ✅ Database migrations uygulanmış
- [ ] ✅ Production build başarılı
- [ ] ✅ Critical user flows test edilmiş

### Should-Have (Önemli)
- [ ] Error tracking kurulumu
- [ ] Analytics kurulumu
- [ ] SEO meta tags
- [ ] Legal pages (Terms, Privacy)

### Nice-to-Have (İsteğe Bağlı)
- [ ] Advanced monitoring
- [ ] A/B testing setup
- [ ] Marketing automation

---

## 🔗 Useful Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://app.supabase.com
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Discord Developer Portal:** https://discord.com/developers/applications
- **Google Cloud Console:** https://console.cloud.google.com

---

## ⚠️ Common Production Issues

### 1. "Invalid API key" Errors
- ✅ Environment variables doğru mu?
- ✅ Scope (Production) seçili mi?
- ✅ Key'ler kesilmiş mi?

### 2. OAuth Not Working
- ✅ Redirect URIs production domain'e ayarlanmış mı?
- ✅ Client ID/Secret doğru mu?

### 3. Payment Issues
- ✅ Live keys kullanılıyor mu?
- ✅ Webhook endpoint doğru mu?
- ✅ Webhook signature verification aktif mi?

---

## 📝 Notes

- Production'a geçmeden önce **mutlaka** staging/preview environment'da test edin
- İlk deployment'dan sonra **mutlaka** tüm kritik flow'ları manuel test edin
- Environment variable'ları ekledikten sonra **redeploy** yapmayı unutmayın
- Stripe test mode'dan live mode'a geçerken **dikkatli** olun

---

**Son Güncelleme:** Production deployment öncesi hazırlanmıştır.

