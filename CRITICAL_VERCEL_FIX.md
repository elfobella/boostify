# ⚠️ KRİTİK: Vercel "Invalid API key" Çözümü

## 🔍 Tespit Edilen Sorunlar

Vercel environment variables ekranında key'ler görünüyor ama hala hata alıyorsunuz. Bu durumda **en olası 3 sorun:**

### 1. ⚠️ EN ÖNEMLİSİ: Environment Scope Seçilmemiş

Vercel'de environment variable eklerken **mutlaka scope seçmeniz gerekiyor:**

1. `SUPABASE_SERVICE_ROLE_KEY` değişkenine tıklayın
2. **"Production"** checkbox'ını işaretleyin (veya Production + Preview + Development)
3. **Save** butonuna tıklayın

**Eğer scope seçilmemişse, key production'da kullanılamaz!**

### 2. Key'in Tamamı Kopyalanmamış Olabilir

Vercel UI'da key truncated (kesilmiş) görünüyor:
```
eyJhbGci0iJIUzI1NiIsInR5cCI6IkpX...
```

Bu sadece görüntü ama gerçek değer kesik olabilir. Kontrol edin:

1. Vercel'de `SUPABASE_SERVICE_ROLE_KEY`'e tıklayın
2. **"Edit"** veya **"Reveal"** butonuna tıklayın
3. Key'in **tamamının** (başından sonuna kadar) göründüğünden emin olun
4. Eğer kesik görünüyorsa, Supabase'den yeniden kopyalayın

### 3. Key'in Başında/Sonunda Boşluk Var

Kopyalarken yanlışlıkla boşluk eklenmiş olabilir:

1. Vercel'de key'i **silelim**
2. Supabase Dashboard → Settings → API → service_role key
3. **"Reveal"** → Key'i seçin → Kopyalayın
4. **Notepad/Text Editor'da yapıştırın** → Başında/sonunda boşluk var mı kontrol edin
5. Boşluksuz olan key'i Vercel'e yapıştırın

## 🛠️ Adım Adım Çözüm

### Adım 1: Vercel'de Mevcut Key'i Silin

1. Vercel Dashboard → Settings → Environment Variables
2. `SUPABASE_SERVICE_ROLE_KEY` bulun
3. Sağdaki **"..."** menüsü → **"Delete"**
4. Onaylayın

### Adım 2: Supabase'den Key'i Alın

1. https://app.supabase.com → Projeniz
2. **Settings** → **API**
3. **"service_role"** bölümünü bulun
4. **"Reveal"** butonuna tıklayın
5. Key'i **tamamen** seçin (Ctrl+A veya Cmd+A)
6. Kopyalayın (Ctrl+C veya Cmd+C)

### Adım 3: Key'i Kontrol Edin (Notepad'de)

1. Notepad veya Text Editor açın
2. Yapıştırın (Ctrl+V)
3. Şunları kontrol edin:
   - ✅ Key `eyJ` ile başlıyor mu?
   - ✅ Key çok uzun mu? (250+ karakter)
   - ✅ Başında/sonunda boşluk var mı? (olmamalı)
   - ✅ Key kesik görünüyor mu? (tam olmalı)

### Adım 4: Vercel'e Ekleyin

1. Vercel Dashboard → Settings → Environment Variables
2. **"Add New"** butonuna tıklayın
3. **Key:** `SUPABASE_SERVICE_ROLE_KEY` (tam olarak bu, NEXT_PUBLIC_ YOK!)
4. **Value:** Notepad'den kopyaladığınız key'i yapıştırın
5. **⚠️ KRİTİK:** Environment kısmında **"Production"** checkbox'ını işaretleyin
6. **"Save"** butonuna tıklayın

### Adım 5: Redeploy

1. Vercel Dashboard → **Deployments**
2. En son deployment'ın yanındaki **"..."** → **"Redeploy"**
3. Veya yeni bir commit push edin

### Adım 6: Test ve Log Kontrolü

Production'da kayıt yaparken Vercel Function Logs'da şunları kontrol edin:

**Başarılı:**
```
[Supabase] Creating auth user with password
[Supabase] Auth user created successfully
```

**Hata varsa detaylı log'lar:**
```
[Supabase] Diagnostic Info:
[Supabase] - SUPABASE_SERVICE_ROLE_KEY exists: true
[Supabase] - SUPABASE_SERVICE_ROLE_KEY length: 220
[Supabase] - Key starts with: eyJhbGciOiJIUzI1Ni...
```

## 🎯 Hızlı Kontrol Listesi

- [ ] Vercel'de `SUPABASE_SERVICE_ROLE_KEY` variable name doğru mu? (NEXT_PUBLIC_ YOK)
- [ ] Key'in tamamı kopyalandı mı? (250+ karakter)
- [ ] Key'in başında/sonunda boşluk var mı? (olmamalı)
- [ ] **Production environment seçili mi?** ⚠️ EN ÖNEMLİSİ
- [ ] Redeploy yapıldı mı?
- [ ] Production'da test edildi mi?

## 🔍 Debugging

Hala hata alıyorsanız, Vercel Function Logs'da şu log'ları paylaşın:

```
[Supabase] Diagnostic Info:
[Supabase] - SUPABASE_SERVICE_ROLE_KEY length: ...
[Supabase] - Key starts with: ...
[Supabase] - Key ends with: ...
```

Bu log'lar sorunun tam olarak ne olduğunu gösterecek.

## ⚠️ Yaygın Hata: Environment Scope

**En yaygın sorun:** Key eklenmiş ama **Production scope seçilmemiş**. 

Vercel'de environment variable eklerken mutlaka scope seçmeniz gerekiyor. Eğer seçmezseniz, key sadece preview/development'ta kullanılabilir, production'da kullanılamaz!

**Çözüm:** Variable'a tıklayın → Edit → **Production** checkbox'ını işaretleyin → Save

