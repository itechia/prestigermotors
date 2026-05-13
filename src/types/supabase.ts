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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          criado_em: string
          email: string
          id: string
          nome: string | null
          updated_date: string
        }
        Insert: {
          criado_em?: string
          email: string
          id: string
          nome?: string | null
          updated_date?: string
        }
        Update: {
          criado_em?: string
          email?: string
          id?: string
          nome?: string | null
          updated_date?: string
        }
        Relationships: []
      }
      sell_leads: {
        Row: {
          admin_notes: string | null
          asking_price: number | null
          brand: string
          color: string | null
          condition_notes: string | null
          created_date: string
          fuel_type: string | null
          id: string
          images: Json
          manufacture_year: number | null
          mileage: number | null
          model: string
          owner_city: string | null
          owner_email: string | null
          owner_name: string
          owner_phone: string
          status: string
          transmission: string | null
          updated_date: string
          version: string | null
          year: number | null
        }
        Insert: {
          admin_notes?: string | null
          asking_price?: number | null
          brand: string
          color?: string | null
          condition_notes?: string | null
          created_date?: string
          fuel_type?: string | null
          id?: string
          images?: Json
          manufacture_year?: number | null
          mileage?: number | null
          model: string
          owner_city?: string | null
          owner_email?: string | null
          owner_name: string
          owner_phone: string
          status?: string
          transmission?: string | null
          updated_date?: string
          version?: string | null
          year?: number | null
        }
        Update: {
          admin_notes?: string | null
          asking_price?: number | null
          brand?: string
          color?: string | null
          condition_notes?: string | null
          created_date?: string
          fuel_type?: string | null
          id?: string
          images?: Json
          manufacture_year?: number | null
          mileage?: number | null
          model?: string
          owner_city?: string | null
          owner_email?: string | null
          owner_name?: string
          owner_phone?: string
          status?: string
          transmission?: string | null
          updated_date?: string
          version?: string | null
          year?: number | null
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          address: string | null
          brands: Json | null
          created_date: string
          facebook_url: string | null
          footer_about: string | null
          footer_help: Json | null
          footer_help_desc: string | null
          footer_help_title: string | null
          footer_institutional: Json | null
          footer_institutional_desc: string | null
          footer_institutional_title: string | null
          footer_payment: Json | null
          footer_payment_desc: string | null
          footer_payment_title: string | null
          footer_text: string | null
          guarantee_section_subtitle: string | null
          guarantee_section_title: string | null
          guarantees: Json | null
          hero_eyebrow: string | null
          hero_highlight: string | null
          hero_image_url: string | null
          hero_image_url_mobile: string | null
          hero_slides: Json | null
          hero_stat_2_label: string | null
          hero_stat_2_value: string | null
          hero_stat_3_label: string | null
          hero_stat_3_value: string | null
          hero_stat_rating: string | null
          hero_stat_rating_label: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          instagram_url: string | null
          interest_form_fields: Json | null
          interest_form_submit_label: string | null
          interest_form_subtitle: string | null
          interest_form_success_message: string | null
          interest_form_title: string | null
          interest_webhook_enabled: boolean | null
          interest_webhook_secret: string | null
          interest_webhook_url: string | null
          lead_form_message: string | null
          lead_form_subtitle: string | null
          lead_form_title: string | null
          logo_url: string | null
          phone_number: string | null
          reviews: Json | null
          reviews_count: string | null
          reviews_rating: string | null
          reviews_title: string | null
          reviews_visible: boolean | null
          sell_webhook_enabled: boolean | null
          sell_webhook_secret: string | null
          sell_webhook_url: string | null
          social_logo_facebook: string | null
          social_logo_instagram: string | null
          social_logo_tiktok: string | null
          social_logo_whatsapp: string | null
          social_logo_youtube: string | null
          social_show_facebook: boolean | null
          social_show_instagram: boolean | null
          social_show_tiktok: boolean | null
          social_show_whatsapp: boolean | null
          social_show_youtube: boolean | null
          store_name: string | null
          store_name_font: string | null
          store_tagline: string | null
          tax_categories: Json | null
          tax_colors: Json | null
          tax_conditions: Json | null
          tax_fuels: Json | null
          tax_models: Json | null
          tax_transmissions: Json | null
          tax_vehicle_types: Json | null
          tiktok_url: string | null
          trust_items: Json | null
          updated_date: string
          whatsapp_number: string | null
          youtube_url: string | null
        }
        Insert: {
          address?: string | null
          brands?: Json | null
          created_date?: string
          facebook_url?: string | null
          footer_about?: string | null
          footer_help?: Json | null
          footer_help_desc?: string | null
          footer_help_title?: string | null
          footer_institutional?: Json | null
          footer_institutional_desc?: string | null
          footer_institutional_title?: string | null
          footer_payment?: Json | null
          footer_payment_desc?: string | null
          footer_payment_title?: string | null
          footer_text?: string | null
          guarantee_section_subtitle?: string | null
          guarantee_section_title?: string | null
          guarantees?: Json | null
          hero_eyebrow?: string | null
          hero_highlight?: string | null
          hero_image_url?: string | null
          hero_image_url_mobile?: string | null
          hero_slides?: Json | null
          hero_stat_2_label?: string | null
          hero_stat_2_value?: string | null
          hero_stat_3_label?: string | null
          hero_stat_3_value?: string | null
          hero_stat_rating?: string | null
          hero_stat_rating_label?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          instagram_url?: string | null
          interest_form_fields?: Json | null
          interest_form_submit_label?: string | null
          interest_form_subtitle?: string | null
          interest_form_success_message?: string | null
          interest_form_title?: string | null
          interest_webhook_enabled?: boolean | null
          interest_webhook_secret?: string | null
          interest_webhook_url?: string | null
          lead_form_message?: string | null
          lead_form_subtitle?: string | null
          lead_form_title?: string | null
          logo_url?: string | null
          phone_number?: string | null
          reviews?: Json | null
          reviews_count?: string | null
          reviews_rating?: string | null
          reviews_title?: string | null
          reviews_visible?: boolean | null
          sell_webhook_enabled?: boolean | null
          sell_webhook_secret?: string | null
          sell_webhook_url?: string | null
          social_logo_facebook?: string | null
          social_logo_instagram?: string | null
          social_logo_tiktok?: string | null
          social_logo_whatsapp?: string | null
          social_logo_youtube?: string | null
          social_show_facebook?: boolean | null
          social_show_instagram?: boolean | null
          social_show_tiktok?: boolean | null
          social_show_whatsapp?: boolean | null
          social_show_youtube?: boolean | null
          store_name?: string | null
          store_name_font?: string | null
          store_tagline?: string | null
          tax_categories?: Json | null
          tax_colors?: Json | null
          tax_conditions?: Json | null
          tax_fuels?: Json | null
          tax_models?: Json | null
          tax_transmissions?: Json | null
          tax_vehicle_types?: Json | null
          tiktok_url?: string | null
          trust_items?: Json | null
          updated_date?: string
          whatsapp_number?: string | null
          youtube_url?: string | null
        }
        Update: {
          address?: string | null
          brands?: Json | null
          created_date?: string
          facebook_url?: string | null
          footer_about?: string | null
          footer_help?: Json | null
          footer_help_desc?: string | null
          footer_help_title?: string | null
          footer_institutional?: Json | null
          footer_institutional_desc?: string | null
          footer_institutional_title?: string | null
          footer_payment?: Json | null
          footer_payment_desc?: string | null
          footer_payment_title?: string | null
          footer_text?: string | null
          guarantee_section_subtitle?: string | null
          guarantee_section_title?: string | null
          guarantees?: Json | null
          hero_eyebrow?: string | null
          hero_highlight?: string | null
          hero_image_url?: string | null
          hero_image_url_mobile?: string | null
          hero_slides?: Json | null
          hero_stat_2_label?: string | null
          hero_stat_2_value?: string | null
          hero_stat_3_label?: string | null
          hero_stat_3_value?: string | null
          hero_stat_rating?: string | null
          hero_stat_rating_label?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          instagram_url?: string | null
          interest_form_fields?: Json | null
          interest_form_submit_label?: string | null
          interest_form_subtitle?: string | null
          interest_form_success_message?: string | null
          interest_form_title?: string | null
          interest_webhook_enabled?: boolean | null
          interest_webhook_secret?: string | null
          interest_webhook_url?: string | null
          lead_form_message?: string | null
          lead_form_subtitle?: string | null
          lead_form_title?: string | null
          logo_url?: string | null
          phone_number?: string | null
          reviews?: Json | null
          reviews_count?: string | null
          reviews_rating?: string | null
          reviews_title?: string | null
          reviews_visible?: boolean | null
          sell_webhook_enabled?: boolean | null
          sell_webhook_secret?: string | null
          sell_webhook_url?: string | null
          social_logo_facebook?: string | null
          social_logo_instagram?: string | null
          social_logo_tiktok?: string | null
          social_logo_whatsapp?: string | null
          social_logo_youtube?: string | null
          social_show_facebook?: boolean | null
          social_show_instagram?: boolean | null
          social_show_tiktok?: boolean | null
          social_show_whatsapp?: boolean | null
          social_show_youtube?: boolean | null
          store_name?: string | null
          store_name_font?: string | null
          store_tagline?: string | null
          tax_categories?: Json | null
          tax_colors?: Json | null
          tax_conditions?: Json | null
          tax_fuels?: Json | null
          tax_models?: Json | null
          tax_transmissions?: Json | null
          tax_vehicle_types?: Json | null
          tiktok_url?: string | null
          trust_items?: Json | null
          updated_date?: string
          whatsapp_number?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          body_type: string | null
          brand: string
          color: string | null
          condition: string | null
          created_date: string
          description: string | null
          doors: number | null
          embed_html: string | null
          engine: string | null
          featured: boolean
          features: Json
          fuel_type: string | null
          hidden: boolean
          id: string
          images: Json
          listed_date: string | null
          manufacture_year: number | null
          mileage: number
          model: string
          price: number
          price_old: number | null
          status: string
          stock_quantity: number
          transmission: string | null
          updated_date: string
          vehicle_type: string | null
          version: string | null
          year: number
        }
        Insert: {
          body_type?: string | null
          brand: string
          color?: string | null
          condition?: string | null
          created_date?: string
          description?: string | null
          doors?: number | null
          embed_html?: string | null
          engine?: string | null
          featured?: boolean
          features?: Json
          fuel_type?: string | null
          hidden?: boolean
          id?: string
          images?: Json
          listed_date?: string | null
          manufacture_year?: number | null
          mileage?: number
          model: string
          price?: number
          price_old?: number | null
          status?: string
          stock_quantity?: number
          transmission?: string | null
          updated_date?: string
          vehicle_type?: string | null
          version?: string | null
          year: number
        }
        Update: {
          body_type?: string | null
          brand?: string
          color?: string | null
          condition?: string | null
          created_date?: string
          description?: string | null
          doors?: number | null
          embed_html?: string | null
          engine?: string | null
          featured?: boolean
          features?: Json
          fuel_type?: string | null
          hidden?: boolean
          id?: string
          images?: Json
          listed_date?: string | null
          manufacture_year?: number | null
          mileage?: number
          model?: string
          price?: number
          price_old?: number | null
          status?: string
          stock_quantity?: number
          transmission?: string | null
          updated_date?: string
          vehicle_type?: string | null
          version?: string | null
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_home_taxonomy: { Args: never; Returns: Json }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
