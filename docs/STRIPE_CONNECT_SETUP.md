# Stripe Connect Setup Guide

## ⚠️ Önemli: Platform Seviyesinde Kurulum Gerekiyor

Stripe Connect account'ları **platform (bizim) API key'i** ile oluşturulur. Booster'lar kendi hesaplarını oluşturamazlar - sadece onboarding yaparlar.

## 🔧 Setup Adımları

### 1. Stripe Dashboard'da Connect'i Etkinleştir

**Test Modunda:**
1. [Stripe Dashboard](https://dashboard.stripe.com/test) → **Connect** sekmesine git
2. Eğer "Get started with Connect" butonu görüyorsan, tıkla
3. Express accounts seçeneğini etkinleştir
4. Platform bilgilerini doldur (gerekirse)

**Production Modunda:**
1. [Stripe Dashboard](https://dashboard.stripe.com) → **Connect** sekmesine git
2. Express accounts'u etkinleştir
3. Platform bilgilerini ve vergi bilgilerini doldur
4. İşletme bilgilerini doğrula

### 2. Environment Variables

`.env.local` dosyasında şunların olması gerekiyor:

```env
# Stripe API Keys (Platform hesabı için)
STRIPE_SECRET_KEY=sk_test_...  # Test mode
# veya
STRIPE_SECRET_KEY=sk_live_...  # Production mode

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Test Modunda Kontrol

Stripe Connect test modunda otomatik olarak çalışmalı. Eğer hata alıyorsan:

```bash
# Stripe CLI ile test et
stripe accounts create --type=express --country=US
```

Eğer bu komut çalışıyorsa, Connect aktif demektir.

### 4. Kod Akışı

**Platform (Bizim Kod):**
```typescript
// Platform API key ile account oluştur
const account = await stripe.accounts.create({
  type: 'express',
  country: 'US',
  email: booster.email,
})
```

**Booster:**
1. "Create Stripe Account" butonuna tıklar
2. Platform account oluşturur (backend'de)
3. Booster onboarding link'i alır
4. Onboarding formunu doldurur
5. Stripe bilgilerini doğrular

## ❌ Hata: "You can only create new accounts if you've signed up for Connect"

Bu hata şu anlama gelir:

1. **Stripe Dashboard'da Connect enable değil**
   - Çözüm: Dashboard → Connect → Enable Connect

2. **Yanlış API key kullanılıyor**
   - Test modunda `sk_test_...` kullanmalısın
   - Production'da `sk_live_...` kullanmalısın
   - Platform hesabının key'i olmalı (bireysel hesap değil)

3. **API version sorunu**
   - Kod `2025-10-29.clover` kullanıyor, bu geçerli bir version olmalı
   - Eğer sorun varsa, en son stable version'ı kullan

## ✅ Doğru Çalışma Akışı

1. **Platform Stripe Dashboard'da Connect'i enable eder** ← Bu önemli!
2. Booster dashboard'a girer
3. "Create Stripe Account" butonuna tıklar
4. Backend platform API key ile account oluşturur ✅
5. Booster onboarding link'i alır
6. Stripe formunu doldurur
7. Onboarding tamamlanır

## 🔍 Debug Checklist

- [ ] Stripe Dashboard'da Connect sekmesi var mı?
- [ ] Connect enable durumunda mı?
- [ ] Environment variable'lar doğru mu?
- [ ] API key platform hesabına mı ait?
- [ ] Test/Live mode doğru mu?

## 📚 Kaynaklar

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Express Accounts Guide](https://stripe.com/docs/connect/express-accounts)
- [Testing Connect](https://stripe.com/docs/connect/testing)

