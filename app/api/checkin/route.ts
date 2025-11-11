import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has already checked in today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data: existingCheckIn } = await supabase
      .from('checkins')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .limit(1)

    if (existingCheckIn && existingCheckIn.length > 0) {
      return NextResponse.json(
        { error: 'You have already checked in today' },
        { status: 400 }
      )
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', user.id)
      .single()

    if (userError) {
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
    }

    // Count referrals
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', user.id)

    if (referralsError) {
      return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 })
    }

    // Calculate reward
    const baseReward = 50
    const referralCount = referrals?.length || 0
    const bonusReward = referralCount * 20
    const totalReward = baseReward + bonusReward

    // Create check-in record
    const { error: checkInError } = await supabase
      .from('checkins')
      .insert({
        user_id: user.id,
        amount: totalReward,
      })

    if (checkInError) {
      console.error('Check-in insert error:', checkInError)
      return NextResponse.json({ 
        error: 'Failed to record check-in',
        details: checkInError.message 
      }, { status: 500 })
    }

    // Update user balance
    const { error: balanceError } = await supabase
      .from('users')
      .update({ balance: (userData.balance || 0) + totalReward })
      .eq('id', user.id)

    if (balanceError) {
      return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 })
    }

    // Return success response
    return NextResponse.json({
      success: true,
      reward: totalReward,
      baseReward,
      bonusReward,
      referralCount,
      newBalance: (userData.balance || 0) + totalReward,
    })
  } catch (error: any) {
    console.error('Check-in error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

