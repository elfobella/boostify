export interface PricingRule {
  basePrice: number
  multiplier: number
  type: 'linear' | 'exponential'
  minLevel?: number
  maxLevel?: number
}

export type ServiceCategory = 
  | 'trophy-boosting'
  | 'path-of-legends-boosting'
  | 'uc-medals-boosting'
  | 'merge-tactics-boosting'
  | 'challenges-boosting'
  | 'pass-royale-boosting'
  | 'crowns-boosting'
  | 'tournament-boosting'
  | 'custom-request'

export const pricingRules: Record<ServiceCategory, PricingRule> = {
  'trophy-boosting': {
    type: 'linear',
    basePrice: 0.50,
    multiplier: 1,
    minLevel: 1,
    maxLevel: 16,
  },
  'path-of-legends-boosting': {
    type: 'exponential',
    basePrice: 5,
    multiplier: 1.5,
  },
  'uc-medals-boosting': {
    type: 'linear',
    basePrice: 0.01,
    multiplier: 1,
  },
  'merge-tactics-boosting': {
    type: 'linear',
    basePrice: 5,
    multiplier: 1.2,
  },
  'challenges-boosting': {
    type: 'linear',
    basePrice: 5,
    multiplier: 1,
  },
  'pass-royale-boosting': {
    type: 'linear',
    basePrice: 1.5,
    multiplier: 1,
  },
  'crowns-boosting': {
    type: 'linear',
    basePrice: 0.30,
    multiplier: 1,
  },
  'tournament-boosting': {
    type: 'linear',
    basePrice: 15,
    multiplier: 1.2,
  },
  'custom-request': {
    type: 'linear',
    basePrice: 20,
    multiplier: 1,
  },
}

// Trophy boosting için kupa aralıklarına göre fiyatlandırma (Euro cinsinden)
// Resimdeki verilere göre: Aralık, Ortalama (+%50) (€)
interface TrophyRange {
  min: number
  max: number
  pricePerRange: number // Aralık başına fiyat (Euro)
}

// Büyük aralıklar (1000'lik artışlar) - Düşük seviye kupalar için
const largeTrophyRanges: TrophyRange[] = [
  { min: 0, max: 1000, pricePerRange: 4.86 },
  { min: 1000, max: 2000, pricePerRange: 6.36 },
  { min: 2000, max: 3000, pricePerRange: 6.36 },
  { min: 3000, max: 4000, pricePerRange: 7.49 },
  { min: 4000, max: 5000, pricePerRange: 8.24 },
  { min: 5000, max: 6000, pricePerRange: 9.96 },
  { min: 6000, max: 7000, pricePerRange: 12.57 },
  { min: 7000, max: 8000, pricePerRange: 13.65 },
  { min: 8000, max: 9000, pricePerRange: 17.48 },
  { min: 9000, max: 10000, pricePerRange: 19.10 },
  { min: 10000, max: 11000, pricePerRange: 13.13 },
  { min: 11000, max: 12000, pricePerRange: 13.67 },
  { min: 12000, max: 13000, pricePerRange: 14.22 },
  { min: 13000, max: 14000, pricePerRange: 15.63 },
  { min: 14000, max: 15000, pricePerRange: 15.32 },
]

// Küçük aralıklar (500'lük artışlar) - Büyük aralıkların içindeki daha detaylı fiyatlandırma için
const smallTrophyRanges: TrophyRange[] = [
  { min: 50, max: 500, pricePerRange: 43.67 },
  { min: 500, max: 1000, pricePerRange: 48.14 },
  { min: 1000, max: 1500, pricePerRange: 47.82 },
  { min: 1500, max: 2000, pricePerRange: 54.69 },
  { min: 2000, max: 2500, pricePerRange: 75.69 },
  { min: 2500, max: 3000, pricePerRange: 93.86 },
]

