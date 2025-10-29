# Clash Royale Boosting Hizmet Sayfası Planı

## 🎮 Genel Bakış

Ana sayfadaki Clash Royale kartına tıklanınca detaylı boosting hizmet sayfası açılacak. Kullanıcı kategori seçip form doldurarak fiyat görecek ve ödeme yapabilecek.

---

## 📋 Boost Hizmet Kategorileri

### Birinci Satır (Ana Kategoriler)

1. **Trophy Boosting** (Kupa Artırma)
   - Arena seviyesi artırma
   - Kupaya göre fiyatlandırma

2. **Path of Legends Boosting** (Efsane Yolu)
   - Lig artırma
   - Seçilen lige göre fiyat

3. **UC Medals Boosting** (UC Madalya)
   - UC madalya toplama
   - Mevcut miktar ve hedef

4. **Merge Tactics Boosting** (Birleştirme Taktikleri)
   - Kart seviyesi artırma
   - Seçilen karta göre

5. **Challenges Boosting** (Meydan Okumalar)
   - Challenge tamamlama
   - Challenge tipine göre

6. **Pass Royale Boosting** (Kraliyet Geçişi)
   - Pass Royale seviyesi artırma
   - Mevcut seviyeden hedef seviyeye

### İkinci Satır (Ek Hizmetler)

7. **Crowns Boosting** (Taç Toplama)
   - Crown sayısı artırma
   - Hedef crown sayısı

8. **Tournament Boosting** (Turnuva)
   - Turnuva kazanımları
   - Turnuva tipine göre

9. **Custom Request** (Özel İstek)
   - Özel hizmet talep formu
   - Açıklama alanı

---

## 🎨 UI Tasarımı

### Kategori Butonları

```tsx
// Seçili kategori
className="bg-white text-gray-900 font-bold rounded-lg px-6 py-3"

// Seçilmemiş kategori
className="bg-gray-900 text-white border border-gray-700 rounded-lg px-6 py-3 hover:border-blue-500"
```

