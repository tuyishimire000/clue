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
    const { amount, withdrawPassword, account_number, account_name } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const MIN_WITHDRAWAL = 2000
    const MAX_WITHDRAWAL = 2000000
    const WITHDRAWAL_FEE_PERCENT = 10

    if (amount < MIN_WITHDRAWAL) {
      return NextResponse.json(
        { error: `Minimum withdrawal amount is ${MIN_WITHDRAWAL.toLocaleString()} RWF` },
        { status: 400 }
      )
    }

    if (amount > MAX_WITHDRAWAL) {
      return NextResponse.json(
        { error: `Maximum withdrawal amount is ${MAX_WITHDRAWAL.toLocaleString()} RWF` },
        { status: 400 }
      )
    }

    if (!withdrawPassword) {
      return NextResponse.json({ error: 'Withdrawal password is required' }, { status: 400 })
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('balance, withdrawal_password, account_name, account_phone_number, payment_method')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('Failed to fetch user data:', userError)
      return NextResponse.json(
        { error: 'Failed to fetch user data', details: userError.message },
        { status: 500 }
      )
    }

    if (!userData) {
      return NextResponse.json({ error: 'User data not found' }, { status: 404 })
    }

    // Verify withdrawal password
    if (!userData.withdrawal_password) {
      return NextResponse.json(
        { error: 'Withdrawal password not set. Please set it in your profile first.' },
        { status: 400 }
      )
    }

    if (userData.withdrawal_password !== withdrawPassword) {
      return NextResponse.json(
        { error: 'Incorrect withdrawal password' },
        { status: 401 }
      )
    }

    // Calculate fee and net amount
    const fee = Math.min(amount * (WITHDRAWAL_FEE_PERCENT / 100), amount * 0.1)
    const netAmount = amount - fee
    const totalDeduction = amount // Total amount to deduct from balance

    // Check if user has sufficient balance
    if ((userData.balance || 0) < totalDeduction) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    // Use saved account details if not provided
    const finalAccountNumber = account_number || userData.account_phone_number || null
    const finalAccountName = account_name || userData.account_name || null

    // Create withdrawal record with pending status
    // Balance will be deducted when admin approves
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawals')
      .insert({
        user_id: user.id,
        amount,
        fee,
        net_amount: netAmount,
        account_number: finalAccountNumber,
        account_name: finalAccountName,
        status: 'pending',
      })
      .select()
      .single()

    if (withdrawalError) {
      console.error('Failed to create withdrawal record:', withdrawalError)
      return NextResponse.json(
        { error: 'Failed to create withdrawal record' },
        { status: 500 }
      )
    }

    // DO NOT deduct balance here - wait for admin approval
    // Balance will be deducted when admin approves the withdrawal

    return NextResponse.json({
      success: true,
      withdrawal_id: withdrawal.id,
      amount,
      fee,
      net_amount: netAmount,
      current_balance: userData.balance,
      status: 'pending',
      message: 'Withdrawal request submitted. Waiting for admin approval.',
    })
  } catch (error: any) {
    console.error('Withdrawal error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

