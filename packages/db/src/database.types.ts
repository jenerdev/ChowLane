export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      assignment_attempts: {
        Row: {
          by: Database["public"]["Enums"]["assigned_by"];
          id: string;
          offered_at: string;
          order_id: string;
          reject_note: string | null;
          reject_reason: Database["public"]["Enums"]["rider_reject_reason"] | null;
          responded_at: string | null;
          response: Database["public"]["Enums"]["attempt_response"] | null;
          rider_id: string;
          staff_id: string | null;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          by: Database["public"]["Enums"]["assigned_by"];
          id?: string;
          offered_at?: string;
          order_id: string;
          reject_note?: string | null;
          reject_reason?: Database["public"]["Enums"]["rider_reject_reason"] | null;
          responded_at?: string | null;
          response?: Database["public"]["Enums"]["attempt_response"] | null;
          rider_id: string;
          staff_id?: string | null;
          tenant_id: string;
        };
        Update: {
          by?: Database["public"]["Enums"]["assigned_by"];
          id?: string;
          offered_at?: string;
          order_id?: string;
          reject_note?: string | null;
          reject_reason?: Database["public"]["Enums"]["rider_reject_reason"] | null;
          responded_at?: string | null;
          response?: Database["public"]["Enums"]["attempt_response"] | null;
          rider_id?: string;
          staff_id?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assignment_attempts_order_id_tenant_id_fkey";
            columns: ["order_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "assignment_attempts_rider_id_tenant_id_fkey";
            columns: ["rider_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "riders";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "assignment_attempts_staff_id_tenant_id_fkey";
            columns: ["staff_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "staff_users";
            referencedColumns: ["id", "tenant_id"];
          },
        ];
      };
      barangay_fees: {
        Row: {
          barangay: string;
          city_municipality: string;
          fee: number;
          id: string;
          is_active: boolean;
          province: string;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          barangay: string;
          city_municipality: string;
          fee: number;
          id?: string;
          is_active?: boolean;
          province: string;
          tenant_id: string;
        };
        Update: {
          barangay?: string;
          city_municipality?: string;
          fee?: number;
          id?: string;
          is_active?: boolean;
          province?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "barangay_fees_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "barangay_fees_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants_public";
            referencedColumns: ["id"];
          },
        ];
      };
      billing_statements: {
        Row: {
          amount_due: number;
          created_at: string;
          delivered_orders: number;
          id: string;
          model: Database["public"]["Enums"]["billing_model"];
          note: string | null;
          paid_at: string | null;
          period_end: string;
          period_start: string;
          status: Database["public"]["Enums"]["statement_status"];
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          amount_due?: number;
          created_at?: string;
          delivered_orders?: number;
          id?: string;
          model: Database["public"]["Enums"]["billing_model"];
          note?: string | null;
          paid_at?: string | null;
          period_end: string;
          period_start: string;
          status?: Database["public"]["Enums"]["statement_status"];
          tenant_id: string;
        };
        Update: {
          amount_due?: number;
          created_at?: string;
          delivered_orders?: number;
          id?: string;
          model?: Database["public"]["Enums"]["billing_model"];
          note?: string | null;
          paid_at?: string | null;
          period_end?: string;
          period_start?: string;
          status?: Database["public"]["Enums"]["statement_status"];
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "billing_statements_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "billing_statements_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants_public";
            referencedColumns: ["id"];
          },
        ];
      };
      coupon_redemptions: {
        Row: {
          coupon_id: string;
          customer_id: string;
          discount: number;
          id: string;
          order_id: string;
          redeemed_at: string;
          released: boolean;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          coupon_id: string;
          customer_id: string;
          discount: number;
          id?: string;
          order_id: string;
          redeemed_at?: string;
          released?: boolean;
          tenant_id: string;
        };
        Update: {
          coupon_id?: string;
          customer_id?: string;
          discount?: number;
          id?: string;
          order_id?: string;
          redeemed_at?: string;
          released?: boolean;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_tenant_id_fkey";
            columns: ["coupon_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "coupons";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "coupon_redemptions_customer_id_tenant_id_fkey";
            columns: ["customer_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "coupon_redemptions_order_id_tenant_id_fkey";
            columns: ["order_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id", "tenant_id"];
          },
        ];
      };
      coupons: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          is_active: boolean;
          max_discount: number | null;
          max_uses: number;
          min_order_subtotal: number | null;
          per_customer_limit: number;
          percent_off: number | null;
          tenant_id: string;
          type: Database["public"]["Enums"]["coupon_type"];
          used_count: number;
          valid_from: string;
          valid_until: string;
        };
        ComputedFields: never;
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          max_discount?: number | null;
          max_uses: number;
          min_order_subtotal?: number | null;
          per_customer_limit?: number;
          percent_off?: number | null;
          tenant_id: string;
          type: Database["public"]["Enums"]["coupon_type"];
          used_count?: number;
          valid_from: string;
          valid_until: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          max_discount?: number | null;
          max_uses?: number;
          min_order_subtotal?: number | null;
          per_customer_limit?: number;
          percent_off?: number | null;
          tenant_id?: string;
          type?: Database["public"]["Enums"]["coupon_type"];
          used_count?: number;
          valid_from?: string;
          valid_until?: string;
        };
        Relationships: [
          {
            foreignKeyName: "coupons_created_by_tenant_id_fkey";
            columns: ["created_by", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "staff_users";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "coupons_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "coupons_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants_public";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_addresses: {
        Row: {
          barangay: string;
          barangay_fee_id: string | null;
          city_municipality: string;
          created_at: string;
          customer_id: string;
          id: string;
          label: string;
          line1: string;
          location_lat: number;
          location_lng: number;
          notes: string | null;
          province: string;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          barangay: string;
          barangay_fee_id?: string | null;
          city_municipality: string;
          created_at?: string;
          customer_id: string;
          id?: string;
          label: string;
          line1: string;
          location_lat: number;
          location_lng: number;
          notes?: string | null;
          province: string;
          tenant_id: string;
        };
        Update: {
          barangay?: string;
          barangay_fee_id?: string | null;
          city_municipality?: string;
          created_at?: string;
          customer_id?: string;
          id?: string;
          label?: string;
          line1?: string;
          location_lat?: number;
          location_lng?: number;
          notes?: string | null;
          province?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_addresses_barangay_fee_id_tenant_id_fkey";
            columns: ["barangay_fee_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "barangay_fees";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "customer_addresses_customer_id_tenant_id_fkey";
            columns: ["customer_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id", "tenant_id"];
          },
        ];
      };
      customers: {
        Row: {
          auth_user_id: string | null;
          avatar_url: string;
          created_at: string;
          email: string | null;
          facebook_id: string;
          id: string;
          location_permission: Database["public"]["Enums"]["location_permission"];
          loyalty_delivered_orders: number;
          loyalty_free_delivery_rewards: number;
          loyalty_free_gift_rewards: number;
          loyalty_orders_toward_free_delivery: number;
          loyalty_orders_toward_free_gift: number;
          loyalty_points: number;
          name: string;
          phone: string | null;
          tenant_id: string;
          verification_status: Database["public"]["Enums"]["verification_status"];
        };
        ComputedFields: never;
        Insert: {
          auth_user_id?: string | null;
          avatar_url?: string;
          created_at?: string;
          email?: string | null;
          facebook_id: string;
          id?: string;
          location_permission?: Database["public"]["Enums"]["location_permission"];
          loyalty_delivered_orders?: number;
          loyalty_free_delivery_rewards?: number;
          loyalty_free_gift_rewards?: number;
          loyalty_orders_toward_free_delivery?: number;
          loyalty_orders_toward_free_gift?: number;
          loyalty_points?: number;
          name: string;
          phone?: string | null;
          tenant_id: string;
          verification_status?: Database["public"]["Enums"]["verification_status"];
        };
        Update: {
          auth_user_id?: string | null;
          avatar_url?: string;
          created_at?: string;
          email?: string | null;
          facebook_id?: string;
          id?: string;
          location_permission?: Database["public"]["Enums"]["location_permission"];
          loyalty_delivered_orders?: number;
          loyalty_free_delivery_rewards?: number;
          loyalty_free_gift_rewards?: number;
          loyalty_orders_toward_free_delivery?: number;
          loyalty_orders_toward_free_gift?: number;
          loyalty_points?: number;
          name?: string;
          phone?: string | null;
          tenant_id?: string;
          verification_status?: Database["public"]["Enums"]["verification_status"];
        };
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customers_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants_public";
            referencedColumns: ["id"];
          },
        ];
      };
      loyalty_transactions: {
        Row: {
          at: string;
          customer_id: string;
          id: string;
          kind: Database["public"]["Enums"]["loyalty_kind"];
          note: string | null;
          order_id: string | null;
          points: number;
          rewards: number;
          staff_id: string | null;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          at?: string;
          customer_id: string;
          id?: string;
          kind: Database["public"]["Enums"]["loyalty_kind"];
          note?: string | null;
          order_id?: string | null;
          points?: number;
          rewards?: number;
          staff_id?: string | null;
          tenant_id: string;
        };
        Update: {
          at?: string;
          customer_id?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["loyalty_kind"];
          note?: string | null;
          order_id?: string | null;
          points?: number;
          rewards?: number;
          staff_id?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_customer_id_tenant_id_fkey";
            columns: ["customer_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "loyalty_transactions_order_id_tenant_id_fkey";
            columns: ["order_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "loyalty_transactions_staff_id_tenant_id_fkey";
            columns: ["staff_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "staff_users";
            referencedColumns: ["id", "tenant_id"];
          },
        ];
      };
      merchants: {
        Row: {
          address: string;
          category: string;
          created_at: string;
          id: string;
          is_open: boolean;
          location_lat: number;
          location_lng: number;
          name: string;
          phone: string;
          photo_url: string;
          status: Database["public"]["Enums"]["active_status"];
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          address: string;
          category: string;
          created_at?: string;
          id?: string;
          is_open?: boolean;
          location_lat: number;
          location_lng: number;
          name: string;
          phone: string;
          photo_url?: string;
          status?: Database["public"]["Enums"]["active_status"];
          tenant_id: string;
        };
        Update: {
          address?: string;
          category?: string;
          created_at?: string;
          id?: string;
          is_open?: boolean;
          location_lat?: number;
          location_lng?: number;
          name?: string;
          phone?: string;
          photo_url?: string;
          status?: Database["public"]["Enums"]["active_status"];
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "merchants_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "merchants_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants_public";
            referencedColumns: ["id"];
          },
        ];
      };
      order_events: {
        Row: {
          actor_id: string | null;
          actor_type: Database["public"]["Enums"]["actor_type"];
          at: string;
          id: string;
          note: string | null;
          order_id: string;
          status: Database["public"]["Enums"]["order_status"];
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          actor_id?: string | null;
          actor_type: Database["public"]["Enums"]["actor_type"];
          at?: string;
          id?: string;
          note?: string | null;
          order_id: string;
          status: Database["public"]["Enums"]["order_status"];
          tenant_id: string;
        };
        Update: {
          actor_id?: string | null;
          actor_type?: Database["public"]["Enums"]["actor_type"];
          at?: string;
          id?: string;
          note?: string | null;
          order_id?: string;
          status?: Database["public"]["Enums"]["order_status"];
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_tenant_id_fkey";
            columns: ["order_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id", "tenant_id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          is_free_gift: boolean;
          is_unavailable: boolean;
          line_no: number;
          line_total: number;
          name: string;
          order_id: string;
          product_id: string | null;
          qty: number;
          store_unit_price: number | null;
          tenant_id: string;
          unit_price: number;
        };
        ComputedFields: never;
        Insert: {
          id?: string;
          is_free_gift?: boolean;
          is_unavailable?: boolean;
          line_no: number;
          line_total: number;
          name: string;
          order_id: string;
          product_id?: string | null;
          qty: number;
          store_unit_price?: number | null;
          tenant_id: string;
          unit_price: number;
        };
        Update: {
          id?: string;
          is_free_gift?: boolean;
          is_unavailable?: boolean;
          line_no?: number;
          line_total?: number;
          name?: string;
          order_id?: string;
          product_id?: string | null;
          qty?: number;
          store_unit_price?: number | null;
          tenant_id?: string;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_tenant_id_fkey";
            columns: ["order_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "order_items_product_id_tenant_id_fkey";
            columns: ["product_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "order_items_product_id_tenant_id_fkey";
            columns: ["product_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "products_public";
            referencedColumns: ["id", "tenant_id"];
          },
        ];
      };
      orders: {
        Row: {
          approved_by: string | null;
          cancel_reason: string | null;
          cash_collected_at: string | null;
          change_for: number | null;
          coupon_code: string | null;
          coupon_discount: number;
          coupon_id: string | null;
          created_at: string;
          customer_id: string;
          delivery_address_text: string;
          delivery_barangay_fee_id: string | null;
          delivery_fee: number;
          delivery_fee_snapshot: NonNullable<Json>;
          delivery_location_lat: number;
          delivery_location_lng: number;
          discount_total: number;
          distance_km: number;
          free_delivery_discount: number;
          id: string;
          merchant_id: string;
          notes: string | null;
          offer_by: Database["public"]["Enums"]["assigned_by"] | null;
          offer_expires_at: string | null;
          offer_offered_at: string | null;
          offer_rider_id: string | null;
          offer_staff_id: string | null;
          order_number: string;
          payment_method: string;
          payment_status: Database["public"]["Enums"]["payment_status"];
          points_discount: number;
          points_earned: number | null;
          points_redeemed: number;
          proof_note: string | null;
          proof_photo_url: string | null;
          reject_reason: string | null;
          rider_earning: number | null;
          rider_id: string | null;
          status: Database["public"]["Enums"]["order_status"];
          store_amount_paid: number | null;
          store_receipt_photo_url: string | null;
          subtotal: number;
          tenant_id: string;
          total: number;
          used_free_delivery_reward: boolean;
          used_free_gift_reward: boolean;
        };
        ComputedFields: never;
        Insert: {
          approved_by?: string | null;
          cancel_reason?: string | null;
          cash_collected_at?: string | null;
          change_for?: number | null;
          coupon_code?: string | null;
          coupon_discount?: number;
          coupon_id?: string | null;
          created_at?: string;
          customer_id: string;
          delivery_address_text: string;
          delivery_barangay_fee_id?: string | null;
          delivery_fee: number;
          delivery_fee_snapshot: NonNullable<Json>;
          delivery_location_lat: number;
          delivery_location_lng: number;
          discount_total?: number;
          distance_km: number;
          free_delivery_discount?: number;
          id?: string;
          merchant_id: string;
          notes?: string | null;
          offer_by?: Database["public"]["Enums"]["assigned_by"] | null;
          offer_expires_at?: string | null;
          offer_offered_at?: string | null;
          offer_rider_id?: string | null;
          offer_staff_id?: string | null;
          order_number: string;
          payment_method?: string;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          points_discount?: number;
          points_earned?: number | null;
          points_redeemed?: number;
          proof_note?: string | null;
          proof_photo_url?: string | null;
          reject_reason?: string | null;
          rider_earning?: number | null;
          rider_id?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          store_amount_paid?: number | null;
          store_receipt_photo_url?: string | null;
          subtotal: number;
          tenant_id: string;
          total: number;
          used_free_delivery_reward?: boolean;
          used_free_gift_reward?: boolean;
        };
        Update: {
          approved_by?: string | null;
          cancel_reason?: string | null;
          cash_collected_at?: string | null;
          change_for?: number | null;
          coupon_code?: string | null;
          coupon_discount?: number;
          coupon_id?: string | null;
          created_at?: string;
          customer_id?: string;
          delivery_address_text?: string;
          delivery_barangay_fee_id?: string | null;
          delivery_fee?: number;
          delivery_fee_snapshot?: NonNullable<Json>;
          delivery_location_lat?: number;
          delivery_location_lng?: number;
          discount_total?: number;
          distance_km?: number;
          free_delivery_discount?: number;
          id?: string;
          merchant_id?: string;
          notes?: string | null;
          offer_by?: Database["public"]["Enums"]["assigned_by"] | null;
          offer_expires_at?: string | null;
          offer_offered_at?: string | null;
          offer_rider_id?: string | null;
          offer_staff_id?: string | null;
          order_number?: string;
          payment_method?: string;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          points_discount?: number;
          points_earned?: number | null;
          points_redeemed?: number;
          proof_note?: string | null;
          proof_photo_url?: string | null;
          reject_reason?: string | null;
          rider_earning?: number | null;
          rider_id?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          store_amount_paid?: number | null;
          store_receipt_photo_url?: string | null;
          subtotal?: number;
          tenant_id?: string;
          total?: number;
          used_free_delivery_reward?: boolean;
          used_free_gift_reward?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "orders_approved_by_tenant_id_fkey";
            columns: ["approved_by", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "staff_users";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "orders_coupon_id_tenant_id_fkey";
            columns: ["coupon_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "coupons";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "orders_customer_id_tenant_id_fkey";
            columns: ["customer_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "orders_delivery_barangay_fee_id_tenant_id_fkey";
            columns: ["delivery_barangay_fee_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "barangay_fees";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "orders_merchant_id_tenant_id_fkey";
            columns: ["merchant_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "orders_offer_rider_id_tenant_id_fkey";
            columns: ["offer_rider_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "riders";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "orders_offer_staff_id_tenant_id_fkey";
            columns: ["offer_staff_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "staff_users";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "orders_rider_id_tenant_id_fkey";
            columns: ["rider_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "riders";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "orders_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants_public";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_admins: {
        Row: {
          auth_user_id: string | null;
          created_at: string;
          email: string;
          id: string;
          name: string;
          status: Database["public"]["Enums"]["active_status"];
        };
        ComputedFields: never;
        Insert: {
          auth_user_id?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          name: string;
          status?: Database["public"]["Enums"]["active_status"];
        };
        Update: {
          auth_user_id?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          name?: string;
          status?: Database["public"]["Enums"]["active_status"];
        };
        Relationships: [];
      };
      products: {
        Row: {
          category: string;
          description: string;
          id: string;
          image_url: string;
          is_available: boolean;
          merchant_id: string;
          name: string;
          price: number;
          sort_order: number;
          store_price: number | null;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          category: string;
          description?: string;
          id?: string;
          image_url?: string;
          is_available?: boolean;
          merchant_id: string;
          name: string;
          price: number;
          sort_order?: number;
          store_price?: number | null;
          tenant_id: string;
        };
        Update: {
          category?: string;
          description?: string;
          id?: string;
          image_url?: string;
          is_available?: boolean;
          merchant_id?: string;
          name?: string;
          price?: number;
          sort_order?: number;
          store_price?: number | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_merchant_id_tenant_id_fkey";
            columns: ["merchant_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "products_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants_public";
            referencedColumns: ["id"];
          },
        ];
      };
      riders: {
        Row: {
          active_order_id: string | null;
          auth_user_id: string | null;
          created_at: string;
          current_shift_id: string | null;
          email: string | null;
          id: string;
          is_on_shift: boolean;
          last_location_lat: number | null;
          last_location_lng: number | null;
          name: string;
          pay_override: Json | null;
          phone: string;
          photo_url: string;
          plate_number: string | null;
          status: Database["public"]["Enums"]["active_status"];
          tenant_id: string;
          vehicle_type: Database["public"]["Enums"]["vehicle_type"];
        };
        ComputedFields: never;
        Insert: {
          active_order_id?: string | null;
          auth_user_id?: string | null;
          created_at?: string;
          current_shift_id?: string | null;
          email?: string | null;
          id?: string;
          is_on_shift?: boolean;
          last_location_lat?: number | null;
          last_location_lng?: number | null;
          name: string;
          pay_override?: Json | null;
          phone: string;
          photo_url?: string;
          plate_number?: string | null;
          status?: Database["public"]["Enums"]["active_status"];
          tenant_id: string;
          vehicle_type: Database["public"]["Enums"]["vehicle_type"];
        };
        Update: {
          active_order_id?: string | null;
          auth_user_id?: string | null;
          created_at?: string;
          current_shift_id?: string | null;
          email?: string | null;
          id?: string;
          is_on_shift?: boolean;
          last_location_lat?: number | null;
          last_location_lng?: number | null;
          name?: string;
          pay_override?: Json | null;
          phone?: string;
          photo_url?: string;
          plate_number?: string | null;
          status?: Database["public"]["Enums"]["active_status"];
          tenant_id?: string;
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"];
        };
        Relationships: [
          {
            foreignKeyName: "riders_active_order_fk";
            columns: ["active_order_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "riders_current_shift_fk";
            columns: ["current_shift_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "shifts";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "riders_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "riders_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants_public";
            referencedColumns: ["id"];
          },
        ];
      };
      roles: {
        Row: {
          id: string;
          is_default: boolean;
          name: string;
          permissions: Database["public"]["Enums"]["permission_key"][];
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          id?: string;
          is_default?: boolean;
          name: string;
          permissions?: Database["public"]["Enums"]["permission_key"][];
          tenant_id: string;
        };
        Update: {
          id?: string;
          is_default?: boolean;
          name?: string;
          permissions?: Database["public"]["Enums"]["permission_key"][];
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "roles_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "roles_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants_public";
            referencedColumns: ["id"];
          },
        ];
      };
      shifts: {
        Row: {
          cash_collected: number;
          expected_remit: number;
          id: string;
          remit_note: string | null;
          remit_received_at: string | null;
          remit_received_by: string | null;
          remit_status: Database["public"]["Enums"]["remit_status"];
          remitted_amount: number | null;
          rider_id: string;
          store_paid: number;
          tenant_id: string;
          time_in: string;
          time_in_lat: number | null;
          time_in_lng: number | null;
          time_out: string | null;
          time_out_lat: number | null;
          time_out_lng: number | null;
        };
        ComputedFields: never;
        Insert: {
          cash_collected?: number;
          expected_remit?: number;
          id?: string;
          remit_note?: string | null;
          remit_received_at?: string | null;
          remit_received_by?: string | null;
          remit_status?: Database["public"]["Enums"]["remit_status"];
          remitted_amount?: number | null;
          rider_id: string;
          store_paid?: number;
          tenant_id: string;
          time_in?: string;
          time_in_lat?: number | null;
          time_in_lng?: number | null;
          time_out?: string | null;
          time_out_lat?: number | null;
          time_out_lng?: number | null;
        };
        Update: {
          cash_collected?: number;
          expected_remit?: number;
          id?: string;
          remit_note?: string | null;
          remit_received_at?: string | null;
          remit_received_by?: string | null;
          remit_status?: Database["public"]["Enums"]["remit_status"];
          remitted_amount?: number | null;
          rider_id?: string;
          store_paid?: number;
          tenant_id?: string;
          time_in?: string;
          time_in_lat?: number | null;
          time_in_lng?: number | null;
          time_out?: string | null;
          time_out_lat?: number | null;
          time_out_lng?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "shifts_remit_received_by_tenant_id_fkey";
            columns: ["remit_received_by", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "staff_users";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "shifts_rider_id_tenant_id_fkey";
            columns: ["rider_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "riders";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "shifts_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shifts_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants_public";
            referencedColumns: ["id"];
          },
        ];
      };
      staff_users: {
        Row: {
          auth_user_id: string | null;
          avatar_url: string | null;
          created_at: string;
          email: string;
          id: string;
          name: string;
          role_id: string | null;
          status: Database["public"]["Enums"]["staff_status"];
          tenant_id: string;
          type: Database["public"]["Enums"]["staff_type"];
        };
        ComputedFields: never;
        Insert: {
          auth_user_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          name: string;
          role_id?: string | null;
          status?: Database["public"]["Enums"]["staff_status"];
          tenant_id: string;
          type: Database["public"]["Enums"]["staff_type"];
        };
        Update: {
          auth_user_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          name?: string;
          role_id?: string | null;
          status?: Database["public"]["Enums"]["staff_status"];
          tenant_id?: string;
          type?: Database["public"]["Enums"]["staff_type"];
        };
        Relationships: [
          {
            foreignKeyName: "staff_users_role_id_tenant_id_fkey";
            columns: ["role_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "staff_users_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "staff_users_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants_public";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_billing: {
        Row: {
          effective_from: string;
          model: Database["public"]["Enums"]["billing_model"];
          monthly_fee: number | null;
          per_order_fee: number | null;
          tenant_id: string;
          trial_ends_at: string | null;
          updated_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          effective_from?: string;
          model?: Database["public"]["Enums"]["billing_model"];
          monthly_fee?: number | null;
          per_order_fee?: number | null;
          tenant_id: string;
          trial_ends_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          effective_from?: string;
          model?: Database["public"]["Enums"]["billing_model"];
          monthly_fee?: number | null;
          per_order_fee?: number | null;
          tenant_id?: string;
          trial_ends_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_billing_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: true;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tenant_billing_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: true;
            referencedRelation: "tenants_public";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tenant_billing_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "platform_admins";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_settings: {
        Row: {
          accepted_id_types: Database["public"]["Enums"]["id_type"][];
          auto_approve_verified_customers: boolean;
          delivery_fee: Json | null;
          dispatch_mode: Database["public"]["Enums"]["dispatch_mode"];
          loyalty: NonNullable<Json>;
          max_order_subtotal: number;
          pin_adjust_radius_m: number;
          rider_pay: Json | null;
          rider_response_timeout_sec: number;
          service_area_lat: number;
          service_area_lng: number;
          service_area_radius_km: number;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          accepted_id_types?: Database["public"]["Enums"]["id_type"][];
          auto_approve_verified_customers?: boolean;
          delivery_fee?: Json | null;
          dispatch_mode?: Database["public"]["Enums"]["dispatch_mode"];
          loyalty: NonNullable<Json>;
          max_order_subtotal?: number;
          pin_adjust_radius_m?: number;
          rider_pay?: Json | null;
          rider_response_timeout_sec?: number;
          service_area_lat: number;
          service_area_lng: number;
          service_area_radius_km: number;
          tenant_id: string;
        };
        Update: {
          accepted_id_types?: Database["public"]["Enums"]["id_type"][];
          auto_approve_verified_customers?: boolean;
          delivery_fee?: Json | null;
          dispatch_mode?: Database["public"]["Enums"]["dispatch_mode"];
          loyalty?: NonNullable<Json>;
          max_order_subtotal?: number;
          pin_adjust_radius_m?: number;
          rider_pay?: Json | null;
          rider_response_timeout_sec?: number;
          service_area_lat?: number;
          service_area_lng?: number;
          service_area_radius_km?: number;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_settings_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: true;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tenant_settings_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: true;
            referencedRelation: "tenants_public";
            referencedColumns: ["id"];
          },
        ];
      };
      tenants: {
        Row: {
          background_color: string;
          business_name: string;
          created_at: string;
          currency: string;
          id: string;
          logo_url: string;
          owner_id: string | null;
          primary_color: string;
          pwa_icons: NonNullable<Json>;
          short_name: string;
          slug: string;
          status: Database["public"]["Enums"]["tenant_status"];
          suspend_reason: string | null;
          timezone: string;
        };
        ComputedFields: never;
        Insert: {
          background_color: string;
          business_name: string;
          created_at?: string;
          currency?: string;
          id?: string;
          logo_url?: string;
          owner_id?: string | null;
          primary_color: string;
          pwa_icons?: NonNullable<Json>;
          short_name: string;
          slug: string;
          status?: Database["public"]["Enums"]["tenant_status"];
          suspend_reason?: string | null;
          timezone?: string;
        };
        Update: {
          background_color?: string;
          business_name?: string;
          created_at?: string;
          currency?: string;
          id?: string;
          logo_url?: string;
          owner_id?: string | null;
          primary_color?: string;
          pwa_icons?: NonNullable<Json>;
          short_name?: string;
          slug?: string;
          status?: Database["public"]["Enums"]["tenant_status"];
          suspend_reason?: string | null;
          timezone?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tenants_owner_fk";
            columns: ["owner_id", "id"];
            isOneToOne: false;
            referencedRelation: "staff_users";
            referencedColumns: ["id", "tenant_id"];
          },
        ];
      };
      verifications: {
        Row: {
          customer_id: string;
          id: string;
          id_back_url: string | null;
          id_front_url: string;
          id_type: Database["public"]["Enums"]["id_type"];
          order_id: string | null;
          reject_reason: string | null;
          result: Database["public"]["Enums"]["verification_result"] | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          selfie_with_id_url: string;
          submitted_at: string;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          customer_id: string;
          id?: string;
          id_back_url?: string | null;
          id_front_url: string;
          id_type: Database["public"]["Enums"]["id_type"];
          order_id?: string | null;
          reject_reason?: string | null;
          result?: Database["public"]["Enums"]["verification_result"] | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          selfie_with_id_url: string;
          submitted_at?: string;
          tenant_id: string;
        };
        Update: {
          customer_id?: string;
          id?: string;
          id_back_url?: string | null;
          id_front_url?: string;
          id_type?: Database["public"]["Enums"]["id_type"];
          order_id?: string | null;
          reject_reason?: string | null;
          result?: Database["public"]["Enums"]["verification_result"] | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          selfie_with_id_url?: string;
          submitted_at?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "verifications_customer_id_tenant_id_fkey";
            columns: ["customer_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "verifications_order_fk";
            columns: ["order_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "verifications_reviewed_by_tenant_id_fkey";
            columns: ["reviewed_by", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "staff_users";
            referencedColumns: ["id", "tenant_id"];
          },
        ];
      };
    };
    Views: {
      products_public: {
        Row: {
          category: string;
          description: string;
          id: string;
          image_url: string;
          is_available: boolean;
          merchant_id: string;
          name: string;
          price: number;
          sort_order: number;
          tenant_id: string;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "products_merchant_id_tenant_id_fkey";
            columns: ["merchant_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "products_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants_public";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_settings_public: {
        Row: {
          accepted_id_types: Database["public"]["Enums"]["id_type"][];
          auto_approve_verified_customers: boolean;
          delivery_fee: Json | null;
          loyalty: NonNullable<Json>;
          max_order_subtotal: number;
          pin_adjust_radius_m: number;
          service_area_lat: number;
          service_area_lng: number;
          service_area_radius_km: number;
          tenant_id: string;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "tenant_settings_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: true;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tenant_settings_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: true;
            referencedRelation: "tenants_public";
            referencedColumns: ["id"];
          },
        ];
      };
      tenants_public: {
        Row: {
          background_color: string;
          business_name: string;
          currency: string;
          id: string;
          logo_url: string;
          primary_color: string;
          pwa_icons: NonNullable<Json>;
          short_name: string;
          slug: string;
          status: Database["public"]["Enums"]["tenant_status"];
          timezone: string;
        };
        ComputedFields: never;
        Insert: {
          background_color?: string | null;
          business_name?: string | null;
          currency?: string | null;
          id?: string | null;
          logo_url?: string | null;
          primary_color?: string | null;
          pwa_icons?: Json | null;
          short_name?: string | null;
          slug?: string | null;
          status?: Database["public"]["Enums"]["tenant_status"] | null;
          timezone?: string | null;
        };
        Update: {
          background_color?: string | null;
          business_name?: string | null;
          currency?: string | null;
          id?: string | null;
          logo_url?: string | null;
          primary_color?: string | null;
          pwa_icons?: Json | null;
          short_name?: string | null;
          slug?: string | null;
          status?: Database["public"]["Enums"]["tenant_status"] | null;
          timezone?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      accept_staff_invite: { Args: { p_tenant: string }; Returns: string };
      adjust_points: {
        Args: { p_customer: string; p_note: string; p_points: number };
        Returns: number;
      };
      approve_order: { Args: { p_order: string }; Returns: undefined };
      arrive_at_store: { Args: { p_order: string }; Returns: undefined };
      assign_order: { Args: { p_order: string; p_rider: string }; Returns: undefined };
      auth_login_status: {
        Args: { p_email: string };
        Returns: {
          in_use: boolean;
          user_id: string;
        }[];
      };
      cancel_order: { Args: { p_order: string; p_reason: string }; Returns: undefined };
      cancel_order_by_customer: { Args: { p_order: string }; Returns: undefined };
      cancel_unavailable: { Args: { p_order: string }; Returns: undefined };
      check_coupon: {
        Args: { p_code: string; p_tenant: string };
        Returns: {
          code: string;
          description: string;
          id: string;
          is_active: boolean;
          max_discount: number;
          max_uses: number;
          min_order_subtotal: number;
          my_uses: number;
          per_customer_limit: number;
          percent_off: number;
          type: Database["public"]["Enums"]["coupon_type"];
          used_count: number;
          valid_from: string;
          valid_until: string;
        }[];
      };
      complete_delivery: { Args: { p: Json }; Returns: undefined };
      create_tenant: {
        Args: {
          p_admin_permissions: Database["public"]["Enums"]["permission_key"][];
          p_background_color: string;
          p_business_name: string;
          p_center_lat: number;
          p_center_lng: number;
          p_loyalty: Json;
          p_owner_auth_id: string;
          p_owner_email: string;
          p_owner_name: string;
          p_primary_color: string;
          p_radius_km: number;
          p_short_name: string;
          p_slug: string;
        };
        Returns: string;
      };
      ensure_customer: { Args: { p_tenant: string }; Returns: string };
      expire_offers: { Args: Record<PropertyKey, never>; Returns: number };
      has_permission: {
        Args: { p_perm: Database["public"]["Enums"]["permission_key"]; p_tenant: string };
        Returns: boolean;
      };
      is_nonneg_int: { Args: { v: Json }; Returns: boolean };
      is_valid_delivery_fee: { Args: { r: Json }; Returns: boolean };
      is_valid_loyalty: { Args: { l: Json }; Returns: boolean };
      is_valid_rider_pay: { Args: { r: Json }; Returns: boolean };
      my_offer: { Args: { p_tenant: string }; Returns: Json };
      pick_up_order: {
        Args: { p_order: string; p_receipt_path: string; p_store_amount: number };
        Returns: undefined;
      };
      place_order: { Args: { p: Json }; Returns: Json };
      record_remittance: {
        Args: { p_amount: number; p_note?: string; p_shift: string };
        Returns: Database["public"]["Enums"]["remit_status"];
      };
      reject_customer: { Args: { p_customer: string; p_reason: string }; Returns: undefined };
      reject_order: { Args: { p_order: string; p_reason: string }; Returns: undefined };
      respond_to_offer: {
        Args: {
          p_accept: boolean;
          p_note?: string;
          p_order: string;
          p_reason?: Database["public"]["Enums"]["rider_reject_reason"];
        };
        Returns: string;
      };
      rider_time_in: {
        Args: { p_lat?: number; p_lng?: number; p_tenant: string };
        Returns: string;
      };
      rider_time_out: { Args: { p_lat?: number; p_lng?: number; p_tenant: string }; Returns: Json };
      set_items_unavailable: { Args: { p: Json }; Returns: undefined };
      submit_verification: {
        Args: {
          p_id_front_url: string;
          p_id_type: Database["public"]["Enums"]["id_type"];
          p_selfie_with_id_url: string;
          p_tenant: string;
        };
        Returns: string;
      };
      verify_customer: { Args: { p_customer: string }; Returns: undefined };
    };
    Enums: {
      active_status: "ACTIVE" | "INACTIVE";
      actor_type: "CUSTOMER" | "OWNER" | "ADMIN" | "RIDER" | "SYSTEM";
      assigned_by: "AUTO" | "ADMIN";
      attempt_response: "ACCEPTED" | "REJECTED" | "TIMED_OUT" | "WITHDRAWN";
      billing_model: "FREE" | "MONTHLY" | "PER_ORDER" | "MONTHLY_PLUS_PER_ORDER";
      coupon_type: "PERCENT_OFF" | "FREE_DELIVERY";
      dispatch_mode: "AUTO" | "MANUAL";
      id_type:
        | "PHILSYS"
        | "DRIVERS_LICENSE"
        | "PASSPORT"
        | "UMID"
        | "SSS"
        | "GSIS"
        | "PRC"
        | "POSTAL"
        | "VOTERS"
        | "PHILHEALTH"
        | "TIN"
        | "SENIOR_CITIZEN"
        | "PWD"
        | "SCHOOL"
        | "OTHER_GOV";
      location_permission: "GRANTED" | "DENIED" | "UNKNOWN";
      loyalty_kind:
        | "POINTS_EARNED"
        | "POINTS_REDEEMED"
        | "POINTS_REFUNDED"
        | "POINTS_ADJUSTED"
        | "FREE_DELIVERY_EARNED"
        | "FREE_DELIVERY_USED"
        | "FREE_DELIVERY_REFUNDED"
        | "FREE_GIFT_EARNED"
        | "FREE_GIFT_USED"
        | "FREE_GIFT_REFUNDED";
      order_status:
        | "PENDING_APPROVAL"
        | "APPROVED"
        | "ASSIGNED"
        | "AT_MERCHANT"
        | "PICKED_UP"
        | "DELIVERED"
        | "REJECTED"
        | "CANCELLED";
      payment_status: "UNPAID" | "COLLECTED";
      permission_key:
        | "customers.view"
        | "customers.verify"
        | "orders.view"
        | "orders.approve"
        | "orders.assign"
        | "orders.cancel"
        | "riders.view"
        | "riders.manage"
        | "merchants.manage"
        | "products.manage"
        | "settings.pricing"
        | "settings.riderPay"
        | "settings.dispatch"
        | "settings.business"
        | "admins.manage"
        | "reports.view"
        | "cash.manage"
        | "coupons.manage"
        | "loyalty.manage"
        | "settings.loyalty";
      remit_status: "OPEN" | "PENDING" | "RECEIVED" | "SHORT" | "OVER";
      rider_reject_reason:
        "NOT_ENOUGH_CASH" | "TOO_FAR" | "VEHICLE_PROBLEM" | "NO_RESPONSE" | "OTHER";
      staff_status: "INVITED" | "ACTIVE" | "INACTIVE";
      staff_type: "OWNER" | "ADMIN";
      statement_status: "UNPAID" | "PAID" | "WAIVED";
      tenant_status: "ACTIVE" | "SUSPENDED";
      vehicle_type: "BICYCLE" | "MOTORCYCLE" | "CAR";
      verification_result: "APPROVED" | "REJECTED";
      verification_status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      active_status: ["ACTIVE", "INACTIVE"],
      actor_type: ["CUSTOMER", "OWNER", "ADMIN", "RIDER", "SYSTEM"],
      assigned_by: ["AUTO", "ADMIN"],
      attempt_response: ["ACCEPTED", "REJECTED", "TIMED_OUT", "WITHDRAWN"],
      billing_model: ["FREE", "MONTHLY", "PER_ORDER", "MONTHLY_PLUS_PER_ORDER"],
      coupon_type: ["PERCENT_OFF", "FREE_DELIVERY"],
      dispatch_mode: ["AUTO", "MANUAL"],
      id_type: [
        "PHILSYS",
        "DRIVERS_LICENSE",
        "PASSPORT",
        "UMID",
        "SSS",
        "GSIS",
        "PRC",
        "POSTAL",
        "VOTERS",
        "PHILHEALTH",
        "TIN",
        "SENIOR_CITIZEN",
        "PWD",
        "SCHOOL",
        "OTHER_GOV",
      ],
      location_permission: ["GRANTED", "DENIED", "UNKNOWN"],
      loyalty_kind: [
        "POINTS_EARNED",
        "POINTS_REDEEMED",
        "POINTS_REFUNDED",
        "POINTS_ADJUSTED",
        "FREE_DELIVERY_EARNED",
        "FREE_DELIVERY_USED",
        "FREE_DELIVERY_REFUNDED",
        "FREE_GIFT_EARNED",
        "FREE_GIFT_USED",
        "FREE_GIFT_REFUNDED",
      ],
      order_status: [
        "PENDING_APPROVAL",
        "APPROVED",
        "ASSIGNED",
        "AT_MERCHANT",
        "PICKED_UP",
        "DELIVERED",
        "REJECTED",
        "CANCELLED",
      ],
      payment_status: ["UNPAID", "COLLECTED"],
      permission_key: [
        "customers.view",
        "customers.verify",
        "orders.view",
        "orders.approve",
        "orders.assign",
        "orders.cancel",
        "riders.view",
        "riders.manage",
        "merchants.manage",
        "products.manage",
        "settings.pricing",
        "settings.riderPay",
        "settings.dispatch",
        "settings.business",
        "admins.manage",
        "reports.view",
        "cash.manage",
        "coupons.manage",
        "loyalty.manage",
        "settings.loyalty",
      ],
      remit_status: ["OPEN", "PENDING", "RECEIVED", "SHORT", "OVER"],
      rider_reject_reason: [
        "NOT_ENOUGH_CASH",
        "TOO_FAR",
        "VEHICLE_PROBLEM",
        "NO_RESPONSE",
        "OTHER",
      ],
      staff_status: ["INVITED", "ACTIVE", "INACTIVE"],
      staff_type: ["OWNER", "ADMIN"],
      statement_status: ["UNPAID", "PAID", "WAIVED"],
      tenant_status: ["ACTIVE", "SUSPENDED"],
      vehicle_type: ["BICYCLE", "MOTORCYCLE", "CAR"],
      verification_result: ["APPROVED", "REJECTED"],
      verification_status: ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"],
    },
  },
} as const;
