'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface User {
  id: string
  full_name: string
  email: string
  referral_code: string
  balance: number
  recharge_wallet: number
  total_recharge: number
}

export default function MePage() {
  const router = useRouter()
  const supabase = createClient()
  const queryClient = useQueryClient()
  
  // State hooks - must be at top level
  const [transferAmount, setTransferAmount] = useState<string>('')
  const [transferError, setTransferError] = useState<string | null>(null)
  const [transferSuccess, setTransferSuccess] = useState(false)

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
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) throw error
      return data as User
    },
  })

  // Fetch check-ins for total income calculation
  const { data: checkIns } = useQuery({
    queryKey: ['checkins', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('checkins')
        .select('amount, created_at')
        .eq('user_id', user.id)

      if (error) throw error
      return data || []
    },
    enabled: !!user?.id,
  })

  // Fetch investments for total income calculation
  const { data: investments } = useQuery({
    queryKey: ['investments', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('investments')
        .select('daily_income, income_period, created_at, status')
        .eq('user_id', user.id)

      if (error) throw error
      return data || []
    },
    enabled: !!user?.id,
  })

  // Fetch withdrawals for total withdraw calculation
  const { data: withdrawals } = useQuery({
    queryKey: ['withdrawals', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('withdrawals')
        .select('amount')
        .eq('user_id', user.id)

      if (error) throw error
      return data || []
    },
    enabled: !!user?.id,
  })

  // Transfer mutation - must be at top level
  const transferMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await fetch('/api/recharge/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Transfer failed')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      setTransferAmount('')
      setTransferSuccess(true)
      setTransferError(null)
      setTimeout(() => setTransferSuccess(false), 3000)
    },
    onError: (error: Error) => {
      setTransferError(error.message)
      setTimeout(() => setTransferError(null), 3000)
    },
  })

  // Early returns after all hooks
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 to-white">
        <div className="text-xl text-gray-800">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Calculate total income from check-ins and investment earnings (excluding recharge)
  const checkInIncome = checkIns?.reduce((sum, checkIn) => sum + (checkIn.amount || 0), 0) || 0
  const investmentIncome = investments?.reduce((sum, inv) => {
    if (inv.status === 'completed') {
      // For completed investments, use total income
      return sum + (inv.daily_income * inv.income_period)
    } else {
      // For active investments, calculate earnings based on days passed
      const now = new Date()
      const createdDate = new Date(inv.created_at)
      const daysPassed = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      const earnedDays = Math.min(daysPassed, inv.income_period)
      return sum + (inv.daily_income * earnedDays)
    }
  }, 0) || 0
  const totalIncome = checkInIncome + investmentIncome

  // Calculate today's income
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  // Today's check-in income
  const todayCheckInIncome = checkIns?.filter(checkIn => {
    const checkInDate = new Date(checkIn.created_at)
    return checkInDate >= today && checkInDate < tomorrow
  }).reduce((sum, checkIn) => sum + (checkIn.amount || 0), 0) || 0
  
  // Today's investment earnings (daily income from active investments)
  const todayInvestmentIncome = investments?.filter(inv => inv.status === 'active').reduce((sum, inv) => {
    const createdDate = new Date(inv.created_at)
    const now = new Date()
    // Check if investment started today or earlier
    if (createdDate <= now) {
      // For active investments, add today's daily income
      return sum + inv.daily_income
    }
    return sum
  }, 0) || 0
  
  const todayIncome = todayCheckInIncome + todayInvestmentIncome

  // Determine user tier based on investments
  const hasInvested = (investments && investments.length > 0) || false
  const userTier = hasInvested ? 'Premium' : 'Basic'

  // Calculate metrics
  const totalRecharge = user.total_recharge || 0
  const totalAssets = user.balance + (user.recharge_wallet || 0)
  const totalWithdraw = withdrawals?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0
  const teamIncome = 0 // TODO: Calculate team income

  const handleTransfer = () => {
    const amount = parseInt(transferAmount)
    if (!amount || amount <= 0) {
      setTransferError('Please enter a valid amount')
      return
    }

    if (amount > (user.recharge_wallet || 0)) {
      setTransferError('Insufficient funds in recharge wallet')
      return
    }

    transferMutation.mutate(amount)
  }

  const handleTransferAll = () => {
    if ((user.recharge_wallet || 0) <= 0) {
      setTransferError('No funds to transfer')
      return
    }
    transferMutation.mutate(user.recharge_wallet || 0)
  }

  const userId = user.id.substring(0, 9) // Shortened user ID

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white pb-20">
      {/* Header */}
      <header className="bg-indigo-600 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="text-white hover:text-indigo-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">Me</h1>
            <div className="w-6"></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4 bg-white rounded-2xl shadow-md p-4">
          <div className="bg-indigo-600 rounded-xl p-3 shadow-lg">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center">
              <span className="text-white text-2xl font-bold">C</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-semibold text-gray-800">{userId}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(user.id)
                  alert('User ID copied!')
                }}
                className="text-gray-400 hover:text-indigo-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <div className="text-sm text-gray-600">Score: 0</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-3xl">💎</div>
            <div className={`text-xs font-bold px-3 py-1.5 rounded ${
              userTier === 'Premium' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' 
                : 'bg-gray-400 text-white'
            }`}>
              {userTier}
            </div>
          </div>
        </div>

        {/* Financial Summary Dashboard */}
        <div className="bg-gray-100 rounded-2xl shadow-md p-6">
          {/* Wallet Balances */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Balance wallet</div>
              <div className="text-3xl font-bold text-indigo-600">
                {user.balance.toLocaleString()} <span className="text-lg">RWF</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Recharge wallet</div>
              <div className="text-3xl font-bold text-gray-700">
                {(user.recharge_wallet || 0).toLocaleString()} <span className="text-lg">RWF</span>
              </div>
            </div>
          </div>

          {/* Transfer Section */}
          {(user.recharge_wallet || 0) > 0 && (
            <div className="bg-white rounded-xl p-4 mb-4 border-2 border-indigo-200">
              <div className="text-sm font-semibold text-gray-800 mb-3">Transfer to Balance Wallet</div>
              
              {transferSuccess && (
                <div className="mb-3 p-2 bg-green-100 text-green-700 rounded text-sm">
                  Transfer successful!
                </div>
              )}
              
              {transferError && (
                <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">
                  {transferError}
                </div>
              )}

              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter amount"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={handleTransfer}
                  disabled={transferMutation.isPending || !transferAmount}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Transfer
                </button>
              </div>
              
              <button
                onClick={handleTransferAll}
                disabled={transferMutation.isPending}
                className="w-full py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Transfer All ({(user.recharge_wallet || 0).toLocaleString()} RWF)
              </button>
            </div>
          )}

          {/* Wavy separator */}
          <div className="relative h-16 bg-gradient-to-r from-indigo-100 to-indigo-200 rounded-xl overflow-hidden my-4">
            <div className="absolute inset-0 opacity-30">
              <svg viewBox="0 0 400 100" className="w-full h-full">
                <path
                  d="M0,50 Q100,20 200,50 T400,50"
                  stroke="white"
                  strokeWidth="3"
                  fill="none"
                />
                <path
                  d="M0,50 Q100,80 200,50 T400,50"
                  stroke="white"
                  strokeWidth="3"
                  fill="none"
                />
              </svg>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">Total income</div>
              <div className="text-lg font-bold text-gray-800">{totalIncome.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">Total recharge</div>
              <div className="text-lg font-bold text-gray-800">{totalRecharge.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">Total assets</div>
              <div className="text-lg font-bold text-gray-800">{totalAssets.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">Total withdraw</div>
              <div className="text-lg font-bold text-gray-800">{totalWithdraw.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">Today&apos;s income</div>
              <div className="text-lg font-bold text-indigo-600">{todayIncome.toLocaleString()} RWF</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">Team income</div>
              <div className="text-lg font-bold text-gray-800">{teamIncome.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Actionable List Items */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <Link
            href="/me/funding"
            className="flex items-center gap-4 p-4 border-b border-gray-100 hover:bg-indigo-50 transition-colors"
          >
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">💰</span>
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-800">Funding details</div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            href="/me/withdrawals"
            className="flex items-center gap-4 p-4 border-b border-gray-100 hover:bg-indigo-50 transition-colors"
          >
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-800">Withdrawal Record</div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            href="/me/password"
            className="flex items-center gap-4 p-4 border-b border-gray-100 hover:bg-indigo-50 transition-colors"
          >
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔒</span>
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-800">Login Password</div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            href="/me/withdrawal-password"
            className="flex items-center gap-4 p-4 border-b border-gray-100 hover:bg-indigo-50 transition-colors"
          >
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔐</span>
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-800">Withdrawal Password</div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            href="/me/bank-account"
            className="flex items-center gap-4 p-4 hover:bg-indigo-50 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💳</span>
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-800">My bank account</div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-indigo-100 shadow-2xl z-50">
        <nav className="container mx-auto px-4">
          <div className="grid grid-cols-4 gap-1 py-3">
            <Link
              href="/dashboard"
              className="flex flex-col items-center justify-center py-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
            >
              <div className="text-3xl mb-1">🏠</div>
              <span className="text-xs font-semibold">Home</span>
            </Link>
            <Link
              href="/invest"
              className="flex flex-col items-center justify-center py-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
            >
              <div className="text-3xl mb-1">💼</div>
              <span className="text-xs font-semibold">Invest</span>
            </Link>
            <Link
              href="/team"
              className="flex flex-col items-center justify-center py-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
            >
              <div className="text-3xl mb-1">👥</div>
              <span className="text-xs font-semibold">Team</span>
            </Link>
            <Link
              href="/me"
              className="flex flex-col items-center justify-center py-2 text-indigo-600 rounded-lg"
            >
              <div className="text-3xl mb-1">👤</div>
              <span className="text-xs font-semibold">Me</span>
            </Link>
          </div>
        </nav>
      </footer>
    </div>
  )
}

