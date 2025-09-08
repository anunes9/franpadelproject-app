// Database types for FranPadelProject Admin
// Generated types matching the PostgreSQL schema

export type UserRole = 'admin' | 'sales' | 'client'
export type ProductType = 'course' | 'clinic' | 'formation'
export type PaymentStatus = 'pending' | 'paid' | 'cancelled'
export type ModuleStatus = 'not_started' | 'in_progress' | 'completed'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: UserRole
          avatar_url: string | null
          club_name: string | null
          club_avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: UserRole
          avatar_url?: string | null
          club_name?: string | null
          club_avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: UserRole
          avatar_url?: string | null
          club_name?: string | null
          club_avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          salesman_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          phone?: string | null
          salesman_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          salesman_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          type: ProductType
          price: number
          duration: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          type: ProductType
          price: number
          duration?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          type?: ProductType
          price?: number
          duration?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          client_id: string
          product_id: string
          salesman_id: string
          sale_date: string
          amount: number
          payment_status: PaymentStatus
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          product_id: string
          salesman_id: string
          sale_date?: string
          amount: number
          payment_status?: PaymentStatus
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          product_id?: string
          salesman_id?: string
          sale_date?: string
          amount?: number
          payment_status?: PaymentStatus
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      client_products: {
        Row: {
          id: string
          client_id: string
          product_id: string
          sale_id: string
          access_start_date: string
          access_end_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          product_id: string
          sale_id: string
          access_start_date?: string
          access_end_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          product_id?: string
          sale_id?: string
          access_start_date?: string
          access_end_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      quiz_attempts: {
        Row: {
          id: string
          user_id: string
          module_external_id: string
          attempt_number: number
          responses: any // JSONB
          total_questions: number
          correct_answers: number
          score_percentage: number
          time_spent_seconds: number | null
          completed_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          module_external_id: string
          attempt_number?: number
          responses: any // JSONB
          total_questions: number
          correct_answers?: number
          score_percentage?: number
          time_spent_seconds?: number | null
          completed_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          module_external_id?: string
          attempt_number?: number
          responses?: any // JSONB
          total_questions?: number
          correct_answers?: number
          score_percentage?: number
          time_spent_seconds?: number | null
          completed_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      module_progress: {
        Row: {
          id: string
          user_id: string
          module_external_id: string
          status: ModuleStatus
          best_score: number | null
          total_attempts: number
          first_attempt_at: string | null
          last_attempt_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          module_external_id: string
          status?: ModuleStatus
          best_score?: number | null
          total_attempts?: number
          first_attempt_at?: string | null
          last_attempt_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          module_external_id?: string
          status?: ModuleStatus
          best_score?: number | null
          total_attempts?: number
          first_attempt_at?: string | null
          last_attempt_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      product_type: ProductType
      payment_status: PaymentStatus
      module_status: ModuleStatus
    }
  }
}
