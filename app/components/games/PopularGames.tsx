"use client"

import { GameCard } from "./GameCard"
import { useLocaleContext } from "@/contexts"

export function PopularGames() {
  const { t } = useLocaleContext()
  
  const games = [
    {
      title: "Clash Royale",
      description: t("games.clashRoyaleDesc"),
      image: "/clash-royale.jpg",
      imageWidth: 400,
      imageHeight: 300,
      href: "/clash-royale/boosting",
      comingSoon: false
    },
    {
      title: "Call of Duty Mobile",
      description: t("games.codMobileDesc"),
      image: "/clash-royale.jpg", // Placeholder image
      imageWidth: 400,
      imageHeight: 300,
      href: "#",
      comingSoon: true
    },
    {
      title: "PUBG Mobile",
      description: t("games.pubgMobileDesc"),
      image: "/clash-royale.jpg", // Placeholder image
      imageWidth: 400,
      imageHeight: 300,
      href: "#",
      comingSoon: true
    },
  ]

  return (
    <section id="games" className="container px-4 py-16 md:py-24">
      <div className="mx-auto max-w-2xl text-center mb-12">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
          {t("games.title")}
        </h2>
        <p className="mt-4 text-lg md:text-xl opacity-70">
          {t("games.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 max-w-6xl mx-auto">
        {games.map((game, index) => (
          <GameCard key={index} {...game} />
        ))}
      </div>
    </section>
  )
}

