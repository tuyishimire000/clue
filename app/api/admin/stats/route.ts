import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Get active users
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Get total balance across all users
    const { data: users } = await supabase
      .from('users')
      .select('balance, recharge_wallet')

    const totalBalance = users?.reduce((sum, u) => sum + (u.balance || 0), 0) || 0
    const totalRechargeWallet = users?.reduce((sum, u) => sum + (u.recharge_wallet || 0), 0) || 0

    // Get pending withdrawals
    const { data: pendingWithdrawals } = await supabase
      .from('withdrawals')
      .select('amount')
      .eq('status', 'pending')

    const pendingWithdrawalAmount = pendingWithdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0
    const pendingWithdrawalCount = pendingWithdrawals?.length || 0

    // Get total investments
    const { data: investments } = await supabase
      .from('investments')
      .select('amount, status')

    const totalInvestments = investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0
    const activeInvestments = investments?.filter(inv => inv.status === 'active').length || 0

    // Get total withdrawals (all statuses)
    const { data: allWithdrawals } = await supabase
      .from('withdrawals')
      .select('amount, status')

    const totalWithdrawals = allWithdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0
    const approvedWithdrawals = allWithdrawals?.filter(w => w.status === 'approved').reduce((sum, w) => sum + w.amount, 0) || 0

    // Get total recharge transactions
    const { data: recharges } = await supabase
      .from('recharge_transactions')
      .select('amount, status')

    const totalRecharges = recharges?.reduce((sum, r) => sum + r.amount, 0) || 0
    const completedRecharges = recharges?.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.amount, 0) || 0

    // Get total check-ins
    const { data: checkIns } = await supabase
      .from('checkins')
      .select('amount')

    const totalCheckIns = checkIns?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0

    // Get referrals count
    const { count: totalReferrals } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      stats: {
        users: {
          total: totalUsers || 0,
          active: activeUsers || 0,
          suspended: (totalUsers || 0) - (activeUsers || 0),
        },
        finances: {
          total_balance: totalBalance,
          total_recharge_wallet: totalRechargeWallet,
          total_investments: totalInvestments,
          active_investments_count: activeInvestments,
          total_withdrawals: totalWithdrawals,
          approved_withdrawals: approvedWithdrawals,
          pending_withdrawals: pendingWithdrawalAmount,
          pending_withdrawals_count: pendingWithdrawalCount,
          total_recharges: totalRecharges,
          completed_recharges: completedRecharges,
          total_check_ins: totalCheckIns,
        },
        referrals: {
          total: totalReferrals || 0,
        },
      },
    })
  } catch (error: any) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