### Özellikler
- Responsive tasarım (Desktop'ta tek satır, mobilde grid)
- Active state gösterimi
- Smooth transitions
- Hover effects

---

## 📝 Form Yapısı

### Ortak Form Alanları
```typescript
interface BaseFormData {
  gameAccount: string      // Oyun hesabı ID/Nickname
  currentLevel: string     // Mevcut seviye/kupa
  targetLevel: string      // Hedef seviye/kupa
  additionalNotes?: string // Ek notlar
}
```

### Kategori-Specific Form Alanları

#### 1. Trophy Boosting
```typescript
{
  currentArena: string     // Mevcut arena (1-16)
  targetArena: string      // Hedef arena
  additionalCards?: string // İstediği kartlar
}
```

#### 2. Path of Legends Boosting
```typescript
{
  currentLeague: string    // Mevcut lig
  targetLeague: string     // Hedef lig
}
```

#### 3. UC Medals Boosting
```typescript
{
  currentMedals: number    // Mevcut UC madalya
  targetMedals: number     // Hedef UC madalya
}
```

#### 4. Merge Tactics Boosting
```typescript
{
  cardName: string         // Kart adı
  currentLevel: number     // Mevcut kart seviyesi
  targetLevel: number      // Hedef kart seviyesi
  quantity: number         // Kart adedi
}
```

#### 5. Challenges Boosting
```typescript
{
  challengeType: string    // Challenge tipi
  targetWins: number       // Hedef galibiyet
}
```

#### 6. Pass Royale Boosting
```typescript
{
  currentPassLevel: number // Mevcut pass seviyesi
  targetPassLevel: number  // Hedef pass seviyesi
  hasPremiumPass: boolean  // Premium pass var mı?
}
```

#### 7. Crowns Boosting
```typescript
{
  targetCrowns: number     // Hedef crown sayısı
}
```

#### 8. Tournament Boosting
```typescript
{
  tournamentType: string   // Turnuva tipi
  targetReward: string     // Hedef ödül
}
```

#### 9. Custom Request
```typescript
{
  requestDescription: string // Detaylı açıklama
  budget?: string           // Bütçe (optional)
}
```

---

## 💰 Fiyatlandırma Sistemi

### Dinamik Fiyat Hesaplama

```typescript
interface PricingRule {
  basePrice: number        // Temel fiyat
  multiplier: number       // Çarpan (seviye farkı)
  type: 'linear' | 'exponential' // Hesaplama tipi
}

function calculatePrice(currentLevel: number, targetLevel: number, pricingRule: PricingRule): number {
  const difference = targetLevel - currentLevel
  
  if (pricingRule.type === 'linear') {
    return pricingRule.basePrice * difference * pricingRule.multiplier
  } else {
    // Exponential pricing for higher levels
    return pricingRule.basePrice * Math.pow(pricingRule.multiplier, difference)
  }
}
```

### Kategori Bazlı Fiyatlandırma

1. **Trophy Boosting**
   - Arena 1-8: $0.50/kupa
   - Arena 9-12: $0.75/kupa
   - Arena 13-16: $1.00/kupa

2. **Path of Legends Boosting**
   - Lig başına: $5 - $50
   - Lig seviyesine göre artan fiyat

3. **UC Medals Boosting**
   - 1000 UC: $10
   - 5000 UC: $45
   - 10000 UC: $85

4. **Merge Tactics Boosting**
   - Kart seviyesi başına: $2-$15
   - Nadirliğe göre fiyat

5. **Challenges Boosting**
   - Standart: $5
   - Grand: $15
   - Classic: $10

6. **Pass Royale Boosting**
   - Seviye başına: $1.50
   - Premium avantajı

7. **Crowns Boosting**
   - 10 crown: $3
   - 100 crown: $25
   - 250 crown: $55

8. **Tournament Boosting**
   - Grand Challenge: $20
   - Classic Challenge: $10
   - Tournament: $30

9. **Custom Request**
   - Değerlendirilecek (manuel)

---

## 🎯 Sayfa Yapısı

```
/clash-royale/boosting
├── Header (Breadcrumb: Ana Sayfa > Oyunlar > Clash Royale)
├── Hero Section
│   ├── Oyun logosu/banner
│   └── Kısa açıklama
├── Service Categories (2 satır)
│   ├── Satır 1: 6 ana kategori
│   └── Satır 2: 3 ek hizmet
├── Dynamic Form Section
│   ├── Seçilen kategoriye göre form
│   ├── Live price preview
│   └── Submit button
├── Pricing Breakdown (Sidebar veya Modal)
│   ├── Base price
│   ├── Extras
│   ├── Total
│   └── Estimated completion time
└── Footer
```

---

## 📐 Component Yapısı

### Ana Bileşenler

1. **ClashRoyaleBoostingPage**
   - Page container
   - State management
   - Category selection

2. **ServiceCategorySelector**
   - Kategori butonları
   - Active state management
   - Responsive layout

3. **BoostingForm**
   - Dinamik form fields
   - Validation
   - Price calculation

4. **PricePreview**
   - Live price display
   - Currency conversion
   - Breakdown modal

5. **OrderSummary**
   - Fiyat detayları
   - Tahmini tamamlanma süresi
   - Checkout button

---

## 🔄 State Management

### Local State
```typescript
const [selectedCategory, setSelectedCategory] = useState<string>('')
const [formData, setFormData] = useState<FormData>({})
const [calculatedPrice, setCalculatedPrice] = useState<number>(0)
const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
```

### Form Validation
- Required fields
- Range validations (min-max seviye)
- Number validations
- Account format validations

---

## 💳 Ödeme Sistemi

### Checkout Flow
```
1. Form Fill → 2. Price Review → 3. Payment → 4. Confirmation
```

### Ödeme Yöntemleri
- Stripe (Kredi Kartı)
- PayPal
- Crypto (USDT, BTC)

### Post-Payment
- Order confirmation email
- Booster assignment
- Progress tracking link

---

## 🎨 Tasarım Özellikleri

### Renk Paleti
- Primary: Blue-600 → Cyan-500 (gradient)
- Accent: Selected category white bg
- Unselected: Dark gray with blue border
- Price: Green for positive, red for urgent

### Animasyonlar
- Category switch: fade in/out
- Form fields: slide in
- Price update: pulse effect
- Submit: loading state

### Responsive
- Desktop: Single row categories
- Tablet: 3x3 grid
- Mobile: 2 rows with scroll

---

## 📱 Routing

```typescript
// Dynamic route
/app/clash-royale/boosting/page.tsx

// Query params for direct category access
/clash-royale/boosting?category=trophy-boosting
```

---

## 🌐 i18n Desteği

### Çeviriler Gerekli

#### Kategoriler
```json
{
  "clashRoyale": {
    "categories": {
      "trophy": "Trophy Boosting",
      "pathOfLegends": "Path of Legends Boosting",
      "ucMedals": "UC Medals Boosting",
      "mergeTactics": "Merge Tactics Boosting",
      "challenges": "Challenges Boosting",
      "passRoyale": "Pass Royale Boosting",
      "crowns": "Crowns Boosting",
      "tournament": "Tournament Boosting",
      "customRequest": "Custom Request"
    }
  }
}
```

#### Form Labels
```json
{
  "form": {
    "gameAccount": "Game Account",
    "currentLevel": "Current Level",
    "targetLevel": "Target Level",
    "estimatedPrice": "Estimated Price",
    "estimatedTime": "Estimated Time",
    "submitOrder": "Continue to Payment"
  }
}
```

---

## ✅ Checklist

### Tasarım
- [ ] Kategori butonları tasarımı
- [ ] Form layout ve validation
- [ ] Price preview component
- [ ] Responsive design
- [ ] Dark mode support

### Fonksiyonellik
- [ ] Category selection state
- [ ] Dynamic form rendering
- [ ] Price calculation logic
- [ ] Form validation
- [ ] i18n entegrasyonu

### Ödeme
- [ ] Stripe/PayPal setup
- [ ] Order processing
- [ ] Confirmation email
- [ ] Order tracking

### UX
- [ ] Loading states
- [ ] Error handling
- [ ] Success messages
- [ ] Progress indicators

---

## 📊 Örnek UI Flow

### Step 1: Category Selection
```
[Trophy Boosting] ← Seçili
[Path of Legends]
[UC Medals]
...
```

### Step 2: Form Fill
```
Game Account: [___________]
Current Arena: [Dropdown ▼]
Target Arena: [Dropdown ▼]
Estimated Price: $45.00
                [Continue to Payment →]
```

### Step 3: Checkout
```
Order Summary
├── Trophy Boosting
├── Arena 9 → Arena 12
├── Estimated time: 24-48 hours
└── Total: $45.00

[Pay with Stripe] [Pay with PayPal]
```

---

## 🔗 API Endpoints (Gelecek)

```
POST /api/orders
POST /api/calculate-price
GET /api/order-status/:id
POST /api/payment/confirm
```

---

## 💳 Stripe Entegrasyonu Gereklilikleri

### 1. Gerekli Paketler

```bash
npm install @stripe/stripe-js stripe
```

### 2. Environment Variables

```env
# .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Stripe Dashboard Setup

- [ ] Stripe hesabı oluştur (https://stripe.com)
- [ ] Test API key'leri al
- [ ] Webhook endpoint oluştur
- [ ] Ödeme yöntemleri aktive et
  - Kredi/Banka Kartı
  - Apple Pay
  - Google Pay

### 4. Dosya Yapısı

```
app/
├── api/
│   ├── stripe/
│   │   ├── create-checkout-session/
│   │   │   └── route.ts
│   │   ├── webhook/
│   │   │   └── route.ts
│   │   └── verify-payment/
│   │       └── route.ts
├── checkout/
│   ├── success/
│   │   └── page.tsx
│   └── cancel/
│       └── page.tsx
└── lib/
    └── stripe.ts
```

### 5. Stripe Client Setup

```typescript
// lib/stripe.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

export const getStripe = async () => {
  const { loadStripe } = await import('@stripe/stripe-js')
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
}
```

### 6. Checkout Session API

```typescript
// app/api/stripe/create-checkout-session/route.ts
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: Request) {
  const { orderId, amount, description } = await req.json()
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Clash Royale Boosting Service',
          description: description,
        },
        unit_amount: amount * 100, // cents
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/checkout/cancel`,
    metadata: {
      orderId: orderId,
    },
  })

  return NextResponse.json({ sessionId: session.id })
}
```

