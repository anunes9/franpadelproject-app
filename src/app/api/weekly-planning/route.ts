import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

/**
 * POST /api/weekly-planning
 * Add a module to a specific day in the weekly plan
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

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
    const { year, week, itemExternalId, itemType, dayOfWeek, orderIndex, notes } = body

    // Validate required fields
    if (!year || !week || !itemExternalId || !itemType || !dayOfWeek) {
      return NextResponse.json({ error: 'Campos obrigatórios em falta' }, { status: 400 })
    }

    // Validate item type
    if (itemType !== 'module' && itemType !== 'exercise') {
      return NextResponse.json({ error: 'Tipo de item inválido' }, { status: 400 })
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

    // Insert the item
    const { data: newItem, error: insertError } = await supabase
      .from('weekly_plan_modules')
      .insert({
        weekly_plan_id: weeklyPlanId,
        item_external_id: itemExternalId,
        item_type: itemType,
        day_of_week: dayOfWeek,
        order_index: finalOrderIndex,
        notes: notes || null,
      })
      .select()
      .single()

    if (insertError || !newItem) {
      console.error('Error inserting item:', insertError)
      return NextResponse.json({ error: 'Erro ao adicionar item' }, { status: 500 })
    }

    return NextResponse.json(newItem, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/weekly-planning:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
