"use client"

import { useEffect, useState, Suspense } from "react"
import { CheckCircle, Mail, Clock, Shield, ArrowLeft } from "lucide-react"
import { Navbar } from "@/app/components/navbar"
import { Footer } from "@/app/components/footer"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useLocaleContext } from "@/contexts"

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const { t } = useLocaleContext()
  const [paymentId, setPaymentId] = useState<string | null>(null)

  useEffect(() => {
    // Get payment intent ID from URL if available
    const id = searchParams.get('payment_intent')
    if (id) {
      setPaymentId(id)
    }
  }, [searchParams])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1 mt-16 py-12 md:py-24">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto">
            {/* Success Card */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-green-500/20 rounded-2xl p-8 md:p-12 shadow-2xl">
              {/* Success Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                  <div className="relative w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-12 w-12 text-white" />
                  </div>
                </div>
              </div>

              {/* Success Message */}
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-4">
                  Payment Successful!
                </h1>
                <p className="text-lg text-gray-400">
                  Thank you for your order. We've received your payment and your boosting service has been queued.
                </p>
              </div>

              {/* Payment Details */}
              {paymentId && (
                <div className="bg-zinc-800/50 rounded-lg p-6 mb-8 border border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                    Transaction Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Transaction ID</span>
                      <span className="text-gray-200 font-mono text-sm">{paymentId.slice(0, 20)}...</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Status</span>
                      <span className="inline-flex items-center gap-2 text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        Completed
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Next Steps */}
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4 p-4 bg-blue-950/30 rounded-lg border border-blue-500/20">
                  <Mail className="h-6 w-6 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-100 mb-1">Check Your Email</h4>
                    <p className="text-sm text-gray-400">
                      We've sent you a confirmation email with all the details and your receipt.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-cyan-950/30 rounded-lg border border-cyan-500/20">
                  <Clock className="h-6 w-6 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-100 mb-1">Order Processing</h4>
                    <p className="text-sm text-gray-400">
                      Your boosting service will start within the next 1-2 hours. You'll receive updates via email.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-green-950/30 rounded-lg border border-green-500/20">
                  <Shield className="h-6 w-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-100 mb-1">Account Safety</h4>
                    <p className="text-sm text-gray-400">
                      Your account credentials are encrypted and handled with the utmost security by our professional team.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Link
                  href="/"
                  className="block w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-bold text-center transition-all duration-200"
                >
                  Return to Home
                </Link>
                <Link
                  href="/#games"
                  className="block w-full px-6 py-3 border border-gray-700 hover:border-gray-600 text-gray-300 rounded-lg font-semibold text-center transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Order Another Service
                </Link>
              </div>
            </div>

            {/* Support Section */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                Need help?{" "}
                <Link href="/contact" className="text-blue-400 hover:text-blue-300 transition-colors">
                  Contact Support
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}

