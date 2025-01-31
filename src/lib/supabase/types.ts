export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          user_type: 'client' | 'provider'
          credits: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          user_type: 'client' | 'provider'
          credits?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          user_type?: 'client' | 'provider'
          credits?: number
          created_at?: string
          updated_at?: string
        }
      }
      provider_profiles: {
        Row: {
          id: string
          skills: string[] | null
          experience: string | null
          hourly_rate: number | null
          is_verified: boolean
          rating: number
          total_reviews: number
          subscription_type: 'free' | 'premium'
          subscription_expires_at: string | null
        }
        Insert: {
          id: string
          skills?: string[] | null
          experience?: string | null
          hourly_rate?: number | null
          is_verified?: boolean
          rating?: number
          total_reviews?: number
          subscription_type?: 'free' | 'premium'
          subscription_expires_at?: string | null
        }
        Update: {
          id?: string
          skills?: string[] | null
          experience?: string | null
          hourly_rate?: number | null
          is_verified?: boolean
          rating?: number
          total_reviews?: number
          subscription_type?: 'free' | 'premium'
          subscription_expires_at?: string | null
        }
      }
      services: {
        Row: {
          id: string
          client_id: string
          title: string
          description: string
          category: string
          budget: number
          location: string
          deadline: string | null
          status: 'open' | 'in_progress' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          title: string
          description: string
          category: string
          budget: number
          location: string
          deadline?: string | null
          status?: 'open' | 'in_progress' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          title?: string
          description?: string
          category?: string
          budget?: number
          location?: string
          deadline?: string | null
          status?: 'open' | 'in_progress' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      service_applications: {
        Row: {
          id: string
          service_id: string
          provider_id: string
          proposed_price: number
          message: string | null
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
        }
        Insert: {
          id?: string
          service_id: string
          provider_id: string
          proposed_price: number
          message?: string | null
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
        }
        Update: {
          id?: string
          service_id?: string
          provider_id?: string
          proposed_price?: number
          message?: string | null
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: 'credit_purchase' | 'service_payment' | 'service_earning'
          status: 'pending' | 'completed' | 'failed'
          payment_method: string | null
          service_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: 'credit_purchase' | 'service_payment' | 'service_earning'
          status?: 'pending' | 'completed' | 'failed'
          payment_method?: string | null
          service_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          type?: 'credit_purchase' | 'service_payment' | 'service_earning'
          status?: 'pending' | 'completed' | 'failed'
          payment_method?: string | null
          service_id?: string | null
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          service_id: string
          reviewer_id: string
          reviewed_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          service_id: string
          reviewer_id: string
          reviewed_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          service_id?: string
          reviewer_id?: string
          reviewed_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
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
      [_ in never]: never
    }
  }
}