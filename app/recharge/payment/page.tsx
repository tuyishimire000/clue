'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'

interface User {
  id: string
  balance: number
}

type PaymentMethod = 'MTN' | 'AIRTEL' | null

function PaymentForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const amount = searchParams.get('amount')
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null)
  const [accountNumber, setAccountNumber] = useState('')
  const [error, setError] = useState<string | null>(null)

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
        .select('id, balance')
        .eq('id', authUser.id)
        .single()

      if (error) throw error
      return data as User
    },
  })

  useEffect(() => {
    if (!amount || isNaN(parseInt(amount))) {
      router.push('/recharge')
    }
  }, [amount, router])

  const handleConfirm = async () => {
    if (!selectedMethod) {
      setError('Please select a payment method')
      return
    }

    if (!accountNumber || accountNumber.trim().length < 9) {
      setError('Please enter a valid payment account number')
      return
    }

    // Navigate to payment process page with payment details
    router.push(`/recharge/payment/process?amount=${amount}&method=${selectedMethod}&account=${accountNumber}`)
  }

  if (!amount) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-indigo-600 rounded-xl p-3 shadow-lg mb-2">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center">
              <span className="text-white text-3xl font-bold">C</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-600">Clue</div>
        </div>

        {/* Instructions */}
        <p className="text-gray-700 text-center mb-6 text-sm">
          Please fill in your payment method and the actual payment account you will use to make the payment.
        </p>

        {/* Payment Amount */}
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-6 text-center">
          <div className="text-sm text-gray-600 mb-1">Payment Amount</div>
          <div className="text-3xl font-bold text-orange-600">
            RWF {parseInt(amount).toLocaleString()}
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Please select a payment method
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* MTN Option */}
            <button
              onClick={() => setSelectedMethod('MTN')}
              className={`p-5 rounded-xl border-2 transition-all ${
                selectedMethod === 'MTN'
                  ? 'border-yellow-500 bg-yellow-50 shadow-lg'
                  : 'border-gray-300 hover:border-yellow-400 hover:bg-yellow-50'
              }`}
            >
              <div className="flex flex-col items-center">
                {/* MTN MoMo Logo */}
                <div className="mb-3 flex items-center justify-center">
                  <svg width="64" height="64" viewBox="0 0 64 64" className="rounded-lg shadow-md">
                    {/* Yellow square background */}
                    <rect width="64" height="64" rx="8" fill="#FFD700" />
                    {/* Dark blue rounded rectangle (centered vertically, slight margin from top) */}
                    <rect x="12" y="10" width="40" height="24" rx="3" fill="#003D82" />
                    {/* Stylized yellow icon inside blue rectangle - upward pointing rocket/M shape */}
                    <g transform="translate(20, 13)">
                      {/* Main triangular shape pointing up and to the right */}
                      <path d="M10 11 L12 5 L14 11 L13 11 L13 15 L11 15 L11 11 Z" fill="#FFD700" />
                      {/* Wing/crescent shape on the right side */}
                      <path d="M14 10 L16 7 L18 10 L17 10 L17 14 L15 14 L15 10 Z" fill="#FFD700" />
                      {/* Small dark blue circle inside the main shape */}
                      <circle cx="12" cy="8" r="1.3" fill="#003D82" />
                    </g>
                    {/* MoMo text below blue rectangle */}
                    <text x="32" y="46" textAnchor="middle" fill="#003D82" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="bold" letterSpacing="0.5px">MoMo</text>
                    {/* from MTN text */}
                    <text x="32" y="54" textAnchor="middle" fill="#003D82" fontFamily="Arial, sans-serif" fontSize="6.5" letterSpacing="0.3px">from MTN</text>
                  </svg>
                </div>
                <div className={`font-bold text-base ${
                  selectedMethod === 'MTN' ? 'text-yellow-800' : 'text-gray-900'
                }`}>
                  MTN
                </div>
                <div className="text-xs text-gray-600 mt-0.5">MoMo from MTN</div>
              </div>
            </button>

            {/* Airtel Option */}
            <button
              onClick={() => setSelectedMethod('AIRTEL')}
              className={`p-5 rounded-xl border-2 transition-all ${
                selectedMethod === 'AIRTEL'
                  ? 'border-red-500 bg-red-50 shadow-lg'
                  : 'border-gray-300 hover:border-red-400 hover:bg-red-50'
              }`}
            >
              <div className="flex flex-col items-center">
                {/* Airtel Money Logo */}
                <div className="mb-3 flex flex-col items-center justify-center">
                  {/* "airtel money" text - clear red text with larger font */}
                  <div className="text-center">
                    <div className="text-[#E60012] font-bold text-xl leading-tight">airtel</div>
                    <div className="text-[#E60012] font-bold text-lg leading-tight mt-1">money</div>
                  </div>
                </div>
                <div className={`font-bold text-base ${
                  selectedMethod === 'AIRTEL' ? 'text-red-800' : 'text-gray-900'
                }`}>
                  AIRTEL
                </div>
                <div className="text-xs text-gray-600 mt-0.5">airtel money</div>
              </div>
            </button>
          </div>
        </div>

        {/* Payment Account Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Account
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <span className="text-orange-600 font-semibold">+250</span>
            </div>
            <input
              type="tel"
              value={accountNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '')
                if (value.length <= 9) {
                  setAccountNumber(value)
                }
              }}
              placeholder="Please enter your actual payment account"
              className="w-full pl-16 pr-4 py-4 border-2 border-gray-200 rounded-xl text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Enter your {selectedMethod === 'MTN' ? 'MTN Mobile Money' : selectedMethod === 'AIRTEL' ? 'Airtel Money' : 'mobile money'} number
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={!selectedMethod || !accountNumber}
          className="w-full py-4 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Confirm
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="w-full mt-3 text-gray-600 hover:text-gray-800 text-sm"
        >
          ← Back
        </button>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-100 to-white">
        <div className="text-xl text-gray-800">Loading...</div>
      </div>
    }>
      <PaymentForm />
    </Suspense>
  )
}
