import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Authenticate user (optional - can be called by system or admin)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Get all active investments
    const { data: investments, error: investmentsError } = await supabase
      .from('investments')
      .select('*')
      .eq('status', 'active')

    if (investmentsError) {
      console.error('Error fetching investments:', investmentsError)
      return NextResponse.json(
        { error: 'Failed to fetch investments', details: investmentsError.message },
        { status: 500 }
      )
    }

    if (!investments || investments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active investments to process',
        processed: 0
      })
    }

    const now = new Date()
    let processedCount = 0
    let earningsAdded = 0
    let principalsReturned = 0

    // Process each investment
    for (const investment of investments) {
      const createdDate = new Date(investment.created_at)
      const daysPassed = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      const daysEarned = Math.min(daysPassed, investment.income_period)
      const isCompleted = daysPassed >= investment.income_period

      // Calculate total earnings so far
      const totalEarningsSoFar = investment.daily_income * daysEarned * investment.purchase_count
      
      // Get the last processed date from updated_at or created_at
      const lastProcessedDate = new Date(investment.updated_at || investment.created_at)
      const daysSinceLastProcess = Math.floor((now.getTime() - lastProcessedDate.getTime()) / (1000 * 60 * 60 * 24))
      
      // Only process if at least 1 day has passed since last update
      if (daysSinceLastProcess < 1 && !isCompleted) {
        continue
      }

      // Get user's current balance
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', investment.user_id)
        .single()

      if (userError || !userData) {
        console.error(`Error fetching user ${investment.user_id}:`, userError)
        continue
      }

      let newBalance = userData.balance
      let investmentUpdate: any = {}

      // If investment period is completed, return principal and final earnings
      if (isCompleted) {
        // Add remaining earnings (if any days weren't processed)
        const remainingDays = investment.income_period - daysEarned
        if (remainingDays > 0) {
          const remainingEarnings = investment.daily_income * remainingDays * investment.purchase_count
          newBalance += remainingEarnings
          earningsAdded += remainingEarnings
        }
        
        // Return principal amount
        newBalance += investment.amount
        principalsReturned += investment.amount
        
        // Mark investment as completed
        investmentUpdate = {
          status: 'completed',
          updated_at: now.toISOString()
        }
      } else {
        // Add daily earnings for days since last process
        const earningsToAdd = investment.daily_income * daysSinceLastProcess * investment.purchase_count
        newBalance += earningsToAdd
        earningsAdded += earningsToAdd
        
        // Update investment with new processed date
        investmentUpdate = {
          updated_at: now.toISOString()
        }
      }

      // Update user balance
      const { error: balanceError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', investment.user_id)

      if (balanceError) {
        console.error(`Error updating balance for user ${investment.user_id}:`, balanceError)
        continue
      }

      // Update investment record
      const { error: updateError } = await supabase
        .from('investments')
        .update(investmentUpdate)
        .eq('id', investment.id)

      if (updateError) {
        console.error(`Error updating investment ${investment.id}:`, updateError)
        continue
      }

      processedCount++
    }

    return NextResponse.json({
      success: true,
      message: 'Investments processed successfully',
      processed: processedCount,
      totalInvestments: investments.length,
      earningsAdded,
      principalsReturned
    })

  } catch (error: any) {
    console.error('Investment processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// GET endpoint to check investment status (for manual testing)
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: investments, error } = await supabase
      .from('investments')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch investments', details: error.message },
        { status: 500 }
      )
    }

    const now = new Date()
    const investmentStatus = investments?.map(inv => {
      const createdDate = new Date(inv.created_at)
      const daysPassed = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      const daysRemaining = Math.max(0, inv.income_period - daysPassed)
      const isCompleted = daysPassed >= inv.income_period
      const earningsSoFar = inv.daily_income * Math.min(daysPassed, inv.income_period) * inv.purchase_count

      return {
        id: inv.id,
        product_name: inv.product_name,
        amount: inv.amount,
        daysPassed,
        daysRemaining,
        isCompleted,
        earningsSoFar,
        totalEarnings: inv.total_income,
        status: inv.status
      }
    }) || []

    return NextResponse.json({
      investments: investmentStatus,
      total: investments?.length || 0
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

