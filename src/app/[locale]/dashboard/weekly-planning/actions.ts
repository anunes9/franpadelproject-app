'use server'

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getWeeklyPlan(year: number, week: number) {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: plan, error } = await supabase
    .from('weekly_plans')
    .select(`
      id,
      weekly_plan_modules (
        id,
        item_external_id,
        item_type,
        day_of_week,
        order_index,
        notes
      )
    `)
    .eq('user_id', user.id)
    .eq('year', year)
    .eq('week_number', week)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 is code for no rows returned
    console.error('Error fetching weekly plan:', error)
    return null
  }

  return plan
}

export async function createWeeklyPlan(year: number, week: number) {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('weekly_plans')
    .insert({
      user_id: user.id,
      year,
      week_number: week
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating weekly plan:', error)
    throw error
  }

  return data
}

export async function addPlanItem(planId: string, item: {
  item_external_id: string,
  item_type: 'module' | 'exercise',
  day_of_week: number,
  order_index?: number,
  notes?: string
}) {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from('weekly_plan_modules')
    .insert({
      weekly_plan_id: planId,
      ...item
    })

  if (error) {
    console.error('Error adding plan item:', error)
    throw error
  }

  revalidatePath('/dashboard/weekly-planning')
}

export async function removePlanItem(itemId: string) {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from('weekly_plan_modules')
    .delete()
    .eq('id', itemId)

  if (error) {
    console.error('Error removing plan item:', error)
    throw error
  }

  revalidatePath('/dashboard/weekly-planning')
}
