# Çoklu Dil ve Para Birimi Seçimi Planı

## 🌐 Özellik Özeti

Navbar'a dil (English/Türkçe) ve para birimi (USD/TRY) seçim özelliği eklenecek.

---

## 📋 Kullanılacak Kütüphaneler

### next-intl (Internationalization)
- **Paket:** `next-intl`
- **Güncel sürüm:** ^3.27.0
- **Neden:** 
  - Next.js 16 App Router için optimize edilmiş
  - Type-safe i18n
  - Server ve Client Components desteği
  - Routing desteği (locale-based routing)

### State Management
- **React Context API** (basit, hafif)
- **LocalStorage** (kullanıcı tercihini kaydet)

---

## 🔧 Mimari Yapı

### Dosya Yapısı
```
boostify/
├── messages/
│   ├── en.json                    # İngilizce çeviriler
│   └── tr.json                    # Türkçe çeviriler
├── i18n/
│   ├── config.ts                  # i18n yapılandırması
│   ├── request.ts                 # Locale detection
│   └── index.ts                   # Exports
├── contexts/
│   ├── CurrencyContext.tsx        # Para birimi state
│   └── index.ts
└── app/
    ├── [locale]/                  # Locale-based routing
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── ...
    └── components/
        └── locale/
            ├── LocaleSelector.tsx # Dil seçici
            ├── CurrencySelector.tsx # Para birimi seçici
            └── index.ts
```

---

## 📝 Translation Dosyaları

### messages/en.json
```json
{
  "nav": {
    "home": "Home",
    "about": "About",
    "services": "Services",
    "contact": "Contact"
  },
  "hero": {
    "title": "Take your games to the top, discover competitive level",
    "subtitle": "Fast and secure boosting service with professional players. Level up your rankings, reach your goals.",
    "ctaPrimary": "Discover Services",
    "ctaSecondary": "How It Works?"
  },
  "games": {
    "title": "Games We Provide Boosting For",
    "subtitle": "Rank boosting and progression services for your favorite games"
  },
  "reliability": {
    "title": "Why Atlas Boost?",
    "subtitle": "Secure, fast and guaranteed boosting service with professional players"
  }
}
```

### messages/tr.json
```json
{
  "nav": {
    "home": "Ana Sayfa",
    "about": "Hakkımızda",
    "services": "Hizmetler",
    "contact": "İletişim"
  },
  "hero": {
    "title": "Oyunlarınızı zirveye taşıyın, rekabetçi seviyeyi keşfedin",
    "subtitle": "Profesyonel oyuncularımızla hızlı ve güvenli boosting hizmeti. Sıralamalarınızı yükseltin, hedeflerinize ulaşın.",
    "ctaPrimary": "Hizmetleri Keşfet",
    "ctaSecondary": "Nasıl Çalışır?"
  },
  "games": {
    "title": "Boosting Hizmeti Sunan Oyunlar",
    "subtitle": "Favori oyunlarınızda sıralama yükseltme ve ilerleme hizmetleri"
  },
  "reliability": {
    "title": "Neden Atlas Boost?",
    "subtitle": "Profesyonel oyuncularımızla güvenli, hızlı ve garantili boosting hizmeti"
  }
}
```

---

## 🎨 UI Bileşenleri

### LocaleSelector
```typescript
// Dropdown veya Toggle formatında
- EN / TR seçimi
- Icon: Globe (lucide-react)
- Hover effect
- Active state gösterimi
- Ripple/transition effect
```

### CurrencySelector
```typescript
// Dropdown formatında
- USD ($) / TRY (₺) seçimi
- Currency symbol gösterimi
- Hover effect
- Active state gösterimi
```

### Navbar İntegrasyonu
- **Position:** Sticky/Fixed (mevcut)
- **Öğeler:**
  - Logo (sol)
  - Navigation Links (orta)
  - CurrencySelector + LocaleSelector + ThemeToggle (sağ)
- **Mobile:** Dropdown menu içinde

---

## 💱 Para Birimi Sistemi

### Currency Exchange Rates
```typescript
const exchangeRates = {
  USD: 1.0,
  TRY: 34.5  // Örnek kur (gerçek time API eklenebilir)
}
```

### Currency Conversion
```typescript
function convertPrice(priceUSD: number, currency: 'USD' | 'TRY'): string {
  const rate = exchangeRates[currency]
  const convertedPrice = priceUSD * rate
  return formatCurrency(convertedPrice, currency)
}
```

