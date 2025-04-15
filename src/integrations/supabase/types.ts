export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          category_id: string
          color: string | null
          created_at: string | null
          id: string
          name: string
          type: string
          user_email: string
        }
        Insert: {
          category_id: string
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          type: string
          user_email: string
        }
        Update: {
          category_id?: string
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          type?: string
          user_email?: string
        }
        Relationships: []
      }
      ideas: {
        Row: {
          countdown_timer: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          image_url: string | null
          learn_more_link: string | null
          live_project_link: string | null
          name: string
        }
        Insert: {
          countdown_timer: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          image_url?: string | null
          learn_more_link?: string | null
          live_project_link?: string | null
          name: string
        }
        Update: {
          countdown_timer?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          image_url?: string | null
          learn_more_link?: string | null
          live_project_link?: string | null
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          backup_last_date: string | null
          created_at: string | null
          currency_preference: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          backup_last_date?: string | null
          created_at?: string | null
          currency_preference?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          backup_last_date?: string | null
          created_at?: string | null
          currency_preference?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          date: string
          description: string | null
          emotional_state: string | null
          id: string
          transaction_id: string
          type: string
          user_email: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          emotional_state?: string | null
          id?: string
          transaction_id: string
          type: string
          user_email: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          emotional_state?: string | null
          id?: string
          transaction_id?: string
          type?: string
          user_email?: string
        }
        Relationships: []
      }
      user_uuids: {
        Row: {
          created_at: string
          email: string
          id: number
          uuid: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: number
          uuid?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: number
          uuid?: string | null
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string
          id: string
          idea_id: string | null
          user_id: string | null
          vote_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id?: string | null
          user_id?: string | null
          vote_type: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string | null
          user_id?: string | null
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
