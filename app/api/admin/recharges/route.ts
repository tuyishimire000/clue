import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'

// GET - Fetch all recharge transactions
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
      .from('recharge_transactions')
      .select(`
        id,
        user_id,
        amount,
        payment_method,
        paid_number,
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

    const { data: recharges, error } = await query

    if (error) {
      console.error('Error fetching recharges:', error)
      return NextResponse.json(
        { error: 'Failed to fetch recharge transactions', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, recharges: recharges || [] })
  } catch (error: any) {
    console.error('Admin recharges error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Approve or reject recharge
export async function POST(request: NextRequest) {
  try {
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const supabase = await createClient()
    const body = await request.json()
    const { recharge_id, action, reason } = body

    if (!recharge_id || !action) {
      return NextResponse.json(
        { error: 'Recharge ID and action are required' },
        { status: 400 }
      )
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Action must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Get recharge details
    const { data: recharge, error: rechargeError } = await supabase
      .from('recharge_transactions')
      .select('*, users:user_id(*)')
      .eq('id', recharge_id)
      .single()

    if (rechargeError || !recharge) {
      return NextResponse.json(
        { error: 'Recharge transaction not found' },
        { status: 404 }
      )
    }

    if (recharge.status !== 'pending') {
      return NextResponse.json(
        { error: `Recharge is already ${recharge.status}` },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      // Get user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('recharge_wallet, total_recharge')
        .eq('id', recharge.user_id)
        .single()

      if (userError) {
        return NextResponse.json(
          { error: 'Failed to fetch user data', details: userError.message },
          { status: 500 }
        )
      }

      // Update recharge status and add to user's recharge wallet
      const newRechargeWallet = (userData.recharge_wallet || 0) + recharge.amount
      const newTotalRecharge = (userData.total_recharge || 0) + recharge.amount

      // Update recharge status
      const { error: updateError } = await supabase
        .from('recharge_transactions')
        .update({
          status: 'completed',
          approved_by: adminUser.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', recharge_id)

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to approve recharge', details: updateError.message },
          { status: 500 }
        )
      }

      // Update user's recharge wallet
      const { error: balanceError } = await supabase
        .from('users')
        .update({
          recharge_wallet: newRechargeWallet,
          total_recharge: newTotalRecharge,
        })
        .eq('id', recharge.user_id)

      if (balanceError) {
        // Rollback recharge status if balance update fails
        await supabase
          .from('recharge_transactions')
          .update({
            status: 'pending',
            approved_by: null,
          })
          .eq('id', recharge_id)

        return NextResponse.json(
          { error: 'Failed to update user balance', details: balanceError.message },
          { status: 500 }
        )
      }
    } else if (action === 'reject') {
      // Update recharge status to rejected
      const { error: updateError } = await supabase
        .from('recharge_transactions')
        .update({
          status: 'rejected',
          approved_by: adminUser.id,
          rejected_reason: reason || 'Rejected by admin',
          updated_at: new Date().toISOString(),
        })
        .eq('id', recharge_id)

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to reject recharge', details: updateError.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: `Recharge ${action}d successfully`,
    })
  } catch (error: any) {
    console.error('Admin recharge action error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