### Fiyat Gösterimi
- USD: `$25.00`
- TRY: `₺862.50`

---

## 🔄 State Management

### LocalStorage Keys
```typescript
localStorage.setItem('boostify-currency', 'USD')
localStorage.setItem('boostify-locale', 'en')
```

### Context Providers
```typescript
// CurrencyContext
- currency state
- setCurrency function
- convertPrice helper
- Provider wrapper

// i18n zaten next-intl tarafından yönetiliyor
```

---

## 🎯 Implementasyon Adımları

### 1. Kütüphane Kurulumu
```bash
npm install next-intl
```

### 2. Yapılandırma
- `messages/` klasörü oluştur
- `i18n/config.ts` yapılandırması
- Locale detection setup

### 3. App Router Yapısı
- `app/[locale]` klasör yapısı
- Middleware setup (locale detection)
- Layout güncellemesi

### 4. Bileşenler
- LocaleSelector component
- CurrencySelector component
- Context providers

### 5. Navbar Entegrasyonu
- Selector'ları navbar'a ekle
- Mobile menu güncellemesi

### 6. Sayfa Güncellemeleri
- Hard-coded text'leri t() ile değiştir
- Currency fiyat gösterimi ekle

---

## 📱 Responsive Tasarım

### Desktop
```
[Logo] [Nav Links...] [Currency] [Language] [Theme]
```

### Mobile
```
[Logo] [☰ Menu]
       ↓ (Menu açılınca)
       [Nav Links]
       [Currency]
       [Language]
       [Theme]
```

---

## ✨ Özellikler

### Dil Değiştirme
- ✅ Anında sayfa yenilemesi (locale-based routing)
- ✅ URL'de locale gösterimi (`/en/`, `/tr/`)
- ✅ Kullanıcı tercihini hatırlama
- ✅ SEO-friendly

### Para Birimi Değiştirme
- ✅ Anında fiyat güncelleme
- ✅ Currency symbol gösterimi
- ✅ Kullanıcı tercihini hatırlama
- ✅ Conversion rate desteği

### UX İyileştirmeleri
- ✅ Smooth transitions
- ✅ Loading states
- ✅ Error handling
- ✅ Accessibility (ARIA labels)

---

## 🎨 Stil Özellikleri

### Selector Tasarımı
```css
- Rounded button style
- Mavi gradient hover
- Active state indicator
- Icons (Globe, Currency symbol)
- Dropdown menu (select için)
```

### Renkler
- **Background:** White (light) / Zinc-900 (dark)
- **Hover:** Blue-100 (light) / Zinc-800 (dark)
- **Active:** Blue-600 border
- **Icon:** Gray (default) → Blue (hover)

---

## 🔗 Kullanım Örnekleri

### Dil Değiştirme
```tsx
import { useTranslations } from 'next-intl'

function Component() {
  const t = useTranslations('hero')
  return <h1>{t('title')}</h1>
}
```

### Para Birimi Kullanımı
```tsx
import { useCurrency } from '@/contexts/CurrencyContext'

function PriceDisplay({ priceUSD }: { priceUSD: number }) {
  const { currency, convertPrice } = useCurrency()
  return <span>{convertPrice(priceUSD, currency)}</span>
}
```

---

## ✅ Checklist

### Setup
- [ ] next-intl kurulumu
- [ ] messages klasörü ve dosyaları
- [ ] i18n yapılandırması
- [ ] Middleware setup

### Context & State
- [ ] CurrencyContext oluştur
- [ ] LocalStorage entegrasyonu
- [ ] Exchange rates setup

### Bileşenler
- [ ] LocaleSelector component
- [ ] CurrencySelector component
- [ ] Context providers

### Navbar
- [ ] Selector'ları ekle
- [ ] Mobile menu güncelle
- [ ] Responsive test

### Sayfa Güncellemeleri
- [ ] Hard-coded text'leri çevir
- [ ] Fiyat gösterimlerini güncelle
- [ ] Test tüm sayfalar

---

## 📝 Notlar

- next-intl, App Router için middleware gerektirir
- Locale-based routing URL yapısını değiştirir
- SEO için metadata da çevrilmeli
- Real-time exchange rates için API entegrasyonu yapılabilir

---

**Son Güncelleme:** 2025-01-25
**Versiyon:** 1.0

