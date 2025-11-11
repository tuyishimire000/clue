'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'

interface User {
  id: string
  balance: number
}

export default function WithdrawPage() {
  const router = useRouter()
  const supabase = createClient()
  const queryClient = useQueryClient()
  
  const [amount, setAmount] = useState('')
  const [withdrawPassword, setWithdrawPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const WITHDRAWAL_FEE_PERCENT = 10
  const MIN_WITHDRAWAL = 2000
  const MAX_WITHDRAWAL = 2000000

  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery({
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

  const calculateFee = (amountValue: number) => {
    return Math.min(amountValue * (WITHDRAWAL_FEE_PERCENT / 100), amountValue * 0.1)
  }

  const calculateNetAmount = (amountValue: number) => {
    return amountValue - calculateFee(amountValue)
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '')
    setAmount(value)
    setError(null)
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const amountValue = parseFloat(amount)

    // Validation
    if (!amount || isNaN(amountValue) || amountValue <= 0) {
      setError('Please enter a valid withdrawal amount')
      return
    }

    if (amountValue < MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal amount is ${MIN_WITHDRAWAL.toLocaleString()} RWF`)
      return
    }

    if (amountValue > MAX_WITHDRAWAL) {
      setError(`Maximum withdrawal amount is ${MAX_WITHDRAWAL.toLocaleString()} RWF`)
      return
    }

    if (!user) {
      setError('User not found')
      return
    }

    if (amountValue > user.balance) {
      setError('Insufficient balance')
      return
    }

    if (!withdrawPassword) {
      setError('Please enter your withdrawal password')
      return
    }

    setLoading(true)

    try {
      const fee = calculateFee(amountValue)
      const netAmount = calculateNetAmount(amountValue)

      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountValue,
          withdrawPassword,
          account_number: null, // TODO: Get from user profile
          account_name: null, // TODO: Get from user profile
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Withdrawal failed')
      }

      // Invalidate and refetch user data to get updated balance
      await queryClient.invalidateQueries({ queryKey: ['user'] })
      await queryClient.invalidateQueries({ queryKey: ['withdrawals'] })
      await queryClient.refetchQueries({ queryKey: ['user'] })

      setSuccess(true)
      setAmount('')
      setWithdrawPassword('')

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Withdrawal failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const amountValue = parseFloat(amount) || 0
  const fee = calculateFee(amountValue)
  const netAmount = calculateNetAmount(amountValue)

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-800">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-800 mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-800 flex-1 text-center">Withdraw</h1>
            <div className="w-6"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-md">
        {/* Withdrawal Form */}
        <form onSubmit={handleWithdraw} className="space-y-6">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Withdrawal Amount
            </label>
            <input
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="RWF 0.00"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-lg"
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Withdrawal Password
            </label>
            <input
              type="password"
              value={withdrawPassword}
              onChange={(e) => {
                setWithdrawPassword(e.target.value)
                setError(null)
              }}
              placeholder="withdraw password"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            />
          </div>

          {/* Fee Display */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-sm text-gray-600">
              Single fee: {WITHDRAWAL_FEE_PERCENT}%
            </div>
            {amountValue > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Withdrawal Amount:</span>
                  <span className="font-semibold">{amountValue.toLocaleString()} RWF</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Fee ({WITHDRAWAL_FEE_PERCENT}%):</span>
                  <span className="font-semibold text-orange-600">{fee.toLocaleString()} RWF</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="text-gray-700 font-medium">Net Amount:</span>
                  <span className="font-bold text-green-600">{netAmount.toLocaleString()} RWF</span>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              Withdrawal request submitted successfully! Redirecting...
            </div>
          )}

          {/* Account Balance Display */}
          <div className="relative bg-gradient-to-r from-green-100 via-green-150 to-green-200 rounded-xl p-6 overflow-hidden min-h-[100px]">
            {/* Wave pattern background */}
            <div className="absolute inset-0 opacity-30">
              <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 120" preserveAspectRatio="none" style={{ height: '100%' }}>
                <path fill="#22c55e" d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
              </svg>
            </div>
            <div className="relative flex items-center justify-between z-10">
              <div className="text-gray-700 font-semibold text-lg">Account Balance</div>
              <div className="text-5xl font-bold text-green-700">
                {user.balance.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Withdrawal Rules */}
          <div className="bg-white rounded-lg p-5 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Withdrawal Rules</h2>
            <ol className="space-y-3 text-sm text-gray-700">
              <li>
                <span className="font-semibold">1. Withdrawal Time:</span> Withdrawals are accepted 24 hours a day, Monday to Sunday.
              </li>
              <li>
                <span className="font-semibold">2. Minimum and Maximum Withdrawal Amounts:</span> The minimum withdrawal amount is {MIN_WITHDRAWAL.toLocaleString()} RWF and the maximum withdrawal amount is {MAX_WITHDRAWAL.toLocaleString()} RWF.
              </li>
              <li>
                <span className="font-semibold">3. Handling Fee:</span> The maximum handling fee for a single withdrawal is {WITHDRAWAL_FEE_PERCENT}% and the minimum is 0.
              </li>
              <li>
                <span className="font-semibold">4. Funding Time:</span> Funds will be credited within 24-72 hours.
              </li>
              <li>
                <span className="font-semibold">5. Action for Failed Withdrawals:</span> If a withdrawal fails, please check your withdrawal information and confirm that it is correct before making a withdrawal.
              </li>
            </ol>
          </div>

          {/* Withdraw Button */}
          <button
            type="submit"
            disabled={loading || !amount || !withdrawPassword}
            className="w-full bg-gradient-to-r from-green-400 to-green-600 text-white py-4 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Withdraw'}
          </button>
        </form>
      </main>
    </div>
  )
}

