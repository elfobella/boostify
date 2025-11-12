"use client"

import { ServiceCategory } from "@/lib/pricing"
import { useLocaleContext } from "@/contexts"
import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

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
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const allCategories = [...categories, ...additionalServices]

  const syncArrowState = useCallback(() => {
    const container = scrollRef.current
    if (!container) return

    const { scrollLeft, scrollWidth, clientWidth } = container
    const maxScrollLeft = scrollWidth - clientWidth

    setCanScrollLeft(scrollLeft > 4)
    setCanScrollRight(maxScrollLeft - scrollLeft > 4)
  }, [])

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const container = scrollRef.current
    const scrollAmount = container.offsetWidth * 0.6
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })

    requestAnimationFrame(syncArrowState)
  }

  const renderCategoryButton = (category: ServiceCategory) => (
    <button
      key={category}
      onClick={() => onSelectCategory(category)}
      className={`flex min-w-[180px] items-center justify-center rounded-full border px-5 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 ${
        selectedCategory === category
          ? 'border-blue-500/90 bg-blue-500/15 text-blue-100'
          : 'border-gray-800/80 bg-zinc-900/60 text-gray-200 hover:border-blue-500/60 hover:text-white'
      }`}
    >
      {t(`clashRoyale.categories.${categoryKeyMap[category]}`)}
    </button>
  )

  useEffect(() => {
    syncArrowState()

    const container = scrollRef.current
    if (!container) return

    const handleContainerScroll = () => syncArrowState()
    container.addEventListener('scroll', handleContainerScroll)
    window.addEventListener('resize', syncArrowState)

    return () => {
      container.removeEventListener('scroll', handleContainerScroll)
      window.removeEventListener('resize', syncArrowState)
    }
  }, [syncArrowState])

  return (
    <div className="relative">
      {canScrollLeft && (
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-zinc-950 via-zinc-950/50 to-transparent" />
      )}
      {canScrollRight && (
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-zinc-950 via-zinc-950/50 to-transparent" />
      )}

      {canScrollLeft && (
        <div className="absolute left-1 top-1/2 z-20 -translate-y-1/2">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="rounded-full border border-gray-800/70 bg-zinc-900/70 p-1 text-gray-300 transition hover:border-blue-500/60 hover:text-white"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      )}
      {canScrollRight && (
        <div className="absolute right-1 top-1/2 z-20 -translate-y-1/2">
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="rounded-full border border-gray-800/70 bg-zinc-900/70 p-1 text-gray-300 transition hover:border-blue-500/60 hover:text-white"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide pb-3"
        onWheel={(event) => {
          if (event.deltaY === 0) return
          event.preventDefault()
          if (!scrollRef.current) return
          scrollRef.current.scrollBy({
            left: event.deltaY,
          })
          requestAnimationFrame(syncArrowState)
        }}
      >
        <div className="flex gap-2 pr-10">
          {allCategories.map(renderCategoryButton)}
        </div>
      </div>
    </div>
  )
}