### 7. Webhook Handler

```typescript
// app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session
      // Update order status in database
      await updateOrderStatus(session.metadata.orderId, 'completed')
      break
    case 'payment_intent.succeeded':
      // Handle successful payment
      break
  }

  return NextResponse.json({ received: true })
}
```

### 8. Frontend Integration

```typescript
// components/CheckoutButton.tsx
'use client'

import { useState } from 'react'
import { getStripe } from '@/lib/stripe'

export function CheckoutButton({ orderId, amount, description }) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)
    
    try {
      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, amount, description }),
      })

      const { sessionId } = await response.json()
      
      // Redirect to Stripe Checkout
      const stripe = await getStripe()
      await stripe?.redirectToCheckout({ sessionId })
    } catch (error) {
      console.error('Checkout error:', error)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? 'Loading...' : 'Proceed to Payment'}
    </button>
  )
}
```

### 9. Success Page

```typescript
// app/checkout/success/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [orderDetails, setOrderDetails] = useState(null)

  useEffect(() => {
    if (sessionId) {
      // Fetch order details
      fetchOrderDetails(sessionId)
    }
  }, [sessionId])

  return (
    <div className="container py-20">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-green-600 mb-4">Payment Successful!</h1>
        <p>Your order has been received.</p>
        {/* Order details */}
      </div>
    </div>
  )
}
```

