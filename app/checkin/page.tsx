'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from 'date-fns'

interface User {
  id: string
  balance: number
  full_name: string
  email: string
}

interface CheckIn {
  id: string
  user_id: string
  amount: number
  created_at: string
}

export default function CheckInPage() {
  const router = useRouter()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [checkInStreak, setCheckInStreak] = useState(0)
  const [totalCheckIns, setTotalCheckIns] = useState(0)
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false)

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
        .select('id, balance, full_name, email')
        .eq('id', authUser.id)
        .single()

      if (error) throw error
      return data as User
    },
  })

  // Fetch all check-ins
  const { data: checkIns, isLoading: checkInsLoading } = useQuery({
    queryKey: ['checkins', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as CheckIn[]
    },
    enabled: !!user?.id,
  })

  // Fetch referrals for calculating daily reward
  const { data: referrals } = useQuery({
    queryKey: ['referrals', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data: referralsData, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)

      if (error) throw error
      return referralsData || []
    },
    enabled: !!user?.id,
  })

  // Check if user has checked in today
  const { data: checkedInToday } = useQuery({
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
      try {
        const response = await fetch('/api/checkin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to check in')
        }

        return data
      } catch (error: any) {
        console.error('Check-in error:', error)
        throw error
      }
    },
    onSuccess: (data) => {
      console.log('Check-in successful:', data)
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['checkins'] })
      queryClient.invalidateQueries({ queryKey: ['checkin-today'] })
    },
    onError: (error: any) => {
      console.error('Check-in mutation error:', error)
    },
  })

  // Calculate statistics
  useEffect(() => {
    if (checkIns && checkIns.length > 0) {
      // Calculate total earnings
      const total = checkIns.reduce((sum, checkIn) => sum + checkIn.amount, 0)
      setTotalEarnings(total)
      setTotalCheckIns(checkIns.length)

      // Calculate streak (consecutive days ending today or yesterday)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Get unique check-in dates
      const checkInDatesMap = new Map<string, Date>()
      checkIns.forEach(ci => {
        const date = parseISO(ci.created_at)
        date.setHours(0, 0, 0, 0)
        const dateKey = date.toISOString().split('T')[0]
        if (!checkInDatesMap.has(dateKey)) {
          checkInDatesMap.set(dateKey, date)
        }
      })
      
      let streak = 0
      let currentDate = new Date(today)
      
      // Count consecutive days starting from today
      while (true) {
        const dateKey = currentDate.toISOString().split('T')[0]
        if (checkInDatesMap.has(dateKey)) {
          streak++
          currentDate.setDate(currentDate.getDate() - 1)
        } else {
          break
        }
      }
      
      setCheckInStreak(streak)
    } else {
      setTotalEarnings(0)
      setTotalCheckIns(0)
      setCheckInStreak(0)
    }
    
    if (checkedInToday !== undefined) {
      setHasCheckedInToday(checkedInToday)
    }
  }, [checkIns, checkedInToday])

  // Get check-in dates for calendar display
  const getCheckInDates = () => {
    if (!checkIns) return []
    return checkIns.map(ci => {
      const date = parseISO(ci.created_at)
      date.setHours(0, 0, 0, 0)
      return date
    })
  }

  // Calendar setup
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const checkInDates = getCheckInDates()
  
  // Get first day of week for the month
  const firstDayOfWeek = getDay(monthStart)
  const emptyDays = Array(firstDayOfWeek).fill(null)

  const hasCheckedInOnDate = (date: Date) => {
    return checkInDates.some(checkInDate => isSameDay(checkInDate, date))
  }

  const getCheckInAmountForDate = (date: Date) => {
    const checkIn = checkIns?.find(ci => isSameDay(parseISO(ci.created_at), date))
    return checkIn?.amount || 0
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const dailyReward = 50 + ((referrals?.length || 0) * 20)

  if (userLoading || checkInsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 to-white">
        <div className="text-xl text-gray-800">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white pb-20">
      {/* Header */}
      <header className="bg-indigo-600 py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-white text-2xl">
            &larr;
          </Link>
          <h1 className="text-white text-xl font-bold">Daily Check-in</h1>
          <div className="w-8"></div> {/* Spacer */}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <div className="text-2xl mb-1">💰</div>
            <div className="text-xs text-gray-600 mb-1">Total Earnings</div>
            <div className="text-lg font-bold text-indigo-600">{totalEarnings.toLocaleString()} RWF</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <div className="text-2xl mb-1">🔥</div>
            <div className="text-xs text-gray-600 mb-1">Current Streak</div>
            <div className="text-lg font-bold text-orange-600">{checkInStreak} days</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <div className="text-2xl mb-1">✅</div>
            <div className="text-xs text-gray-600 mb-1">Total Check-ins</div>
            <div className="text-lg font-bold text-green-600">{totalCheckIns}</div>
          </div>
        </div>

        {/* Daily Reward Info */}
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-xl shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90">Today&apos;s Reward</div>
              <div className="text-2xl font-bold">{dailyReward} RWF</div>
              <div className="text-xs opacity-75 mt-1">Base: 50 RWF + {referrals?.length || 0} referrals × 20 RWF</div>
            </div>
            <div className="text-4xl">🎁</div>
          </div>
        </div>

        {/* Calendar View */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-bold text-gray-800">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square"></div>
            ))}
            {daysInMonth.map(day => {
              const checkedIn = hasCheckedInOnDate(day)
              const amount = getCheckInAmountForDate(day)
              const isCurrentDay = isToday(day)
              
              return (
                <div
                  key={day.toISOString()}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs border-2 transition-all ${
                    checkedIn
                      ? 'bg-green-100 border-green-500 text-green-800 font-bold'
                      : isCurrentDay
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  <div>{format(day, 'd')}</div>
                  {checkedIn && (
                    <div className="text-[10px] text-green-600 mt-0.5">
                      +{amount} RWF
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Check-in History */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Check-in History</h2>
          {checkIns && checkIns.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {checkIns.map((checkIn) => (
                <div
                  key={checkIn.id}
                  className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                      ✓
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">
                        {format(parseISO(checkIn.created_at), 'MMMM d, yyyy')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(parseISO(checkIn.created_at), 'h:mm a')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      +{checkIn.amount.toLocaleString()} RWF
                    </div>
                    <div className="text-xs text-gray-500">Earned</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📅</div>
              <p>No check-ins yet</p>
              <p className="text-sm mt-1">Start checking in daily to earn rewards!</p>
            </div>
          )}
        </div>

        {/* Check-in Button */}
        <button
          type="button"
          onClick={() => {
            console.log('Check-in button clicked', { hasCheckedInToday, isPending: checkInMutation.isPending })
            if (!hasCheckedInToday && !checkInMutation.isPending) {
              checkInMutation.mutate()
            }
          }}
          disabled={hasCheckedInToday || checkInMutation.isPending}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {checkInMutation.isPending ? (
            'Processing...'
          ) : hasCheckedInToday ? (
            '✓ Already Checked In Today'
          ) : (
            `Check In Now - Earn ${dailyReward} RWF`
          )}
        </button>

        {checkInMutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mt-4">
            {checkInMutation.error?.message || 'Failed to check in. Please try again.'}
          </div>
        )}

        {checkInMutation.isSuccess && checkInMutation.data && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mt-4">
            ✓ Check-in successful! You earned {checkInMutation.data.reward || dailyReward} RWF
          </div>
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

