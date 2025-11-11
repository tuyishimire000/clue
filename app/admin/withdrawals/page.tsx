'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Suspense } from 'react'

function WithdrawalsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedId = searchParams.get('id')
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [rejectReason, setRejectReason] = useState('')

  // Fetch withdrawals
  const { data: withdrawalsData, isLoading } = useQuery({
    queryKey: ['admin-withdrawals', statusFilter],
    queryFn: async () => {
      const response = await fetch(`/api/admin/withdrawals?status=${statusFilter === 'all' ? 'all' : statusFilter}`)
      if (!response.ok) {
        throw new Error('Failed to fetch withdrawals')
      }
      const result = await response.json()
      return result.withdrawals || []
    },
  })

  // Approve/Reject mutation
  const actionMutation = useMutation({
    mutationFn: async ({ withdrawalId, action, reason }: { withdrawalId: string, action: 'approve' | 'reject', reason?: string }) => {
      const response = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          withdrawal_id: withdrawalId,
          action,
          reason,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process withdrawal')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      setRejectReason('')
      router.push('/admin/withdrawals')
    },
  })

  const withdrawals = withdrawalsData || []
  const selectedWithdrawal = withdrawals.find((w: any) => w.id === selectedId)

  const handleApprove = (withdrawalId: string) => {
    if (confirm('Are you sure you want to approve this withdrawal?')) {
      actionMutation.mutate({ withdrawalId, action: 'approve' })
    }
  }

  const handleReject = (withdrawalId: string) => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }
    if (confirm('Are you sure you want to reject this withdrawal?')) {
      actionMutation.mutate({ withdrawalId, action: 'reject', reason: rejectReason })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-800">Loading withdrawals...</div>
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
              <h1 className="text-2xl font-bold">Withdrawals Management</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-2">
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
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                statusFilter === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                statusFilter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Rejected
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Withdrawals List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-800">
                  Withdrawals ({withdrawals.length})
                </h2>
              </div>

              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {withdrawals.map((withdrawal: any) => (
                  <div
                    key={withdrawal.id}
                    onClick={() => router.push(`/admin/withdrawals?id=${withdrawal.id}`)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedId === withdrawal.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">
                          {withdrawal.users?.full_name || withdrawal.users?.email || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {withdrawal.amount.toLocaleString()} RWF
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(withdrawal.created_at), 'MMM d, yyyy HH:mm')}
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          withdrawal.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : withdrawal.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {withdrawal.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {withdrawals.length === 0 && (
                <div className="p-8 text-center text-gray-500">No withdrawals found</div>
              )}
            </div>
          </div>

          {/* Withdrawal Details */}
          <div className="lg:col-span-1">
            {selectedWithdrawal ? (
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Withdrawal Details</h2>

                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">User</div>
                    <div className="font-semibold text-gray-800">
                      {selectedWithdrawal.users?.full_name || selectedWithdrawal.users?.email || 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-500">{selectedWithdrawal.users?.email}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Amount</div>
                    <div className="font-semibold text-gray-800">
                      {selectedWithdrawal.amount.toLocaleString()} RWF
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Fee</div>
                    <div className="font-semibold text-gray-800">
                      {selectedWithdrawal.fee.toLocaleString()} RWF
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Net Amount</div>
                    <div className="font-semibold text-green-600">
                      {selectedWithdrawal.net_amount.toLocaleString()} RWF
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Account Number</div>
                    <div className="font-semibold text-gray-800">
                      {selectedWithdrawal.account_number || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Account Name</div>
                    <div className="font-semibold text-gray-800">
                      {selectedWithdrawal.account_name || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Status</div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedWithdrawal.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : selectedWithdrawal.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {selectedWithdrawal.status}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Date</div>
                    <div className="text-sm text-gray-800">
                      {format(new Date(selectedWithdrawal.created_at), 'MMM d, yyyy HH:mm')}
                    </div>
                  </div>

                  {selectedWithdrawal.rejected_reason && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Rejection Reason</div>
                      <div className="text-sm text-red-600">{selectedWithdrawal.rejected_reason}</div>
                    </div>
                  )}

                  {/* Actions */}
                  {selectedWithdrawal.status === 'pending' && (
                    <div className="pt-4 border-t border-gray-200 space-y-3">
                      <button
                        onClick={() => handleApprove(selectedWithdrawal.id)}
                        disabled={actionMutation.isPending}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionMutation.isPending ? 'Processing...' : 'Approve'}
                      </button>

                      <div>
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Enter rejection reason..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                          rows={3}
                        />
                        <button
                          onClick={() => handleReject(selectedWithdrawal.id)}
                          disabled={actionMutation.isPending || !rejectReason.trim()}
                          className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionMutation.isPending ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center text-gray-500">
                  Select a withdrawal to view details
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function WithdrawalsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-800">Loading...</div>
      </div>
    }>
      <WithdrawalsContent />
    </Suspense>
  )
}

