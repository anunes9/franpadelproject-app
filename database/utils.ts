import { createClient } from '../src/utils/supabase/client'

// Database utility functions for common operations
const supabase = createClient()

export const dbUtils = {
  // User operations
  async getUserById(id: string) {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single()

    if (error) throw error
    return data
  },

  async getCurrentUserProfile(userId: string) {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single()

    if (error) throw error
    return data
  },

  async getUsersByRole(role: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', role)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Client operations
  async getClients(options?: { salesmanId?: string; search?: string; limit?: number; offset?: number }) {
    let query = supabase.from('clients').select(`
        *,
        users!salesman_id (full_name)
      `)

    if (options?.salesmanId) {
      query = query.eq('salesman_id', options.salesmanId)
    }

    if (options?.search) {
      query = query.or(`
        email.ilike.%${options.search}%,
        full_name.ilike.%${options.search}%,
        phone.ilike.%${options.search}%
      `)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async getClientById(id: string) {
    const { data, error } = await supabase
      .from('clients')
      .select(
        `
        *,
        users!salesman_id (full_name)
      `
      )
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async getClientWithProducts(id: string) {
    // Get client details
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select(
        `
        *,
        users!salesman_id (full_name)
      `
      )
      .eq('id', id)
      .single()

    if (clientError) throw clientError

    // Get client's products through sales and client_products
    const { data: clientProducts, error: productsError } = await supabase
      .from('client_products')
      .select(
        `
        *,
        products (
          id,
          name,
          description,
          type,
          price,
          duration,
          is_active
        ),
        sales (
          id,
          sale_date,
          amount,
          payment_status,
          notes,
          users!salesman_id (full_name)
        )
      `
      )
      .eq('client_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (productsError) throw productsError

    return {
      client,
      products: clientProducts || [],
    }
  },

  async createClient(clientData: {
    email: string
    full_name: string
    phone?: string
    salesman_id?: string
    notes?: string
  }) {
    const { data, error } = await supabase.from('clients').insert(clientData).select().single()

    if (error) throw error
    return data
  },

  async updateClient(
    id: string,
    updates: Partial<{
      email: string
      full_name: string
      phone: string
      salesman_id: string
      notes: string
    }>
  ) {
    const { data, error } = await supabase.from('clients').update(updates).eq('id', id).select().single()

    if (error) throw error
    return data
  },

  async deleteClient(id: string) {
    const { error } = await supabase.from('clients').delete().eq('id', id)

    if (error) throw error
    return true
  },

  // Product operations
  async getProducts(options?: { type?: string; isActive?: boolean; search?: string; limit?: number; offset?: number }) {
    let query = supabase.from('products').select('*')

    if (options?.type) {
      query = query.eq('type', options.type)
    }

    if (options?.isActive !== undefined) {
      query = query.eq('is_active', options.isActive)
    }

    if (options?.search) {
      query = query.or(`
        name.ilike.%${options.search}%,
        description.ilike.%${options.search}%
      `)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async getProductById(id: string) {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single()

    if (error) throw error
    return data
  },

  async createProduct(productData: {
    name: string
    description?: string
    type: string
    price: number
    duration?: number
    is_active?: boolean
  }) {
    const { data, error } = await supabase.from('products').insert(productData).select().single()

    if (error) throw error
    return data
  },

  async updateProduct(
    id: string,
    updates: Partial<{
      name: string
      description: string
      type: string
      price: number
      duration: number
      is_active: boolean
    }>
  ) {
    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single()

    if (error) throw error
    return data
  },

  async deleteProduct(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id)

    if (error) throw error
    return true
  },

  // Sales operations
  async getSales(options?: {
    salesmanId?: string
    clientId?: string
    paymentStatus?: string
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  }) {
    let query = supabase.from('sales').select(`
        *,
        clients (full_name, email),
        products (name, type, price),
        users!salesman_id (full_name)
      `)

    if (options?.salesmanId) {
      query = query.eq('salesman_id', options.salesmanId)
    }

    if (options?.clientId) {
      query = query.eq('client_id', options.clientId)
    }

    if (options?.paymentStatus) {
      query = query.eq('payment_status', options.paymentStatus)
    }

    if (options?.startDate) {
      query = query.gte('sale_date', options.startDate)
    }

    if (options?.endDate) {
      query = query.lte('sale_date', options.endDate)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async getSaleById(id: string) {
    const { data, error } = await supabase
      .from('sales')
      .select(
        `
        *,
        clients (full_name, email),
        products (name, type, price),
        users!salesman_id (full_name)
      `
      )
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async createSale(saleData: {
    client_id: string
    product_id: string
    salesman_id: string
    amount: number
    payment_status?: string
    notes?: string
  }) {
    const { data, error } = await supabase.from('sales').insert(saleData).select().single()

    if (error) throw error
    return data
  },

  async updateSale(
    id: string,
    updates: Partial<{
      payment_status: string
      notes: string
    }>
  ) {
    const { data, error } = await supabase.from('sales').update(updates).eq('id', id).select().single()

    if (error) throw error
    return data
  },

  // Dashboard statistics
  async getDashboardStats() {
    // Get total sales
    const { data: salesData } = await supabase.from('sales').select('amount').eq('payment_status', 'paid')

    const totalSales = salesData?.length || 0
    const monthlyRevenue = salesData?.reduce((sum, sale) => sum + sale.amount, 0) || 0

    // Get total clients
    const { count: totalClients } = await supabase.from('clients').select('*', { count: 'exact', head: true })

    // Get active subscriptions
    const { count: activeSubscriptions } = await supabase
      .from('client_products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Get sales by salesman
    const { data: salesBySalesman } = await supabase
      .from('sales')
      .select(
        `
        salesman_id,
        amount,
        users!salesman_id (full_name)
      `
      )
      .eq('payment_status', 'paid')

    const salesmanStats =
      salesBySalesman?.reduce((acc, sale) => {
        // @ts-expect-error User has full_name
        const salesmanName = sale.users?.full_name || 'Unknown'
        if (!acc[salesmanName]) {
          acc[salesmanName] = { total_sales: 0, client_count: 0 }
        }
        acc[salesmanName].total_sales += sale.amount
        return acc
      }, {} as Record<string, { total_sales: number; client_count: number }>) || {}

    const salesBySalesmanArray = Object.entries(salesmanStats).map(([salesman_name, stats]) => ({
      salesman_name,
      ...stats,
    }))

    // Get recent sales
    const { data: recentSales } = await supabase
      .from('sales')
      .select(
        `
        *,
        clients (full_name, email),
        products (name, type, price),
        users!salesman_id (full_name)
      `
      )
      .order('created_at', { ascending: false })
      .limit(10)

    return {
      totalSales,
      totalClients: totalClients || 0,
      activeSubscriptions: activeSubscriptions || 0,
      monthlyRevenue,
      salesBySalesman: salesBySalesmanArray,
      recentSales: recentSales || [],
    }
  },
}
