import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { productId, productName, price, purchaseCount, dailyIncome, incomePeriod, walletType } = body

    // Validate input
    if (!productId || !productName || !price || !purchaseCount || !dailyIncome || !incomePeriod || !walletType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (purchaseCount < 1) {
      return NextResponse.json(
        { error: 'Purchase count must be at least 1' },
        { status: 400 }
      )
    }

    // Check if this is a Super Weekend product (check if productId starts with 'vaccine' or contains 'Super Weekend')
    // For Super Weekend products, only allow investment on weekends (Saturday or Sunday) in Kigali time
    const isSuperWeekendProduct = productId.startsWith('vaccine') || productId.toLowerCase().includes('vaccine')
    if (isSuperWeekendProduct) {
      const now = new Date()
      // Get Kigali time (Africa/Kigali timezone)
      const kigaliTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Kigali' }))
      const dayOfWeek = kigaliTime.getDay() // 0 = Sunday, 6 = Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      
      if (!isWeekend) {
        return NextResponse.json(
          { error: 'This product is only available on weekends (Saturday and Sunday)' },
          { status: 400 }
        )
      }
    }

    // Calculate total amount
    const totalAmount = price * purchaseCount
    const totalIncome = dailyIncome * incomePeriod * purchaseCount

    // Get user's current balance
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user:', userError)
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      )
    }

    // Validate wallet type and balance
    if (walletType === 'balance') {
      if (userData.balance < totalAmount) {
        return NextResponse.json(
          { error: 'Insufficient balance. Please recharge your wallet.' },
          { status: 400 }
        )
      }
    } else if (walletType === 'recharge') {
      // If using recharge wallet, redirect to recharge page
      // For now, we'll treat it as insufficient balance
      return NextResponse.json(
        { error: 'Please recharge your wallet first', redirectTo: '/recharge' },
        { status: 400 }
      )
    } else {
      return NextResponse.json(
        { error: 'Invalid wallet type' },
        { status: 400 }
      )
    }

    // Create investment record
    const { data: investment, error: investmentError } = await supabase
      .from('investments')
      .insert({
        user_id: user.id,
        product_id: productId,
        product_name: productName,
        amount: totalAmount,
        purchase_count: purchaseCount,
        daily_income: dailyIncome,
        income_period: incomePeriod,
        total_income: totalIncome,
        status: 'active'
      })
      .select()
      .single()

    if (investmentError) {
      console.error('Investment insert error:', investmentError)
      return NextResponse.json(
        { error: 'Failed to create investment', details: investmentError.message },
        { status: 500 }
      )
    }

    // Update user balance (deduct investment amount)
    const newBalance = userData.balance - totalAmount
    const { error: balanceError } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', user.id)

    if (balanceError) {
      console.error('Balance update error:', balanceError)
      // Rollback: delete the investment if balance update fails
      await supabase
        .from('investments')
        .delete()
        .eq('id', investment.id)
      
      return NextResponse.json(
        { error: 'Failed to update balance', details: balanceError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Investment created successfully',
      investment: {
        id: investment.id,
        productName: investment.product_name,
        amount: investment.amount,
        purchaseCount: investment.purchase_count,
        dailyIncome: investment.daily_income,
        incomePeriod: investment.income_period,
        totalIncome: investment.total_income,
      },
      newBalance: newBalance
    })

  } catch (error: any) {
    console.error('Investment error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}


