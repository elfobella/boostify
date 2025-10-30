# Typography Plan - Boostify

## Amaç
Modern, okunabilir ve profesyonel bir tipografi sistemi kurmak.

## Font Family Seçimi

### Öneriler

#### 1. **Geist Sans** (Mevcut - Güncellenmiş)
- Google Fonts'tan güncel Geist font ailesi
- Modern, minimalist ve okunabilir
- İyi karakter seti desteği
- Bedava ve hızlı

#### 2. **Inter** (Alternatif Seçenek)
- Dünya çapında en popüler UI fontlarından biri
- Mükemmel okunabilirlik
- Geniş ağırlık seçenekleri
- Bedava

#### 3. **Poppins** (Alternatif Seçenek)
- Friendly ve modern görünüm
- Karakterler arası mükemmel boşluk
- Mobile-friendly
- Bedava

## Önerilen Font: **Inter**
- UI odaklı tasarım için optimize edilmiş
- Mükemmel okunabilirlik
- Çok yaygın kullanılıyor (trendy)
- Weight seçenekleri geniş

## Font Implementation

### 1. Font Import (next/font/google)
```tsx
import { Inter } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
})
```

### 2. CSS Variables
```css
:root {
  --font-sans: var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

### 3. Base Font Sizes (Artırılmış)

#### Body Text
- Base: 16px → **18px**
- Line height: 1.6 → **1.7**

#### Headings
- H1: 3rem → **3.5rem** (56px)
- H2: 2.5rem → **3rem** (48px)
- H3: 2rem → **2.5rem** (40px)
- H4: 1.5rem → **1.875rem** (30px)
- H5: 1.25rem → **1.5rem** (24px)
- H6: 1rem → **1.25rem** (20px)

### 4. Component-Specific Sizes

#### Navbar
- Logo: 1.25rem → **1.5rem** (24px)
- Menu items: 0.875rem → **1rem** (16px)

#### Hero Section
- Main title: 2.5rem → **4rem** (64px)
- Subtitle: 1.125rem → **1.375rem** (22px)

#### Game Cards
- Title: 1.25rem → **1.5rem** (24px)
- Description: 0.875rem → **1rem** (16px)

#### Buttons
- Small: 0.875rem → **1rem** (16px)
- Medium: 1rem → **1.125rem** (18px)
- Large: 1.125rem → **1.25rem** (20px)

#### Footer
- Links: 0.875rem → **1rem** (16px)
- Copyright: 0.875rem → **1rem** (16px)

### 5. Font Weights
- Light: 300
- Regular: 400
- Medium: 500
- **Semibold: 600** (vurgular için)
- Bold: 700
- Extrabold: 800 (özel durumlar)

## Responsive Typography

### Mobile
- H1: 2rem (32px)
- H2: 1.75rem (28px)
- H3: 1.5rem (24px)
- Body: 16px

### Tablet
- H1: 3rem (48px)
- H2: 2.5rem (40px)
- H3: 2rem (32px)
- Body: 17px

### Desktop
- H1: 4rem (64px)
- H2: 3rem (48px)
- H3: 2.5rem (40px)
- Body: 18px

## Letter Spacing

### Headings
```css
h1, h2, h3 {
  letter-spacing: -0.025em; /* Tighter for impact */
}
```

### Body Text
```css
body {
  letter-spacing: 0;
}
```

### Uppercase Text
```css
.uppercase {
  letter-spacing: 0.05em;
}
```

## Line Height Strategy

```css
.heading {
  line-height: 1.2; /* Tight for headings */
}

.body-text {
  line-height: 1.7; /* Comfortable for reading */
}

.lead {
  line-height: 1.6; /* Slightly tighter for emphasis */
}
```

## Color Contrast

### Dark Mode
- Primary text: #fafafa (98% luminance)
- Secondary text: #a3a3a3 (65% luminance)
- Muted text: #737373 (45% luminance)

### Light Mode
- Primary text: #0a0a0a (3% luminance)
- Secondary text: #404040 (25% luminance)
- Muted text: #737373 (45% luminance)

## Implementation Steps

1. ✅ Choose final font (Inter öneriliyor)
2. ✅ Import font in layout.tsx
3. ✅ Update globals.css with base sizes
4. ✅ Update component styles
5. ✅ Test responsive behavior
6. ✅ Verify contrast ratios
7. ✅ Test with both languages (EN/TR)

## Files to Update

- `app/layout.tsx` - Font import
- `app/globals.css` - Base typography styles
- `app/components/navbar/Navbar.tsx` - Navbar text sizes
- `app/components/navbar/NavItems.tsx` - Menu item sizes
- `app/page.tsx` - Hero section text sizes
- `app/components/games/GameCard.tsx` - Card text sizes
- `app/components/reliability/ReliabilityCard.tsx` - Feature card sizes
- `app/clash-royale/boosting/page.tsx` - Boosting page text sizes

## Testing Checklist

- [ ] Font yükleniyor mu?
- [ ] Her ekran boyutunda düzgün görünüyor mu?
- [ ] Dark/Light mode'da kontrast yeterli mi?
- [ ] İngilizce ve Türkçe metinler düzgün görünüyor mu?
- [ ] Tüm heading seviyeleri doğru boyutta mı?
- [ ] Line height'lar okuma için uygun mu?
- [ ] Mobile'da text çok büyük/küçük mü?

## Expected Outcome

- Modern, profesyonel görünüm
- İyileştirilmiş okunabilirlik
- Daha güçlü görsel hiyerarşi
- Tutarlı tipografi sistemi
- Responsive ve accessible

