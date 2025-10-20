import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * POST /api/weekly-planning
 * Add a module to a specific day in the weekly plan
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { year, week, moduleExternalId, dayOfWeek, orderIndex, notes } = body

    // Validate required fields
    if (!year || !week || !moduleExternalId || !dayOfWeek) {
      return NextResponse.json({ error: 'Campos obrigatórios em falta' }, { status: 400 })
    }

    // Validate field types and ranges
    if (
      typeof year !== 'number' ||
      typeof week !== 'number' ||
      typeof dayOfWeek !== 'number' ||
      week < 1 ||
      week > 53 ||
      dayOfWeek < 1 ||
      dayOfWeek > 7
    ) {
      return NextResponse.json({ error: 'Valores de campos inválidos' }, { status: 400 })
    }

    // First, ensure weekly plan exists for this user/year/week
    let weeklyPlanId: string

    const { data: existingPlan, error: findError } = await supabase
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
        return NextResponse.json({ error: 'Erro ao criar planeamento semanal' }, { status: 500 })
      }

      weeklyPlanId = newPlan.id
    }

    // If no orderIndex provided, get the next available order for this day
    let finalOrderIndex = orderIndex ?? 0

    if (orderIndex === undefined || orderIndex === null) {
      const { data: existingModules } = await supabase
        .from('weekly_plan_modules')
        .select('order_index')
        .eq('weekly_plan_id', weeklyPlanId)
        .eq('day_of_week', dayOfWeek)
        .order('order_index', { ascending: false })
        .limit(1)

      if (existingModules && existingModules.length > 0) {
        finalOrderIndex = existingModules[0].order_index + 1
      }
    }

    // Insert the module
    const { data: newModule, error: insertError } = await supabase
      .from('weekly_plan_modules')
      .insert({
        weekly_plan_id: weeklyPlanId,
        module_external_id: moduleExternalId,
        day_of_week: dayOfWeek,
        order_index: finalOrderIndex,
        notes: notes || null,
      })
      .select()
      .single()

    if (insertError || !newModule) {
      console.error('Error inserting module:', insertError)
      return NextResponse.json({ error: 'Erro ao adicionar módulo' }, { status: 500 })
    }

    return NextResponse.json(newModule, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/weekly-planning:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
