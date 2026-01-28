export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      blocked_words: {
        Row: {
          created_at: string
          id: string
          word: string
        }
        Insert: {
          created_at?: string
          id?: string
          word: string
        }
        Update: {
          created_at?: string
          id?: string
          word?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          project_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          project_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          project_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      emojis: {
        Row: {
          category: string | null
          created_at: string
          id: string
          image_url: string
          is_animated: boolean | null
          shortcode: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_animated?: boolean | null
          shortcode: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_animated?: boolean | null
          shortcode?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_answer_votes: {
        Row: {
          answer_id: string
          created_at: string
          id: string
          is_helpful: boolean
          voter_id: string
        }
        Insert: {
          answer_id: string
          created_at?: string
          id?: string
          is_helpful: boolean
          voter_id: string
        }
        Update: {
          answer_id?: string
          created_at?: string
          id?: string
          is_helpful?: boolean
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_answer_votes_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "forum_answers"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_answers: {
        Row: {
          author_id: string
          content: string
          created_at: string
          helpful_count: number
          id: string
          is_solution: boolean
          not_helpful_count: number
          question_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          helpful_count?: number
          id?: string
          is_solution?: boolean
          not_helpful_count?: number
          question_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          helpful_count?: number
          id?: string
          is_solution?: boolean
          not_helpful_count?: number
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "forum_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_questions: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_solved: boolean
          solution_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_solved?: boolean
          solution_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_solved?: boolean
          solution_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "forum_questions_solution_id_fkey"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "forum_answers"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          moderator_id: string
          project_id: string | null
          project_title: string | null
          reason: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          moderator_id: string
          project_id?: string | null
          project_title?: string | null
          reason?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          moderator_id?: string
          project_id?: string | null
          project_title?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      online_users: {
        Row: {
          id: string
          last_ping: string
          user_id: string
        }
        Insert: {
          id?: string
          last_ping?: string
          user_id: string
        }
        Update: {
          id?: string
          last_ping?: string
          user_id?: string
        }
        Relationships: []
      }
      private_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      profile_ratings: {
        Row: {
          created_at: string
          id: string
          is_positive: boolean
          profile_id: string
          rater_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_positive: boolean
          profile_id: string
          rater_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_positive?: boolean
          profile_id?: string
          rater_id?: string
        }
        Relationships: []
      }
      profile_subscriptions: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      profile_wall_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          profile_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          profile_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          profile_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string | null
          discord_username: string | null
          id: string
          last_seen_at: string | null
          profile_accent_color: string | null
          profile_emoji: string | null
          profile_primary_color: string | null
          telegram_username: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          discord_username?: string | null
          id: string
          last_seen_at?: string | null
          profile_accent_color?: string | null
          profile_emoji?: string | null
          profile_primary_color?: string | null
          telegram_username?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          discord_username?: string | null
          id?: string
          last_seen_at?: string | null
          profile_accent_color?: string | null
          profile_emoji?: string | null
          profile_primary_color?: string | null
          telegram_username?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      project_subscriptions: {
        Row: {
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_subscriptions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_versions: {
        Row: {
          changelog: string | null
          created_at: string | null
          downloads_count: number | null
          file_size: number | null
          file_url: string
          id: string
          minecraft_versions: string[] | null
          project_id: string
          version_number: string
        }
        Insert: {
          changelog?: string | null
          created_at?: string | null
          downloads_count?: number | null
          file_size?: number | null
          file_url: string
          id?: string
          minecraft_versions?: string[] | null
          project_id: string
          version_number: string
        }
        Update: {
          changelog?: string | null
          created_at?: string | null
          downloads_count?: number | null
          file_size?: number | null
          file_url?: string
          id?: string
          minecraft_versions?: string[] | null
          project_id?: string
          version_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          access_mode: string
          author_id: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string | null
          description: string
          download_url: string | null
          downloads_count: number | null
          id: string
          is_approved: boolean | null
          is_premium: boolean | null
          min_donor_tier: string | null
          minecraft_versions: string[] | null
          price: number | null
          price_type: string
          slug: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          access_mode?: string
          author_id: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string | null
          description: string
          download_url?: string | null
          downloads_count?: number | null
          id?: string
          is_approved?: boolean | null
          is_premium?: boolean | null
          min_donor_tier?: string | null
          minecraft_versions?: string[] | null
          price?: number | null
          price_type?: string
          slug: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          access_mode?: string
          author_id?: string
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string | null
          description?: string
          download_url?: string | null
          downloads_count?: number | null
          id?: string
          is_approved?: boolean | null
          is_premium?: boolean | null
          min_donor_tier?: string | null
          minecraft_versions?: string[] | null
          price?: number | null
          price_type?: string
          slug?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      public_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      purchase_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          request_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          request_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          request_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_requests: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          message: string | null
          project_id: string
          referral_source: string | null
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          message?: string | null
          project_id: string
          referral_source?: string | null
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          message?: string | null
          project_id?: string
          referral_source?: string | null
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          action_type: string
          count: number | null
          created_at: string | null
          id: string
          identifier: string
          window_start: string | null
        }
        Insert: {
          action_type: string
          count?: number | null
          created_at?: string | null
          id?: string
          identifier: string
          window_start?: string | null
        }
        Update: {
          action_type?: string
          count?: number | null
          created_at?: string | null
          id?: string
          identifier?: string
          window_start?: string | null
        }
        Relationships: []
      }
      ratings: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      reputation_history: {
        Row: {
          created_at: string | null
          given_by: string | null
          id: string
          points_change: number
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          given_by?: string | null
          id?: string
          points_change: number
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          given_by?: string | null
          id?: string
          points_change?: number
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_bot_response: boolean
          is_system_message: boolean
          sender_id: string | null
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_bot_response?: boolean
          is_system_message?: boolean
          sender_id?: string | null
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_bot_response?: boolean
          is_system_message?: boolean
          sender_id?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          donor_tier: Database["public"]["Enums"]["donor_tier"]
          id: string
          priority: number
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          donor_tier?: Database["public"]["Enums"]["donor_tier"]
          id?: string
          priority?: number
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          donor_tier?: Database["public"]["Enums"]["donor_tier"]
          id?: string
          priority?: number
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_daily_downloads: {
        Row: {
          created_at: string
          download_count: number
          download_date: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          download_count?: number
          download_date?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          download_count?: number
          download_date?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_donors: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          nickname_color: string | null
          tier: Database["public"]["Enums"]["donor_tier"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          nickname_color?: string | null
          tier?: Database["public"]["Enums"]["donor_tier"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          nickname_color?: string | null
          tier?: Database["public"]["Enums"]["donor_tier"]
          user_id?: string
        }
        Relationships: []
      }
      user_reputation: {
        Row: {
          created_at: string | null
          id: string
          points: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          points?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          points?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      can_customize_nickname: { Args: { p_user_id: string }; Returns: boolean }
      can_set_profile_emoji: { Args: { p_user_id: string }; Returns: boolean }
      check_download_limit: { Args: { p_user_id: string }; Returns: boolean }
      check_rate_limit: {
        Args: {
          p_action_type: string
          p_identifier: string
          p_max_requests?: number
          p_window_seconds?: number
        }
        Returns: boolean
      }
      get_donor_priority: {
        Args: { tier: Database["public"]["Enums"]["donor_tier"] }
        Returns: number
      }
      get_project_rating: { Args: { project_uuid: string }; Returns: number }
      get_project_rating_count: {
        Args: { project_uuid: string }
        Returns: number
      }
      get_remaining_downloads: { Args: { p_user_id: string }; Returns: number }
      get_role_priority: {
        Args: { role_name: Database["public"]["Enums"]["app_role"] }
        Returns: number
      }
      get_ticket_priority: {
        Args: { tier: Database["public"]["Enums"]["donor_tier"] }
        Returns: number
      }
      get_user_donor_tier: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["donor_tier"]
      }
      get_user_reputation: { Args: { user_uuid: string }; Returns: number }
      has_higher_role: {
        Args: {
          _target_role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_download_count: {
        Args: { p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "developer"
        | "player"
        | "curator"
        | "owner"
      content_type:
        | "plugin"
        | "mod"
        | "map"
        | "resourcepack"
        | "build"
        | "config"
      donor_tier:
        | "none"
        | "bronze"
        | "silver"
        | "gold"
        | "diamond"
        | "sponsor"
        | "iron"
        | "emerald"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "moderator",
        "user",
        "developer",
        "player",
        "curator",
        "owner",
      ],
      content_type: ["plugin", "mod", "map", "resourcepack", "build", "config"],
      donor_tier: [
        "none",
        "bronze",
        "silver",
        "gold",
        "diamond",
        "sponsor",
        "iron",
        "emerald",
      ],
    },
  },
} as const