// Kupa sayısına göre fiyat hesaplama
function calculateTrophyBoostPrice(currentTrophies: number, targetTrophies: number): number {
  if (currentTrophies >= targetTrophies || currentTrophies < 0) {
    return 0
  }

  let totalPrice = 0
  let currentPos = currentTrophies

  while (currentPos < targetTrophies) {
    // Önce büyük aralıklara bak
    let largeRange = largeTrophyRanges.find(range => 
      currentPos >= range.min && currentPos < range.max
    )
    
    if (largeRange) {
      // Büyük aralığın içindeyiz
      if (targetTrophies <= largeRange.max) {
        // Hedef de bu büyük aralığın içinde
        // Tam aralık mı yoksa kısmi mi?
        if (currentPos === largeRange.min && targetTrophies === largeRange.max) {
          // Tam büyük aralık
          totalPrice += largeRange.pricePerRange
          currentPos = largeRange.max
          break
        } else {
          // Kısmi büyük aralık - büyük aralığın orantılı fiyatını kullan
          const trophiesInThisRange = targetTrophies - currentPos
          const rangeSize = largeRange.max - largeRange.min
          const ratio = trophiesInThisRange / rangeSize
          totalPrice += largeRange.pricePerRange * ratio
          currentPos = targetTrophies
          break
        }
      } else {
        // Hedef bu büyük aralığın dışında - büyük aralığın kalan kısmını hesapla
        const trophiesInThisRange = largeRange.max - currentPos
        const rangeSize = largeRange.max - largeRange.min
        const ratio = trophiesInThisRange / rangeSize
        totalPrice += largeRange.pricePerRange * ratio
        currentPos = largeRange.max
        // Loop devam edecek, bir sonraki aralığa geçecek
      }
    } else {
      // Büyük aralık yok, küçük aralıklara bak
      let smallRange = smallTrophyRanges.find(range => 
        currentPos >= range.min && currentPos < range.max
      )
      
      if (smallRange) {
        // Küçük aralığın içindeyiz
        if (targetTrophies <= smallRange.max) {
          // Hedef de bu küçük aralığın içinde
          if (currentPos === smallRange.min && targetTrophies === smallRange.max) {
            // Tam küçük aralık
            totalPrice += smallRange.pricePerRange
            currentPos = smallRange.max
            break
          } else {
            // Kısmi küçük aralık - küçük aralığın orantılı fiyatını kullan
            const trophiesInThisRange = targetTrophies - currentPos
            const rangeSize = smallRange.max - smallRange.min
            const ratio = trophiesInThisRange / rangeSize
            totalPrice += smallRange.pricePerRange * ratio
            currentPos = targetTrophies
            break
          }
        } else {
          // Hedef bu küçük aralığın dışında - küçük aralığın kalan kısmını hesapla
          const trophiesInThisRange = smallRange.max - currentPos
          const rangeSize = smallRange.max - smallRange.min
          const ratio = trophiesInThisRange / rangeSize
          totalPrice += smallRange.pricePerRange * ratio
          currentPos = smallRange.max
          // Loop devam edecek
        }
      } else {
        // Hiçbir aralık yok, en yakın aralığı bul
        const allRanges = [...smallTrophyRanges, ...largeTrophyRanges].sort((a, b) => a.min - b.min)
        const nextRange = allRanges.find(range => range.min > currentPos)
        
        if (nextRange) {
          // Bir sonraki aralığa kadar olan kısmı hesapla
          const trophiesUntilNextRange = Math.min(nextRange.min - currentPos, targetTrophies - currentPos)
          
          // Bir önceki aralığı bul (eğer varsa)
          const prevRange = allRanges.filter(r => r.max <= currentPos).pop()
          const rangeToUse = prevRange || nextRange
          const rangeSize = rangeToUse.max - rangeToUse.min
          const ratio = trophiesUntilNextRange / rangeSize
          totalPrice += rangeToUse.pricePerRange * ratio
          
          currentPos += trophiesUntilNextRange
        } else {
          // Son aralığın fiyatını kullan
          const lastRange = largeTrophyRanges[largeTrophyRanges.length - 1]
          const remainingTrophies = targetTrophies - currentPos
          const rangeSize = lastRange.max - lastRange.min
          const ratio = remainingTrophies / rangeSize
          totalPrice += lastRange.pricePerRange * ratio
          break
        }
      }
    }
  }

  return Math.round(totalPrice * 100) / 100 // 2 decimal places
}

