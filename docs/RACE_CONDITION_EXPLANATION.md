# Race Condition Açıklaması ve Koruma

## 🎯 Race Condition Nedir?

Race condition (yarış durumu), iki veya daha fazla işlem aynı anda aynı kaynağa erişmeye çalıştığında ortaya çıkan bir durumdur.

### Senaryo: İki Booster Aynı Order'ı Almaya Çalışıyor

**Sorun olmasaydı (race condition koruması olmadan):**

```
Zaman Akışı:

T=0ms:  Booster A → "Order #123'ü alayım" diye kontrol ediyor
        Booster B → "Order #123'ü alayım" diye kontrol ediyor

T=10ms: Booster A → Order #123'ün booster_id'si NULL ✅
        Booster B → Order #123'ün booster_id'si NULL ✅ (hala NULL çünkü henüz update olmadı)

T=20ms: Booster A → Order'ı kendisine atıyor (booster_id = A'nın ID'si)
        Booster B → Order'ı kendisine atıyor (booster_id = B'nin ID'si) ❌

Sonuç: İki booster de aynı order'ı aldı! 😱
```

### Bizim Koruma Sistemimiz

Kodumuzda `app/api/orders/claim/route.ts` dosyasında şu koruma var:

```typescript
// ⚠️ ÖNEMLİ: Aynı anda update ederken constraint kontrolü
const { data: updatedOrder, error: updateError } = await supabaseAdmin
  .from('orders')
  .update({
    booster_id: userData.id,
    claimed_at: new Date().toISOString(),
    status: 'processing',
  })
  .eq('id', orderId)
  .eq('status', 'pending')           // ✅ Status hala pending mi?
  .is('booster_id', null)            // ✅ Hala NULL mı?
  .select()
  .single()
```

**Nasıl çalışıyor:**

```
T=0ms:  Booster A → Order #123'ü kontrol ediyor (booster_id = NULL) ✅
        Booster B → Order #123'ü kontrol ediyor (booster_id = NULL) ✅

T=10ms: Booster A → UPDATE çalıştırıyor:
        - WHERE booster_id IS NULL ✅
        - UPDATE booster_id = A'nın ID'si
        - ✅ BAŞARILI (1 row updated)

T=11ms: Booster B → UPDATE çalıştırıyor:
        - WHERE booster_id IS NULL ❌ (Artık NULL değil!)
        - 0 rows updated
        - ❌ HATA: "Order was already claimed"

Sonuç: Sadece ilk booster (A) order'ı aldı! ✅
```

## 🛡️ Koruma Mekanizmaları

### 1. Database Level Constraint (En Güvenli)

SQL'de `.is('booster_id', null)` kontrolü:
- Update sadece `booster_id IS NULL` olan kayıtları etkiler
- İlk update'ten sonra artık bu condition sağlanmaz
- İkinci booster 0 row bulur ve başarısız olur

### 2. Status Check

`.eq('status', 'pending')` kontrolü:
- Sadece pending orderlar claim edilebilir
- Zaten claimed olanlar (processing, completed) claim edilemez

### 3. Application Level Check (Double Check)

Kod içinde iki kez kontrol:
```typescript
// İlk kontrol
if (order.booster_id) {
  return { error: 'Already claimed' }
}

// Update sırasında tekrar kontrol (race condition için)
.eq('status', 'pending')
.is('booster_id', null)
```

## 🧪 Test Senaryosu

### Senaryo 1: Normal Kullanım ✅
```
1. Booster A order'ı görür
2. "Claim Order" tıklar
3. Order Booster A'ya atanır
4. Diğer boosterler artık göremez
```

### Senaryo 2: Race Condition (İki booster aynı anda) ✅
```
1. Booster A ve B aynı anda (1-2 ms farkla) "Claim" tıklar
2. İkisi de order'ın available olduğunu görür (çünkü henüz update olmadı)
3. Booster A'nın request'i önce database'e ulaşır
4. Database update edilir (booster_id = A)
5. Booster B'nin request'i database'e ulaşır
6. Database: "booster_id IS NULL" condition'ı artık false
7. Booster B 0 row bulur → Hata: "Already claimed"
8. Sonuç: Sadece A başarılı ✅
```

## 📊 Timing Diagram

```
Booster A:  [Check] → [Update Request] → [✅ Success]
                                       ↓
Database:                              [UPDATE: booster_id = A]
                                       ↓
Booster B:  [Check] → [Update Request] → [❌ Failed: No rows updated]
                                       ↓
Database:                              [WHERE booster_id IS NULL → 0 rows]
```

## 🎯 Özet

**Race Condition:** İki kullanıcı aynı anda aynı şeyi yapmaya çalıştığında oluşan çakışma.

**Bizim Çözümümüz:**
- Database seviyesinde constraint ile koruma
- WHERE clause'da `booster_id IS NULL` kontrolü
- İlk gelen kazanır, ikinci başarısız olur
- Bu şekilde hiçbir order iki kez atanmaz

**Test Etmek İçin:**
1. İki farklı browser/tab açın
2. İki farklı booster hesabıyla giriş yapın
3. Aynı order'ı aynı anda claim etmeye çalışın
4. İlk tıklayan kazanmalı, ikincisi hata almalı

