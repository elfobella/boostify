"use client"

import { useState, useEffect } from "react"
import { ServiceCategory, calculatePrice, getEstimatedTime } from "@/lib/pricing"
import { useCurrency, useLocaleContext } from "@/contexts"

interface BoostingFormProps {
  category: ServiceCategory
  onPriceChange: (price: number) => void
  onFormChange: (isValid: boolean) => void
  onFormDataChange?: (data: {
    gameAccount: string
    currentLevel: string
    targetLevel: string
  }) => void
}

export function BoostingForm({ category, onPriceChange, onFormChange, onFormDataChange }: BoostingFormProps) {
  const { convertPrice } = useCurrency()
  const { t } = useLocaleContext()
  const [gameAccount, setGameAccount] = useState("")
  const [currentLevel, setCurrentLevel] = useState("")
  const [targetLevel, setTargetLevel] = useState("")
  const [calculatedPrice, setCalculatedPrice] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState("")

  const isValid = !!gameAccount && !!currentLevel && !!targetLevel

  useEffect(() => {
    onFormChange(isValid)
    if (onFormDataChange) {
      onFormDataChange({
        gameAccount,
        currentLevel,
        targetLevel,
      })
    }
  }, [isValid, gameAccount, currentLevel, targetLevel, onFormChange, onFormDataChange])

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

    </div>
  )
}

