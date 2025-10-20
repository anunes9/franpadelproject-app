import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * DELETE /api/weekly-planning/module/[id]
 * Remove a module from the weekly plan
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const moduleId = params.id

    if (!moduleId) {
      return NextResponse.json({ error: 'ID do módulo em falta' }, { status: 400 })
    }

    // Verify the module belongs to the user before deleting
    const { data: module, error: fetchError } = await supabase
      .from('weekly_plan_modules')
      .select(
        `
        id,
        weekly_plan_id,
        weekly_plans!inner(user_id)
      `
      )
      .eq('id', moduleId)
      .single()

    if (fetchError || !module) {
      return NextResponse.json({ error: 'Módulo não encontrado' }, { status: 404 })
    }

    // The RLS policy will handle authorization, but we can add extra check
    // @ts-ignore - TypeScript doesn't understand the nested structure
    if (module.weekly_plans.user_id !== user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Delete the module
    const { error: deleteError } = await supabase.from('weekly_plan_modules').delete().eq('id', moduleId)

    if (deleteError) {
      console.error('Error deleting module:', deleteError)
      return NextResponse.json({ error: 'Erro ao remover módulo' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/weekly-planning/module/[id]:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

/**
 * PUT /api/weekly-planning/module/[id]
 * Update module order or notes
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const moduleId = params.id
    const body = await request.json()
    const { orderIndex, notes } = body

    if (!moduleId) {
      return NextResponse.json({ error: 'ID do módulo em falta' }, { status: 400 })
    }

    // Verify the module belongs to the user
    const { data: module, error: fetchError } = await supabase
      .from('weekly_plan_modules')
      .select(
        `
        id,
        weekly_plan_id,
        weekly_plans!inner(user_id)
      `
      )
      .eq('id', moduleId)
      .single()

    if (fetchError || !module) {
      return NextResponse.json({ error: 'Módulo não encontrado' }, { status: 404 })
    }

    // Build update object with only provided fields
    const updateData: any = {}

    if (orderIndex !== undefined && orderIndex !== null) {
      if (typeof orderIndex !== 'number') {
        return NextResponse.json({ error: 'Índice de ordem inválido' }, { status: 400 })
      }
      updateData.order_index = orderIndex
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    // Update the module
    const { data: updatedModule, error: updateError } = await supabase
      .from('weekly_plan_modules')
      .update(updateData)
      .eq('id', moduleId)
      .select()
      .single()

    if (updateError || !updatedModule) {
      console.error('Error updating module:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar módulo' }, { status: 500 })
    }

    return NextResponse.json(updatedModule)
  } catch (error) {
    console.error('Error in PUT /api/weekly-planning/module/[id]:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
