'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'

export default function AdminUsersPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [actionType, setActionType] = useState<'update_balance' | 'suspend' | 'activate' | 'make_admin' | 'remove_admin'>('update_balance')
  const [actionValue, setActionValue] = useState('')

  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      const url = search
        ? `/api/admin/users?search=${encodeURIComponent(search)}`
        : '/api/admin/users'
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const result = await response.json()
      return result.users || []
    },
  })

  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: async ({ userId, action, value }: { userId: string, action: string, value?: any }) => {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          action,
          value,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update user')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      setActionValue('')
      setSelectedUser(null)
      alert('User updated successfully')
    },
  })

  const users = usersData || []

  const handleUpdate = () => {
    if (!selectedUser) return

    if (actionType === 'update_balance' && !actionValue) {
      alert('Please enter a balance value')
      return
    }

    if (confirm(`Are you sure you want to ${actionType.replace('_', ' ')} for this user?`)) {
      updateMutation.mutate({
        userId: selectedUser.id,
        action: actionType,
        value: actionType === 'update_balance' ? parseInt(actionValue) : undefined,
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-800">Loading users...</div>
      </div>
    )
  }

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
              <h1 className="text-2xl font-bold">Users Management</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Search */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, name, or referral code..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-800">
                  Users ({users.length})
                </h2>
              </div>

              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {users.map((user: any) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedUser?.id === user.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-gray-800">
                            {user.full_name || user.email}
                          </div>
                          {user.is_admin && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-semibold rounded">
                              Admin
                            </span>
                          )}
                          {!user.is_active && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-semibold rounded">
                              Suspended
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                        <div className="text-xs text-gray-500">
                          Balance: {user.balance.toLocaleString()} RWF | 
                          Referrals: {user.referral_count} | 
                          Investments: {user.total_investments.toLocaleString()} RWF
                        </div>
                        <div className="text-xs text-gray-500">
                          Joined: {format(new Date(user.created_at), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {users.length === 0 && (
                <div className="p-8 text-center text-gray-500">No users found</div>
              )}
            </div>
          </div>

          {/* User Actions */}
          <div className="lg:col-span-1">
            {selectedUser ? (
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-lg font-bold text-gray-800 mb-4">User Actions</h2>

                <div className="space-y-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">User</div>
                    <div className="font-semibold text-gray-800">
                      {selectedUser.full_name || selectedUser.email}
                    </div>
                    <div className="text-xs text-gray-500">{selectedUser.email}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Balance</div>
                    <div className="font-semibold text-gray-800">
                      {selectedUser.balance.toLocaleString()} RWF
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Recharge Wallet</div>
                    <div className="font-semibold text-gray-800">
                      {selectedUser.recharge_wallet.toLocaleString()} RWF
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Status</div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedUser.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {selectedUser.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                </div>

                {/* Action Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Action
                  </label>
                  <select
                    value={actionType}
                    onChange={(e) => {
                      setActionType(e.target.value as any)
                      setActionValue('')
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="update_balance">Update Balance</option>
                    <option value="suspend">Suspend User</option>
                    <option value="activate">Activate User</option>
                    <option value="make_admin">Make Admin</option>
                    <option value="remove_admin">Remove Admin</option>
                  </select>
                </div>

                {actionType === 'update_balance' && (
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      New Balance (RWF)
                    </label>
                    <input
                      type="number"
                      value={actionValue}
                      onChange={(e) => setActionValue(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter new balance"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                )}

                <button
                  onClick={handleUpdate}
                  disabled={updateMutation.isPending || (actionType === 'update_balance' && !actionValue)}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateMutation.isPending ? 'Processing...' : 'Apply Action'}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center text-gray-500">
                  Select a user to manage
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