// Arena numarasını kupa sayısına çevir
export function arenaToTrophies(arena: number): number {
  // Clash Royale arena kupa aralıkları (yaklaşık)
  const arenaTrophyMap: Record<number, number> = {
    1: 0,
    2: 300,
    3: 600,
    4: 1000,
    5: 1300,
    6: 1600,
    7: 2000,
    8: 2300,
    9: 2600,
    10: 3000,
    11: 3300,
    12: 3600,
    13: 4000,
    14: 4300,
    15: 4600,
    16: 5000,
  }
  return arenaTrophyMap[arena] ?? arena * 300
}

export function calculatePrice(
  currentLevel: number,
  targetLevel: number,
  category: ServiceCategory
): number {
  const rule = pricingRules[category]
  
  if (!rule) {
    return 0
  }

  const difference = targetLevel - currentLevel

  if (difference <= 0) {
    return 0
  }

  // Trophy boosting için özel kupa aralıklarına göre fiyatlandırma
  if (category === 'trophy-boosting') {
    // Eğer değer 16'dan büyükse, bu zaten kupa sayısıdır (arena max 16)
    // Eğer 16 veya daha küçükse, arena numarasıdır ve kupa sayısına çevrilmelidir
    const currentTrophies = currentLevel > 16 ? currentLevel : arenaToTrophies(currentLevel)
    const targetTrophies = targetLevel > 16 ? targetLevel : arenaToTrophies(targetLevel)
    return calculateTrophyBoostPrice(currentTrophies, targetTrophies)
  }

  let price = 0

  if (rule.type === 'linear') {
    price = rule.basePrice * difference * rule.multiplier
  } else {
    // Exponential pricing
    price = rule.basePrice * Math.pow(rule.multiplier, difference)
  }

  return Math.round(price * 100) / 100 // 2 decimal places
}

export function getEstimatedTime(
  currentLevel: number,
  targetLevel: number,
  category: ServiceCategory
): string {
  const difference = targetLevel - currentLevel
  
  if (category === 'trophy-boosting') {
    // Eğer değer 16'dan büyükse, bu zaten kupa sayısıdır (arena max 16)
    // Eğer 16 veya daha küçükse, arena numarasıdır ve kupa sayısına çevrilmelidir
    const currentTrophies = currentLevel > 16 ? currentLevel : arenaToTrophies(currentLevel)
    const targetTrophies = targetLevel > 16 ? targetLevel : arenaToTrophies(targetLevel)
    const trophyDifference = targetTrophies - currentTrophies
    
    // Kupa farkına göre süre hesapla (yaklaşık 50 kupa/saat)
    const hours = Math.max(1, Math.ceil(trophyDifference / 50))
    if (hours < 24) return `${hours} hours`
    return `${Math.ceil(hours / 24)} days`
  }

  if (category === 'path-of-legends-boosting') {
    const days = difference * 0.5
    if (days < 1) return 'Same day'
    return `${Math.ceil(days)} days`
  }

  if (category === 'uc-medals-boosting' || category === 'crowns-boosting') {
    const hours = difference / 100
    if (hours < 1) return '1-2 hours'
    return `${Math.ceil(hours)} hours`
  }

  if (category === 'merge-tactics-boosting') {
    const days = difference * 0.5
    return `${Math.ceil(days)} days`
  }

  if (category === 'challenges-boosting' || category === 'tournament-boosting') {
    return '2-4 hours'
  }

  if (category === 'pass-royale-boosting') {
    const hours = difference * 1
    if (hours < 24) return `${hours} hours`
    return `${Math.ceil(hours / 24)} days`
  }

  return 'To be determined'
}

