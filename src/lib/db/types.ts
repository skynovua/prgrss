export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      body_measurements: {
        Row: {
          arms: number | null;
          body_fat: number | null;
          body_weight: number | null;
          chest: number | null;
          hips: number | null;
          id: string;
          legs: number | null;
          measured_at: string;
          user_id: string;
          waist: number | null;
        };
        Insert: {
          arms?: number | null;
          body_fat?: number | null;
          body_weight?: number | null;
          chest?: number | null;
          hips?: number | null;
          id?: string;
          legs?: number | null;
          measured_at: string;
          user_id: string;
          waist?: number | null;
        };
        Update: {
          arms?: number | null;
          body_fat?: number | null;
          body_weight?: number | null;
          chest?: number | null;
          hips?: number | null;
          id?: string;
          legs?: number | null;
          measured_at?: string;
          user_id?: string;
          waist?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "body_measurements_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      exercises: {
        Row: {
          equipment: string | null;
          id: string;
          is_custom: boolean | null;
          muscle_group: string | null;
          name: string;
          user_id: string | null;
        };
        Insert: {
          equipment?: string | null;
          id?: string;
          is_custom?: boolean | null;
          muscle_group?: string | null;
          name: string;
          user_id?: string | null;
        };
        Update: {
          equipment?: string | null;
          id?: string;
          is_custom?: boolean | null;
          muscle_group?: string | null;
          name?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "exercises_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      favorite_exercises: {
        Row: {
          created_at: string | null;
          exercise_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          exercise_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          exercise_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorite_exercises_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorite_exercises_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      programs: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          is_template: boolean | null;
          name: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_template?: boolean | null;
          name: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_template?: boolean | null;
          name?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "programs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      push_subscriptions: {
        Row: {
          auth: string;
          created_at: string | null;
          endpoint: string;
          id: string;
          p256dh: string;
          user_id: string;
        };
        Insert: {
          auth: string;
          created_at?: string | null;
          endpoint: string;
          id?: string;
          p256dh: string;
          user_id: string;
        };
        Update: {
          auth?: string;
          created_at?: string | null;
          endpoint?: string;
          id?: string;
          p256dh?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      reminders: {
        Row: {
          days: number[] | null;
          enabled: boolean | null;
          id: string;
          message: string | null;
          time: string | null;
          user_id: string;
        };
        Insert: {
          days?: number[] | null;
          enabled?: boolean | null;
          id?: string;
          message?: string | null;
          time?: string | null;
          user_id: string;
        };
        Update: {
          days?: number[] | null;
          enabled?: boolean | null;
          id?: string;
          message?: string | null;
          time?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reminders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      sets: {
        Row: {
          created_at: string | null;
          duration_s: number | null;
          exercise_id: string;
          id: string;
          notes: string | null;
          reps: number | null;
          rpe: number | null;
          set_number: number;
          weight: number | null;
          workout_id: string;
        };
        Insert: {
          created_at?: string | null;
          duration_s?: number | null;
          exercise_id: string;
          id?: string;
          notes?: string | null;
          reps?: number | null;
          rpe?: number | null;
          set_number: number;
          weight?: number | null;
          workout_id: string;
        };
        Update: {
          created_at?: string | null;
          duration_s?: number | null;
          exercise_id?: string;
          id?: string;
          notes?: string | null;
          reps?: number | null;
          rpe?: number | null;
          set_number?: number;
          weight?: number | null;
          workout_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sets_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sets_workout_id_fkey";
            columns: ["workout_id"];
            isOneToOne: false;
            referencedRelation: "workouts";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          auto_rest_timer: boolean;
          avatar_url: string | null;
          created_at: string | null;
          id: string;
          name: string | null;
        };
        Insert: {
          auto_rest_timer?: boolean;
          avatar_url?: string | null;
          created_at?: string | null;
          id: string;
          name?: string | null;
        };
        Update: {
          auto_rest_timer?: boolean;
          avatar_url?: string | null;
          created_at?: string | null;
          id?: string;
          name?: string | null;
        };
        Relationships: [];
      };
      workouts: {
        Row: {
          created_at: string | null;
          finished_at: string | null;
          id: string;
          name: string | null;
          notes: string | null;
          program_id: string | null;
          started_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          finished_at?: string | null;
          id?: string;
          name?: string | null;
          notes?: string | null;
          program_id?: string | null;
          started_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          finished_at?: string | null;
          id?: string;
          name?: string | null;
          notes?: string | null;
          program_id?: string | null;
          started_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workouts_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workouts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      delete_workout_cascade: {
        Args: { target_workout_id: string };
        Returns: boolean;
      };
      get_achievement_metrics: { Args: never; Returns: Json };
      get_dashboard_data: { Args: never; Returns: Json };
      get_popular_exercises: {
        Args: { lim?: number };
        Returns: {
          exercise_id: string;
          usage_count: number;
        }[];
      };
      get_progress_exercise_progress: {
        Args: { client_timezone?: string; period_since?: string };
        Returns: Json;
      };
      get_progress_global_stats: { Args: never; Returns: Json };
      get_progress_period_summary: {
        Args: { period_since?: string };
        Returns: Json;
      };
      save_workout_with_sets: {
        Args: { payload: Json };
        Returns: {
          saved_at: string;
          sets_count: number;
          workout_id: string;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
