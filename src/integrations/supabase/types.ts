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
      campaign_recommendations: {
        Row: {
          budget: string
          created_at: string
          description: string
          difficulty: string
          id: string
          insights: string[]
          platform: string
          roi: string
          title: string
          website_url: string
        }
        Insert: {
          budget: string
          created_at?: string
          description: string
          difficulty: string
          id?: string
          insights: string[]
          platform: string
          roi: string
          title: string
          website_url: string
        }
        Update: {
          budget?: string
          created_at?: string
          description?: string
          difficulty?: string
          id?: string
          insights?: string[]
          platform?: string
          roi?: string
          title?: string
          website_url?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          campaign_type: string | null
          channel_id: string
          content: string
          created_at: string
          id: string
          role: string
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          campaign_type?: string | null
          channel_id: string
          content: string
          created_at?: string
          id?: string
          role: string
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          campaign_type?: string | null
          channel_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "user_chat_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_reddit_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string
          subreddit: string
          title: string
          website_url: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url: string
          subreddit: string
          title: string
          website_url: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string
          subreddit?: string
          title?: string
          website_url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      session: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: string | null
          token: string
          updated_at: string
          user_agent: string | null
          user_id: string | null
          website: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id: string
          ip_address?: string | null
          token: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          website: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          token?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          website?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      subreddit_recommendations: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          subreddit: string
          website_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          subreddit: string
          website_url: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          subreddit?: string
          website_url?: string
        }
        Relationships: []
      }
      user: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_actions: {
        Row: {
          action_type: string
          chat_data: Json | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          reddit_posts: Json | null
          session_id: string | null
          subreddit_recommendations: Json | null
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          action_type: string
          chat_data?: Json | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          reddit_posts?: Json | null
          session_id?: string | null
          subreddit_recommendations?: Json | null
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          action_type?: string
          chat_data?: Json | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          reddit_posts?: Json | null
          session_id?: string | null
          subreddit_recommendations?: Json | null
          user_id?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      user_chat_channels: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_chat_history: {
        Row: {
          ai_response: string
          created_at: string
          id: string
          user_id: string | null
          user_prompt: string
          website_url: string
        }
        Insert: {
          ai_response: string
          created_at?: string
          id?: string
          user_id?: string | null
          user_prompt: string
          website_url: string
        }
        Update: {
          ai_response?: string
          created_at?: string
          id?: string
          user_id?: string | null
          user_prompt?: string
          website_url?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          created_at: string
          email: string
          feedback: string
          id: string
          name: string
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string
          email: string
          feedback: string
          id?: string
          name: string
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          feedback?: string
          id?: string
          name?: string
          user_id?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      website_analyses: {
        Row: {
          constraints: string[]
          core_value_proposition: string
          created_at: string
          current_stage: string
          goals: string[]
          id: string
          preferred_channels: string[]
          product_overview: string
          strengths: string[]
          suggested_budget: string
          target_audience_segments: string[]
          target_audience_type: string
          tone_and_personality: string
          updated_at: string
          website_url: string
        }
        Insert: {
          constraints: string[]
          core_value_proposition: string
          created_at?: string
          current_stage: string
          goals: string[]
          id?: string
          preferred_channels: string[]
          product_overview: string
          strengths: string[]
          suggested_budget: string
          target_audience_segments: string[]
          target_audience_type: string
          tone_and_personality: string
          updated_at?: string
          website_url: string
        }
        Update: {
          constraints?: string[]
          core_value_proposition?: string
          created_at?: string
          current_stage?: string
          goals?: string[]
          id?: string
          preferred_channels?: string[]
          product_overview?: string
          strengths?: string[]
          suggested_budget?: string
          target_audience_segments?: string[]
          target_audience_type?: string
          tone_and_personality?: string
          updated_at?: string
          website_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      insert_session: {
        Args: { session_data: Json }
        Returns: undefined
      }
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
