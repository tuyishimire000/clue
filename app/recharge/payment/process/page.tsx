'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'

interface User {
  id: string
  balance: number
  recharge_wallet?: number
  total_recharge?: number
}

// Payment account details - in production, this would come from your backend
const PAYMENT_ACCOUNTS = {
  MTN: {
    number: '0791755517',
    name: 'Josephine NIBAKURE',
    ussdPrefix: '*182*1*1*',
  },
  AIRTEL: {
    number: '0724128516',
    name: '0724128516',
    ussdPrefix: '*185*1*1*', // Airtel USSD format
  },
}

function PaymentProcessForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const queryClient = useQueryClient()
  
  const amount = searchParams.get('amount')
  const method = searchParams.get('method')
  const account = searchParams.get('account')
  
  const [isChecking, setIsChecking] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending')

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return null
      }

      const { data, error } = await supabase
        .from('users')
        .select('id, balance, recharge_wallet, total_recharge')
        .eq('id', authUser.id)
        .single()

      if (error) throw error
      return data as User
    },
  })

  useEffect(() => {
    if (!amount || !method || !account) {
      router.push('/recharge')
    }
  }, [amount, method, account, router])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    alert(`${label} copied to clipboard!`)
  }

  const handleClickToPay = () => {
    // Open phone dialer with USSD code
    const ussdCode = generateUSSDCode()
    window.location.href = `tel:${ussdCode}`
  }

  const getPaymentAccount = () => {
    return PAYMENT_ACCOUNTS[method as keyof typeof PAYMENT_ACCOUNTS] || PAYMENT_ACCOUNTS.MTN
  }

  const generateUSSDCode = () => {
    const paymentAccount = getPaymentAccount()
    // USSD code format: *182*1*1*{account}*{amount}# for MTN
    // USSD code format: *185*1*1*{account}*{amount}# for Airtel
    return `${paymentAccount.ussdPrefix}${paymentAccount.number}*${amount}#`
  }

  const getPaymentMethodName = () => {
    return method === 'MTN' ? 'MTN MoMo' : 'Airtel Money'
  }

  const handleConfirmPayment = async () => {
    setIsChecking(true)
    
    // Create recharge transaction with pending status
    if (user?.id) {
      try {
        const response = await fetch('/api/recharge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            amount: parseInt(amount || '0'),
            payment_method: method || 'MTN',
            paid_number: account || '',
          }),
        })

        const result = await response.json()

        if (response.ok) {
          // Payment confirmed, transaction created as pending
          setPaymentStatus('completed') // 'completed' here means payment confirmed, not approved
          
          // Invalidate user queries (though balance won't update until admin approval)
          await queryClient.invalidateQueries({ queryKey: ['user'] })
          
          // Redirect to dashboard after 2 seconds with success message
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        } else {
          console.error('Recharge failed:', result.error)
          setPaymentStatus('failed')
        }
      } catch (error) {
        console.error('Failed to process recharge:', error)
        setPaymentStatus('failed')
      }
    }
    
    setIsChecking(false)
  }

  if (!amount || !method || !account) {
    return null
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-800 mb-4"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Payment</h1>
        </div>

        {/* Timeline Container */}
        <div className="relative pl-8">
          {/* Dashed vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300"></div>

          {/* Section 1: COPY & PAY */}
          <div className="relative mb-8">
            {/* Timeline circle icon */}
            <div className="absolute left-0 top-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center -ml-4">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>

            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
                COPY & PAY
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Copy this {getPaymentMethodName()} account and make payment
              </p>

              {/* Payment Details Box */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                <div className="mb-3">
                  <div className="text-sm text-gray-600 mb-1">Total Amount:</div>
                  <div className="text-2xl font-bold text-orange-600">
                    RWF {parseInt(amount).toLocaleString()}
                  </div>
                </div>

                <div className="mb-3 pb-3 border-b border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">{getPaymentMethodName()} Account:</div>
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-orange-600">{getPaymentAccount().number}</div>
                    <button
                      onClick={() => copyToClipboard(getPaymentAccount().number, 'Account number')}
                      className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300 transition"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">Account Name:</div>
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-orange-600">{getPaymentAccount().name}</div>
                    <button
                      onClick={() => copyToClipboard(getPaymentAccount().name, 'Account name')}
                      className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300 transition"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Click to Pay Button */}
              <button
                onClick={handleClickToPay}
                className="w-full bg-orange-600 text-white py-4 rounded-lg font-semibold text-lg mb-3 hover:bg-orange-700 transition shadow-md"
              >
                Click to pay
              </button>

              {/* USSD Code */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-sm font-mono text-gray-700">{generateUSSDCode()}</div>
                <button
                  onClick={() => copyToClipboard(generateUSSDCode(), 'USSD code')}
                  className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300 transition flex-shrink-0 ml-2"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Payment completed? */}
          <div className="relative">
            {/* Timeline circle icon */}
            <div className="absolute left-0 top-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center -ml-4">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>

            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-1">
                Confirm Payment
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                After making the payment, click <span className="text-orange-600 font-semibold">Confirm Payment</span> to submit for admin approval
              </p>

              {/* Payment Confirmation Box */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">Amount to recharge:</div>
                  <div className="text-3xl font-bold text-gray-800 mb-4">
                    RWF {parseInt(amount || '0').toLocaleString()}
                  </div>
                </div>

                {paymentStatus === 'pending' && (
                  <>
                    <button
                      onClick={handleConfirmPayment}
                      disabled={isChecking}
                      className="w-full bg-orange-600 text-white py-3 rounded-lg text-base font-semibold hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                    >
                      {isChecking ? 'Processing...' : 'Confirm Payment'}
                    </button>
                    <div className="text-xs text-gray-500 text-center">
                      Click to confirm that you have completed the payment. Your recharge will be reviewed by admin before being added to your wallet.
                    </div>
                  </>
                )}

                {paymentStatus === 'completed' && (
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="text-sm text-green-700 font-medium mb-1">
                        ✓ Payment Confirmed
                      </div>
                      <div className="text-xs text-green-600">
                        Your payment has been confirmed and submitted for admin approval. Your recharge wallet will be updated once approved.
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 text-center">
                      Redirecting to dashboard...
                    </div>
                  </div>
                )}

                {paymentStatus === 'failed' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="text-sm text-red-700 font-medium mb-1">
                      ✗ Payment Processing Failed
                    </div>
                    <div className="text-xs text-red-600 mb-3">
                      {paymentStatus === 'failed' ? 'Failed to process payment confirmation. Please try again.' : ''}
                    </div>
                    <button
                      onClick={handleConfirmPayment}
                      disabled={isChecking}
                      className="w-full bg-orange-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isChecking ? 'Processing...' : 'Try Again'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Your Payment Account Section */}
          <div className="relative mt-8">
            <div className="ml-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-gray-600">Your payment account:</span>
              </div>
              <div className="text-lg font-bold text-orange-600 ml-7">
                {account}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentProcessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-xl text-gray-800">Loading...</div>
      </div>
    }>
      <PaymentProcessForm />
    </Suspense>
  )
}

