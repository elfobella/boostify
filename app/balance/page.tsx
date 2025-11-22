"use client"

import { Suspense, useState, useEffect } from "react"
import { Navbar } from "@/app/components/navbar"
import { Footer } from "@/app/components/footer"
import { Wallet, Plus, History, Loader2, CheckCircle, XCircle, ArrowLeft } from "lucide-react"
import { Elements } from "@stripe/react-stripe-js"
import { stripePromise } from "@/lib/stripe"
import { StripeCheckout } from "@/app/components/payment/StripeCheckout"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"

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

function BalanceContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [balance, setBalance] = useState<BalanceData>({ balance: 0, cashback: 0 })
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showDeposit, setShowDeposit] = useState(false)
  const [depositAmount, setDepositAmount] = useState("")
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false)
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [isCheckingPending, setIsCheckingPending] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
      return
    }
    if (status === "authenticated") {
      fetchBalance()
      fetchTransactions()
      
      // Check for success parameter
      if (searchParams.get('deposit') === 'success') {
        setShowSuccessMessage(true)
        // Remove query parameter from URL
        router.replace('/balance', { scroll: false })
        // Hide message after 5 seconds
        setTimeout(() => setShowSuccessMessage(false), 5000)
      }
    }
  }, [status, router, searchParams])

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

  const fetchTransactions = async (reset = false) => {
    const currentOffset = reset ? 0 : offset
    setIsLoadingTransactions(true)
    try {
      const response = await fetch(`/api/balance/transactions?limit=20&offset=${currentOffset}`)
      if (response.ok) {
        const data = await response.json()
        const newTransactions = data.transactions || []
        
        if (reset) {
          setTransactions(newTransactions)
        } else {
          // Filter out duplicates when appending
          setTransactions(prev => {
            const existingIds = new Set(prev.map(tx => tx.id))
            const uniqueNew = newTransactions.filter(tx => !existingIds.has(tx.id))
            return [...prev, ...uniqueNew]
          })
        }
        setHasMore(data.pagination?.hasMore || false)
        setOffset(currentOffset + newTransactions.length)
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
    await fetchTransactions(true)
    setShowDeposit(false)
    setClientSecret(null)
    setDepositAmount("")
  }

  const handleCheckPendingDeposits = async () => {
    setIsCheckingPending(true)
    try {
      const response = await fetch('/api/balance/manual-update', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.processedCount > 0) {
          alert(`Found and processed ${data.processedCount} pending deposit(s)!`)
          await fetchBalance()
          await fetchTransactions(true)
        } else {
          alert('No pending deposits found.')
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to check pending deposits')
      }
    } catch (error) {
      console.error('Error checking pending deposits:', error)
      alert('Failed to check pending deposits')
    } finally {
      setIsCheckingPending(false)
    }
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
        return <Plus className="h-5 w-5 text-green-400" />
      case 'payment':
        return <XCircle className="h-5 w-5 text-red-400" />
      case 'cashback':
        return <CheckCircle className="h-5 w-5 text-yellow-400" />
      case 'refund':
        return <ArrowLeft className="h-5 w-5 text-blue-400" />
      default:
        return <Wallet className="h-5 w-5 text-gray-400" />
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

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'cashback':
      case 'refund':
        return 'text-green-400'
      case 'payment':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <>
        <Navbar />
        <main className="flex-1 mt-16 py-12 md:py-24">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto">
              <div className="animate-pulse space-y-6">
                <div className="h-8 bg-zinc-800 rounded w-48"></div>
                <div className="h-32 bg-zinc-800 rounded"></div>
                <div className="h-64 bg-zinc-800 rounded"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 mt-16 py-12 md:py-24">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Profile
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Wallet className="h-8 w-8 md:h-10 md:w-10" />
                Balance & Transactions
              </h1>
              <p className="text-gray-400">Manage your account balance and view transaction history</p>
            </div>

            {/* Success Message */}
            {showSuccessMessage && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-green-400 font-medium">Deposit successful!</p>
                  <p className="text-sm text-gray-400">Your balance has been updated.</p>
                </div>
                <button
                  onClick={() => setShowSuccessMessage(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-950/50 to-cyan-950/50 border border-blue-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <Wallet className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
                <div className="text-sm text-gray-400 mb-1">Available Balance</div>
                <div className="text-3xl font-bold text-blue-400">{formatCurrency(balance.balance)}</div>
              </div>

              <div className="bg-gradient-to-br from-yellow-950/50 to-amber-950/50 border border-yellow-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-500/20 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-yellow-400" />
                  </div>
                </div>
                <div className="text-sm text-gray-400 mb-1">Total Cashback</div>
                <div className="text-3xl font-bold text-yellow-400">{formatCurrency(balance.cashback)}</div>
                <div className="text-xs text-gray-500 mt-2">2.5% cashback on every deposit</div>
              </div>
            </div>

            {/* Actions */}
            <div className="mb-8 flex gap-4">
              <button
                onClick={handleDepositClick}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add Funds
              </button>
              <button
                onClick={handleCheckPendingDeposits}
                disabled={isCheckingPending}
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isCheckingPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Check Pending Deposits
                  </>
                )}
              </button>
            </div>

            {/* Transaction History */}
            <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Transaction History
                </h2>
              </div>

              {isLoadingTransactions && transactions.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  Loading transactions...
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions yet</p>
                  <p className="text-sm text-gray-500 mt-2">Your transaction history will appear here</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {transactions.map((tx, index) => (
                      <div
                        key={`${tx.id}-${tx.created_at}-${index}`}
                        className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg hover:bg-zinc-750 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            {getTransactionIcon(tx.transaction_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium">
                              {getTransactionLabel(tx.transaction_type)}
                            </div>
                            <div className="text-sm text-gray-400 truncate">{tx.description}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(tx.created_at).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <div className={`font-bold text-lg ${getTransactionColor(tx.transaction_type)}`}>
                            {tx.transaction_type === 'deposit' || tx.transaction_type === 'cashback' || tx.transaction_type === 'refund'
                              ? '+'
                              : '-'}
                            {formatCurrency(Math.abs(tx.amount))}
                          </div>
                          {tx.cashback_amount && tx.cashback_amount > 0 && (
                            <div className="text-xs text-yellow-400 mt-1">
                              +{formatCurrency(tx.cashback_amount)} cashback
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            Balance: {formatCurrency(tx.balance_after)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {hasMore && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={() => fetchTransactions()}
                        disabled={isLoadingTransactions}
                        className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                      >
                        {isLoadingTransactions ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          'Load More'
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Deposit Modal */}
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
                      className="w-full pl-8 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

      <Footer />
    </>
  )
}

export default function BalancePage() {
  return (
    <Suspense fallback={
      <>
        <Navbar />
        <main className="flex-1 mt-16 py-12 md:py-24">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto">
              <div className="animate-pulse space-y-6">
                <div className="h-8 bg-zinc-800 rounded w-48"></div>
                <div className="h-32 bg-zinc-800 rounded"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    }>
      <BalanceContent />
    </Suspense>
  )
}

