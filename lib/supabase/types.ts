// This file will be auto-generated when you run:
// npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts
//
// Or using the Supabase CLI:
// supabase gen types typescript --local > lib/supabase/types.ts
//
// For now, this is a placeholder. Replace with your generated types.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      // Your tables will be defined here after running type generation
      // Example:
      // requests: {
      //   Row: {
      //     id: string
      //     customer_id: string | null
      //     service_id: string
      //     // ... other fields
      //   }
      //   Insert: {
      //     id?: string
      //     customer_id?: string | null
      //     // ... other fields
      //   }
      //   Update: {
      //     id?: string
      //     customer_id?: string | null
      //     // ... other fields
      //   }
      // }
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
