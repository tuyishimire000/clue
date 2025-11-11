import { createClient } from '@/lib/supabase/server'

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return false
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('is_admin, is_active')
      .eq('id', user.id)
      .single()

    if (error || !userData) {
      return false
    }

    return userData.is_admin === true && userData.is_active === true
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Get admin user data
 */
export async function getAdminUser() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return null
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('id, email, full_name, is_admin, is_active')
      .eq('id', user.id)
      .single()

    if (error || !userData) {
      return null
    }

    if (userData.is_admin !== true || userData.is_active !== true) {
      return null
    }

    return userData
  } catch (error) {
    console.error('Error getting admin user:', error)
    return null
  }
}

