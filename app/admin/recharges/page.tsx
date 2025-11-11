'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Suspense } from 'react'

function RechargesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedId = searchParams.get('id')
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('pending')
  const [rejectReason, setRejectReason] = useState('')

  // Fetch recharges
  const { data: rechargesData, isLoading } = useQuery({
    queryKey: ['admin-recharges', statusFilter],
    queryFn: async () => {
      const response = await fetch(`/api/admin/recharges?status=${statusFilter === 'all' ? 'all' : statusFilter}`)
      if (!response.ok) {
        throw new Error('Failed to fetch recharges')
      }
      const result = await response.json()
      return result.recharges || []
    },
  })

  // Approve/Reject mutation
  const actionMutation = useMutation({
    mutationFn: async ({ rechargeId, action, reason }: { rechargeId: string, action: 'approve' | 'reject', reason?: string }) => {
      const response = await fetch('/api/admin/recharges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recharge_id: rechargeId,
          action,
          reason,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process recharge')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-recharges'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      queryClient.invalidateQueries({ queryKey: ['admin-pending-recharges'] })
      setRejectReason('')
      router.push('/admin/recharges')
    },
  })

  const recharges = rechargesData || []
  const selectedRecharge = recharges.find((r: any) => r.id === selectedId)

  const handleApprove = (rechargeId: string) => {
    if (confirm('Are you sure you want to approve this recharge?')) {
      actionMutation.mutate({ rechargeId, action: 'approve' })
    }
  }

  const handleReject = (rechargeId: string) => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }
    if (confirm('Are you sure you want to reject this recharge?')) {
      actionMutation.mutate({ rechargeId, action: 'reject', reason: rejectReason })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-800">Loading recharges...</div>
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
              <h1 className="text-2xl font-bold">Recharges Management</h1>
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
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Completed
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
          {/* Recharges List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-800">
                  Recharges ({recharges.length})
                </h2>
              </div>

              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {recharges.map((recharge: any) => (
                  <div
                    key={recharge.id}
                    onClick={() => router.push(`/admin/recharges?id=${recharge.id}`)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedId === recharge.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">
                          {recharge.users?.full_name || recharge.users?.email || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {recharge.amount.toLocaleString()} RWF
                        </div>
                        <div className="text-xs text-gray-500">
                          {recharge.payment_method} - {recharge.paid_number}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(recharge.created_at), 'MMM d, yyyy HH:mm')}
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          recharge.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : recharge.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {recharge.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {recharges.length === 0 && (
                <div className="p-8 text-center text-gray-500">No recharges found</div>
              )}
            </div>
          </div>

          {/* Recharge Details */}
          <div className="lg:col-span-1">
            {selectedRecharge ? (
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Recharge Details</h2>

                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">User</div>
                    <div className="font-semibold text-gray-800">
                      {selectedRecharge.users?.full_name || selectedRecharge.users?.email || 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-500">{selectedRecharge.users?.email}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Amount</div>
                    <div className="font-semibold text-gray-800">
                      {selectedRecharge.amount.toLocaleString()} RWF
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Payment Method</div>
                    <div className="font-semibold text-gray-800">
                      {selectedRecharge.payment_method}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Paid Number</div>
                    <div className="font-semibold text-gray-800">
                      {selectedRecharge.paid_number || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Status</div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedRecharge.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : selectedRecharge.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {selectedRecharge.status}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Date</div>
                    <div className="text-sm text-gray-800">
                      {format(new Date(selectedRecharge.created_at), 'MMM d, yyyy HH:mm')}
                    </div>
                  </div>

                  {selectedRecharge.rejected_reason && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Rejection Reason</div>
                      <div className="text-sm text-red-600">{selectedRecharge.rejected_reason}</div>
                    </div>
                  )}

                  {/* Actions */}
                  {selectedRecharge.status === 'pending' && (
                    <div className="pt-4 border-t border-gray-200 space-y-3">
                      <button
                        onClick={() => handleApprove(selectedRecharge.id)}
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
                          onClick={() => handleReject(selectedRecharge.id)}
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
                  Select a recharge to view details
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function RechargesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-800">Loading...</div>
      </div>
    }>
      <RechargesContent />
    </Suspense>
  )
}


