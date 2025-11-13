"use client"

import { useEffect, useState } from "react"
import { CheckCircle, X, ExternalLink } from "lucide-react"
import { createPortal } from "react-dom"
import Link from "next/link"

interface ToastProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  actionLabel?: string
  actionHref?: string
  duration?: number
}

export function Toast({
  isOpen,
  onClose,
  title,
  message,
  actionLabel,
  actionHref,
  duration = 5000,
}: ToastProps) {
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      // Trigger animation with slight delay for smooth entrance
      const showTimer = setTimeout(() => setIsVisible(true), 50)
      
      // Auto close after duration
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose(), 350) // Wait for animation
      }, duration)

      return () => {
        clearTimeout(showTimer)
        clearTimeout(timer)
      }
    } else {
      setIsVisible(false)
    }
  }, [isOpen, duration, onClose])

  if (!mounted || !isOpen) return null

  const toastContent = (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
      style={{ isolation: 'isolate' }}
    >
      <div
        className={`
          pointer-events-auto
          max-w-sm
          bg-zinc-900
          border border-green-500/40
          rounded-lg
          shadow-lg
          px-4
          py-3
          transform
          transition-all
          ${isVisible 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-6 opacity-0 scale-95'
          }
        `}
        style={{
          transitionDuration: '350ms',
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Content */}
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-5 h-5 text-green-500">
            <CheckCircle className="h-5 w-5" />
          </div>
          
          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-100">
              {title}
            </p>
            {message && (
              <p className="text-xs text-gray-400 mt-0.5">
                {message}
              </p>
            )}
          </div>

          {/* Action Button */}
          {actionLabel && actionHref && (
            <Link
              href={actionHref}
              onClick={() => {
                setIsVisible(false)
                setTimeout(() => onClose(), 350)
              }}
              className="
                flex-shrink-0
                px-3
                py-1.5
                bg-blue-600
                hover:bg-blue-700
                text-white
                rounded-md
                font-medium
                text-xs
                transition-colors
                duration-150
              "
            >
              {actionLabel}
            </Link>
          )}

          {/* Close Button */}
          <button
            onClick={() => {
              setIsVisible(false)
              setTimeout(() => onClose(), 350)
            }}
            className="flex-shrink-0 text-gray-400 hover:text-gray-200 transition-colors ml-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(toastContent, document.body)
}

