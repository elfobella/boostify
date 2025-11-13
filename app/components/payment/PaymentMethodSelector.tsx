"use client"

import { useState } from "react"
import { Check, CreditCard, Smartphone, Wallet, Coins, Lock } from "lucide-react"

export type PaymentMethod = 
  | 'card'
  | 'apple_pay'
  | 'google_pay'
  | 'link'
  | 'crypto'
  | 'paysafe'
  | 'skrill'

interface PaymentMethodOption {
  id: PaymentMethod
  name: string
  description: string
  icon: React.ReactNode
  available: boolean
  comingSoon?: boolean
}

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null
  onMethodSelect: (method: PaymentMethod) => void
  availableMethods?: PaymentMethod[]
}

export function PaymentMethodSelector({ 
  selectedMethod, 
  onMethodSelect,
  availableMethods = ['card', 'apple_pay', 'google_pay', 'link', 'crypto']
}: PaymentMethodSelectorProps) {
  const paymentMethods: PaymentMethodOption[] = [
    {
      id: 'card',
      name: 'Debit/Credit cards',
      description: 'We accept all major debit and credit cards',
      icon: <CreditCard className="h-5 w-5" />,
      available: availableMethods.includes('card'),
    },
    {
      id: 'apple_pay',
      name: 'Apple Pay',
      description: 'Pay securely with Apple Pay',
      icon: <Smartphone className="h-5 w-5" />,
      available: availableMethods.includes('apple_pay'),
    },
    {
      id: 'google_pay',
      name: 'Google Pay',
      description: 'Pay securely with Google Pay',
      icon: <Smartphone className="h-5 w-5" />,
      available: availableMethods.includes('google_pay'),
    },
    {
      id: 'link',
      name: 'Link by Stripe',
      description: 'Save your card for faster checkout',
      icon: <Wallet className="h-5 w-5" />,
      available: availableMethods.includes('link'),
    },
    {
      id: 'crypto',
      name: 'Crypto',
      description: 'BTC · ETH · DGC · LTC · USDT · USDC and more!',
      icon: <Coins className="h-5 w-5" />,
      available: availableMethods.includes('crypto'),
      comingSoon: !availableMethods.includes('crypto'),
    },
    {
      id: 'paysafe',
      name: 'Paysafe Card',
      description: 'Prepaid card for online payments',
      icon: <Lock className="h-5 w-5" />,
      available: false,
      comingSoon: true,
    },
    {
      id: 'skrill',
      name: 'Skrill',
      description: 'Skrill · Neteller · Rapid Transfer',
      icon: <Wallet className="h-5 w-5" />,
      available: false,
      comingSoon: true,
    },
  ]

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-100 mb-4">Pay with</h3>
      
      {paymentMethods.map((method) => {
        const isSelected = selectedMethod === method.id
        const isDisabled = !method.available && !method.comingSoon
        
        return (
          <button
            key={method.id}
            type="button"
            onClick={() => {
              if (method.available && !method.comingSoon) {
                onMethodSelect(method.id)
              }
            }}
            disabled={isDisabled}
            className={`w-full p-4 rounded-lg border-2 transition-all ${
              isSelected
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-800 bg-zinc-800/50 hover:border-gray-700'
            } ${
              isDisabled || method.comingSoon
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className={`p-2 rounded-lg ${
                  isSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700/50 text-gray-400'
                }`}>
                  {method.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium ${
                      isSelected ? 'text-white' : 'text-gray-200'
                    }`}>
                      {method.name}
                    </p>
                    {method.comingSoon && (
                      <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${
                    isSelected ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {method.description}
                  </p>
                </div>
              </div>
              
              {isSelected && method.available && (
                <div className="ml-4">
                  <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}
              
              {!isSelected && method.available && !method.comingSoon && (
                <div className="ml-4">
                  <div className="h-5 w-5 rounded-full border-2 border-gray-600" />
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

