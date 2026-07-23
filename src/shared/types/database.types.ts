// AUTO-GENERATED from the live Supabase schema (introspection). Do not edit by hand.
// Regenerate after a migration: npm run db:types
// Shape is Supabase-compatible (Database["public"]["Tables"|"Enums"]).

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      affiliate_clicks: {
        Row: {
          id: string;
          user_id: string | null;
          provider_id: string | null;
          recommendation_id: string | null;
          clicked_at: string;
          conversion_status: Database["public"]["Enums"]["conversion_status"];
          converted_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          provider_id?: string | null;
          recommendation_id?: string | null;
          clicked_at?: string;
          conversion_status?: Database["public"]["Enums"]["conversion_status"];
          converted_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          provider_id?: string | null;
          recommendation_id?: string | null;
          clicked_at?: string;
          conversion_status?: Database["public"]["Enums"]["conversion_status"];
          converted_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      affiliate_programs: {
        Row: {
          id: string;
          provider_id: string;
          network: string | null;
          tracking_url: string | null;
          commission_type: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          provider_id: string;
          network?: string | null;
          tracking_url?: string | null;
          commission_type?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          provider_id?: string;
          network?: string | null;
          tracking_url?: string | null;
          commission_type?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      ai_jobs: {
        Row: {
          id: string;
          job_type: Database["public"]["Enums"]["ai_job_type"];
          status: Database["public"]["Enums"]["ai_job_status"];
          input_data: Json | null;
          output_data: Json | null;
          model: string | null;
          tokens_used: number | null;
          confidence: number | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          job_type: Database["public"]["Enums"]["ai_job_type"];
          status?: Database["public"]["Enums"]["ai_job_status"];
          input_data?: Json | null;
          output_data?: Json | null;
          model?: string | null;
          tokens_used?: number | null;
          confidence?: number | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          job_type?: Database["public"]["Enums"]["ai_job_type"];
          status?: Database["public"]["Enums"]["ai_job_status"];
          input_data?: Json | null;
          output_data?: Json | null;
          model?: string | null;
          tokens_used?: number | null;
          confidence?: number | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      ai_prompts: {
        Row: {
          id: string;
          agent_type: string;
          version: string;
          prompt_text: string;
          input_schema: Json | null;
          output_schema: Json | null;
          active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          agent_type: string;
          version: string;
          prompt_text: string;
          input_schema?: Json | null;
          output_schema?: Json | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          agent_type?: string;
          version?: string;
          prompt_text?: string;
          input_schema?: Json | null;
          output_schema?: Json | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      consent_records: {
        Row: {
          id: string;
          user_id: string;
          consent_type: string;
          version: string | null;
          granted_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          consent_type: string;
          version?: string | null;
          granted_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          consent_type?: string;
          version?: string | null;
          granted_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      contracts: {
        Row: {
          id: string;
          user_service_id: string;
          start_date: string | null;
          renewal_date: string | null;
          cancellation_period: number | null;
          contract_terms: Json;
          source_document_id: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_service_id: string;
          start_date?: string | null;
          renewal_date?: string | null;
          cancellation_period?: number | null;
          contract_terms?: Json;
          source_document_id?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_service_id?: string;
          start_date?: string | null;
          renewal_date?: string | null;
          cancellation_period?: number | null;
          contract_terms?: Json;
          source_document_id?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      countries: {
        Row: {
          id: string;
          code: string;
          name: string;
          currency_code: string;
          timezone: string;
          active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          currency_code: string;
          timezone: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          currency_code?: string;
          timezone?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      document_extractions: {
        Row: {
          id: string;
          document_id: string;
          extracted_data: Json;
          confidence_score: number | null;
          ai_model: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          document_id: string;
          extracted_data?: Json;
          confidence_score?: number | null;
          ai_model?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          document_id?: string;
          extracted_data?: Json;
          confidence_score?: number | null;
          ai_model?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          household_id: string;
          uploaded_by: string | null;
          storage_path: string;
          document_type: Database["public"]["Enums"]["document_type"] | null;
          processing_status: Database["public"]["Enums"]["document_processing_status"];
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          household_id: string;
          uploaded_by?: string | null;
          storage_path: string;
          document_type?: Database["public"]["Enums"]["document_type"] | null;
          processing_status?: Database["public"]["Enums"]["document_processing_status"];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          household_id?: string;
          uploaded_by?: string | null;
          storage_path?: string;
          document_type?: Database["public"]["Enums"]["document_type"] | null;
          processing_status?: Database["public"]["Enums"]["document_processing_status"];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      household_members: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["household_role"];
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          role?: Database["public"]["Enums"]["household_role"];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          household_id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["household_role"];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      household_preferences: {
        Row: {
          id: string;
          household_id: string;
          notification_preferences: Json;
          communication_preferences: Json;
          switching_preferences: Json;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          household_id: string;
          notification_preferences?: Json;
          communication_preferences?: Json;
          switching_preferences?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          household_id?: string;
          notification_preferences?: Json;
          communication_preferences?: Json;
          switching_preferences?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      households: {
        Row: {
          id: string;
          country_id: string | null;
          name: string;
          address_line_1: string | null;
          city: string | null;
          county: string | null;
          postal_code: string | null;
          property_type: Database["public"]["Enums"]["property_type"] | null;
          ownership_status: Database["public"]["Enums"]["ownership_status"] | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          country_id?: string | null;
          name: string;
          address_line_1?: string | null;
          city?: string | null;
          county?: string | null;
          postal_code?: string | null;
          property_type?: Database["public"]["Enums"]["property_type"] | null;
          ownership_status?: Database["public"]["Enums"]["ownership_status"] | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          country_id?: string | null;
          name?: string;
          address_line_1?: string | null;
          city?: string | null;
          county?: string | null;
          postal_code?: string | null;
          property_type?: Database["public"]["Enums"]["property_type"] | null;
          ownership_status?: Database["public"]["Enums"]["ownership_status"] | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: Database["public"]["Enums"]["message_role"];
          content: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: Database["public"]["Enums"]["message_role"];
          content?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: Database["public"]["Enums"]["message_role"];
          content?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: Database["public"]["Enums"]["notification_type"];
          title: string | null;
          message: string | null;
          read: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: Database["public"]["Enums"]["notification_type"];
          title?: string | null;
          message?: string | null;
          read?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: Database["public"]["Enums"]["notification_type"];
          title?: string | null;
          message?: string | null;
          read?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      plans: {
        Row: {
          id: string;
          name: Database["public"]["Enums"]["subscription_plan"];
          price: number | null;
          features: Json;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: Database["public"]["Enums"]["subscription_plan"];
          price?: number | null;
          features?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: Database["public"]["Enums"]["subscription_plan"];
          price?: number | null;
          features?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          communication_preferences: Json;
          notification_settings: Json;
          currency: string | null;
          language: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          communication_preferences?: Json;
          notification_settings?: Json;
          currency?: string | null;
          language?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          communication_preferences?: Json;
          notification_settings?: Json;
          currency?: string | null;
          language?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      provider_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      provider_crawls: {
        Row: {
          id: string;
          provider_id: string;
          status: Database["public"]["Enums"]["provider_crawl_status"];
          started_at: string | null;
          completed_at: string | null;
          result: Json | null;
          error: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          provider_id: string;
          status?: Database["public"]["Enums"]["provider_crawl_status"];
          started_at?: string | null;
          completed_at?: string | null;
          result?: Json | null;
          error?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          provider_id?: string;
          status?: Database["public"]["Enums"]["provider_crawl_status"];
          started_at?: string | null;
          completed_at?: string | null;
          result?: Json | null;
          error?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      provider_offers: {
        Row: {
          id: string;
          product_id: string;
          price: number | null;
          billing_period: Database["public"]["Enums"]["billing_period"] | null;
          contract_length: number | null;
          discount_amount: number | null;
          valid_from: string | null;
          valid_until: string | null;
          source: Database["public"]["Enums"]["offer_source"] | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          product_id: string;
          price?: number | null;
          billing_period?: Database["public"]["Enums"]["billing_period"] | null;
          contract_length?: number | null;
          discount_amount?: number | null;
          valid_from?: string | null;
          valid_until?: string | null;
          source?: Database["public"]["Enums"]["offer_source"] | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          product_id?: string;
          price?: number | null;
          billing_period?: Database["public"]["Enums"]["billing_period"] | null;
          contract_length?: number | null;
          discount_amount?: number | null;
          valid_from?: string | null;
          valid_until?: string | null;
          source?: Database["public"]["Enums"]["offer_source"] | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      provider_price_history: {
        Row: {
          id: string;
          offer_id: string;
          old_price: number | null;
          new_price: number | null;
          changed_at: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          offer_id: string;
          old_price?: number | null;
          new_price?: number | null;
          changed_at?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          offer_id?: string;
          old_price?: number | null;
          new_price?: number | null;
          changed_at?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      provider_products: {
        Row: {
          id: string;
          provider_id: string;
          name: string;
          description: string | null;
          product_type: string | null;
          active: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          provider_id: string;
          name: string;
          description?: string | null;
          product_type?: string | null;
          active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          provider_id?: string;
          name?: string;
          description?: string | null;
          product_type?: string | null;
          active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      providers: {
        Row: {
          id: string;
          country_id: string | null;
          category_id: string | null;
          name: string;
          website: string | null;
          logo_url: string | null;
          active: boolean;
          affiliate_available: boolean;
          api_available: boolean;
          crawler_available: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          country_id?: string | null;
          category_id?: string | null;
          name: string;
          website?: string | null;
          logo_url?: string | null;
          active?: boolean;
          affiliate_available?: boolean;
          api_available?: boolean;
          crawler_available?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          country_id?: string | null;
          category_id?: string | null;
          name?: string;
          website?: string | null;
          logo_url?: string | null;
          active?: boolean;
          affiliate_available?: boolean;
          api_available?: boolean;
          crawler_available?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      recommendation_explanations: {
        Row: {
          id: string;
          recommendation_id: string;
          summary: string | null;
          reasoning: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          recommendation_id: string;
          summary?: string | null;
          reasoning?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          recommendation_id?: string;
          summary?: string | null;
          reasoning?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      recommendation_feedback: {
        Row: {
          id: string;
          recommendation_id: string;
          user_id: string | null;
          feedback: string | null;
          reason: Database["public"]["Enums"]["recommendation_feedback_reason"] | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          recommendation_id: string;
          user_id?: string | null;
          feedback?: string | null;
          reason?: Database["public"]["Enums"]["recommendation_feedback_reason"] | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          recommendation_id?: string;
          user_id?: string | null;
          feedback?: string | null;
          reason?: Database["public"]["Enums"]["recommendation_feedback_reason"] | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      recommendations: {
        Row: {
          id: string;
          household_id: string;
          category_id: string | null;
          current_service_id: string | null;
          recommended_provider_id: string | null;
          estimated_saving: number | null;
          confidence_score: number | null;
          summary: string | null;
          status: Database["public"]["Enums"]["recommendation_status"];
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          household_id: string;
          category_id?: string | null;
          current_service_id?: string | null;
          recommended_provider_id?: string | null;
          estimated_saving?: number | null;
          confidence_score?: number | null;
          summary?: string | null;
          status?: Database["public"]["Enums"]["recommendation_status"];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          household_id?: string;
          category_id?: string | null;
          current_service_id?: string | null;
          recommended_provider_id?: string | null;
          estimated_saving?: number | null;
          confidence_score?: number | null;
          summary?: string | null;
          status?: Database["public"]["Enums"]["recommendation_status"];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      renewals: {
        Row: {
          id: string;
          contract_id: string;
          renewal_date: string | null;
          status: Database["public"]["Enums"]["renewal_status"];
          analysis_completed: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          contract_id: string;
          renewal_date?: string | null;
          status?: Database["public"]["Enums"]["renewal_status"];
          analysis_completed?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          contract_id?: string;
          renewal_date?: string | null;
          status?: Database["public"]["Enums"]["renewal_status"];
          analysis_completed?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      service_details: {
        Row: {
          id: string;
          user_service_id: string;
          data: Json;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_service_id: string;
          data?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_service_id?: string;
          data?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan: Database["public"]["Enums"]["subscription_plan"];
          status: Database["public"]["Enums"]["subscription_status"];
          renewal_date: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: Database["public"]["Enums"]["subscription_plan"];
          status?: Database["public"]["Enums"]["subscription_status"];
          renewal_date?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: Database["public"]["Enums"]["subscription_plan"];
          status?: Database["public"]["Enums"]["subscription_status"];
          renewal_date?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      user_services: {
        Row: {
          id: string;
          household_id: string;
          provider_id: string | null;
          category_id: string | null;
          current_product_id: string | null;
          monthly_cost: number | null;
          annual_cost: number | null;
          status: Database["public"]["Enums"]["user_service_status"];
          renewal_date: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          household_id: string;
          provider_id?: string | null;
          category_id?: string | null;
          current_product_id?: string | null;
          monthly_cost?: number | null;
          annual_cost?: number | null;
          status?: Database["public"]["Enums"]["user_service_status"];
          renewal_date?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          household_id?: string;
          provider_id?: string | null;
          category_id?: string | null;
          current_product_id?: string | null;
          monthly_cost?: number | null;
          annual_cost?: number | null;
          status?: Database["public"]["Enums"]["user_service_status"];
          renewal_date?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          clerk_user_id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          country_id: string | null;
          timezone: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          clerk_user_id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          country_id?: string | null;
          timezone?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          clerk_user_id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          country_id?: string | null;
          timezone?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      create_household: { Args: { p_name: string; p_country_id?: string | null; p_address_line_1?: string | null; p_city?: string | null; p_county?: string | null; p_postal_code?: string | null; p_property_type?: Database["public"]["Enums"]["property_type"] | null; p_ownership_status?: Database["public"]["Enums"]["ownership_status"] | null }; Returns: string };
      create_service: { Args: { p_household_id: string; p_provider_id?: string | null; p_category_id?: string | null; p_current_product_id?: string | null; p_monthly_cost?: number | null; p_annual_cost?: number | null; p_status?: Database["public"]["Enums"]["user_service_status"] | null; p_renewal_date?: string | null; p_contract_start_date?: string | null }; Returns: string };
      current_household_ids: { Args: Record<never, never>; Returns: string[] };
      current_user_id: { Args: Record<never, never>; Returns: string };
    };
    Enums: {
      ai_job_status: "queued" | "running" | "completed" | "failed";
      ai_job_type: "document_analysis" | "recommendation_generation" | "provider_analysis" | "assistant_request";
      billing_period: "monthly" | "annual";
      conversion_status: "clicked" | "converted" | "rejected";
      document_processing_status: "uploaded" | "processing" | "completed" | "failed";
      document_type: "bill" | "contract" | "insurance_policy" | "renewal_letter" | "invoice" | "other";
      household_role: "owner" | "admin" | "member" | "viewer";
      message_role: "user" | "assistant";
      notification_type: "saving_found" | "renewal" | "system" | "billing";
      offer_source: "api" | "affiliate_feed" | "crawler" | "manual";
      ownership_status: "owner" | "renter" | "landlord" | "other";
      property_type: "house" | "apartment" | "townhouse" | "other";
      provider_crawl_status: "queued" | "running" | "completed" | "failed";
      recommendation_feedback_reason: "too_hard" | "not_interested" | "wrong_time" | "incorrect";
      recommendation_status: "new" | "viewed" | "accepted" | "rejected" | "completed";
      renewal_status: "pending" | "analysing" | "recommendation_ready" | "completed" | "ignored";
      subscription_plan: "free" | "premium" | "family";
      subscription_status: "active" | "trialing" | "past_due" | "canceled" | "unpaid";
      user_service_status: "active" | "expired" | "cancelled" | "unknown";
    };
    CompositeTypes: Record<never, never>;
  };
};

// Convenience helpers
export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];
