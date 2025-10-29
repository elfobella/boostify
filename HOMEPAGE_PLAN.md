# Anasayfa Planı: Boostify

## 🚀 Hoş Geldiniz!

### Giriş Bölümü
**Konum:** Sayfa en üstü, Hero Section içinde

**İçerik:**
```
Güvenilirliğimiz ve hızımızla dijital deneyiminizi zirveye taşıyoruz.
```

**Stil:**
- Center aligned (merkez hizalama)
- Büyük, etkileyici font (text-3xl veya text-4xl)
- Mavi gradient renk (blue-600 to cyan-500)
- Modern, profesyonel ton

---

## 🎮 Popüler Oyunlar Bölümü

### Konum
Hero section'dan sonra, Features section'dan önce

### Yapı

#### Başlık
**"Popüler Oyunlar"** veya **"Featured Games"**
- text-3xl, bold
- Mavi gradient text

#### Oyun Kartı Yapısı
```
┌─────────────────────────────┐
│    [Oyun Resmi]            │
│    clash-royale.jpg        │
│    200x180px               │
├─────────────────────────────┤
│    Clash Royale            │
│    [Kısa açıklama]         │
│    [Buton: Daha Fazla >]   │
└─────────────────────────────┘
```

**Özellikler:**
- Card design (rounded-lg, shadow-lg)
- Hover effect (scale ve shadow artışı)
- Gradient border veya glow effect
- Responsive: Desktop'ta grid, mobile'da tek sütun
- Image optimizasyon (Next.js Image component)
- Hover'da başlık vurgusu (mavi renk)

### Clash Royale Kartı
**İçerik:**
- **Başlık:** "Clash Royale"
- **Görsel:** `/public/clash-royale.jpg` (200x180px)
- **Açıklama:** "Strategik kart savaşları ve kule savunma deneyimi"
- **CTA:** "Oyunu Keşfet →"

**Renk Palette:**
- Başlık: Blue-600 (hover: blue-700)
- Buton: Gradient (blue to cyan)
- Card background: White (dark: zinc-900)
- Border: Subtle blue glow on hover

---

## ⚡ Güvenilirlik ve Hız Bölümü

### Konum
Popüler Oyunlar'dan sonra, Features'tan önce

### Başlık
**"Güvenilirlik ve Hız"** veya **"Reliability & Performance"**

### Yapı
3-4 özellik kartı (grid layout)

#### Kart #1: Yüksek Performans
**İkon:** ⚡ (Zap icon from lucide-react)
**Başlık:** "Yüksek Performans"
**Açıklama:** "En güncel teknolojilerle optimize edilmiş kod yapısı ve hızlı yükleme süreleri."
**Özellikler:**
- SSD ile hızlı veri erişimi
- CDN desteği
- Optimize edilmiş veritabanı sorguları

#### Kart #2: Kesintisiz Çalışma
**İkon:** 🔒 (Shield icon from lucide-react)
**Başlık:** "Kesintisiz Çalışma"
**Açıklama:** "Güçlü sunucu altyapısı ve sürekli izleme sistemiyle %99.9 uptime garanti."
**Özellikler:**
- 7/24 izleme
- Otomatik yedekleme
- Hata yönetimi

#### Kart #3: Güvenli Çözümler
**İkon:** 🛡️ (Lock icon from lucide-react)
**Başlık:** "Güvenli Çözümler"
**Açıklama:** "Veri güvenliği ve gizliliğine en üst düzeyde önem veriyoruz."
**Özellikler:**
- SSL sertifika
- Veri şifreleme
- GDPR uyumlu

#### Kart #4: Ölçeklenebilirlik
**İkon:** 🚀 (Rocket icon from lucide-react)
**Başlık:** "Ölçeklenebilirlik"
**Açıklama:** "Projeleriniz büyüdükçe kolayca ölçeklenebilir mimari."
**Özellikler:**
- Bulut altyapısı
- Dinamik kaynak yönetimi
- Dikey ve yatay ölçekleme

### Stil Özellikleri
- **Grid Layout:** 2x2 (desktop), 1x4 (mobile)
- **Card Design:** 
  - Rounded-xl corners
  - Hover: scale-105, glow effect
  - Border: subtle, mavi aksan rengi
- **İkonlar:** 
  - Mavi gradient background
  - Shadow effect (glow)
  - 48px x 48px boyut
