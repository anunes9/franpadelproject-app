'use server'

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Mark a module as completed for the current user
 */
export async function markModuleComplete(moduleExternalId: string) {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Insert or update module progress
  const { error } = await supabase
    .from('module_progress')
    .upsert({
      user_id: user.id,
      module_external_id: moduleExternalId,
      status: 'completed',
      completed_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,module_external_id'
    })

  if (error) {
    console.error('Error marking module as complete:', error)
    throw error
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/beginner')
  revalidatePath('/dashboard/intermediate')
}

/**
 * Mark an exercise as completed for the current user
 */
export async function markExerciseComplete(exerciseExternalId: string) {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Insert or update exercise progress
  const { error } = await supabase
    .from('exercise_progress')
    .upsert({
      user_id: user.id,
      exercise_external_id: exerciseExternalId,
      completed_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,exercise_external_id'
    })

  if (error) {
    console.error('Error marking exercise as complete:', error)
    throw error
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/exercises')
}

/**
 * Get completion stats for the dashboard
 */
export async function getCompletionStats() {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      modulesCompleted: 0,
      exercisesCompleted: 0
    }
  }

  // Get completed modules count
  const { count: modulesCount, error: modulesError } = await supabase
    .from('module_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'completed')

  if (modulesError) {
    console.error('Error fetching module progress:', modulesError)
  }

  // Get completed exercises count
  const { count: exercisesCount, error: exercisesError } = await supabase
    .from('exercise_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (exercisesError) {
    console.error('Error fetching exercise progress:', exercisesError)
  }

  return {
    modulesCompleted: modulesCount || 0,
    exercisesCompleted: exercisesCount || 0
  }
}

/**
 * Check if a module is completed for the current user
 */
export async function isModuleComplete(moduleExternalId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return false
  }

  const { data, error } = await supabase
    .from('module_progress')
    .select('status')
    .eq('user_id', user.id)
    .eq('module_external_id', moduleExternalId)
    .eq('status', 'completed')
    .single()

  if (error || !data) {
    return false
  }

  return true
}

/**
 * Check if an exercise is completed for the current user
 */
export async function isExerciseComplete(exerciseExternalId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return false
  }

  const { data, error } = await supabase
    .from('exercise_progress')
    .select('id')
    .eq('user_id', user.id)
    .eq('exercise_external_id', exerciseExternalId)
    .single()

  if (error || !data) {
    return false
  }

  return true
}

/**
 * Get module completion status for multiple modules
 */
export async function getModuleCompletionStatus(moduleExternalIds: string[]): Promise<Record<string, boolean>> {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || moduleExternalIds.length === 0) {
    return {}
  }

  const { data, error } = await supabase
    .from('module_progress')
    .select('module_external_id')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .in('module_external_id', moduleExternalIds)

  if (error) {
    console.error('Error fetching module completion status:', error)
    return {}
  }

  const completedModules = new Set(data?.map(m => m.module_external_id) || [])
  const statusMap: Record<string, boolean> = {}
  
  moduleExternalIds.forEach(id => {
    statusMap[id] = completedModules.has(id)
  })

  return statusMap
}

/**
 * Get exercise completion status for multiple exercises
 */
export async function getExerciseCompletionStatus(exerciseExternalIds: string[]): Promise<Record<string, boolean>> {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || exerciseExternalIds.length === 0) {
    return {}
  }

  const { data, error } = await supabase
    .from('exercise_progress')
    .select('exercise_external_id')
    .eq('user_id', user.id)
    .in('exercise_external_id', exerciseExternalIds)

  if (error) {
    console.error('Error fetching exercise completion status:', error)
    return {}
  }

  const completedExercises = new Set(data?.map(e => e.exercise_external_id) || [])
  const statusMap: Record<string, boolean> = {}
  
  exerciseExternalIds.forEach(id => {
    statusMap[id] = completedExercises.has(id)
  })

  return statusMap
}

/**
 * Get current user profile
 */
export async function getUserProfile() {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}
