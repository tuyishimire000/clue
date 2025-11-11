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
    const { password } = body

    if (!password || password.length < 4) {
      return NextResponse.json(
        { error: 'Password must be at least 4 characters long' },
        { status: 400 }
      )
    }

    // Update withdrawal password in users table
    // Note: We're storing it as plain text for now. In production, you should hash it.
    const { error: updateError } = await supabase
      .from('users')
      .update({ withdrawal_password: password })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to update withdrawal password:', updateError)
      return NextResponse.json(
        { error: 'Failed to update withdrawal password', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Withdrawal password updated successfully',
    })
  } catch (error: any) {
    console.error('Withdrawal password update error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


