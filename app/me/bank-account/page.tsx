'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'

interface BankAccount {
  payment_method: string | null
  account_name: string | null
  account_phone_number: string | null
}

export default function BankAccountPage() {
  const router = useRouter()
  const supabase = createClient()
  const queryClient = useQueryClient()
  
  const [paymentMethod, setPaymentMethod] = useState<'MTN' | 'Airtel' | ''>('')
  const [accountName, setAccountName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Fetch bank account details
  const { data: bankAccount, isLoading: bankAccountLoading, refetch } = useQuery({
    queryKey: ['bank-account'],
    queryFn: async () => {
      const response = await fetch('/api/bank-account')
      if (!response.ok) {
        throw new Error('Failed to fetch bank account details')
      }
      const result = await response.json()
      return result as BankAccount
    },
  })

  // Initialize form when data is loaded
  useEffect(() => {
    if (bankAccount) {
      const hasAccount = !!bankAccount?.payment_method
      if (!isEditing && hasAccount) {
        // Show saved account details (not editing)
        setPaymentMethod((bankAccount?.payment_method as 'MTN' | 'Airtel') || '')
        setAccountName(bankAccount?.account_name || '')
        setPhoneNumber(bankAccount?.account_phone_number || '')
      } else if (isEditing && hasAccount) {
        // Editing existing account - populate form
        setPaymentMethod((bankAccount?.payment_method as 'MTN' | 'Airtel') || '')
        setAccountName(bankAccount?.account_name || '')
        setPhoneNumber(bankAccount?.account_phone_number || '')
      } else if (!hasAccount) {
        // No account yet - show empty form
        setPaymentMethod('')
        setAccountName('')
        setPhoneNumber('')
        setIsEditing(false)
      }
    }
  }, [bankAccount, isEditing])

  // Format phone number for display
  const formatPhoneNumber = (phone: string | null) => {
    if (!phone) return ''
    // Remove non-digits
    const digits = phone.replace(/\D/g, '')
    // Format as +250XXXXXXXXX
    if (digits.length === 9) {
      return `+250${digits}`
    }
    return phone
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validation
    if (!paymentMethod) {
      setError('Please select a payment method')
      return
    }

    if (!accountName.trim()) {
      setError('Please enter the registered name')
      return
    }

    if (!phoneNumber.trim()) {
      setError('Please enter the phone number')
      return
    }

    // Validate phone number
    const phoneDigits = phoneNumber.replace(/\D/g, '')
    if (phoneDigits.length < 9 || phoneDigits.length > 10) {
      setError('Phone number must be 9-10 digits')
      return
    }

    // If editing existing account, password is required
    if (isEditing && !password) {
      setError('Password is required to update bank account details')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/bank-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_method: paymentMethod,
          account_name: accountName.trim(),
          account_phone_number: phoneNumber.trim(),
          password: isEditing ? password : undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save bank account details')
      }

      setSuccess(true)
      setPassword('')
      
      // Refetch bank account details
      await refetch()
      await queryClient.invalidateQueries({ queryKey: ['bank-account'] })

      // Exit editing mode after save (will show saved details)
      setTimeout(() => {
        setIsEditing(false)
        setSuccess(false)
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to save bank account details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setError(null)
    setSuccess(false)
    setPassword('')
  }

  const handleCancel = () => {
    if (bankAccount) {
      setPaymentMethod((bankAccount?.payment_method as 'MTN' | 'Airtel') || '')
      setAccountName(bankAccount?.account_name || '')
      setPhoneNumber(bankAccount?.account_phone_number || '')
    }
    setIsEditing(false)
    setPassword('')
    setError(null)
  }

  if (bankAccountLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 to-white">
        <div className="text-xl text-gray-800">Loading...</div>
      </div>
    )
  }

  const hasSavedAccount = bankAccount?.payment_method !== null && bankAccount?.payment_method !== undefined

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800 mr-4"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-800 flex-1 text-center">My Bank Account</h1>
            <div className="w-6"></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-md">
        {/* Saved Account Details Display */}
        {hasSavedAccount && !isEditing && (
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Saved Account Details</h2>
              <button
                onClick={handleEdit}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold"
              >
                Edit
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Payment Method</div>
                <div className="text-base font-semibold text-gray-800">
                  {bankAccount?.payment_method === 'MTN' ? 'MTN Mobile Money' : 'Airtel Money'}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">Account Name</div>
                <div className="text-base font-semibold text-gray-800">
                  {bankAccount?.account_name || ''}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">Phone Number</div>
                <div className="text-base font-semibold text-gray-800">
                  {formatPhoneNumber(bankAccount?.account_phone_number || null)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bank Account Form */}
        {(isEditing || !hasSavedAccount) && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6 space-y-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {hasSavedAccount ? 'Update Bank Account' : 'Add Bank Account'}
            </h2>

            {/* Payment Method Selection */}
            <div>
              <label className="block text-base font-bold text-gray-900 mb-3">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('MTN')
                    setError(null)
                  }}
                  className={`p-4 border-2 rounded-lg font-semibold transition-all ${
                    paymentMethod === 'MTN'
                      ? 'border-yellow-400 bg-yellow-50 text-gray-800'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="text-lg mb-1">MTN</div>
                  <div className="text-xs">Mobile Money</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('Airtel')
                    setError(null)
                  }}
                  className={`p-4 border-2 rounded-lg font-semibold transition-all ${
                    paymentMethod === 'Airtel'
                      ? 'border-red-400 bg-red-50 text-gray-800'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="text-lg mb-1">Airtel</div>
                  <div className="text-xs">Money</div>
                </button>
              </div>
            </div>

            {/* Account Name */}
            <div>
              <label className="block text-base font-bold text-gray-900 mb-2">
                Registered Name
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => {
                  setAccountName(e.target.value)
                  setError(null)
                }}
                placeholder="Enter the name registered with your payment account"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 placeholder-gray-400 bg-white"
                disabled={loading}
                required
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-base font-bold text-gray-900 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value.replace(/\D/g, ''))
                  setError(null)
                }}
                placeholder="Enter your payment account phone number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 placeholder-gray-400 bg-white"
                disabled={loading}
                maxLength={10}
                required
              />
              <p className="mt-1 text-xs text-gray-500">Enter 9-10 digits (e.g., 724128516)</p>
            </div>

            {/* Password (required when editing) */}
            {isEditing && (
              <div>
                <label className="block text-base font-bold text-gray-900 mb-2">
                  Withdrawal Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError(null)
                  }}
                  placeholder="Enter your withdrawal password to save changes"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 placeholder-gray-400 bg-white"
                  disabled={loading}
                  required
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                Bank account details saved successfully!
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={loading || !paymentMethod || !accountName.trim() || !phoneNumber.trim()}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-3 rounded-lg font-bold text-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : hasSavedAccount ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-indigo-100 shadow-2xl z-50">
        <nav className="container mx-auto px-4">
          <div className="grid grid-cols-4 gap-1 py-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex flex-col items-center justify-center py-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
            >
              <div className="text-3xl mb-1">🏠</div>
              <span className="text-xs font-semibold">Home</span>
            </button>
            <button
              onClick={() => router.push('/invest')}
              className="flex flex-col items-center justify-center py-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
            >
              <div className="text-3xl mb-1">💼</div>
              <span className="text-xs font-semibold">Invest</span>
            </button>
            <button
              onClick={() => router.push('/team')}
              className="flex flex-col items-center justify-center py-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
            >
              <div className="text-3xl mb-1">👥</div>
              <span className="text-xs font-semibold">Team</span>
            </button>
            <button
              onClick={() => router.push('/me')}
              className="flex flex-col items-center justify-center py-2 text-indigo-600 rounded-lg"
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

