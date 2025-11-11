import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, getAdminUser } from '@/lib/admin'

// GET - Fetch all withdrawals
export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    let query = supabase
      .from('withdrawals')
      .select(`
        id,
        user_id,
        amount,
        fee,
        net_amount,
        account_number,
        account_name,
        status,
        approved_by,
        rejected_reason,
        created_at,
        updated_at,
        users:user_id (
          id,
          email,
          full_name
        )
      `)
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: withdrawals, error } = await query

    if (error) {
      console.error('Error fetching withdrawals:', error)
      return NextResponse.json(
        { error: 'Failed to fetch withdrawals', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, withdrawals: withdrawals || [] })
  } catch (error: any) {
    console.error('Admin withdrawals error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Approve or reject withdrawal
export async function POST(request: NextRequest) {
  try {
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const supabase = await createClient()
    const body = await request.json()
    const { withdrawal_id, action, reason } = body // action: 'approve' or 'reject'

    if (!withdrawal_id || !action) {
      return NextResponse.json(
        { error: 'Withdrawal ID and action are required' },
        { status: 400 }
      )
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Action must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Get withdrawal details
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawals')
      .select('*, users:user_id(*)')
      .eq('id', withdrawal_id)
      .single()

    if (withdrawalError || !withdrawal) {
      return NextResponse.json(
        { error: 'Withdrawal not found' },
        { status: 404 }
      )
    }

    if (withdrawal.status !== 'pending') {
      return NextResponse.json(
        { error: `Withdrawal is already ${withdrawal.status}` },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      // Get user's current balance
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', withdrawal.user_id)
        .single()

      if (userError) {
        return NextResponse.json(
          { error: 'Failed to fetch user data', details: userError.message },
          { status: 500 }
        )
      }

      // Check if user has sufficient balance
      if ((userData.balance || 0) < withdrawal.amount) {
        return NextResponse.json(
          { error: 'User has insufficient balance for this withdrawal' },
          { status: 400 }
        )
      }

      // Deduct balance when approving
      const newBalance = (userData.balance || 0) - withdrawal.amount

      // Update withdrawal status to approved
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({
          status: 'approved',
          approved_by: adminUser.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', withdrawal_id)

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to approve withdrawal', details: updateError.message },
          { status: 500 }
        )
      }

      // Deduct balance from user
      const { error: balanceError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', withdrawal.user_id)

      if (balanceError) {
        // Rollback withdrawal status if balance update fails
        await supabase
          .from('withdrawals')
          .update({
            status: 'pending',
            approved_by: null,
          })
          .eq('id', withdrawal_id)

        return NextResponse.json(
          { error: 'Failed to deduct balance', details: balanceError.message },
          { status: 500 }
        )
      }
    } else if (action === 'reject') {
      // Update withdrawal status to rejected
      // No balance refund needed since balance was never deducted
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({
          status: 'rejected',
          approved_by: adminUser.id,
          rejected_reason: reason || 'Rejected by admin',
          updated_at: new Date().toISOString(),
        })
        .eq('id', withdrawal_id)

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to reject withdrawal', details: updateError.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: `Withdrawal ${action}d successfully`,
    })
  } catch (error: any) {
    console.error('Admin withdrawal action error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

