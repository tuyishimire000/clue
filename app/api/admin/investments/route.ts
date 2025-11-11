import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''

    let query = supabase
      .from('investments')
      .select(`
        id,
        user_id,
        product_id,
        product_name,
        amount,
        purchase_count,
        daily_income,
        income_period,
        total_income,
        status,
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

    const { data: investments, error } = await query

    if (error) {
      console.error('Error fetching investments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch investments', details: error.message },
        { status: 500 }
      )
    }

    // Filter by search if provided
    let filteredInvestments = investments || []
    if (search) {
      const searchLower = search.toLowerCase()
      filteredInvestments = filteredInvestments.filter((inv: any) => {
        const userEmail = inv.users?.email?.toLowerCase() || ''
        const userName = inv.users?.full_name?.toLowerCase() || ''
        const productName = inv.product_name?.toLowerCase() || ''
        return userEmail.includes(searchLower) || userName.includes(searchLower) || productName.includes(searchLower)
      })
    }

    return NextResponse.json({ success: true, investments: filteredInvestments })
  } catch (error: any) {
    console.error('Admin investments error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


