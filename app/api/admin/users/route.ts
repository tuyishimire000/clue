import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'

// GET - Fetch all users
export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        referral_code,
        balance,
        recharge_wallet,
        total_recharge,
        is_admin,
        is_active,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%,referral_code.ilike.%${search}%`)
    }

    const { data: users, error } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { error: 'Failed to fetch users', details: error.message },
        { status: 500 }
      )
    }

    // Get user statistics
    const usersWithStats = await Promise.all(
      (users || []).map(async (user) => {
        // Get referral count
        const { count: referralCount } = await supabase
          .from('referrals')
          .select('*', { count: 'exact', head: true })
          .eq('referrer_id', user.id)

        // Get investment count and total
        const { data: investments } = await supabase
          .from('investments')
          .select('amount, status')
          .eq('user_id', user.id)

        const totalInvestments = investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0
        const activeInvestments = investments?.filter(inv => inv.status === 'active').length || 0

        // Get withdrawal count and total
        const { data: withdrawals } = await supabase
          .from('withdrawals')
          .select('amount, status')
          .eq('user_id', user.id)

        const totalWithdrawals = withdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0

        return {
          ...user,
          referral_count: referralCount || 0,
          total_investments: totalInvestments,
          active_investments: activeInvestments,
          total_withdrawals: totalWithdrawals,
        }
      })
    )

    return NextResponse.json({ success: true, users: usersWithStats })
  } catch (error: any) {
    console.error('Admin users error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Update user (balance, status, etc.)
export async function POST(request: NextRequest) {
  try {
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const supabase = await createClient()
    const body = await request.json()
    const { user_id, action, value, reason } = body

    if (!user_id || !action) {
      return NextResponse.json(
        { error: 'User ID and action are required' },
        { status: 400 }
      )
    }

    let updateData: any = {}

    switch (action) {
      case 'update_balance':
        if (value === undefined || value === null) {
          return NextResponse.json({ error: 'Balance value is required' }, { status: 400 })
        }
        updateData.balance = value
        break

      case 'update_recharge_wallet':
        if (value === undefined || value === null) {
          return NextResponse.json({ error: 'Recharge wallet value is required' }, { status: 400 })
        }
        updateData.recharge_wallet = value
        break

      case 'suspend':
        updateData.is_active = false
        break

      case 'activate':
        updateData.is_active = true
        break

      case 'make_admin':
        updateData.is_admin = true
        break

      case 'remove_admin':
        updateData.is_admin = false
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user_id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update user', details: updateError.message },
        { status: 500 }
      )
    }

    // TODO: Log admin action to an audit log table

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser,
    })
  } catch (error: any) {
    console.error('Admin user update error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

