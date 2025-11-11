'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import Link from 'next/link'

export default function AdminInvestmentsPage() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [search, setSearch] = useState('')

  // Fetch investments
  const { data: investmentsData, isLoading } = useQuery({
    queryKey: ['admin-investments', statusFilter, search],
    queryFn: async () => {
      const url = new URL('/api/admin/investments', window.location.origin)
      if (statusFilter !== 'all') {
        url.searchParams.set('status', statusFilter)
      }
      if (search) {
        url.searchParams.set('search', search)
      }
      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error('Failed to fetch investments')
      }
      const result = await response.json()
      return result.investments || []
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-800">Loading investments...</div>
      </div>
    )
  }

  const investments = investmentsData || []

  // Calculate totals
  const totalInvestments = investments.reduce((sum: number, inv: any) => sum + inv.amount, 0)
  const activeInvestments = investments.filter((inv: any) => inv.status === 'active')
  const completedInvestments = investments.filter((inv: any) => inv.status === 'completed')
  const totalActiveAmount = activeInvestments.reduce((sum: number, inv: any) => sum + inv.amount, 0)
  const totalCompletedAmount = completedInvestments.reduce((sum: number, inv: any) => sum + inv.amount, 0)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-indigo-600 text-white py-4 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="text-white hover:text-indigo-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold">Investments Management</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">Total Investments</div>
            <div className="text-2xl font-bold text-indigo-600">
              {totalInvestments.toLocaleString()} RWF
            </div>
            <div className="text-xs text-gray-500 mt-1">{investments.length} investments</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">Active Investments</div>
            <div className="text-2xl font-bold text-green-600">
              {totalActiveAmount.toLocaleString()} RWF
            </div>
            <div className="text-xs text-gray-500 mt-1">{activeInvestments.length} active</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">Completed</div>
            <div className="text-2xl font-bold text-blue-600">
              {totalCompletedAmount.toLocaleString()} RWF
            </div>
            <div className="text-xs text-gray-500 mt-1">{completedInvestments.length} completed</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">Total Expected Return</div>
            <div className="text-2xl font-bold text-purple-600">
              {investments.reduce((sum: number, inv: any) => sum + inv.total_income, 0).toLocaleString()} RWF
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex gap-2 flex-1">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  statusFilter === 'active'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  statusFilter === 'completed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Completed
              </button>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user email or product name..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Investments Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">
              Investments ({investments.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">User</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Product</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Daily Income</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Period</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Total Income</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {investments.map((investment: any) => {
                  const createdDate = new Date(investment.created_at)
                  const now = new Date()
                  const daysPassed = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
                  const daysRemaining = Math.max(0, investment.income_period - daysPassed)
                  const progress = investment.status === 'completed' ? 100 : Math.min(100, (daysPassed / investment.income_period) * 100)

                  return (
                    <tr key={investment.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-gray-800">
                          {investment.users?.full_name || investment.users?.email || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500">{investment.users?.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-gray-800">
                          {investment.product_name}
                        </div>
                        <div className="text-xs text-gray-500">x{investment.purchase_count}</div>
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold">
                        {investment.amount.toLocaleString()} RWF
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {investment.daily_income.toLocaleString()} RWF/day
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {investment.income_period} days
                        {investment.status === 'active' && (
                          <div className="text-xs text-gray-500">{daysRemaining} remaining</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-green-600">
                        {investment.total_income.toLocaleString()} RWF
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            investment.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {investment.status}
                        </span>
                        {investment.status === 'active' && (
                          <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-indigo-600 h-1.5 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {format(new Date(investment.created_at), 'MMM d, yyyy')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {investments.length === 0 && (
            <div className="p-8 text-center text-gray-500">No investments found</div>
          )}
        </div>
      </main>
    </div>
  )
}


