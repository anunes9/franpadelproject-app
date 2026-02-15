'use server'

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getWeekDates } from '@/utils/date-helpers'

export async function getWeeklyPlan(year: number, week: number) {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // First, get the weekly plan
  const { data: plan, error: planError } = await supabase
    .from('weekly_plans')
    .select('id')
    .eq('user_id', user.id)
    .eq('year', year)
    .eq('week_number', week)
    .single()

  if (planError && planError.code !== 'PGRST116') { // PGRST116 is code for no rows returned
    console.error('Error fetching weekly plan:', planError)
    return null
  }

  if (!plan) {
    return null
  }

  // Get the week date range
  const { start, end } = getWeekDates(year, week)
  const startDate = start.toISOString().split('T')[0] // YYYY-MM-DD
  const endDate = end.toISOString().split('T')[0] // YYYY-MM-DD

  // Then, get the modules separately using the plan ID and date range
  const { data: modules, error: modulesError } = await supabase
    .from('weekly_plan_modules')
    .select('id, item_external_id, item_type, day_of_week, date, order_index, notes')
    .eq('weekly_plan_id', plan.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('order_index', { ascending: true })

  if (modulesError) {
    console.error('Error fetching weekly plan modules:', modulesError)
    // Return plan without modules rather than failing completely
    return {
      ...plan,
      weekly_plan_modules: []
    }
  }

  return {
    ...plan,
    weekly_plan_modules: modules || []
  }
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
  date: string, // YYYY-MM-DD format
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
