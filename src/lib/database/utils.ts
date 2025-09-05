import { createClient } from '@/utils/supabase/client'

const supabase = createClient()

export const dbUtils = {
  async getCurrentUserProfile(userId: string) {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single()

    if (error) throw error
    return data
  },
}
