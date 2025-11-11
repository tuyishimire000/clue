'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format, addDays } from 'date-fns'

interface User {
  id: string
  balance: number
}

interface Investment {
  id: string
  user_id: string
  product_id: string
  product_name: string
  amount: number
  purchase_count: number
  daily_income: number
  income_period: number
  total_income: number
  status: string
  created_at: string
  updated_at: string
}

export default function MyProductsPage() {
  const router = useRouter()
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Process investments periodically (every 5 minutes)
  useEffect(() => {
    const processInvestments = async () => {
      try {
        await fetch('/api/investments/process', { method: 'POST' })
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['investments'] })
        queryClient.invalidateQueries({ queryKey: ['user'] })
      } catch (error) {
        console.error('Error processing investments:', error)
      }
    }

    // Process immediately on mount
    processInvestments()

    // Then process every 5 minutes
    const interval = setInterval(processInvestments, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [queryClient])

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

  // Fetch user investments
  const { data: investments, isLoading: investmentsLoading } = useQuery({
    queryKey: ['investments', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching investments:', error)
        return []
      }
      return (data || []) as Investment[]
    },
    enabled: !!user?.id,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes to get updated balances
  })

  if (userLoading || investmentsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 to-white">
        <div className="text-xl text-gray-800">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Calculate investment statistics
  const totalInvestment = investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0
  const totalReturn = investments?.reduce((sum, inv) => {
    const createdDate = new Date(inv.created_at)
    const now = new Date()
    const daysPassed = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysEarned = Math.min(daysPassed, inv.income_period)
    const earnedSoFar = inv.daily_income * daysEarned * inv.purchase_count
    return sum + earnedSoFar
  }, 0) || 0
  const todayEarnings = investments?.reduce((sum, inv) => {
    const createdDate = new Date(inv.created_at)
    const now = new Date()
    const daysPassed = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysPassed < inv.income_period) {
      return sum + (inv.daily_income * inv.purchase_count)
    }
    return sum
  }, 0) || 0

  const getInvestmentProgress = (investment: Investment) => {
    const createdDate = new Date(investment.created_at)
    const now = new Date()
    const daysPassed = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
    const progress = Math.min((daysPassed / investment.income_period) * 100, 100)
    const daysRemaining = Math.max(investment.income_period - daysPassed, 0)
    const earnedSoFar = investment.daily_income * Math.min(daysPassed, investment.income_period) * investment.purchase_count
    const completionDate = addDays(createdDate, investment.income_period)
    return {
      progress,
      daysRemaining,
      earnedSoFar,
      completionDate,
      daysPassed,
      isCompleted: daysPassed >= investment.income_period,
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white pb-20">
      {/* Header */}
      <header className="bg-indigo-600 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link href="/invest" className="text-white hover:text-indigo-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-white">My Products</h1>
            <div className="w-6"></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Summary Card */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
          <div className="text-center mb-4">
            <div className="text-xs sm:text-sm text-gray-600 mb-2">Total Investment</div>
            <div className="text-2xl sm:text-4xl font-bold text-indigo-600">
              {totalInvestment.toLocaleString()} RWF
            </div>
          </div>
          
          <div className="relative h-20 bg-gradient-to-r from-indigo-100 to-indigo-200 rounded-xl overflow-hidden mt-4">
            <div className="absolute inset-0 opacity-20">
              <svg viewBox="0 0 400 100" className="w-full h-full">
                <path
                  d="M0,50 Q100,20 200,50 T400,50"
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M0,50 Q100,80 200,50 T400,50"
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </div>
            <div className="relative h-full flex items-center justify-around px-2 sm:px-4">
              <div className="text-center flex-1">
                <div className="text-xs text-gray-600 mb-1">Total Return</div>
                <div className="text-sm sm:text-lg font-bold text-indigo-700">
                  {totalReturn.toLocaleString()} RWF
                </div>
              </div>
              <div className="text-center flex-1">
                <div className="text-xs text-gray-600 mb-1">Today Earnings</div>
                <div className="text-sm sm:text-lg font-bold text-indigo-700">
                  {todayEarnings.toLocaleString()} RWF
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Investments List */}
        {investments && investments.length > 0 ? (
          <div className="space-y-4">
            {investments.filter(inv => inv.status === 'active').map((investment) => {
              const progressData = getInvestmentProgress(investment)
              return (
                <div key={investment.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                  {/* Product Header */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-800">{investment.product_name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        progressData.isCompleted
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {progressData.isCompleted ? 'Completed' : 'Active'}
                      </span>
                    </div>
                  </div>

                  {/* Investment Details */}
                  <div className="p-4 space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-2">
                        <span>Progress</span>
                        <span>{progressData.progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all"
                          style={{ width: `${progressData.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Investment Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Investment Amount</div>
                        <div className="text-sm font-bold text-gray-800">
                          {investment.amount.toLocaleString()} RWF
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Purchase Count</div>
                        <div className="text-sm font-bold text-gray-800">
                          {investment.purchase_count}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Daily Income</div>
                        <div className="text-sm font-bold text-green-600">
                          {(investment.daily_income * investment.purchase_count).toLocaleString()} RWF
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Total Income</div>
                        <div className="text-sm font-bold text-green-600">
                          {investment.total_income.toLocaleString()} RWF
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Earned So Far</div>
                        <div className="text-sm font-bold text-indigo-600">
                          {progressData.earnedSoFar.toLocaleString()} RWF
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Days Remaining</div>
                        <div className="text-sm font-bold text-gray-800">
                          {progressData.isCompleted ? 'Completed' : `${progressData.daysRemaining} days`}
                        </div>
                      </div>
                    </div>

                    {/* Income Period Info */}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex justify-between items-center text-xs text-gray-600">
                        <span>Income Period: {investment.income_period} days</span>
                        <span>Started: {format(new Date(investment.created_at), 'MMM dd, yyyy')}</span>
                      </div>
                      {!progressData.isCompleted && (
                        <div className="mt-1 text-xs text-gray-600">
                          Completion: {format(progressData.completionDate, 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            
            {/* Completed Investments Section */}
            {investments.filter(inv => inv.status === 'completed').length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Completed Investments</h2>
                <div className="space-y-4">
                  {investments.filter(inv => inv.status === 'completed').map((investment) => {
                    const progressData = getInvestmentProgress(investment)
                    return (
                      <div key={investment.id} className="bg-gray-50 rounded-2xl shadow-md overflow-hidden border-2 border-green-200">
                        <div className="p-4 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800">{investment.product_name}</h3>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              Completed
                            </span>
                          </div>
                        </div>
                        <div className="p-4 space-y-2 text-sm text-gray-700">
                          <div className="flex justify-between">
                            <span>Investment Amount:</span>
                            <span className="font-semibold">{investment.amount.toLocaleString()} RWF</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Earnings:</span>
                            <span className="font-semibold text-green-600">{investment.total_income.toLocaleString()} RWF</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Principal + Earnings Returned:</span>
                            <span className="font-semibold text-indigo-600">{(investment.amount + investment.total_income).toLocaleString()} RWF</span>
                          </div>
                          <div className="pt-2 border-t border-gray-200 text-xs text-gray-600">
                            Completed: {format(new Date(investment.updated_at || investment.created_at), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Investments Yet</h3>
            <p className="text-gray-600 mb-6">Start investing to see your products here</p>
            <Link
              href="/invest"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

