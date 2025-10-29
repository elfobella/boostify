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
      imageWidth: 300,
      imageHeight: 420,
      href: "/clash-royale/boosting",
      comingSoon: false
    },
    {
      title: "Call of Duty Mobile",
      description: "Rank boosting services coming soon",
      image: "/clash-royale.jpg", // Placeholder image
      imageWidth: 300,
      imageHeight: 420,
      href: "#",
      comingSoon: true
    },
    {
      title: "PUBG Mobile",
      description: "Boosting services coming soon",
      image: "/clash-royale.jpg", // Placeholder image
      imageWidth: 300,
      imageHeight: 420,
      href: "#",
      comingSoon: true
    },
  ]

  return (
    <section id="games" className="container px-4 py-16 md:py-24">
      <div className="mx-auto max-w-2xl text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
          {t("games.title")}
        </h2>
        <p className="mt-4 text-lg opacity-70">
          {t("games.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {games.map((game, index) => (
          <GameCard key={index} {...game} />
        ))}
      </div>
    </section>
  )
}

