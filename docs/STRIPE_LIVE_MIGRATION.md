# 💳 Stripe Live Mode'a Geçiş Rehberi

## ⚠️ KRİTİK: Live Mode'a Geçmeden Önce

Live mode'a geçtiğinizde **gerçek para** işlemleri yapılacak. Bu nedenle çok dikkatli olmalısınız!

---

## 🔑 1. Environment Variables Değişiklikleri

### Vercel'de Yapılacaklar

1. **Stripe Dashboard'dan Live Keys Alın:**
   - [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **API keys**
   - **Live mode** toggle'ını açın (sağ üstte)
   - **Publishable key** (`pk_live_...`) kopyalayın
   - **Secret key** (`sk_live_...`) kopyalayın

2. **Vercel Environment Variables Güncelle:**
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (ESKİ: pk_test_...)
   STRIPE_SECRET_KEY=sk_live_... (ESKİ: sk_test_...)
   ```

3. **⚠️ ÖNEMLİ:**
   - Test key'leri **SİLMEYİN** (development için gerekli)
   - Sadece **Production** scope'unda live key'leri kullanın
   - **Preview** ve **Development** scope'larında test key'leri kalsın

---

## 🔒 2. Stripe Dashboard Konfigürasyonu

### A. Payment Methods Aktifleştirme

1. **Stripe Dashboard** → **Settings** → **Payment methods**
2. **Live mode**'a geçin (sağ üstte toggle)
3. Şu payment method'ları aktifleştirin:
   - ✅ **Card** (otomatik aktif)
   - ✅ **Apple Pay** (domain verification gerekli)
   - ✅ **Google Pay** (otomatik aktif)
   - ✅ **Link** (opsiyonel, önerilir)

### B. Apple Pay Domain Verification (ZORUNLU)

**⚠️ Apple Pay sadece domain verify edildikten sonra çalışır!**

1. **Stripe Dashboard** → **Settings** → **Payment methods** → **Apple Pay**
2. **Add domain** butonuna tıklayın
3. Production domain'inizi girin (örn: `atlasboost.com`)
4. **Domain association file**'ı indirin
5. Dosyayı şu path'e yükleyin:
   ```
   https://yourdomain.com/.well-known/apple-developer-merchantid-domain-association
   ```
6. **Vercel'de dosya ekleme:**
   - `public/.well-known/apple-developer-merchantid-domain-association` oluşturun
   - İndirilen dosyayı buraya kopyalayın
   - Deploy edin
7. Stripe Dashboard'da **Verify** butonuna tıklayın
8. Verification genellikle birkaç dakika sürer

**Not:** Domain verification olmadan Apple Pay **ÇALIŞMAZ**!

### C. Google Pay Konfigürasyonu

Google Pay genellikle otomatik çalışır, ancak kontrol edin:
1. **Stripe Dashboard** → **Settings** → **Payment methods** → **Google Pay**
2. **Enabled** olduğundan emin olun
3. Region ayarlarını kontrol edin (genellikle "All regions")

---

## 🔔 3. Webhook Konfigürasyonu

### A. Webhook Endpoint Oluştur

1. **Stripe Dashboard** → **Developers** → **Webhooks**
2. **Add endpoint** butonuna tıklayın
3. **Endpoint URL** girin:
   ```
   https://yourdomain.com/api/webhook/stripe
   ```
4. **Events to send** seçin:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `charge.refunded`
   - ✅ `account.updated` (Stripe Connect için)
   - ✅ `payment_intent.amount_capturable_updated` (opsiyonel)

5. **Signing secret** kopyalayın (örnek: `whsec_...`)
6. Vercel'de environment variable ekleyin:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### B. Webhook Test Et

1. **Stripe Dashboard** → **Developers** → **Webhooks**
2. Endpoint'in yanındaki **...** → **Send test webhook**
3. `payment_intent.succeeded` event'ini seçin
4. **Send test webhook** butonuna tıklayın
5. Vercel logs'da webhook'un geldiğini kontrol edin

---

## 💰 4. Stripe Connect (Booster Payments)

### A. Connect'i Live Mode'da Aktifleştir

1. **Stripe Dashboard** → **Connect** (Live mode'da)
2. **Get started** veya **Settings** → **Connect settings**
3. **Express accounts** aktif olduğundan emin olun
4. Platform bilgilerini doldurun:
   - Business name
   - Business type
   - Tax information
   - Bank account (payout için)

### B. Booster Onboarding Kontrolü

Live mode'da booster'lar:
1. Gerçek kimlik bilgileri vermeli
2. Gerçek banka hesabı bağlamalı
3. Tax information doldurmalı
4. Stripe verification'ı geçmeli

**⚠️ Test mode'daki booster account'ları live mode'da çalışmaz!**

---

## 🧪 5. Test ve Doğrulama

### A. Test Kartları (Live Mode'da ÇALIŞMAZ!)

Live mode'da test kartları **kullanılamaz**. Gerçek kartlarla test etmeniz gerekir, ancak:

**⚠️ DİKKAT:** Live mode'da gerçek para çekilir!

**Önerilen Test Yöntemi:**
1. Küçük tutarlarla test edin (örn: $0.50)
2. Test sonrası hemen refund yapın
3. Stripe Dashboard'da **Refunds** sekmesinden refund yapabilirsiniz

### B. Test Checklist

- [ ] Payment Intent oluşturuluyor mu?
- [ ] Payment başarılı oluyor mu?
- [ ] Order database'e kaydediliyor mu?
- [ ] Webhook çalışıyor mu?
- [ ] Apple Pay görünüyor mu? (Safari'de test edin)
- [ ] Google Pay görünüyor mu? (Chrome'da test edin)
- [ ] Stripe Connect split payment çalışıyor mu?
- [ ] Refund işlemi çalışıyor mu?

---

## 📊 6. Monitoring ve Logging

### A. Stripe Dashboard Monitoring

1. **Stripe Dashboard** → **Payments**
   - Tüm ödemeleri görüntüleyin
   - Failed payment'ları kontrol edin
   - Refund'ları takip edin

2. **Stripe Dashboard** → **Developers** → **Logs**
   - API request'leri görüntüleyin
   - Error'ları kontrol edin

3. **Stripe Dashboard** → **Connect** → **Accounts**
   - Booster account'larını görüntüleyin
   - Payout'ları takip edin

### B. Vercel Logs

1. **Vercel Dashboard** → **Your Project** → **Logs**
2. Webhook event'lerini kontrol edin
3. Error'ları takip edin

---

## 🚨 7. Güvenlik Kontrolleri

### A. API Key Güvenliği

- ✅ Secret key'ler **ASLA** client-side'da kullanılmamalı
- ✅ Publishable key sadece `NEXT_PUBLIC_` prefix'i ile kullanılmalı
- ✅ Secret key sadece server-side API routes'da kullanılmalı
- ✅ Environment variables Vercel'de **encrypted** olarak saklanmalı

### B. Webhook Güvenliği

- ✅ Webhook signature verification **ZORUNLU**
- ✅ `STRIPE_WEBHOOK_SECRET` environment variable'ı kullanılmalı
- ✅ Webhook endpoint'inde signature kontrol edilmeli

**Örnek Webhook Verification:**
```typescript
// app/api/webhook/stripe/route.ts
import Stripe from 'stripe'
import { headers } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    return new Response(`Webhook Error: ${err}`, { status: 400 })
  }

  // Process event...
}
```

---

## 💸 8. Finansal Ayarlar

### A. Payout Ayarları

1. **Stripe Dashboard** → **Settings** → **Bank accounts and scheduling**
2. Payout schedule'i ayarlayın:
   - **Daily** (önerilir, hızlı)
   - **Weekly** (daha az sıklık)
   - **Monthly** (en az sıklık)

3. **Minimum payout amount** ayarlayın (örn: $10)

### B. Fee Yapısı

Live mode'da Stripe fee'leri:
- **Card payments**: 2.9% + $0.30 per transaction
- **International cards**: +1% ekstra
- **Stripe Connect**: Platform fee + Stripe fee

**Hesaplama:**
- $100 ödeme → $2.90 + $0.30 = $3.20 fee
- Net: $96.80

### C. Tax Handling

1. **Stripe Dashboard** → **Settings** → **Tax**
2. Tax calculation'ı aktifleştirin (gerekirse)
3. Tax rate'leri ayarlayın

---

## 🔄 9. Rollback Planı

Eğer bir sorun olursa:

1. **Hemen test mode'a geri dön:**
   - Vercel'de environment variables'ı test key'lere çevir
   - Redeploy yap

2. **Payment'ları durdur:**
   - Stripe Dashboard → **Settings** → **Account** → **Pause payments**

3. **Refund yap:**
   - Stripe Dashboard → **Payments** → İlgili payment → **Refund**

---

## ✅ 10. Pre-Launch Checklist

### Environment Variables
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_...` (Production scope)
- [ ] `STRIPE_SECRET_KEY` = `sk_live_...` (Production scope)
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_...` (Production scope)
- [ ] Test key'leri Development/Preview scope'larında kaldı

### Stripe Dashboard
- [ ] Live mode aktif
- [ ] Payment methods aktif (Card, Apple Pay, Google Pay)
- [ ] Apple Pay domain verified
- [ ] Webhook endpoint oluşturuldu ve test edildi
- [ ] Stripe Connect aktif
- [ ] Bank account bağlandı

### Testing
- [ ] Küçük tutarlı test payment yapıldı
- [ ] Webhook test edildi
- [ ] Apple Pay test edildi (Safari)
- [ ] Google Pay test edildi (Chrome)
- [ ] Refund test edildi
- [ ] Stripe Connect split payment test edildi

### Monitoring
- [ ] Stripe Dashboard monitoring aktif
- [ ] Vercel logs kontrol ediliyor
- [ ] Error tracking kuruldu (Sentry, vb.)

---

## 📝 11. Post-Launch Monitoring

### İlk 24 Saat

1. **Her saat kontrol edin:**
   - Stripe Dashboard → **Payments** → Failed payments
   - Vercel Logs → Error'lar
   - Webhook delivery status

2. **İlk gün sonunda:**
   - Toplam payment sayısı
   - Success rate
   - Failed payment'ların nedenleri
   - Refund rate

### İlk Hafta

1. **Günlük kontrol:**
   - Payment trends
   - Error patterns
   - Customer complaints

2. **Hafta sonunda:**
   - Revenue raporu
   - Fee analizi
   - Payout durumu

---

## 🆘 12. Common Issues ve Çözümleri

### Issue 1: Apple Pay Görünmüyor

**Neden:**
- Domain verification yapılmamış
- Safari kullanılmıyor
- HTTPS yok

**Çözüm:**
1. Domain verification'ı kontrol et
2. Safari'de test et
3. HTTPS olduğundan emin ol

### Issue 2: Webhook Çalışmıyor

**Neden:**
- Webhook secret yanlış
- Endpoint URL yanlış
- Signature verification hatası

**Çözüm:**
1. `STRIPE_WEBHOOK_SECRET` kontrol et
2. Webhook endpoint URL'ini kontrol et
3. Webhook signature verification kodunu kontrol et

### Issue 3: Payment Failed

**Neden:**
- Kart bilgileri yanlış
- Yetersiz bakiye
- Kart limiti aşıldı

**Çözüm:**
1. Stripe Dashboard → **Payments** → Failed payment → Detayları kontrol et
2. Customer'a uygun error message göster
3. Retry mekanizması ekle (opsiyonel)

---

## 📞 13. Support ve Resources

### Stripe Support
- **Email:** support@stripe.com
- **Dashboard:** [Stripe Dashboard](https://dashboard.stripe.com)
- **Docs:** [Stripe Docs](https://stripe.com/docs)

### Useful Links
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Connect](https://stripe.com/docs/connect)
- [Apple Pay Setup](https://stripe.com/docs/apple-pay)
- [Google Pay Setup](https://stripe.com/docs/google-pay)

---

## ⚠️ SON UYARI

Live mode'a geçtiğinizde:
- ✅ **Gerçek para** işlemleri yapılacak
- ✅ **Gerçek müşteriler** ödeme yapacak
- ✅ **Yasal sorumluluklar** başlayacak
- ✅ **Refund policy** uygulanmalı
- ✅ **Customer support** hazır olmalı

**Test etmeden live'a geçmeyin!**

---

**Son Güncelleme:** Stripe Live Mode migration rehberi

