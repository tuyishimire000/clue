'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'

interface User {
  id: string
  full_name: string
  email: string
  referral_code: string
  balance: number
}

export default function MePage() {
  const router = useRouter()
  const supabase = createClient()
  const [showEditId, setShowEditId] = useState(false)

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

  // Calculate metrics (mock data for now)
  const totalIncome = user.balance
  const totalRecharge = 0
  const totalAssets = 0
  const totalWithdraw = 0
  const todayIncome = user.balance > 0 ? user.balance.toFixed(2) : '0.00'
  const teamIncome = 0

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
            <div className="bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded">
              V0
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
                {user.balance} <span className="text-lg">RWF</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Recharge wallet</div>
              <div className="text-3xl font-bold text-gray-700">
                0 <span className="text-lg">RWF</span>
              </div>
            </div>
          </div>

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
              <div className="text-lg font-bold text-gray-800">{totalIncome}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">Total recharge</div>
              <div className="text-lg font-bold text-gray-800">{totalRecharge}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">Total assets</div>
              <div className="text-lg font-bold text-gray-800">{totalAssets}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">Total withdraw</div>
              <div className="text-lg font-bold text-gray-800">{totalWithdraw}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">Today&apos;s income</div>
              <div className="text-lg font-bold text-indigo-600">{todayIncome}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">Team income</div>
              <div className="text-lg font-bold text-gray-800">{teamIncome}</div>
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

