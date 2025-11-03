# Boostify Proje Yapısı ve Mimari Plan

## 📋 Proje Özeti

Modern Next.js 16 projesi için iskelet yapısı ve kullanılacak kütüphaneler.

---

## 🛠️ Kullanılacak Kütüphaneler

### 1. **Next.js 16** (Mevcut)
- App Router yapısı
- Server Components desteği
- Optimized routing

### 2. **TypeScript** (Mevcut)
- Full type safety
- Modern ES2020+ features

### 3. **Tailwind CSS v4** (Mevcut)
- Utility-first CSS framework
- Modern JIT compilation
- Dark mode native support

### 4. **Dark Mode: next-themes**
- **Paket:** `next-themes`
- **Güncel sürüm:** ^0.4.4
- **Neden:** En popüler ve güncel Next.js dark mode çözümü
- **Özellikler:**
  - SSR desteği
  - Sistem tercihi desteği (system preference)
  - Flash prevention
  - Zero-config

### 5. **Icon Library: lucide-react**
- **Paket:** `lucide-react`
- **Güncel sürüm:** ^0.469.0
- **Neden:** Modern, hafif ve performanslı ikon kütüphanesi
- **Alternatif:** react-icons (daha ağır ama geniş katalog)

### 6. **Animasyon: framer-motion**
- **Paket:** `framer-motion`
- **Güncel sürüm:** ^12.0.0
- **Neden:** En popüler ve güçlü React animasyon kütüphanesi
- **Özellikler:**
  - Smooth transitions
  - Page transitions
  - Micro-interactions

### 7. **Form Management: react-hook-form**
- **Paket:** `react-hook-form`
- **Güncel sürüm:** ^7.54.2
- **Neden:** Performanslı ve küçük bundle size
- **Moderate:** UX de eksik varsa form kullanımında lazım olur

### 8. **HTTP Client: TanStack Query (React Query)**
- **Paket:** `@tanstack/react-query`
- **Güncel sürüm:** ^6.1.1
- **Neden:** Modern ve güçlü data fetching kütüphanesi
- **Özellikler:**
  - Caching
  - Auto refetching
  - Optimistic updates

### 9. **UI Components: shadcn/ui**
- **Paket:** `shadcn/ui` (copy-paste pattern)
- **Neden:** Radix UI + Tailwind kombinasyonu
- **Özellikler:**
  - Accessible components
  - Customizable
  - No runtime dependencies
- **Bileşenler:**
  - Button, Input, Card, Dialog, Dropdown Menu, Sheet, Toast

---

## 📁 Klasör Yapısı

