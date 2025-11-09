'use server'

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { getAllModules, Module } from '@/lib/contentful/modules-delivery'
import { getAllExercises, Exercise } from '@/lib/contentful/exercises-delivery'
import { revalidatePath } from 'next/cache'

export interface WeeklyPlanItem {
  id: string
  weekly_plan_id: string
  item_external_id: string
  item_type: 'module' | 'exercise'
  day_of_week: number
  order_index: number
  notes: string | null
  created_at: string
  updated_at: string
  module?: Module // Populated from Contentful if type is 'module'
  exercise?: Exercise // Populated from Contentful if type is 'exercise'
}

export interface WeeklyPlan {
  id: string
  user_id: string
  year: number
  week_number: number
  created_at: string
  updated_at: string
}

export interface WeeklyPlanData {
  weeklyPlan: WeeklyPlan | null
  items: WeeklyPlanItem[]
}

/**
 * Fetch weekly plan for a specific week with full module details from Contentful
 */
export async function getWeeklyPlan(year: number, week: number): Promise<WeeklyPlanData | null> {
  try {
    const supabase = await createSupabaseServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Não autorizado')
    }

    // Get weekly plan
    const { data: weeklyPlan, error: planError } = await supabase
      .from('weekly_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('year', year)
      .eq('week_number', week)
      .single()

    // If no plan exists, return empty structure
    if (planError || !weeklyPlan) {
      return {
        weeklyPlan: null,
        items: [],
      }
    }

    // Get all items for this weekly plan
    const { data: planItems, error: itemsError } = await supabase
      .from('weekly_plan_modules')
      .select('*')
      .eq('weekly_plan_id', weeklyPlan.id)
      .order('day_of_week', { ascending: true })
      .order('order_index', { ascending: true })

    if (itemsError) {
      console.error('Error fetching weekly plan items:', itemsError)
      throw new Error('Erro ao buscar itens do planeamento')
    }

    // Fetch all modules and exercises from Contentful in parallel
    const [allModules, allExercises] = await Promise.all([getAllModules(), getAllExercises()])

    // Map details from Contentful to plan items based on type
    const itemsWithDetails: WeeklyPlanItem[] = (planItems || []).map((planItem) => {
      if (planItem.item_type === 'exercise') {
        const exerciseDetails = allExercises.find((e) => e.externalId === planItem.item_external_id)
        return {
          ...planItem,
          exercise: exerciseDetails,
        }
      } else {
        const moduleDetails = allModules.find((m) => m.externalId === planItem.item_external_id)
        return {
          ...planItem,
          module: moduleDetails,
        }
      }
    })

    return {
      weeklyPlan,
      items: itemsWithDetails,
    }
  } catch (error) {
    console.error('Error in getWeeklyPlan:', error)
    return null
  }
}

/**
 * Add an item (module or exercise) to a specific day in the weekly plan
 */
export async function addItemToDay(
  year: number,
  week: number,
  itemExternalId: string,
  itemType: 'module' | 'exercise',
  dayOfWeek: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autorizado' }
    }

    // Validate inputs
    if (week < 1 || week > 53 || dayOfWeek < 1 || dayOfWeek > 7) {
      return { success: false, error: 'Parâmetros inválidos' }
    }

    // First, ensure weekly plan exists
    let weeklyPlanId: string

    const { data: existingPlan } = await supabase
      .from('weekly_plans')
      .select('id')
      .eq('user_id', user.id)
      .eq('year', year)
      .eq('week_number', week)
      .single()

    if (existingPlan) {
      weeklyPlanId = existingPlan.id
    } else {
      // Create new weekly plan
      const { data: newPlan, error: createError } = await supabase
        .from('weekly_plans')
        .insert({
          user_id: user.id,
          year,
          week_number: week,
        })
        .select('id')
        .single()

      if (createError || !newPlan) {
        console.error('Error creating weekly plan:', createError)
        return { success: false, error: 'Erro ao criar planeamento semanal' }
      }

      weeklyPlanId = newPlan.id
    }

    // Get next order index for this day
    const { data: existingModules } = await supabase
      .from('weekly_plan_modules')
      .select('order_index')
      .eq('weekly_plan_id', weeklyPlanId)
      .eq('day_of_week', dayOfWeek)
      .order('order_index', { ascending: false })
      .limit(1)

    let orderIndex = 0
    if (existingModules && existingModules.length > 0) {
      orderIndex = existingModules[0].order_index + 1
    }

    // Insert the item
    const { error: insertError } = await supabase.from('weekly_plan_modules').insert({
      weekly_plan_id: weeklyPlanId,
      item_external_id: itemExternalId,
      item_type: itemType,
      day_of_week: dayOfWeek,
      order_index: orderIndex,
    })

    if (insertError) {
      console.error('Error inserting item:', insertError)
      return { success: false, error: 'Erro ao adicionar item' }
    }

    // Revalidate the page
    revalidatePath(`/dashboard/weekly-planning`)

    return { success: true }
  } catch (error) {
    console.error('Error in addModuleToDay:', error)
    return { success: false, error: 'Erro interno do servidor' }
  }
}

