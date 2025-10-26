import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

/**
 * GET /api/weekly-planning/[year]/[week]
 * Fetch user's weekly plan for a specific week
 */
export async function GET(request: NextRequest, { params }: { params: { year: string; week: string } }) {
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

    const year = parseInt(params.year)
    const week = parseInt(params.week)

    // Validate parameters
    if (isNaN(year) || isNaN(week) || week < 1 || week > 53) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
    }

    // First, try to get existing weekly plan
    const { data: weeklyPlan, error: planError } = await supabase
      .from('weekly_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('year', year)
      .eq('week_number', week)
      .single()

    // If no plan exists, return empty structure
    if (planError || !weeklyPlan) {
      return NextResponse.json({
        weeklyPlan: null,
        modules: [],
      })
    }

    // Get all modules for this weekly plan
    const { data: modules, error: modulesError } = await supabase
      .from('weekly_plan_modules')
      .select('*')
      .eq('weekly_plan_id', weeklyPlan.id)
      .order('day_of_week', { ascending: true })
      .order('order_index', { ascending: true })

    if (modulesError) {
      console.error('Error fetching weekly plan modules:', modulesError)
      return NextResponse.json({ error: 'Erro ao buscar módulos do planeamento' }, { status: 500 })
    }

    return NextResponse.json({
      weeklyPlan,
      modules: modules || [],
    })
  } catch (error) {
    console.error('Error in GET /api/weekly-planning/[year]/[week]:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