```
boostify/
├── app/
│   ├── layout.tsx                 # Root layout (dark mode provider)
│   ├── page.tsx                   # Home page
│   ├── globals.css                # Global styles
│   ├── favicon.ico
│   │
│   ├── components/                # Shared components
│   │   ├── navbar/
│   │   │   ├── Navbar.tsx
│   │   │   ├── NavItems.tsx
│   │   │   ├── MobileMenu.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── footer/
│   │   │   ├── Footer.tsx
│   │   │   ├── FooterLinks.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── theme/
│   │   │   ├── ThemeProvider.tsx  # next-themes provider
│   │   │   ├── ThemeToggle.tsx    # Dark mode toggle button
│   │   │   └── index.ts
│   │   │
│   │   └── ui/                    # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       └── ...
│   │
│   ├── api/                       # API routes (optional)
│   │   └── ...
│   │
│   └── [pages]/                   # Route pages
│       ├── layout.tsx
│       ├── page.tsx
│       └── loading.tsx            # Loading UI
│
├── lib/
│   ├── utils.ts                   # Utility functions (cn, etc.)
│   └── queries.ts                 # React Query setup
│
├── hooks/                         # Custom hooks
│   ├── useTheme.ts
│   └── ...
│
├── types/                         # TypeScript types
│   ├── index.ts
│   └── ...
│
├── public/                        # Static assets
│   ├── images/
│   └── ...
│
├── components.json                # shadcn/ui config
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🎨 Dark Mode Implementasyonu

### 1. **next-themes Setup**
```typescript
// app/components/theme/ThemeProvider.tsx
'use client'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
```

### 2. **Root Layout'a Entegrasyon**
- ThemeProvider wrapper eklenecek
- `suppressHydrationWarning` eklenmeli (dark mode hydration için)

### 3. **Theme Toggle Component**
- Toggle button (sun/moon icons)
- Smooth transitions

---

## 🧭 Navbar Yapısı

### Özellikler:
- Responsive design (mobile/desktop)
- Logo ve marka alanı
- Navigation links (active state)
- Theme toggle button
- Mobile hamburger menu
- Sticky/fixed position option

### Bileşenler:
- **Navbar.tsx**: Ana container
- **NavItems.tsx**: Desktop navigation links
- **MobileMenu.tsx**: Mobile hamburger menu
- **ThemeToggle.tsx**: Dark mode switch

### Stil:
- Clean ve minimal design
- Smooth hover effects
- Mobile-first approach

---

## 🦶 Footer Yapısı

### Özellikler:
- Multi-column layout
- Social media links
- Copyright information
- Quick links
- Newsletter subscription (optional)

### Bileşenler:
- **Footer.tsx**: Ana container
- **FooterLinks.tsx**: Link grupları
- **SocialLinks.tsx**: Sosyal medya ikonları

### Stil:
- Separator ile header'dan ayrım
- Grid layout
- Subtle background color

---

## 🎯 Implementasyon Adımları

### Faz 1: Temel Setup
1. ✅ next-themes kurulumu
2. ✅ ThemeProvider setup
3. ✅ Root layout güncellemesi

### Faz 2: UI Components
4. shadcn/ui kurulumu
5. Button, Card, Input gibi temel bileşenler

### Faz 3: Navbar
6. Navbar component yapısı
7. Navigation links
8. Theme toggle
9. Mobile menu

### Faz 4: Footer
10. Footer component yapısı
11. Links ve social media
12. Responsive design

### Faz 5: Styling & Polish
13. Global styles düzenleme
14. Color scheme (light/dark)
15. Animations & transitions
16. Accessibility checks

---

## 🎨 Tasarım Sistemi

### Renkler:
- **Primary:** Tailwind default (customizable)
- **Background:** zinc-50 (light) / black (dark)
- **Foreground:** black (light) / zinc-50 (dark)
- **Border:** zinc-200 (light) / zinc-800 (dark)

### Typography:
- **Font:** Geist Sans (mevcut)
- **Sizes:** Tailwind type scale
- **Line height:** 1.5 - 1.75

### Spacing:
- Consistent spacing scale (4px base)
- Tailwind spacing utilities

### Border Radius:
- **Small:** 8px
- **Medium:** 12px
- **Large:** 16px

---

## 📦 Install Komutları

```bash
# Core dependencies
npm install next-themes framer-motion

# UI components
npx shadcn@latest init
npx shadcn@latest add button card input

# Icon library
npm install lucide-react

# Optional
npm install react-hook-form @tanstack/react-query
```

---

## ✅ Checklist

### Setup
- [ ] next-themes kurulumu
- [ ] shadcn/ui kurulumu
- [ ] lucide-react kurulumu
- [ ] framer-motion kurulumu

### Components
- [ ] ThemeProvider
- [ ] ThemeToggle
- [ ] Navbar
- [ ] Footer
- [ ] UI components (Button, Card, etc.)

### Styling
- [ ] Dark mode CSS variables
- [ ] Global styles
- [ ] Responsive breakpoints
- [ ] Animations

### Testing
- [ ] Theme switching test
- [ ] Responsive design test
- [ ] Browser compatibility
- [ ] Accessibility audit

---

## 🔗 Kaynaklar

- [next-themes Documentation](https://github.com/pacocoursey/next-themes)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Next.js 16 Docs](https://nextjs.org/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev/)

---

## 📝 Notlar

- Tüm bileşenler Server Components olarak başlar
- Client-side etkileşim için 'use client' directive kullanılır
- Dark mode SSR için özel dikkat gerektirir
- Performance için lazy loading düşünülebilir
- SEO için metadata yapısı düzenlenecek
- Analytics (Vercel Analytics) eklenecek

---

**Son Güncelleme:** 2025-01-25
**Proje:** Boostify
**Versiyon:** 0.1.0

