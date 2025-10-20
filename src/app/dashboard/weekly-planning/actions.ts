'use server'

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { getAllModules } from '@/lib/contentful/modules-delivery'
import { Module } from '@/lib/contentful/modules-delivery'
import { revalidatePath } from 'next/cache'

export interface WeeklyPlanModule {
  id: string
  weekly_plan_id: string
  module_external_id: string
  day_of_week: number
  order_index: number
  notes: string | null
  created_at: string
  updated_at: string
  module?: Module // Populated from Contentful
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
  modules: WeeklyPlanModule[]
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
        modules: [],
      }
    }

    // Get all modules for this weekly plan
    const { data: planModules, error: modulesError } = await supabase
      .from('weekly_plan_modules')
      .select('*')
      .eq('weekly_plan_id', weeklyPlan.id)
      .order('day_of_week', { ascending: true })
      .order('order_index', { ascending: true })

    if (modulesError) {
      console.error('Error fetching weekly plan modules:', modulesError)
      throw new Error('Erro ao buscar módulos do planeamento')
    }

    // Fetch all modules from Contentful
    const allModules = await getAllModules()

    // Map module details from Contentful to plan modules
    const modulesWithDetails: WeeklyPlanModule[] = (planModules || []).map((planModule) => {
      const moduleDetails = allModules.find((m) => m.externalId === planModule.module_external_id)
      return {
        ...planModule,
        module: moduleDetails,
      }
    })

    return {
      weeklyPlan,
      modules: modulesWithDetails,
    }
  } catch (error) {
    console.error('Error in getWeeklyPlan:', error)
    return null
  }
}

/**
 * Add a module to a specific day in the weekly plan
 */
export async function addModuleToDay(
  year: number,
  week: number,
  moduleExternalId: string,
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

    // Insert the module
    const { error: insertError } = await supabase.from('weekly_plan_modules').insert({
      weekly_plan_id: weeklyPlanId,
      module_external_id: moduleExternalId,
      day_of_week: dayOfWeek,
      order_index: orderIndex,
    })

    if (insertError) {
      console.error('Error inserting module:', insertError)
      return { success: false, error: 'Erro ao adicionar módulo' }
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
 * Remove a module from the weekly plan
 */
export async function removeModuleFromDay(moduleId: string): Promise<{ success: boolean; error?: string }> {
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

    // Delete the module (RLS will ensure user owns it)
    const { error: deleteError } = await supabase.from('weekly_plan_modules').delete().eq('id', moduleId)

    if (deleteError) {
      console.error('Error deleting module:', deleteError)
      return { success: false, error: 'Erro ao remover módulo' }
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
 * Update module order or notes
 */
export async function updateModuleOrder(
  moduleId: string,
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

    // Update the module
    const { error: updateError } = await supabase
      .from('weekly_plan_modules')
      .update({ order_index: newOrderIndex })
      .eq('id', moduleId)

    if (updateError) {
      console.error('Error updating module order:', updateError)
      return { success: false, error: 'Erro ao atualizar ordem do módulo' }
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
