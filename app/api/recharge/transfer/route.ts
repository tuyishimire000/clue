import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('balance, recharge_wallet')
      .eq('id', user.id)
      .single()

    if (userError) {
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
    }

    const currentRechargeWallet = userData.recharge_wallet || 0
    const currentBalance = userData.balance || 0

    if (amount > currentRechargeWallet) {
      return NextResponse.json(
        { error: 'Insufficient funds in recharge wallet' },
        { status: 400 }
      )
    }

    // Transfer from recharge wallet to balance
    const newRechargeWallet = currentRechargeWallet - amount
    const newBalance = currentBalance + amount

    const { error: updateError } = await supabase
      .from('users')
      .update({
        recharge_wallet: newRechargeWallet,
        balance: newBalance,
      })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to transfer funds' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      balance: newBalance,
      recharge_wallet: newRechargeWallet,
      amount,
    })
  } catch (error: any) {
    console.error('Transfer error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

