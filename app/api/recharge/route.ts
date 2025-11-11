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
    const { amount, payment_method, paid_number } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Create recharge transaction record with pending status
    // Wallet will be updated when admin approves
    const { data: transaction, error: transactionError } = await supabase
      .from('recharge_transactions')
      .insert({
        user_id: user.id,
        amount,
        payment_method: payment_method || 'MTN',
        paid_number: paid_number || '',
        status: 'pending', // Set to pending - admin must approve
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Failed to create transaction record:', transactionError)
      return NextResponse.json(
        { error: 'Failed to create recharge request', details: transactionError.message },
        { status: 500 }
      )
    }

    // DO NOT update wallet here - wait for admin approval
    // Wallet will be updated when admin approves the recharge

    return NextResponse.json({
      success: true,
      amount,
      transaction_id: transaction.id,
      status: 'pending',
      message: 'Recharge request submitted. Waiting for admin approval.',
    })
  } catch (error: any) {
    console.error('Recharge error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