/**
 * Remove an item from the weekly plan
 */
export async function removeItemFromDay(itemId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autorizado' }
    }

    // Delete the item (RLS will ensure user owns it)
    const { error: deleteError } = await supabase.from('weekly_plan_modules').delete().eq('id', itemId)

    if (deleteError) {
      console.error('Error deleting item:', deleteError)
      return { success: false, error: 'Erro ao remover item' }
    }

    // Revalidate the page
    revalidatePath(`/dashboard/weekly-planning`)

    return { success: true }
  } catch (error) {
    console.error('Error in removeModuleFromDay:', error)
    return { success: false, error: 'Erro interno do servidor' }
  }
}

/**
 * Update item order or notes
 */
export async function updateItemOrder(
  itemId: string,
  newOrderIndex: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autorizado' }
    }

    // Update the item
    const { error: updateError } = await supabase
      .from('weekly_plan_modules')
      .update({ order_index: newOrderIndex })
      .eq('id', itemId)

    if (updateError) {
      console.error('Error updating item order:', updateError)
      return { success: false, error: 'Erro ao atualizar ordem do item' }
    }

    // Revalidate the page
    revalidatePath(`/dashboard/weekly-planning`)

    return { success: true }
  } catch (error) {
    console.error('Error in updateModuleOrder:', error)
    return { success: false, error: 'Erro interno do servidor' }
  }
}

/**
 * Get all available modules from Contentful
 */
export async function getAvailableModules(): Promise<Module[]> {
  try {
    return await getAllModules()
  } catch (error) {
    console.error('Error fetching available modules:', error)
    return []
  }
}

/**
 * Get all available exercises from Contentful
 */
export async function getAvailableExercises(): Promise<Exercise[]> {
  try {
    return await getAllExercises()
  } catch (error) {
    console.error('Error fetching available exercises:', error)
    return []
  }
}

/**
 * Get details for a specific day with full module and exercise information
 */
export async function getDayDetails(
  year: number,
  week: number,
  dayOfWeek: number
): Promise<{
  date: Date
  items: WeeklyPlanItem[]
  weekInfo: { year: number; week: number }
} | null> {
  try {
    const supabase = await createSupabaseServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Não autorizado')
    }

    // Get or create weekly plan
    const { data: weeklyPlan } = await supabase
      .from('weekly_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('year', year)
      .eq('week_number', week)
      .single()

    // If no plan exists, return empty with date info
    if (!weeklyPlan) {
      const { getDateForDay } = await import('@/utils/date-helpers')
      const date = getDateForDay(year, week, dayOfWeek)
      return {
        date,
        items: [],
        weekInfo: { year, week },
      }
    }

    // Get items for this specific day
    const { data: planItems, error: itemsError } = await supabase
      .from('weekly_plan_modules')
      .select('*')
      .eq('weekly_plan_id', weeklyPlan.id)
      .eq('day_of_week', dayOfWeek)
      .order('order_index', { ascending: true })

    if (itemsError) {
      console.error('Error fetching day items:', itemsError)
      throw new Error('Erro ao buscar itens do dia')
    }

    // Fetch all modules and exercises from Contentful in parallel
    const [allModules, allExercises] = await Promise.all([getAllModules(), getAllExercises()])

    // Map details from Contentful to plan items based on type
    const itemsWithDetails: WeeklyPlanItem[] = (planItems || []).map((planItem) => {
      if (planItem.item_type === 'exercise') {
        const exerciseDetails = allExercises.find((e) => e.externalId === planItem.item_external_id)
        return {
          ...planItem,
          exercise: exerciseDetails,
        }
      } else {
        const moduleDetails = allModules.find((m) => m.externalId === planItem.item_external_id)
        return {
          ...planItem,
          module: moduleDetails,
        }
      }
    })

    const { getDateForDay } = await import('@/utils/date-helpers')
    const date = getDateForDay(year, week, dayOfWeek)

    return {
      date,
      items: itemsWithDetails,
      weekInfo: { year, week },
    }
  } catch (error) {
    console.error('Error in getDayDetails:', error)
    return null
  }
}
