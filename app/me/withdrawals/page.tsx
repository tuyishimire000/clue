'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'

interface Withdrawal {
  id: string
  amount: number
  fee: number
  net_amount: number
  account_number: string | null
  account_name: string | null
  status: string
  created_at: string
  updated_at: string
}

export default function WithdrawalsPage() {
  const router = useRouter()
  const supabase = createClient()

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
        .select('id')
        .eq('id', authUser.id)
        .single()

      if (error) throw error
      return data
    },
  })

  // Fetch withdrawals
  const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ['withdrawals', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as Withdrawal[]
    },
    enabled: !!user?.id,
  })

  if (userLoading || withdrawalsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 to-white">
        <div className="text-xl text-gray-800">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
            Completed
          </span>
        )
      case 'pending':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
            Pending
          </span>
        )
      case 'processing':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            Processing
          </span>
        )
      case 'failed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            Failed
          </span>
        )
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            {status}
          </span>
        )
    }
  }

  const totalWithdrawals = withdrawals?.length || 0
  const totalWithdrawn = withdrawals?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0
  const totalFees = withdrawals?.reduce((sum, w) => sum + (w.fee || 0), 0) || 0
  const totalNetAmount = withdrawals?.reduce((sum, w) => sum + (w.net_amount || 0), 0) || 0

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
            <h1 className="text-xl font-bold text-white">Withdrawal Records</h1>
            <div className="w-6"></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Summary Card */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Withdrawal Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Total Withdrawals</div>
              <div className="text-2xl font-bold text-indigo-600">
                {totalWithdrawals}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Total Withdrawn</div>
              <div className="text-2xl font-bold text-indigo-600">
                {totalWithdrawn.toLocaleString()} RWF
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Total Fees</div>
              <div className="text-2xl font-bold text-red-600">
                {totalFees.toLocaleString()} RWF
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Net Amount</div>
              <div className="text-2xl font-bold text-green-600">
                {totalNetAmount.toLocaleString()} RWF
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawals List */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">Withdrawal Records</h2>
          </div>

          {withdrawals && withdrawals.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {withdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Left side - Withdrawal details */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">📤</div>
                        <div>
                          <div className="font-semibold text-gray-800">
                            {withdrawal.amount.toLocaleString()} RWF
                          </div>
                          <div className="text-sm text-gray-600">
                            Net: {withdrawal.net_amount.toLocaleString()} RWF
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Fee:</span>
                          <span>{withdrawal.fee.toLocaleString()} RWF</span>
                        </div>
                        {withdrawal.account_number && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Account Number:</span>
                            <span>{withdrawal.account_number}</span>
                          </div>
                        )}
                        {withdrawal.account_name && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Account Name:</span>
                            <span>{withdrawal.account_name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Time:</span>
                          <span>
                            {format(new Date(withdrawal.created_at), 'MMM d, yyyy HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right side - Status */}
                    <div className="flex items-center gap-3">
                      {getStatusBadge(withdrawal.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">📭</div>
              <div className="text-gray-600 font-medium mb-2">No withdrawal records found</div>
              <div className="text-sm text-gray-500 mb-4">
                Your withdrawal history will appear here once you make your first withdrawal.
              </div>
              <Link
                href="/withdraw"
                className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Make a Withdrawal
              </Link>
            </div>
          )}
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


