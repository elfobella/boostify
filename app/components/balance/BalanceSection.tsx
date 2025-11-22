"use client"

import { useState, useEffect } from "react"
import { Wallet, Plus, History, Loader2, CheckCircle, XCircle } from "lucide-react"
import { Elements } from "@stripe/react-stripe-js"
import { stripePromise } from "@/lib/stripe"
import { StripeCheckout } from "../payment/StripeCheckout"

interface BalanceData {
  balance: number
  cashback: number
}

interface BalanceTransaction {
  id: string
  transaction_type: 'deposit' | 'withdrawal' | 'payment' | 'cashback' | 'refund'
  amount: number
  balance_before: number
  balance_after: number
  cashback_amount?: number
  description: string
  created_at: string
}

export function BalanceSection() {
  const [balance, setBalance] = useState<BalanceData>({ balance: 0, cashback: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [showDeposit, setShowDeposit] = useState(false)
  const [depositAmount, setDepositAmount] = useState("")
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false)
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([])
  const [showTransactions, setShowTransactions] = useState(false)
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)

  useEffect(() => {
    fetchBalance()
  }, [])

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/balance')
      if (response.ok) {
        const data = await response.json()
        setBalance(data)
      }
    } catch (error) {
      console.error('Error fetching balance:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTransactions = async () => {
    setIsLoadingTransactions(true)
    try {
      const response = await fetch('/api/balance/transactions?limit=20')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setIsLoadingTransactions(false)
    }
  }

  const handleDepositClick = () => {
    setShowDeposit(true)
    setDepositAmount("")
    setClientSecret(null)
  }

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(depositAmount)
    
    if (!amount || amount < 5) {
      alert('Minimum deposit amount is $5')
      return
    }

    setIsProcessingDeposit(true)
    try {
      const response = await fetch('/api/balance/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      })

      if (response.ok) {
        const data = await response.json()
        setClientSecret(data.clientSecret)
        setPaymentIntentId(data.paymentIntentId)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create deposit')
      }
    } catch (error) {
      console.error('Error creating deposit:', error)
      alert('Failed to create deposit')
    } finally {
      setIsProcessingDeposit(false)
    }
  }

  const handleDepositSuccess = async () => {
    await fetchBalance()
    await fetchTransactions()
    setShowDeposit(false)
    setClientSecret(null)
    setDepositAmount("")
  }

  const handleShowTransactions = () => {
    if (!showTransactions) {
      fetchTransactions()
    }
    setShowTransactions(!showTransactions)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <Plus className="h-4 w-4 text-green-400" />
      case 'payment':
        return <XCircle className="h-4 w-4 text-red-400" />
      case 'cashback':
        return <CheckCircle className="h-4 w-4 text-yellow-400" />
      default:
        return <Wallet className="h-4 w-4 text-gray-400" />
    }
  }

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Deposit'
      case 'payment':
        return 'Payment'
      case 'cashback':
        return 'Cashback'
      case 'refund':
        return 'Refund'
      default:
        return type
    }
  }

  if (isLoading) {
    return (
      <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
        <div className="animate-pulse">
          <div className="h-6 bg-zinc-800 rounded w-32 mb-4"></div>
          <div className="h-12 bg-zinc-800 rounded w-48 mb-2"></div>
          <div className="h-4 bg-zinc-800 rounded w-32"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Balance
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleShowTransactions}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
          >
            <History className="h-4 w-4" />
            {showTransactions ? 'Hide' : 'History'}
          </button>
          <button
            onClick={handleDepositClick}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Funds
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-zinc-800 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Available Balance</div>
          <div className="text-2xl font-bold text-white">{formatCurrency(balance.balance)}</div>
        </div>
        <div className="bg-zinc-800 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Total Cashback</div>
          <div className="text-2xl font-bold text-yellow-400">{formatCurrency(balance.cashback)}</div>
        </div>
      </div>

      {showTransactions && (
        <div className="mt-6 border-t border-zinc-800 pt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Transaction History</h3>
          {isLoadingTransactions ? (
            <div className="text-center py-8 text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No transactions yet
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(tx.transaction_type)}
                    <div>
                      <div className="text-white font-medium">
                        {getTransactionLabel(tx.transaction_type)}
                      </div>
                      <div className="text-sm text-gray-400">{tx.description}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-bold ${
                        tx.transaction_type === 'deposit' || tx.transaction_type === 'cashback'
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {tx.transaction_type === 'deposit' || tx.transaction_type === 'cashback'
                        ? '+'
                        : '-'}
                      {formatCurrency(Math.abs(tx.amount))}
                    </div>
                    {tx.cashback_amount && tx.cashback_amount > 0 && (
                      <div className="text-xs text-yellow-400">
                        +{formatCurrency(tx.cashback_amount)} cashback
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showDeposit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-lg p-6 max-w-md w-full border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Add Funds</h3>
              <button
                onClick={() => {
                  setShowDeposit(false)
                  setClientSecret(null)
                  setDepositAmount("")
                }}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {!clientSecret ? (
              <form onSubmit={handleDepositSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount (Minimum $5)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="5"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="mt-2 text-sm text-gray-400">
                    You'll receive {((parseFloat(depositAmount) || 0) * 0.025).toFixed(2)} cashback (2.5%)
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isProcessingDeposit}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isProcessingDeposit ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      Continue to Payment
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div>
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'night',
                      variables: {
                        colorPrimary: '#2563eb',
                        colorBackground: '#18181b',
                        colorText: '#f4f4f5',
                        colorDanger: '#ef4444',
                        fontFamily: 'system-ui, sans-serif',
                        spacingUnit: '4px',
                        borderRadius: '8px',
                      },
                    },
                    loader: 'auto',
                  }}
                >
                  <StripeCheckout
                    clientSecret={clientSecret}
                    onSuccess={handleDepositSuccess}
                    onCancel={() => {
                      setShowDeposit(false)
                      setClientSecret(null)
                    }}
                    paymentIntentId={paymentIntentId || undefined}
                    amount={parseFloat(depositAmount)}
                    currency="usd"
                  />
                </Elements>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

