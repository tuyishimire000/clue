'use client'

import { useState } from 'react'
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
  amount: number
  created_at: string
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
  image_url?: string
}

export default function InvestPage() {
  const router = useRouter()
  const supabase = createClient()
  const [selectedCategory, setSelectedCategory] = useState('Fertilizer 1')

  // Mock products data - in production, this would come from a database
  const products: Product[] = [
    {
      id: '1',
      name: 'MDCP',
      price: 27000,
      daily_income: 1134,
      income_period: 45,
      status: 'Hot',
      progress: 75,
      category: 'Fertilizer 1',
    },
    {
      id: '2',
      name: 'PMB',
      price: 55000,
      daily_income: 2420,
      income_period: 46,
      status: 'Hot',
      progress: 72,
      category: 'Fertilizer 1',
    },
    {
      id: '3',
      name: 'DCP',
      price: 35000,
      daily_income: 1500,
      income_period: 40,
      status: 'Hot',
      progress: 68,
      category: 'Fertilizer 1',
    },
    {
      id: '4',
      name: 'TSP',
      price: 45000,
      daily_income: 2000,
      income_period: 42,
      status: 'Hot',
      progress: 80,
      category: 'Fertilizer 2',
    },
    {
      id: '5',
      name: 'Weekend Special',
      price: 100000,
      daily_income: 5000,
      income_period: 30,
      status: 'Hot',
      progress: 90,
      category: 'Super Weekend',
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

  // Fetch user investments (mock for now)
  const { data: investments } = useQuery({
    queryKey: ['investments', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      // In production, fetch from investments table
      return [] as Investment[]
    },
    enabled: !!user?.id,
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

  const filteredProducts = products.filter(p => p.category === selectedCategory)
  const totalInvestment = investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0
  const totalReturn = 0 // Calculate from investments
  const todayEarnings = 0 // Calculate from investments

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
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center mb-4">
            <div className="text-sm text-gray-600 mb-2">Total investment amount</div>
            <div className="text-4xl font-bold text-indigo-600">{totalInvestment.toLocaleString()} RWF</div>
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
            <div className="relative h-full flex items-center justify-around px-4">
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">Total return</div>
                <div className="text-lg font-bold text-indigo-700">{totalReturn.toLocaleString()} RWF</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">Today Earnings</div>
                <div className="text-lg font-bold text-indigo-700">{todayEarnings.toLocaleString()} RWF</div>
              </div>
            </div>
          </div>
        </div>

        {/* My Products Section */}
        <div className="bg-indigo-600 rounded-xl p-4 flex items-center justify-between">
          <div className="text-white font-semibold">My products</div>
          <Link href="/invest/my-products" className="text-indigo-100 text-sm">
            hold pieces {investments?.length || 0} &gt;
          </Link>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['Super Weekend', 'Fertilizer 2', 'Fertilizer 1'].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Products List */}
        <div className="space-y-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
              {/* Product Header */}
              <div className="p-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">{product.name}</h3>
                <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                  State: {product.status}
                </span>
              </div>

              {/* Product Image */}
              <div className="relative h-48 bg-gradient-to-br from-indigo-200 to-indigo-400">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-6xl mb-2">🌾</div>
                    <div className="text-sm font-semibold bg-black/30 px-3 py-1 rounded">
                      {product.name} PRODUCT
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Product price</div>
                    <div className="text-lg font-bold text-gray-800">
                      {product.price.toLocaleString()} RWF
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">Daily income</div>
                    <div className="text-lg font-bold text-indigo-600">
                      {product.daily_income.toLocaleString()} RWF
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-1">Income period</div>
                  <div className="text-lg font-bold text-gray-800">{product.income_period} days</div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{product.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${product.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Invest Button */}
                <button
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md"
                  onClick={() => {
                    // Handle investment
                    alert(`Invest in ${product.name} - Coming soon!`)
                  }}
                >
                  Invest Now
                </button>
              </div>
            </div>
          ))}
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
              href="/dashboard#referrals"
              className="flex flex-col items-center justify-center py-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
            >
              <div className="text-3xl mb-1">👥</div>
              <span className="text-xs font-semibold">Team</span>
            </Link>
            <button
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