### 10. Cancel Page

```typescript
// app/checkout/cancel/page.tsx
export default function CancelPage() {
  return (
    <div className="container py-20">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-orange-600 mb-4">Payment Cancelled</h1>
        <p>Your payment was cancelled. You can try again.</p>
      </div>
    </div>
  )
}
```

### 11. Security Checklist

- [ ] API key'leri environment variables'da sakla
- [ ] Webhook signature verification yap
- [ ] HTTPS kullan (production)
- [ ] Rate limiting ekle
- [ ] Error handling ekle
- [ ] Logging ekle
- [ ] Test mode'da test et

### 12. Test Mode Setup

```typescript
// Test card numbers (Stripe)
const testCards = {
  visa: '4242 4242 4242 4242',
  mastercard: '5555 5555 5555 4444',
  amex: '3782 822463 10005',
}

// Test CVV: Any 3 digits
// Test Expiry: Any future date
```

### 13. Production Deployment

- [ ] Live API keys al
- [ ] Webhook URL'i güncelle
- [ ] SSL sertifikası kontrol et
- [ ] Security headers ekle
- [ ] Monitoring setup
- [ ] Error tracking (Sentry)

### 14. Order Management

```typescript
// Database schema (örnek)
interface Order {
  id: string
  userId: string
  gameAccount: string
  category: string
  currentLevel: string
  targetLevel: string
  calculatedPrice: number
  status: 'pending' | 'paid' | 'in_progress' | 'completed' | 'cancelled'
  stripeSessionId: string
  createdAt: Date
  updatedAt: Date
}
```

### 15. Additional Features

- [ ] Subscription support (yinelemeli ödemeler)
- [ ] Refund handling
- [ ] Invoice generation
- [ ] Email notifications
- [ ] Mobile payments (Apple Pay, Google Pay)
- [ ] Multi-currency support

### 16. Webhook Events to Handle

```typescript
// Important webhook events
const webhookEvents = {
  'payment_intent.succeeded': 'Payment completed',
  'payment_intent.payment_failed': 'Payment failed',
  'checkout.session.completed': 'Checkout completed',
  'charge.refunded': 'Refund processed',
  'customer.subscription.created': 'Subscription created',
  'invoice.payment_succeeded': 'Invoice paid',
}
```

---

**Son Güncelleme:** 2025-01-25
**Versiyon:** 1.1

