"use client"

import { useState, useEffect } from "react"
import { ServiceCategory, calculatePrice, getEstimatedTime } from "@/lib/pricing"
import { useCurrency, useLocaleContext } from "@/contexts"

interface BoostingFormProps {
  category: ServiceCategory
  onPriceChange: (price: number) => void
}

export function BoostingForm({ category, onPriceChange }: BoostingFormProps) {
  const { convertPrice } = useCurrency()
  const { t } = useLocaleContext()
  const [gameAccount, setGameAccount] = useState("")
  const [currentLevel, setCurrentLevel] = useState("")
  const [targetLevel, setTargetLevel] = useState("")
  const [calculatedPrice, setCalculatedPrice] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState("")

  useEffect(() => {
    if (currentLevel && targetLevel) {
      const current = parseFloat(currentLevel)
      const target = parseFloat(targetLevel)
      
      if (!isNaN(current) && !isNaN(target) && target > current) {
        const price = calculatePrice(current, target, category)
        const time = getEstimatedTime(current, target, category)
        setCalculatedPrice(price)
        setEstimatedTime(time)
        onPriceChange(price)
      } else {
        setCalculatedPrice(0)
        setEstimatedTime("")
        onPriceChange(0)
      }
    }
  }, [currentLevel, targetLevel, category, onPriceChange])

  const getCategoryFields = () => {
    switch (category) {
      case 'trophy-boosting':
        return (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("clashRoyale.form.currentArena")}
              </label>
              <input
                type="number"
                min="1"
                max="15"
                placeholder="e.g. 9"
                value={currentLevel}
                onChange={(e) => setCurrentLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("clashRoyale.form.targetArena")}
              </label>
              <input
                type="number"
                min={parseInt(currentLevel) + 1 || 2}
                max="16"
                placeholder="e.g. 12"
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )
      
      case 'uc-medals-boosting':
      case 'crowns-boosting':
        return (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("clashRoyale.form.currentAmount")}
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 5000"
                value={currentLevel}
                onChange={(e) => setCurrentLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("clashRoyale.form.targetAmount")}
              </label>
              <input
                type="number"
                min={parseInt(currentLevel) + 1 || 1}
                placeholder="e.g. 10000"
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )
      
      default:
        return (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("clashRoyale.form.currentLevel")}
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 5"
                value={currentLevel}
                onChange={(e) => setCurrentLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("clashRoyale.form.targetLevel")}
              </label>
              <input
                type="number"
                min={parseInt(currentLevel) + 1 || 1}
                placeholder="e.g. 10"
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Common Fields */}
      <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("clashRoyale.form.gameAccount")}
              </label>
        <input
          type="text"
          placeholder="e.g. #ABC123XYZ"
          value={gameAccount}
          onChange={(e) => setGameAccount(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Category-specific fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {getCategoryFields()}
      </div>

      {/* Price & Time Preview */}
      {calculatedPrice > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t("clashRoyale.form.estimatedPrice")}</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {convertPrice(calculatedPrice)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                {t("clashRoyale.form.estimatedTime")}: {estimatedTime}
              </p>
            </div>
            <button
              disabled={!gameAccount || !currentLevel || !targetLevel}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {t("clashRoyale.form.proceedPayment")}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

