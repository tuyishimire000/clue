'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import Link from 'next/link'

export default function AdminDashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      const result = await response.json()
      return result.stats
    },
  })

  // Fetch pending withdrawals
  const { data: withdrawalsData, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ['admin-pending-withdrawals'],
    queryFn: async () => {
      const response = await fetch('/api/admin/withdrawals?status=pending')
      if (!response.ok) {
        throw new Error('Failed to fetch withdrawals')
      }
      const result = await response.json()
      return result.withdrawals || []
    },
  })

  // Fetch pending recharges
  const { data: rechargesData, isLoading: rechargesLoading } = useQuery({
    queryKey: ['admin-pending-recharges'],
    queryFn: async () => {
      const response = await fetch('/api/admin/recharges?status=pending')
      if (!response.ok) {
        throw new Error('Failed to fetch recharges')
      }
      const result = await response.json()
      return result.recharges || []
    },
  })

  if (statsLoading || withdrawalsLoading || rechargesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-800">Loading admin dashboard...</div>
      </div>
    )
  }

  const pendingWithdrawals = withdrawalsData || []
  const pendingRecharges = rechargesData || []

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-indigo-600 text-white py-4 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              User Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Users */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">Total Users</div>
            <div className="text-3xl font-bold text-indigo-600">{stats?.users?.total || 0}</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats?.users?.active || 0} active, {stats?.users?.suspended || 0} suspended
            </div>
          </div>

          {/* Total Balance */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">Total Balance</div>
            <div className="text-3xl font-bold text-green-600">
              {(stats?.finances?.total_balance || 0).toLocaleString()} RWF
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Recharge Wallet: {(stats?.finances?.total_recharge_wallet || 0).toLocaleString()} RWF
            </div>
          </div>

          {/* Pending Withdrawals */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">Pending Withdrawals</div>
            <div className="text-3xl font-bold text-yellow-600">
              {(stats?.finances?.pending_withdrawals || 0).toLocaleString()} RWF
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats?.finances?.pending_withdrawals_count || 0} requests
            </div>
          </div>

          {/* Pending Recharges */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">Pending Recharges</div>
            <div className="text-3xl font-bold text-blue-600">
              {(pendingRecharges.reduce((sum: number, r: any) => sum + r.amount, 0) || 0).toLocaleString()} RWF
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {pendingRecharges.length || 0} requests
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link
            href="/admin/withdrawals"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-lg font-semibold text-gray-800 mb-2">Withdrawals</div>
            <div className="text-sm text-gray-600">
              Manage withdrawal requests and approvals
            </div>
            <div className="mt-2 text-indigo-600 font-semibold">
              {pendingWithdrawals.length} pending →
            </div>
          </Link>

          <Link
            href="/admin/recharges"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-lg font-semibold text-gray-800 mb-2">Recharges</div>
            <div className="text-sm text-gray-600">
              Manage recharge requests and approvals
            </div>
            <div className="mt-2 text-indigo-600 font-semibold">
              {pendingRecharges.length} pending →
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-lg font-semibold text-gray-800 mb-2">Users</div>
            <div className="text-sm text-gray-600">
              View and manage all users
            </div>
            <div className="mt-2 text-indigo-600 font-semibold">
              {stats?.users?.total || 0} users →
            </div>
          </Link>

          <Link
            href="/admin/investments"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-lg font-semibold text-gray-800 mb-2">Investments</div>
            <div className="text-sm text-gray-600">
              View and manage all investments
            </div>
            <div className="mt-2 text-indigo-600 font-semibold">
              {stats?.finances?.active_investments_count || 0} active →
            </div>
          </Link>
        </div>

        {/* Recent Pending Withdrawals */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Recent Pending Withdrawals</h2>
            <Link
              href="/admin/withdrawals"
              className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
            >
              View All →
            </Link>
          </div>

          {pendingWithdrawals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">User</th>
                    <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">Amount</th>
                    <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">Net Amount</th>
                    <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">Date</th>
                    <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingWithdrawals.slice(0, 5).map((withdrawal: any) => (
                    <tr key={withdrawal.id} className="border-b border-gray-100">
                      <td className="py-2 px-4">
                        <div className="text-sm font-medium text-gray-800">
                          {withdrawal.users?.full_name || withdrawal.users?.email || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500">{withdrawal.account_number}</div>
                      </td>
                      <td className="py-2 px-4 text-sm font-semibold">
                        {withdrawal.amount.toLocaleString()} RWF
                      </td>
                      <td className="py-2 px-4 text-sm text-gray-600">
                        {withdrawal.net_amount.toLocaleString()} RWF
                      </td>
                      <td className="py-2 px-4 text-sm text-gray-600">
                        {format(new Date(withdrawal.created_at), 'MMM d, yyyy HH:mm')}
                      </td>
                      <td className="py-2 px-4">
                        <Link
                          href={`/admin/withdrawals?id=${withdrawal.id}`}
                          className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold"
                        >
                          Review →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No pending withdrawals</div>
          )}
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Financial Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Investments:</span>
                <span className="font-semibold">
                  {(stats?.finances?.total_investments || 0).toLocaleString()} RWF
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Investments:</span>
                <span className="font-semibold">{stats?.finances?.active_investments_count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Withdrawals:</span>
                <span className="font-semibold">
                  {(stats?.finances?.total_withdrawals || 0).toLocaleString()} RWF
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Approved Withdrawals:</span>
                <span className="font-semibold text-green-600">
                  {(stats?.finances?.approved_withdrawals || 0).toLocaleString()} RWF
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Recharges:</span>
                <span className="font-semibold">
                  {(stats?.finances?.total_recharges || 0).toLocaleString()} RWF
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed Recharges:</span>
                <span className="font-semibold text-green-600">
                  {(stats?.finances?.completed_recharges || 0).toLocaleString()} RWF
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Activity Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Check-ins:</span>
                <span className="font-semibold">
                  {(stats?.finances?.total_check_ins || 0).toLocaleString()} RWF
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Referrals:</span>
                <span className="font-semibold">{stats?.referrals?.total || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

