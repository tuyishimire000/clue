'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'

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

interface Product {
  id: string
  name: string
  price: number
  daily_income: number
  income_period: number
  status: string
  progress: number
  category: string
  version?: string
  image_url?: string
}

export default function InvestPage() {
  const router = useRouter()
  const supabase = createClient()
  const [selectedCategory, setSelectedCategory] = useState('Super Weekend')

  // Mock products data - in production, this would come from a database
  const products: Product[] = [
    // Vaccine 1 - mRNA Products (ordered from cheapest to most expensive)
    {
      id: 'mrna-1',
      name: '【mRNA-1】',
      price: 27000,
      daily_income: 1134,
      income_period: 45,
      status: 'Hot',
      progress: 75,
      category: 'Vaccine 1',
      version: 'V1',
    },
    {
      id: 'mrna-3',
      name: '【mRNA-3】',
      price: 35000,
      daily_income: 1500,
      income_period: 40,
      status: 'Hot',
      progress: 68,
      category: 'Vaccine 1',
      version: 'V1',
    },
    {
      id: 'mrna-4',
      name: '【mRNA-4】',
      price: 45000,
      daily_income: 2000,
      income_period: 42,
      status: 'Hot',
      progress: 80,
      category: 'Vaccine 1',
      version: 'V1',
    },
    {
      id: 'mrna-2',
      name: '【mRNA-2】',
      price: 55000,
      daily_income: 2420,
      income_period: 46,
      status: 'Hot',
      progress: 72,
      category: 'Vaccine 1',
      version: 'V1',
    },
    {
      id: 'mrna-5',
      name: '【mRNA-5】',
      price: 82000,
      daily_income: 2460,
      income_period: 30,
      status: 'Hot',
      progress: 65,
      category: 'Vaccine 1',
      version: 'V1',
    },
    // Vaccine 2 - BioNTech Products (ordered from cheapest to most expensive)
    {
      id: 'biontech-1',
      name: '【BioNTech-1】',
      price: 6000,
      daily_income: 360,
      income_period: 30,
      status: 'Hot',
      progress: 32,
      category: 'Vaccine 2',
      version: 'V1',
    },
    {
      id: 'biontech-2',
      name: '【BioNTech-2】',
      price: 20000,
      daily_income: 840,
      income_period: 45,
      status: 'Hot',
      progress: 29,
      category: 'Vaccine 2',
      version: 'V1',
    },
    {
      id: 'biontech-3',
      name: '【BioNTech-3】',
      price: 40000,
      daily_income: 1760,
      income_period: 46,
      status: 'Hot',
      progress: 30,
      category: 'Vaccine 2',
      version: 'V1',
    },
    {
      id: 'biontech-4',
      name: '【BioNTech-4】',
      price: 80000,
      daily_income: 3680,
      income_period: 47,
      status: 'Hot',
      progress: 30,
      category: 'Vaccine 2',
      version: 'V1',
    },
    {
      id: 'biontech-5',
      name: '【BioNTech-5】',
      price: 150000,
      daily_income: 7050,
      income_period: 48,
      status: 'Hot',
      progress: 27,
      category: 'Vaccine 2',
      version: 'V1',
    },
    // Super Weekend - Vaccine Products
    {
      id: 'vaccine-a',
      name: '【Vaccine-A】',
      price: 3000,
      daily_income: 300,
      income_period: 2,
      status: 'Hot',
      progress: 57,
      category: 'Super Weekend',
      version: 'V1',
    },
    {
      id: 'vaccine-b',
      name: '【Vaccine-B】',
      price: 13000,
      daily_income: 364,
      income_period: 7,
      status: 'Hot',
      progress: 48,
      category: 'Super Weekend',
      version: 'V1',
    },
    {
      id: 'vaccine-c',
      name: '【Vaccine-C】',
      price: 36000,
      daily_income: 1044,
      income_period: 15,
      status: 'Hot',
      progress: 50,
      category: 'Super Weekend',
      version: 'V2',
    },
    {
      id: 'vaccine-d',
      name: '【Vaccine-D】',
      price: 82000,
      daily_income: 2460,
      income_period: 30,
      status: 'Hot',
      progress: 45,
      category: 'Super Weekend',
      version: 'V2',
    },
    {
      id: 'vaccine-e',
      name: '【Vaccine-E】',
      price: 150000,
      daily_income: 4500,
      income_period: 45,
      status: 'Hot',
      progress: 42,
      category: 'Super Weekend',
      version: 'V3',
    },
    {
      id: 'vaccine-f',
      name: '【Vaccine-F】',
      price: 250000,
      daily_income: 7500,
      income_period: 60,
      status: 'Hot',
      progress: 38,
      category: 'Super Weekend',
      version: 'V3',
    },
    {
      id: 'vaccine-g',
      name: '【Vaccine-G】',
      price: 400000,
      daily_income: 12000,
      income_period: 90,
      status: 'Hot',
      progress: 35,
      category: 'Super Weekend',
      version: 'V4',
    },
  ]

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

  // Check if it's currently a weekend in Kigali timezone (Africa/Kigali)
  // This must be called before any early returns (Rules of Hooks)
  const isWeekend = useMemo(() => {
    const now = new Date()
    // Get current time in Kigali timezone
    const kigaliTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Kigali' }))
    const dayOfWeek = kigaliTime.getDay()
    // 0 = Sunday, 6 = Saturday
    return dayOfWeek === 0 || dayOfWeek === 6
  }, [])

  // Fetch user investments
  const { data: investments, isLoading: investmentsLoading } = useQuery({
    queryKey: ['investments', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching investments:', error)
        return []
      }
      return (data || []) as Investment[]
    },
    enabled: !!user?.id,
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

  const filteredProducts = products.filter(p => p.category === selectedCategory)

  // Check if Super Weekend products should be locked (locked on weekdays)
  const isSuperWeekendLocked = !isWeekend
  
  // Calculate totals from investments
  const totalInvestment = investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0
  
  // Calculate total return (earned so far based on days passed)
  const totalReturn = investments?.reduce((sum, inv) => {
    const createdDate = new Date(inv.created_at)
    const now = new Date()
    const daysPassed = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysEarned = Math.min(daysPassed, inv.income_period)
    const earnedSoFar = inv.daily_income * daysEarned * inv.purchase_count
    return sum + earnedSoFar
  }, 0) || 0
  
  // Calculate today's earnings (only for active investments that haven't completed their period)
  const todayEarnings = investments?.reduce((sum, inv) => {
    const createdDate = new Date(inv.created_at)
    const now = new Date()
    const daysPassed = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
    // Only count if investment is still within income period
    if (daysPassed < inv.income_period) {
      return sum + (inv.daily_income * inv.purchase_count)
    }
    return sum
  }, 0) || 0
  
  // Count total products (unique product IDs or total purchase count)
  const holdPieces = investments?.reduce((sum, inv) => sum + inv.purchase_count, 0) || 0

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
            <h1 className="text-xl font-bold text-white">Products</h1>
            <div className="w-6"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Investment Summary Card */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
          <div className="text-center mb-4">
            <div className="text-xs sm:text-sm text-gray-600 mb-2">Total investment amount</div>
            <div className="text-2xl sm:text-4xl font-bold text-indigo-600 break-words">
              {totalInvestment.toLocaleString()} RWF
            </div>
          </div>
          
          {/* Wavy graphic section */}
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
                <div className="text-xs text-gray-600 mb-1">Total return</div>
                <div className="text-sm sm:text-lg font-bold text-indigo-700 break-words">
                  {totalReturn.toLocaleString()} RWF
                </div>
              </div>
              <div className="text-center flex-1">
                <div className="text-xs text-gray-600 mb-1">Today Earnings</div>
                <div className="text-sm sm:text-lg font-bold text-indigo-700 break-words">
                  {todayEarnings.toLocaleString()} RWF
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* My Products Section */}
        <Link href="/invest/my-products" className="block bg-indigo-600 rounded-xl p-4 flex items-center justify-between hover:bg-indigo-700 transition-colors cursor-pointer">
          <div className="text-white font-semibold text-sm sm:text-base">My products</div>
          <div className="text-indigo-100 text-xs sm:text-sm whitespace-nowrap flex items-center gap-1">
            hold pieces {holdPieces} &gt;
          </div>
        </Link>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {['Super Weekend', 'Vaccine 2', 'Vaccine 1'].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                selectedCategory === category
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Products List */}
        <div className="space-y-4">
          {filteredProducts.map((product) => {
            const isVaccineProduct = product.category === 'Super Weekend'
            const isMrnaProduct = product.category === 'Vaccine 1' && product.id?.startsWith('mrna')
            const isBiontechProduct = product.category === 'Vaccine 2' && product.id?.startsWith('biontech')
            const productLabel = isVaccineProduct 
              ? product.name.replace('【', '').replace('】', '').toUpperCase()
              : isMrnaProduct
              ? product.name.replace('【', '').replace('】', '').toUpperCase()
              : isBiontechProduct
              ? product.name.replace('【', '').replace('】', '').toUpperCase()
              : `${product.name} PRODUCT`
            
            // Check if this product should be locked (only Super Weekend products are locked on weekdays)
            const isLocked = isVaccineProduct && isSuperWeekendLocked
            
            return (
              <div key={product.id} className="relative bg-white rounded-2xl shadow-md overflow-hidden">
                {/* Lock Overlay - Only for Super Weekend products when locked */}
                {isLocked && (
                  <div className="absolute inset-0 bg-white/30 backdrop-blur-xl z-50 rounded-2xl flex items-center justify-center pointer-events-none border border-white/20 shadow-lg">
                    <div className="text-center p-8 max-w-xs bg-white/40 backdrop-blur-lg rounded-2xl border border-white/30 shadow-xl">
                      <div className="mb-6 flex justify-center">
                        <div className="bg-white/60 backdrop-blur-md rounded-full p-5 border-2 border-white/50 shadow-lg">
                          <svg
                            className="w-16 h-16 text-gray-800"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-3 drop-shadow-sm">Wait Weekend</div>
                      <div className="text-base text-gray-800 leading-relaxed font-medium drop-shadow-sm">
                        This product is only available<br />on Saturdays and Sundays
                      </div>
                    </div>
                  </div>
                )}

                {/* Product Header */}
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3 break-words">
                    {product.name}
                  </h3>
                </div>

                {/* Product Image and Details Layout */}
                <div className="flex flex-col sm:flex-row gap-4 p-4">
                  {/* Product Image */}
                  <div className="relative w-full sm:w-32 h-32 flex-shrink-0 bg-gradient-to-br from-green-200 via-green-300 to-green-400 rounded-xl overflow-hidden shadow-md mx-auto sm:mx-0">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white relative z-10">
                        <div className="text-4xl mb-1">💉</div>
                      </div>
                    </div>
                    {/* Version Badge */}
                    {product.version && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg z-20">
                        {product.version}
                      </div>
                    )}
                    {/* Product Label */}
                    {(isVaccineProduct || isMrnaProduct || isBiontechProduct) && (
                      <div className="absolute top-2 left-2 bg-yellow-400 text-gray-800 text-xs font-bold px-2 py-0.5 rounded shadow-md z-20">
                        {productLabel}
                      </div>
                    )}
                  </div>

                  {/* Product Details - Responsive Layout */}
                  <div className="flex-1 w-full">
                    {/* Mobile: Stacked layout */}
                    <div className="block sm:hidden space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Product price</span>
                        <span className="text-sm font-bold text-gray-800">
                          {product.price.toLocaleString()} RWF
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Daily income</span>
                        <span className="text-sm font-bold text-gray-800">
                          {product.daily_income.toLocaleString()} RWF
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Income period</span>
                        <span className="text-sm font-bold text-gray-800">
                          {product.income_period} days
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="text-xs text-gray-600">Status</span>
                        <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                          State: {product.status}
                        </span>
                      </div>
                    </div>

                    {/* Desktop: Three Column Layout */}
                    <div className="hidden sm:grid grid-cols-3 gap-4">
                      {/* Column 1: Labels */}
                      <div className="space-y-3">
                        <div className="text-xs text-gray-600">Product price</div>
                        <div className="text-xs text-gray-600">Daily income</div>
                        <div className="text-xs text-gray-600">Income period</div>
                      </div>

                      {/* Column 2: Empty spacer */}
                      <div></div>

                      {/* Column 3: Status and Values */}
                      <div className="space-y-3">
                        <div>
                          <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                            State: {product.status}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-gray-800">
                          {product.price.toLocaleString()} RWF
                        </div>
                        <div className="text-sm font-bold text-gray-800">
                          {product.daily_income.toLocaleString()} RWF
                        </div>
                        <div className="text-sm font-bold text-gray-800">
                          {product.income_period}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {(isVaccineProduct || isMrnaProduct || isBiontechProduct) && (
                  <div className="px-4 pb-4">
                    <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-visible">
                      <div
                        className="bg-green-500 h-3 rounded-full transition-all"
                        style={{ width: `${product.progress}%` }}
                      ></div>
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md -mr-1 sm:-mr-2 whitespace-nowrap">
                        {product.progress}%
                      </div>
                    </div>
                  </div>
                )}

                {/* Invest Button */}
                <div className="px-4 pb-4 relative">
                  {isLocked ? (
                    <div className="w-full bg-gray-400 text-white py-3 rounded-lg font-semibold shadow-md text-center cursor-not-allowed opacity-75">
                      Invest Now
                    </div>
                  ) : (
                    <Link
                      href={`/invest/${product.id}`}
                      className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md block text-center"
                    >
                      Invest Now
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
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
              className="flex flex-col items-center justify-center py-2 text-indigo-600 rounded-lg"
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

