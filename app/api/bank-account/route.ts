import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user bank account details
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('payment_method, account_name, account_phone_number')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('Failed to fetch bank account:', userError)
      return NextResponse.json(
        { error: 'Failed to fetch bank account details', details: userError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      payment_method: userData?.payment_method || null,
      account_name: userData?.account_name || null,
      account_phone_number: userData?.account_phone_number || null,
    })
  } catch (error: any) {
    console.error('Bank account fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { payment_method, account_name, account_phone_number, password } = body

    // Validate required fields
    if (!payment_method) {
      return NextResponse.json({ error: 'Payment method is required' }, { status: 400 })
    }

    if (payment_method !== 'MTN' && payment_method !== 'Airtel') {
      return NextResponse.json(
        { error: 'Payment method must be MTN or Airtel' },
        { status: 400 }
      )
    }

    if (!account_name || account_name.trim().length === 0) {
      return NextResponse.json({ error: 'Account name is required' }, { status: 400 })
    }

    if (!account_phone_number || account_phone_number.trim().length === 0) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    // Validate phone number format (should be 9-10 digits)
    const phoneDigits = account_phone_number.replace(/\D/g, '')
    if (phoneDigits.length < 9 || phoneDigits.length > 10) {
      return NextResponse.json(
        { error: 'Phone number must be 9-10 digits' },
        { status: 400 }
      )
    }

    // Verify withdrawal password if updating existing account
    const { data: existingUser } = await supabase
      .from('users')
      .select('payment_method, withdrawal_password')
      .eq('id', user.id)
      .single()

    // If user already has payment details, require password
    if (existingUser?.payment_method && !password) {
      return NextResponse.json(
        { error: 'Password is required to update bank account details' },
        { status: 400 }
      )
    }

    if (existingUser?.payment_method && password) {
      // Verify withdrawal password
      if (!existingUser.withdrawal_password || existingUser.withdrawal_password !== password) {
        return NextResponse.json(
          { error: 'Incorrect password' },
          { status: 401 }
        )
      }
    }

    // Format phone number (remove non-digits, ensure proper format)
    const formattedPhone = phoneDigits.length === 9 ? phoneDigits : phoneDigits.slice(-9)

    // Update user bank account details
    const { error: updateError } = await supabase
      .from('users')
      .update({
        payment_method,
        account_name: account_name.trim(),
        account_phone_number: formattedPhone,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to update bank account:', updateError)
      return NextResponse.json(
        { error: 'Failed to update bank account details', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Bank account details saved successfully',
      payment_method,
      account_name: account_name.trim(),
      account_phone_number: formattedPhone,
    })
  } catch (error: any) {
    console.error('Bank account update error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