- **Typography:**
  - Başlık: text-xl, bold
  - Açıklama: text-sm, opacity-70
  - List item: text-xs, bullet points

---

## 📐 Sayfa Düzeni

```
┌─────────────────────────────────────┐
│         Navbar                      │
├─────────────────────────────────────┤
│  [Background Pattern & Light Rays]  │
│                                     │
│  🎯 GİRİŞ CÜMLESİ                  │
│     (Center, Large, Gradient)      │
│                                     │
│  📊 Get Started Buttons             │
├─────────────────────────────────────┤
│                                     │
│  🎮 POPÜLER OYUNLAR                 │
│     [Clash Royale Card 200x180]    │
│     [Diğer oyun kartları...]       │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  ⚡ GÜVENİLİRLİK VE HIZ             │
│     [Grid: 4 Kart]                  │
│     - Yüksek Performans             │
│     - Kesintisiz Çalışma            │
│     - Güvenli Çözümler              │
│     - Ölçeklenebilirlik             │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  ✨ FEATURES (Mevcut bölüm)         │
│     - Modern UI Components          │
│     - Smooth Animations             │
│     - Dark Mode                     │
│     - Type Safe                     │
│                                     │
├─────────────────────────────────────┤
│         Footer                      │
└─────────────────────────────────────┘
```

---

## 🎨 Renk Paleti

### Primary Colors
- **Mavi:** blue-600, blue-500, blue-400
- **Cyan:** cyan-500, cyan-400
- **Gradient:** from-blue-600 to-cyan-500

### Accent Colors
- **Background:** white (light), zinc-950 (dark)
- **Text:** gray-900 (light), gray-100 (dark)
- **Border:** gray-200 (light), gray-800 (dark)

### Special Effects
- **Glow:** shadow-blue-500/50
- **Hover:** shadow-blue-500/70
- **Pattern:** subtle grid background

---

## 💻 Teknik Detaylar

### Bileşenler
1. **HeroSection** (mevcut, güncellenecek)
2. **PopularGames** (yeni)
3. **ReliabilitySection** (yeni)
4. **Features** (mevcut)

### Animasyonlar
- **Card Hover:** scale-105, smooth transition
- **Glow Effect:** shadow intensity artışı
- **Fade In:** section geçişlerinde
- **Image Load:** blur to clear effect

### Responsive Breakpoints
- **Mobile:** < 768px (1 column)
- **Tablet:** 768px - 1024px (2 columns)
- **Desktop:** > 1024px (3-4 columns)

---

## 📝 İçerik Örnekleri

### Giriş Cümlesi Seçenekleri
1. "Güvenilirliğimiz ve hızımızla dijital deneyiminizi zirveye taşıyoruz."
2. "Modern teknoloji, güvenilir altyapı ve hızlı çözümlerle yanınızdayız."
3. "Boostify ile hız ve performansın bir arada olduğu deneyimi keşfedin."

### Clash Royale Açıklaması
"Kart stratejisi ve gerçek zamanlı savaşların buluştuğu Clash Royale'de, kulelerinizi koruyun ve düşmanları yenin. Stratejik düşünce ve hızlı karar verme yeteneğinizi test edin."

---

## ✅ Checklist

### Tasarım
- [ ] Giriş cümlesi tasarımı (center, gradient, large)
- [ ] Popüler oyunlar kart tasarımı
- [ ] Clash Royale görsel optimizasyonu
- [ ] Güvenilirlik ve hız kartları
- [ ] Responsive grid layout
- [ ] Hover efektleri ve animasyonlar

### İçerik
- [ ] Giriş cümlesi finalizasyonu
- [ ] Oyun açıklamaları
- [ ] Güvenilirlik özellik açıklamaları
- [ ] SEO-friendly başlıklar

### Teknik
- [ ] Component yapısı (PopularGames, ReliabilitySection)
- [ ] Next.js Image optimizasyonu
- [ ] Animation hookları (framer-motion)
- [ ] Dark mode uyumluluğu
- [ ] Performance optimization

---

**Not:** Bu plan üzerinden kodlamaya başlandığında, her bölüm için ayrı component dosyaları oluşturulacak ve mevcut `app/page.tsx` içinde organize edilecek.

**Son Güncelleme:** 2025-01-25
**Versiyon:** 1.0

