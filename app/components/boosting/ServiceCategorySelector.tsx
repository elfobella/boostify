"use client"

import { ServiceCategory } from "@/lib/pricing"
import { useLocaleContext } from "@/contexts"

interface ServiceCategorySelectorProps {
  selectedCategory: ServiceCategory
  onSelectCategory: (category: ServiceCategory) => void
}

const categories: ServiceCategory[] = [
  'trophy-boosting',
  'path-of-legends-boosting',
  'uc-medals-boosting',
  'merge-tactics-boosting',
  'challenges-boosting',
  'pass-royale-boosting',
]

const additionalServices: ServiceCategory[] = [
  'crowns-boosting',
  'tournament-boosting',
  'custom-request',
]

const categoryKeyMap: Record<ServiceCategory, string> = {
  'trophy-boosting': 'trophy',
  'path-of-legends-boosting': 'pathOfLegends',
  'uc-medals-boosting': 'ucMedals',
  'merge-tactics-boosting': 'mergeTactics',
  'challenges-boosting': 'challenges',
  'pass-royale-boosting': 'passRoyale',
  'crowns-boosting': 'crowns',
  'tournament-boosting': 'tournament',
  'custom-request': 'customRequest',
}

export function ServiceCategorySelector({ selectedCategory, onSelectCategory }: ServiceCategorySelectorProps) {
  const { t } = useLocaleContext()
  
  const allCategories = [...categories, ...additionalServices]
  
  return (
    <div className="relative">
      {/* Scrollable Container */}
      <div className="overflow-x-auto scrollbar-hide pb-4">
        <div className="flex gap-3 min-w-max">
          {allCategories.map((category) => (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                selectedCategory === category
                  ? 'bg-white text-gray-900 shadow-lg'
                  : 'bg-gray-900 text-white border border-gray-700 hover:border-blue-500'
              }`}
            >
              {t(`clashRoyale.categories.${categoryKeyMap[category]}`)}
            </button>
          ))}
        </div>
      </div>
      
    </div>
  )
}

