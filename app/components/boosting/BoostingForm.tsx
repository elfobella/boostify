"use client"

import { useState, useEffect, useRef, ReactNode } from "react"
import { ServiceCategory, calculatePrice, getEstimatedTime } from "@/lib/pricing"
import { useCurrency, useLocaleContext } from "@/contexts"
import { Target, Trophy, Swords, Sparkles, RefreshCw, Info } from "lucide-react"

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

interface BoostingFormProps {
  category: ServiceCategory
  onPriceChange: (price: number) => void
  onEstimatedTimeChange: (time: string) => void
  onFormChange: (isValid: boolean) => void
  onFormDataChange?: (data: {
    gameAccount: string
    currentLevel: string
    targetLevel: string
  }) => void
}

export function BoostingForm({ category, onPriceChange, onEstimatedTimeChange, onFormChange, onFormDataChange }: BoostingFormProps) {
  const { convertPrice } = useCurrency()
  const { t } = useLocaleContext()
  const [gameAccount, setGameAccount] = useState("")
  const [currentLevel, setCurrentLevel] = useState("")
  const [targetLevel, setTargetLevel] = useState("")
  const [calculatedPrice, setCalculatedPrice] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState("")
  const isFirstRender = useRef(true)

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
        onEstimatedTimeChange(time)
        return
      }
    }

    setCalculatedPrice(0)
    setEstimatedTime("")
    onPriceChange(0)
    onEstimatedTimeChange("")
  }, [currentLevel, targetLevel, category, onPriceChange, onEstimatedTimeChange])

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    setGameAccount("")
    setCurrentLevel("")
    setTargetLevel("")
    setCalculatedPrice(0)
    setEstimatedTime("")
  }, [category])

  const getCategoryFields = () => {
    switch (category) {
      case 'trophy-boosting':
        return (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("clashRoyale.form.currentTrophies") || "Current Trophies"}
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 2000"
                value={currentLevel}
                onChange={(e) => setCurrentLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("clashRoyale.form.targetTrophies") || "Target Trophies"}
              </label>
              <input
                type="number"
                min={parseInt(currentLevel) + 1 || 1}
                placeholder="e.g. 3000"
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
      <div className="rounded-xl border border-gray-800 bg-zinc-950/70 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-blue-400/70">
              {t(`clashRoyale.categories.${categoryKeyMap[category]}`)}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-gray-100">
              {t("clashRoyale.orderDetails")}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setGameAccount("")
              setCurrentLevel("")
              setTargetLevel("")
              if (onFormDataChange) {
                onFormDataChange({
                  gameAccount: "",
                  currentLevel: "",
                  targetLevel: "",
                })
              }
            }}
            className="inline-flex items-center gap-2 rounded-full border border-gray-800 px-3 py-1.5 text-[11px] font-semibold text-gray-400 transition hover:border-blue-500/60 hover:text-white"
          >
            <RefreshCw className="h-3 w-3" />
            {t("common.reset")}
          </button>
        </div>

        <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t("clashRoyale.form.gameAccount")}
              </label>
              <input
                type="text"
                placeholder="#ABC123XYZ"
                value={gameAccount}
                onChange={(e) => setGameAccount(e.target.value)}
                className="w-full rounded-lg border border-gray-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <p className="flex items-center gap-2 text-[11px] text-gray-500">
                <Info className="h-3 w-3 text-blue-400" />
                {t("clashRoyale.orderDetailsHint")}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {getCategoryFields()}
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-600/15 to-cyan-500/10 p-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-blue-200/80">{t("clashRoyale.liveEstimate")}</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {calculatedPrice > 0 ? convertPrice(calculatedPrice) : '--'}
              </p>
            </div>
            <p className="flex items-center gap-2 text-xs text-blue-100/80">
              <ClockIcon />
              {estimatedTime ? `${t("clashRoyale.form.estimatedTime")}: ${estimatedTime}` : t("clashRoyale.formPreview.fillPrompt")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <HighlightCard
          icon={<Target className="h-5 w-5" />}
          title={t("clashRoyale.formPreview.currentLabel")}
          value={currentLevel || '--'}
          description={t("clashRoyale.formPreview.currentDescription")}
        />
        <HighlightCard
          icon={<Swords className="h-5 w-5" />}
          title={t("clashRoyale.formPreview.targetLabel")}
          value={targetLevel || '--'}
          description={t("clashRoyale.formPreview.targetDescription")}
        />
        <HighlightCard
          icon={<Sparkles className="h-5 w-5" />}
          title={t("clashRoyale.formPreview.statusLabel")}
          value={isValid ? t("clashRoyale.formPreview.statusReady") : t("clashRoyale.formPreview.statusIncomplete")}
          description={isValid ? t("clashRoyale.formPreview.statusReadyDescription") : t("clashRoyale.formPreview.statusIncompleteDescription")}
        />
      </div>
    </div>
  )
}

function ClockIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
    <circle cx="12" cy="12" r="10" className="opacity-50" />
    <path d="M12 6v6l3 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
}

function HighlightCard({ icon, title, value, description }: { icon: ReactNode; title: string; value: string; description: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-zinc-950/60 p-4">
      <div className="flex items-center gap-3 text-gray-200">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-300">
          {icon}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">{title}</p>
          <p className="text-lg font-semibold text-white">{value}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-500">{description}</p>
    </div>
  )
}

