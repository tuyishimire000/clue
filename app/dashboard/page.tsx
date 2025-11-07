'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import Link from 'next/link'

interface User {
  id: string
  full_name: string
  email: string
  referral_code: string
  referred_by: string | null
  balance: number
}

interface Referral {
  id: string
  referred_id: string
  created_at: string
  referred_user: {
    email: string
    full_name: string
  } | null
}

interface CheckIn {
  id: string
  amount: number
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const [showNotification, setShowNotification] = useState(true)

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login')
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        queryClient.invalidateQueries({ queryKey: ['user'] })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, queryClient, supabase.auth])

  // Fetch user data
  const { data: userData, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        router.push('/login')
        return null
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          await new Promise(resolve => setTimeout(resolve, 1000))
          const { data: retryData, error: retryError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single()
          
          if (retryError) {
            console.error('User profile not found after retry:', retryError)
            throw new Error('User profile not found. Please contact support.')
          }
          
          setUser(retryData)
          return retryData
        }
        throw error
      }
      
      setUser(data)
      return data
    },
    retry: 2,
    retryDelay: 1000,
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
        .select('id, email, full_name')
        .in('id', referredIds)

      if (usersError) throw usersError

      return referralsData.map(ref => ({
        ...ref,
        referred_user: usersData?.find(u => u.id === ref.referred_id) || null
      })) as Referral[]
    },
    enabled: !!user?.id,
  })

  // Fetch check-ins
  const { data: checkIns } = useQuery({
    queryKey: ['checkins', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return data as CheckIn[]
    },
    enabled: !!user?.id,
  })

  // Check if user has checked in today
  const { data: hasCheckedInToday } = useQuery({
    queryKey: ['checkin-today', user?.id],
    queryFn: async () => {
      if (!user?.id) return false

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const { data, error } = await supabase
        .from('checkins')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .limit(1)

      if (error) throw error
      return (data?.length ?? 0) > 0
    },
    enabled: !!user?.id,
  })

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/checkin', {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to check in')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['checkins'] })
      queryClient.invalidateQueries({ queryKey: ['checkin-today'] })
    },
  })

  const handleCheckIn = () => {
    checkInMutation.mutate()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 to-white">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="text-xl text-gray-800">Loading your dashboard...</div>
        </div>
      </div>
    )
  }

  if (userError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 to-white">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Error</h2>
          <p className="text-gray-700 mb-4">
            {userError instanceof Error ? userError.message : 'Failed to load user data'}
          </p>
          <button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['user'] })
            }}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
          >
            Retry
          </button>
          <button
            onClick={handleLogout}
            className="w-full mt-2 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
          >
            Logout
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 to-white">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="text-xl text-gray-800">Redirecting to login...</div>
        </div>
      </div>
    )
  }

  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${user.referral_code}`
  const referralBonus = (referrals?.length || 0) * 50
  const dailyReward = 100 + referralBonus

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white pb-20">
      {/* Header */}
      <header className="bg-indigo-600 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-xl p-2 shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-white text-2xl font-bold">C</span>
                </div>
              </div>
              <div className="text-white">
                <div className="font-semibold">{user.full_name || 'User'}</div>
                <div className="text-sm text-indigo-200">{user.email}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-white hover:text-indigo-200 text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Banner */}
      <div className="relative h-40 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          ></div>
        </div>
        <div className="relative h-full flex items-center justify-center px-4">
          <div className="text-center text-white">
            <div className="text-4xl mb-2">💰</div>
            <div className="text-3xl font-bold mb-1">{user.balance} RWF</div>
            <div className="text-indigo-100">Your Balance</div>
          </div>
        </div>
      </div>

      {/* Notification Bar */}
      {showNotification && (
        <div className="bg-indigo-100 border-b border-indigo-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-indigo-700 text-sm">
              Welcome back, {user.full_name || 'User'}! Keep earning rewards daily.
            </span>
          </div>
          <button
            onClick={() => setShowNotification(false)}
            className="text-indigo-600 hover:text-indigo-800"
          >
            ✕
          </button>
        </div>
      )}

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Wallet Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Wallet</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              className="bg-gradient-to-br from-pink-400 via-pink-500 to-orange-500 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-white text-center"
            >
              <div className="text-5xl mb-3">💳</div>
              <div className="font-bold text-lg">RECHARGE</div>
              <div className="text-sm mt-1 opacity-90">Add funds</div>
            </button>
            <button
              className="bg-gradient-to-br from-indigo-400 via-indigo-500 to-indigo-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-white text-center"
            >
              <div className="text-5xl mb-3">📤</div>
              <div className="font-bold text-lg">WITHDRAW</div>
              <div className="text-sm mt-1 opacity-90">Cash out</div>
            </button>
          </div>
        </section>

        {/* Service Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Service</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleCheckIn}
              disabled={hasCheckedInToday || checkInMutation.isPending}
              className="bg-white border-2 border-indigo-300 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all transform hover:scale-105 text-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-5xl mb-3">✅</div>
              <div className="font-bold text-gray-800 text-lg">Daily Check-in</div>
              {hasCheckedInToday ? (
                <div className="text-sm text-green-600 mt-1 font-medium">Already checked in!</div>
              ) : (
                <div className="text-sm text-indigo-600 mt-1 font-medium">Earn {dailyReward} RWF</div>
              )}
            </button>
            <Link
              href="#referrals"
              className="bg-white border-2 border-indigo-300 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all transform hover:scale-105 text-center"
            >
              <div className="text-5xl mb-3">👥</div>
              <div className="font-bold text-gray-800 text-lg">Referrals</div>
              <div className="text-sm text-indigo-600 mt-1 font-medium">
                {referrals?.length || 0} referrals
              </div>
            </Link>
          </div>
        </section>

        {/* Interactive Cards */}
        <section>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-red-400 to-pink-500 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
              <div className="absolute top-2 right-2 text-2xl">🎁</div>
              <div className="font-bold text-lg mt-4">Referral Code</div>
              <div className="text-sm mt-2 opacity-90 font-mono">{user.referral_code}</div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(referralLink)
                  alert('Referral link copied!')
                }}
                className="mt-3 text-xs bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30 transition"
              >
                Copy Link
              </button>
            </div>
            <div className="bg-gradient-to-br from-blue-400 to-orange-400 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
              <div className="absolute bottom-2 right-2 text-3xl">🎉</div>
              <div className="font-bold text-lg">Team Stats</div>
              <div className="text-2xl font-bold mt-2">{referrals?.length || 0}</div>
              <div className="text-sm mt-1 opacity-90">Total Referrals</div>
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        {checkIns && checkIns.length > 0 && (
          <section className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Check-ins</h2>
            <div className="space-y-2">
              {checkIns.slice(0, 5).map((checkIn) => (
                <div key={checkIn.id} className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-700">
                      {format(new Date(checkIn.created_at), 'MMM d, yyyy')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(checkIn.created_at), 'h:mm a')}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-indigo-600">+{checkIn.amount} RWF</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Referrals List */}
        {referrals && referrals.length > 0 && (
          <section id="referrals" className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Referrals</h2>
            <div className="space-y-2">
              {referrals.map((referral) => (
                <div key={referral.id} className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-700">
                      {referral.referred_user?.full_name || referral.referred_user?.email || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(referral.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="text-indigo-600 font-semibold">+50 RWF/day</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-indigo-100 shadow-2xl z-50">
        <nav className="container mx-auto px-4">
          <div className="grid grid-cols-4 gap-1 py-3">
            <Link
              href="/dashboard"
              className="flex flex-col items-center justify-center py-2 text-indigo-600 rounded-lg"
            >
              <div className="text-3xl mb-1">🏠</div>
              <span className="text-xs font-semibold">Home</span>
            </Link>
            <button
              className="flex flex-col items-center justify-center py-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
            >
              <div className="text-3xl mb-1">💼</div>
              <span className="text-xs font-semibold">Invest</span>
            </button>
            <Link
              href="#referrals"
              className="flex flex-col items-center justify-center py-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
            >
              <div className="text-3xl mb-1">👥</div>
              <span className="text-xs font-semibold">Team</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center py-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
            >
              <div className="text-3xl mb-1">👤</div>
              <span className="text-xs font-semibold">Me</span>
            </button>
          </div>
        </nav>
      </footer>
    </div>
  )
}
