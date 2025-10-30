"use client"

import * as React from "react"
import { useLocaleContext } from "@/contexts"

interface AuthButtonProps {
  onOpenModal: () => void
}

export function AuthButton({ onOpenModal }: AuthButtonProps) {
  const { t } = useLocaleContext()

  return (
    <button
      onClick={onOpenModal}
      className="inline-flex h-9 w-auto items-center justify-center gap-2 rounded-md border border-blue-600 bg-gradient-to-r from-blue-600 to-cyan-600 px-4 text-white text-sm font-medium hover:from-blue-700 hover:to-cyan-700 transition-all duration-200"
    >
      {t("auth.signIn")}
    </button>
  )
}

