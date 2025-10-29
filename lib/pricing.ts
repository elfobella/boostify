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

  let price = 0

  if (rule.type === 'linear') {
    price = rule.basePrice * difference * rule.multiplier
  } else {
    // Exponential pricing
    price = rule.basePrice * Math.pow(rule.multiplier, difference)
  }

  // Trophy boosting için arena bazlı ek fiyatlandırma
  if (category === 'trophy-boosting') {
    if (targetLevel >= 13) {
      price *= 1.5
    } else if (targetLevel >= 9) {
      price *= 1.25
    }
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
    const hours = difference * 2
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

