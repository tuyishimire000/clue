'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface User {
  id: string
  balance: number
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
}

// Product data - in production, this would come from a database
const PRODUCTS: Product[] = [
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

export default function ProductDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const productId = params?.id as string

  const [purchaseCount, setPurchaseCount] = useState(1)
  const [selectedCoupon, setSelectedCoupon] = useState('')
  const [selectedWallet, setSelectedWallet] = useState<'balance' | 'recharge'>('balance')
  const [showCouponDropdown, setShowCouponDropdown] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.coupon-dropdown')) {
        setShowCouponDropdown(false)
      }
    }

    if (showCouponDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCouponDropdown])

  // Find product
  const product = PRODUCTS.find(p => p.id === productId)
  const queryClient = useQueryClient()

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

  // Investment mutation
  const investMutation = useMutation({
    mutationFn: async () => {
      if (!product || !user) {
        throw new Error('Product or user data not available')
      }

      const totalAmount = product.price * purchaseCount

      // Validate balance if using balance wallet
      if (selectedWallet === 'balance' && user.balance < totalAmount) {
        throw new Error('Insufficient balance. Please recharge your wallet.')
      }

      // Validate wallet selection
      if (selectedWallet === 'recharge') {
        throw new Error('Please recharge your wallet first')
      }

      const response = await fetch('/api/invest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          price: product.price,
          purchaseCount: purchaseCount,
          dailyIncome: product.daily_income,
          incomePeriod: product.income_period,
          walletType: selectedWallet,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create investment')
      }

      return data
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh user balance and investments
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['investments'] })
      
      // Show success message and redirect
      const successMessage = `✅ Investment Successful!\n\n` +
        `Product: ${data.investment.productName}\n` +
        `Purchase Count: ${data.investment.purchaseCount}\n` +
        `Amount Invested: ${data.investment.amount.toLocaleString()} RWF\n` +
        `Daily Income: ${(data.investment.dailyIncome * data.investment.purchaseCount).toLocaleString()} RWF\n` +
        `Total Income: ${data.investment.totalIncome.toLocaleString()} RWF\n` +
        `New Balance: ${data.newBalance.toLocaleString()} RWF\n\n` +
        `Your investment is now active!`
      
      alert(successMessage)
      router.push('/invest')
    },
    onError: (error: any) => {
      console.error('Investment error:', error)
      alert(error.message || 'Failed to create investment. Please try again.')
    },
  })

  // Check if it's currently a weekend in Kigali timezone
  // This must be called before any early returns (Rules of Hooks)
  const isWeekend = useMemo(() => {
    const now = new Date()
    // Get current time in Kigali timezone
    const kigaliTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Kigali' }))
    const dayOfWeek = kigaliTime.getDay()
    // 0 = Sunday, 6 = Saturday
    return dayOfWeek === 0 || dayOfWeek === 6
  }, [])

  useEffect(() => {
    if (!product) {
      router.push('/invest')
    }
  }, [product, router])

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-800">Loading...</div>
      </div>
    )
  }

  if (!product || !user) {
    return null
  }

  const isVaccineProduct = product.category === 'Super Weekend'
  const isMrnaProduct = product.category === 'Vaccine 1' && product.id?.startsWith('mrna')
  const isBiontechProduct = product.category === 'Vaccine 2' && product.id?.startsWith('biontech')
  const productLabel = isVaccineProduct 
    ? product.name.replace('【', '').replace('】', '').toUpperCase()
    : isMrnaProduct
    ? product.name.replace('【', '').replace('】', '').toUpperCase()
    : isBiontechProduct
    ? product.name.replace('【', '').replace('】', '').toUpperCase()
    : product.name

  // Check if Super Weekend product should be locked (locked on weekdays)
  const isLocked = isVaccineProduct && !isWeekend

  // Calculate values
  const dailyRate = ((product.daily_income / product.price) * 100).toFixed(0)
  const totalIncome = product.daily_income * product.income_period
  const profitPlusPrincipal = product.price + totalIncome
  const totalPrice = product.price * purchaseCount
  const totalDailyIncome = product.daily_income * purchaseCount
  const totalTotalIncome = totalIncome * purchaseCount
  const totalProfitPlusPrincipal = profitPlusPrincipal * purchaseCount

  const handleJoin = () => {
    if (!product || !user) {
      alert('Loading... Please wait.')
      return
    }

    // Check if locked (Super Weekend products on weekdays)
    if (isLocked) {
      alert('This product is only available on weekends (Saturday and Sunday). Please try again on the weekend.')
      return
    }

    const totalAmount = product.price * purchaseCount

    // Validate balance if using balance wallet
    if (selectedWallet === 'balance' && user.balance < totalAmount) {
      alert(`Insufficient balance. You need ${totalAmount.toLocaleString()} RWF but only have ${user.balance.toLocaleString()} RWF. Please recharge your wallet.`)
      return
    }

    // Confirm investment
    const confirmMessage = `Confirm investment?\n\nProduct: ${product.name}\nPurchase Count: ${purchaseCount}\nTotal Amount: ${totalAmount.toLocaleString()} RWF\nDaily Income: ${(product.daily_income * purchaseCount).toLocaleString()} RWF\nTotal Income: ${(product.daily_income * product.income_period * purchaseCount).toLocaleString()} RWF`
    
    if (window.confirm(confirmMessage)) {
      investMutation.mutate()
    }
  }

  const isProcessing = investMutation.isPending
  const totalAmount = product ? product.price * purchaseCount : 0
  const hasInsufficientBalance = user && selectedWallet === 'balance' && user.balance < totalAmount

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <header className="bg-white py-4 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            <Link href="/invest" className="text-gray-600 hover:text-gray-800 mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-800 flex-1 text-center -ml-10">
              {product.name}
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-4 relative">
        {/* Lock Overlay - Only for Super Weekend products when locked */}
        {isLocked && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-xl z-40 flex items-center justify-center p-4">
            <div className="bg-white/40 backdrop-blur-2xl rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-white/30">
              <div className="mb-6 flex justify-center">
                <div className="bg-white/60 backdrop-blur-md rounded-full p-6 border-2 border-white/50 shadow-lg">
                  <svg
                    className="w-20 h-20 text-gray-800"
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
              <h2 className="text-3xl font-bold text-gray-900 mb-4 drop-shadow-sm">Wait Weekend</h2>
              <p className="text-lg text-gray-800 mb-6 font-medium drop-shadow-sm">
                This product is only available on Saturdays and Sundays
              </p>
              <Link
                href="/invest"
                className="inline-block bg-indigo-600/90 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg"
              >
                Back to Products
              </Link>
            </div>
          </div>
        )}
        {/* Product Banner Image */}
        <div className="relative w-full h-56 sm:h-64 bg-gradient-to-br from-green-200 via-green-300 to-green-400 rounded-xl overflow-hidden shadow-lg">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white relative z-10">
              <div className="text-7xl mb-2">💉</div>
            </div>
          </div>
          {/* Version Badge */}
          {product.version && (
            <div className="absolute top-3 left-3 bg-red-600 text-white text-xl font-bold px-4 py-2 rounded-lg shadow-xl z-20">
              {product.version}
            </div>
          )}
          {/* Product Label */}
          {(isVaccineProduct || isMrnaProduct || isBiontechProduct) && (
            <div className="absolute top-3 right-3 bg-yellow-400 text-gray-800 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg shadow-lg z-20">
              {productLabel}
            </div>
          )}
        </div>

        {/* Product Details Grid */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <div className="text-xs text-gray-600 mb-1">Product Price:</div>
              <div className="text-base sm:text-lg font-bold text-green-600">{product.price.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Daily rate:</div>
              <div className="text-base sm:text-lg font-bold text-green-600">{dailyRate}%</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Daily income:</div>
              <div className="text-base sm:text-lg font-bold text-green-600">{product.daily_income.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Income period:</div>
              <div className="text-base sm:text-lg font-bold text-green-600">{product.income_period}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Total income:</div>
              <div className="text-base sm:text-lg font-bold text-green-600">{totalIncome.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Profit + Principal:</div>
              <div className="text-base sm:text-lg font-bold text-green-600">{profitPlusPrincipal.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Number of Purchases */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 font-medium">Number of purchases:</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPurchaseCount(Math.max(1, purchaseCount - 1))}
                className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 active:bg-gray-400 flex items-center justify-center transition-colors font-bold text-gray-700"
              >
                −
              </button>
              <span className="text-base sm:text-lg font-bold min-w-[60px] text-center">
                <span className="text-red-600">{purchaseCount}</span> <span className="text-gray-700">times</span>
              </span>
              <button
                onClick={() => setPurchaseCount(purchaseCount + 1)}
                className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 active:bg-gray-400 flex items-center justify-center transition-colors font-bold text-gray-700"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Coupon Section */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Coupon</label>
          <div className="relative coupon-dropdown">
            <button
              onClick={() => setShowCouponDropdown(!showCouponDropdown)}
              className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg text-left hover:border-gray-400 bg-white"
            >
              <span className={selectedCoupon ? 'text-gray-800' : 'text-gray-400'}>
                {selectedCoupon || 'select coupon'}
              </span>
              <svg 
                className={`w-5 h-5 text-gray-400 transition-transform ${showCouponDropdown ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showCouponDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                <button
                  onClick={() => {
                    setSelectedCoupon('')
                    setShowCouponDropdown(false)
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm text-gray-700"
                >
                  No coupon available
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Wallet Selection */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">Select wallet</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedWallet('recharge')}
              className={`py-3 px-4 rounded-lg border-2 transition-colors ${
                selectedWallet === 'recharge'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              Recharge
            </button>
            <button
              onClick={() => setSelectedWallet('balance')}
              className={`py-3 px-4 rounded-lg border-2 transition-colors ${
                selectedWallet === 'balance'
                  ? 'bg-yellow-400 border-yellow-500 text-white font-semibold'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              Balance
            </button>
          </div>
          {selectedWallet === 'balance' && (
            <div className="mt-3 text-sm text-gray-600">
              Available Balance: <span className="font-bold text-gray-800">{user.balance.toLocaleString()} RWF</span>
            </div>
          )}
        </div>

        {/* Product Description */}
        {isVaccineProduct && (
          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="text-lg font-bold text-gray-800 mb-3">{product.name}</h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              The {'{Super Weekend}'} series is only available for purchase on Saturdays and Sundays. You can receive income daily and withdraw money at any time. After the contract period ends, your investment funds will be returned to you, and you can receive the principal plus profit.
            </p>
            <p className="text-sm text-red-600 font-medium">
              (Note: This product can only be purchased by members who have reached {product.version} level.)
            </p>
          </div>
        )}
        
        {/* mRNA Product Description */}
        {isMrnaProduct && (
          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="text-lg font-bold text-gray-800 mb-3">{product.name}</h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              You can receive income daily and withdraw money at any time. After the contract period ends, your investment funds will be returned to you, and you can receive the principal plus profit.
            </p>
            <p className="text-sm text-red-600 font-medium">
              (Note: This product can only be purchased by members who have reached {product.version} level.)
            </p>
          </div>
        )}
        
        {/* BioNTech Product Description */}
        {isBiontechProduct && (
          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="text-lg font-bold text-gray-800 mb-3">{product.name}</h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              You can receive income daily and withdraw money at any time. After the contract period ends, your investment funds will be returned to you, and you can receive the principal plus profit.
            </p>
            <p className="text-sm text-red-600 font-medium">
              (Note: This product can only be purchased by members who have reached {product.version} level.)
            </p>
          </div>
        )}

        {/* Product Information */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Product Information</h2>
          <div className="space-y-2 text-sm text-gray-700">
            <div><strong>[{productLabel}]</strong></div>
            <div>Price: {product.price.toLocaleString()} RWF</div>
            <div>Contract Length: {product.income_period} Days</div>
            <div>Daily Income: {product.daily_income.toLocaleString()} RWF</div>
            <div>Total Income: {totalIncome.toLocaleString()} RWF</div>
            <div>Principal + Total Income: {product.price.toLocaleString()} RWF + {totalIncome.toLocaleString()} RWF = {profitPlusPrincipal.toLocaleString()} RWF</div>
          </div>
        </div>

        {/* Bonus Section */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Bonus</h2>
          <p className="text-sm text-gray-700">
            Purchase {product.name} and receive a bonus of {product.daily_income.toLocaleString()} RWF.
          </p>
        </div>

        {/* Join Now Button */}
        <button
          onClick={handleJoin}
          disabled={isLocked || isProcessing || hasInsufficientBalance || selectedWallet === 'recharge'}
          className={`w-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
            isLocked || isProcessing || hasInsufficientBalance || selectedWallet === 'recharge'
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:shadow-xl active:scale-98'
          }`}
        >
          {isLocked ? 'Available Only on Weekends' : isProcessing ? 'Processing...' : hasInsufficientBalance ? 'Insufficient Balance' : selectedWallet === 'recharge' ? 'Please Use Balance Wallet' : 'Join Now'}
        </button>

        {/* Balance Warning */}
        {selectedWallet === 'balance' && user && totalAmount > user.balance && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            <p className="font-semibold mb-1">Insufficient Balance</p>
            <p>You need {totalAmount.toLocaleString()} RWF but only have {user.balance.toLocaleString()} RWF.</p>
            <Link href="/recharge" className="text-yellow-900 font-semibold underline mt-2 inline-block">
              Recharge now →
            </Link>
          </div>
        )}

        {/* Recharge Wallet Note */}
        {selectedWallet === 'recharge' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-semibold mb-1">Recharge Wallet Selected</p>
            <p>Please recharge your wallet first to make investments.</p>
            <Link href="/recharge" className="text-blue-900 font-semibold underline mt-2 inline-block">
              Go to Recharge →
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

