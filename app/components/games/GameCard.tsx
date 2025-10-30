"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useLocaleContext } from "@/contexts"

interface GameCardProps {
  title: string
  description: string
  image: string
  imageWidth?: number
  imageHeight?: number
  href?: string
  comingSoon?: boolean
}

export function GameCard({ 
  title, 
  description, 
  image, 
  imageWidth = 200, 
  imageHeight = 180,
  href = "#",
  comingSoon = false
}: GameCardProps) {
  const { t } = useLocaleContext()
  
  const cardContent = (
    <div className="group relative overflow-hidden rounded-xl bg-zinc-900 border-2 border-gray-800 shadow-lg transition-all duration-300 hover:border-blue-400">
      <div className="relative w-full">
        <Image
          src={image}
          alt={title}
          width={imageWidth}
          height={imageHeight}
          className={`w-full h-auto object-cover transition-all duration-300 ${
            comingSoon ? 'opacity-60' : 'hover:scale-105'
          }`}
        />
        
        {/* Coming Soon Badge */}
        {comingSoon && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <span className="text-white font-bold text-lg px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg">
              {t("games.comingSoon")}
            </span>
          </div>
        )}
      </div>
    </div>
  )
  
  if (comingSoon) {
    return cardContent
  }
  
  return (
    <Link href={href}>
      {cardContent}
    </Link>
  )
}

