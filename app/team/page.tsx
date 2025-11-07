'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'

interface User {
  id: string
  full_name: string
  email: string
  referral_code: string
  balance: number
}

interface Referral {
  id: string
  referred_id: string
  created_at: string
  referred_user: {
    id: string
    email: string
    full_name: string
    balance: number
    created_at: string
  } | null
}

export default function TeamPage() {
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
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) throw error
      return data as User
    },
  })

  // Fetch referrals
  const { data: referrals, isLoading: referralsLoading } = useQuery({
    queryKey: ['referrals', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false })

      if (referralsError) throw referralsError
      if (!referralsData || referralsData.length === 0) return []

      const referredIds = referralsData.map(r => r.referred_id)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name, balance, created_at')
        .in('id', referredIds)

      if (usersError) throw usersError

      return referralsData.map(ref => ({
        ...ref,
        referred_user: usersData?.find(u => u.id === ref.referred_id) || null
      })) as Referral[]
    },
    enabled: !!user?.id,
  })

  if (userLoading || referralsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 to-white">
        <div className="text-xl text-gray-800">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const totalReferrals = referrals?.length || 0
  const totalBonus = totalReferrals * 50 // Daily bonus per referral

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
            <h1 className="text-xl font-bold text-white">Team</h1>
            <div className="w-6"></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Team Summary Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center mb-4">
            <div className="text-5xl mb-3">👥</div>
            <div className="text-3xl font-bold text-indigo-600 mb-2">{totalReferrals}</div>
            <div className="text-sm text-gray-600">Total Team Members</div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-indigo-50 rounded-xl p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">Daily Bonus</div>
              <div className="text-xl font-bold text-indigo-600">+{totalBonus} RWF</div>
              <div className="text-xs text-gray-500 mt-1">Per day</div>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">Referral Code</div>
              <div className="text-lg font-mono font-bold text-indigo-600">{user.referral_code}</div>
              <button
                onClick={() => {
                  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${user.referral_code}`
                  navigator.clipboard.writeText(referralLink)
                  alert('Referral link copied!')
                }}
                className="text-xs text-indigo-600 mt-1 underline"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>

        {/* Team Members List */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Team Members</h2>
            <p className="text-sm text-gray-600 mt-1">
              {totalReferrals === 0 
                ? 'No referrals yet. Share your link to start building your team!'
                : `${totalReferrals} member${totalReferrals > 1 ? 's' : ''} in your team`
              }
            </p>
          </div>

          {referralsLoading ? (
            <div className="p-8 text-center text-gray-500">Loading team members...</div>
          ) : referrals && referrals.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {referrals.map((referral, index) => (
                <div
                  key={referral.id}
                  className="p-4 hover:bg-indigo-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Member Number/Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {index + 1}
                      </div>

                      {/* Member Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-800 truncate">
                            {referral.referred_user?.full_name || 'Unknown User'}
                          </h3>
                          {referral.referred_user && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {referral.referred_user?.email || 'Email not available'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Joined: {format(new Date(referral.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>

                    {/* Member Stats */}
                    <div className="text-right ml-4">
                      <div className="text-sm font-bold text-indigo-600">+50 RWF</div>
                      <div className="text-xs text-gray-500">Daily bonus</div>
                      {referral.referred_user?.balance !== undefined && (
                        <div className="text-xs text-gray-600 mt-1">
                          Balance: {referral.referred_user.balance} RWF
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Team Members Yet</h3>
              <p className="text-gray-600 mb-4">
                Start building your team by sharing your referral link!
              </p>
              <div className="bg-indigo-50 rounded-xl p-4 mt-4">
                <div className="text-sm text-gray-600 mb-2">Your Referral Link:</div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${user.referral_code}`}
                    className="flex-1 px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm text-gray-700"
                  />
                  <button
                    onClick={() => {
                      const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${user.referral_code}`
                      navigator.clipboard.writeText(referralLink)
                      alert('Referral link copied!')
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Team Earnings Info */}
        {totalReferrals > 0 && (
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white">
            <h3 className="text-lg font-bold mb-3">Team Earnings</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-indigo-100">Total Team Members:</span>
                <span className="font-bold">{totalReferrals}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-indigo-100">Daily Bonus Per Member:</span>
                <span className="font-bold">+50 RWF</span>
              </div>
              <div className="border-t border-indigo-400 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Daily Bonus:</span>
                  <span className="text-2xl font-bold">+{totalBonus} RWF</span>
                </div>
              </div>
            </div>
          </div>
        )}
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
              className="flex flex-col items-center justify-center py-2 text-indigo-600 rounded-lg"
            >
              <div className="text-3xl mb-1">👥</div>
              <span className="text-xs font-semibold">Team</span>
            </Link>
            <Link
              href="/me"
              className="flex flex-col items-center justify-center py-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
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

