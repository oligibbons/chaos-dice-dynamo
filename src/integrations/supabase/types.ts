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
      chaos_events: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string
          effect: Json
          id: string
          name: string
          rarity: string | null
          trigger_condition: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description: string
          effect: Json
          id?: string
          name: string
          rarity?: string | null
          trigger_condition?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string
          effect?: Json
          id?: string
          name?: string
          rarity?: string | null
          trigger_condition?: string | null
        }
        Relationships: []
      }
      game_players: {
        Row: {
          game_id: string
          id: string
          is_ready: boolean | null
          joined_at: string | null
          player_id: string
          score: number | null
          scorecard: Json | null
          turn_order: number
        }
        Insert: {
          game_id: string
          id?: string
          is_ready?: boolean | null
          joined_at?: string | null
          player_id: string
          score?: number | null
          scorecard?: Json | null
          turn_order: number
        }
        Update: {
          game_id?: string
          id?: string
          is_ready?: boolean | null
          joined_at?: string | null
          player_id?: string
          score?: number | null
          scorecard?: Json | null
          turn_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_scorecards: {
        Row: {
          category: string
          created_at: string | null
          game_id: string
          id: string
          player_id: string
          round_scored: number
          score: number
        }
        Insert: {
          category: string
          created_at?: string | null
          game_id: string
          id?: string
          player_id: string
          round_scored: number
          score: number
        }
        Update: {
          category?: string
          created_at?: string | null
          game_id?: string
          id?: string
          player_id?: string
          round_scored?: number
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_scorecards_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_turns: {
        Row: {
          completed_at: string | null
          created_at: string | null
          dice_rolls: Json | null
          game_id: string
          id: string
          player_id: string
          score_earned: number | null
          selected_category: string | null
          turn_number: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          dice_rolls?: Json | null
          game_id: string
          id?: string
          player_id: string
          score_earned?: number | null
          selected_category?: string | null
          turn_number: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          dice_rolls?: Json | null
          game_id?: string
          id?: string
          player_id?: string
          score_earned?: number | null
          selected_category?: string | null
          turn_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_turns_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          chaos_events: Json | null
          created_at: string | null
          current_player_turn: number | null
          current_players: number | null
          current_round: number | null
          finished_at: string | null
          game_code: string | null
          host_id: string
          id: string
          max_players: number | null
          max_rounds: number | null
          name: string
          started_at: string | null
          status: string | null
          turn_start_time: string | null
        }
        Insert: {
          chaos_events?: Json | null
          created_at?: string | null
          current_player_turn?: number | null
          current_players?: number | null
          current_round?: number | null
          finished_at?: string | null
          game_code?: string | null
          host_id: string
          id?: string
          max_players?: number | null
          max_rounds?: number | null
          name: string
          started_at?: string | null
          status?: string | null
          turn_start_time?: string | null
        }
        Update: {
          chaos_events?: Json | null
          created_at?: string | null
          current_player_turn?: number | null
          current_players?: number | null
          current_round?: number | null
          finished_at?: string | null
          game_code?: string | null
          host_id?: string
          id?: string
          max_players?: number | null
          max_rounds?: number | null
          name?: string
          started_at?: string | null
          status?: string | null
          turn_start_time?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      advance_game_turn: {
        Args: { game_uuid: string }
        Returns: undefined
      }
      check_game_completion: {
        Args: { game_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
