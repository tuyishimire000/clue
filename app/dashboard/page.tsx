'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'

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
  }
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

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login')
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Refresh user data when auth state changes
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
        // If user profile doesn't exist, it might still be creating
        // Wait a bit and retry, or redirect to login
        if (error.code === 'PGRST116') {
          // User profile not found - might be a new user, wait and retry
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

      // Fetch referrals
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false })

      if (referralsError) throw referralsError
      if (!referralsData || referralsData.length === 0) return []

      // Fetch user details for referred users
      const referredIds = referralsData.map(r => r.referred_id)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', referredIds)

      if (usersError) throw usersError

      // Combine data
      return referralsData.map(ref => ({
        ...ref,
        referred_user: usersData?.find(u => u.id === ref.referred_id) || null
      })) as Referral[]
    },
    enabled: !!user?.id,
  })

  // Fetch check-ins
  const { data: checkIns, isLoading: checkInsLoading } = useQuery({
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="text-xl text-gray-800">Loading your dashboard...</div>
        </div>
      </div>
    )
  }

  if (userError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="text-xl text-gray-800">Redirecting to login...</div>
        </div>
      </div>
    )
  }

  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${user.referral_code}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Balance Card */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Balance</h2>
            <p className="text-3xl font-bold text-indigo-600">{user.balance} RWF</p>
          </div>

          {/* Referral Code Card */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Your Referral Code</h2>
            <p className="text-2xl font-mono font-bold text-indigo-600 mb-3">{user.referral_code}</p>
            <div className="space-y-2">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(referralLink)
                  alert('Referral link copied!')
                }}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
              >
                Copy Link
              </button>
            </div>
          </div>

          {/* Referrals Count Card */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Referrals</h2>
            <p className="text-3xl font-bold text-indigo-600">
              {referralsLoading ? '...' : referrals?.length || 0}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              +{((referrals?.length || 0) * 50)} RWF/day bonus
            </p>
          </div>
        </div>

        {/* Daily Check-In */}
        <div className="mt-6 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Daily Check-In</h2>
          {hasCheckedInToday ? (
            <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              ✅ You&apos;ve already checked in today! Come back tomorrow for more rewards.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-gray-700 mb-2">
                  <strong>Base Reward:</strong> 100 RWF
                </p>
                <p className="text-gray-700">
                  <strong>Referral Bonus:</strong> {(referrals?.length || 0) * 50} RWF ({referrals?.length || 0} referrals × 50 RWF)
                </p>
                <p className="text-lg font-bold text-indigo-600 mt-2">
                  Total Reward: {100 + ((referrals?.length || 0) * 50)} RWF
                </p>
              </div>
              <button
                onClick={handleCheckIn}
                disabled={checkInMutation.isPending}
                className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {checkInMutation.isPending ? 'Processing...' : 'Check In Now'}
              </button>
              {checkInMutation.isError && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {checkInMutation.error?.message || 'Failed to check in'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Referrals List */}
        <div className="mt-6 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Referrals</h2>
          {referralsLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : referrals && referrals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 text-gray-700">Email</th>
                    <th className="text-left py-2 px-4 text-gray-700">Name</th>
                    <th className="text-left py-2 px-4 text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((referral) => (
                    <tr key={referral.id} className="border-b">
                      <td className="py-2 px-4 text-gray-600">
                        {(referral.referred_user as any)?.email || 'N/A'}
                      </td>
                      <td className="py-2 px-4 text-gray-600">
                        {(referral.referred_user as any)?.full_name || 'N/A'}
                      </td>
                      <td className="py-2 px-4 text-gray-600">
                        {format(new Date(referral.created_at), 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No referrals yet. Share your link to earn bonuses!</p>
          )}
        </div>

        {/* Check-In History */}
        <div className="mt-6 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Check-Ins</h2>
          {checkInsLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : checkIns && checkIns.length > 0 ? (
            <div className="space-y-2">
              {checkIns.map((checkIn) => (
                <div key={checkIn.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
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
          ) : (
            <p className="text-gray-500">No check-ins yet. Check in daily to earn rewards!</p>
          )}
        </div>
      </div>
    </div>
  )
}

