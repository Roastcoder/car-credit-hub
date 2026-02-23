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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      banks: {
        Row: {
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          interest_rate: number | null
          is_active: boolean | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          interest_rate?: number | null
          is_active?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          interest_rate?: number | null
          is_active?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      branches: {
        Row: {
          address: string | null
          city: string | null
          code: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          manager_name: string | null
          name: string
          phone: string | null
          pincode: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          manager_name?: string | null
          name: string
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          manager_name?: string | null
          name?: string
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      brokers: {
        Row: {
          area: string | null
          commission_rate: number | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          area?: string | null
          commission_rate?: number | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          area?: string | null
          commission_rate?: number | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          broker_id: string | null
          commission_amount: number
          commission_rate: number | null
          created_at: string
          id: string
          loan_id: string
          paid_date: string | null
          status: Database["public"]["Enums"]["commission_status"]
          updated_at: string
        }
        Insert: {
          broker_id?: string | null
          commission_amount?: number
          commission_rate?: number | null
          created_at?: string
          id?: string
          loan_id: string
          paid_date?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          updated_at?: string
        }
        Update: {
          broker_id?: string | null
          commission_amount?: number
          commission_rate?: number | null
          created_at?: string
          id?: string
          loan_id?: string
          paid_date?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_documents: {
        Row: {
          created_at: string
          document_type: Database["public"]["Enums"]["doc_type"]
          file_name: string
          file_size: number | null
          id: string
          loan_id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type?: Database["public"]["Enums"]["doc_type"]
          file_name: string
          file_size?: number | null
          id?: string
          loan_id: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: Database["public"]["Enums"]["doc_type"]
          file_name?: string
          file_size?: number | null
          id?: string
          loan_id?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_documents_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          aadhaar: string | null
          actual_loan_amount: number | null
          address: string | null
          advance_emi: number | null
          agent_mobile_no: string | null
          agreement_date: string | null
          agreement_number: string | null
          agriculture: string | null
          applicant_name: string
          approval_date: string | null
          assigned_bank_id: string | null
          assigned_broker_id: string | null
          booking_mode: string | null
          booking_month: string | null
          booking_year: string | null
          bounce_charges: number | null
          branch_id: string | null
          branch_manager_name: string | null
          car_make: string | null
          car_model: string | null
          car_variant: string | null
          challan: string | null
          co_applicant_mobile: string | null
          co_applicant_name: string | null
          created_at: string
          created_by: string | null
          current_address: string | null
          current_district: string | null
          current_pincode: string | null
          current_tehsil: string | null
          current_village: string | null
          customer_id: string | null
          customer_track_company: string | null
          dealer_name: string | null
          deferral_charges: number | null
          disburse_branch_name: string | null
          disburse_date: string | null
          documentation_charges: number | null
          down_payment: number | null
          dto_location: string | null
          emi: number | null
          emi_amount: number | null
          emi_end_date: string | null
          emi_mode: string | null
          emi_start_date: string | null
          fc: string | null
          file_charge: number | null
          file_sign_date: string | null
          file_stage: string | null
          financier_address: string | null
          financier_contact_no: string | null
          financier_disburse_date: string | null
          financier_email: string | null
          financier_executive_name: string | null
          financier_loan_id: string | null
          financier_team_vertical: string | null
          first_emi_amount: number | null
          first_installment_due_date: string | null
          first_payment_credited: string | null
          for_closure: string | null
          grid: number | null
          gst: number | null
          guarantor_mobile: string | null
          guarantor_name: string | null
          hold_amount: number | null
          hpn_after_pdd: string | null
          hpn_at_login: string | null
          id: string
          idv: number | null
          income_source: string | null
          insurance_agent_contact: string | null
          insurance_agent_name: string | null
          insurance_company_name: string | null
          insurance_coverage_amount: number | null
          insurance_date: string | null
          insurance_hpn: string | null
          insurance_made_by: string | null
          insurance_nominee: string | null
          insurance_policy_number: string | null
          insurance_renewal_date: string | null
          insurance_status: string | null
          insurance_transfer: string | null
          insurance_type: string | null
          insured_name: string | null
          interest_rate: number | null
          irr: number | null
          loan_amount: number
          loan_number: string | null
          loan_suraksha: number | null
          loan_type: string | null
          loan_type_vehicle: string | null
          login_date: string | null
          ltv: number | null
          maker_name: string | null
          manager_id: string | null
          mehar_disburse_date: string | null
          mfg_year: string | null
          mobile: string
          model_variant_name: string | null
          model_year: string | null
          monthly_income: number | null
          net_disbursement_amount: number | null
          net_received_amount: number | null
          new_financier: string | null
          nip_ip: string | null
          on_road_price: number | null
          other_charges: number | null
          our_branch: string | null
          pan: string | null
          payment_received_date: string | null
          penalty_charges: number | null
          permanent_address: string | null
          permanent_district: string | null
          permanent_pincode: string | null
          permanent_tehsil: string | null
          permanent_village: string | null
          premium_amount: number | null
          previous_track_details: string | null
          principal_amount: number | null
          processing_fee: number | null
          product_code: string | null
          product_name: string | null
          rc_expiry_date: string | null
          rc_mfg_date: string | null
          rc_owner_name: string | null
          record: string | null
          remark: string | null
          rto_agent_name: string | null
          rto_docs_handover_date: string | null
          rto_papers: string | null
          rto_rc_handover_date: string | null
          rto_work_description: string | null
          sanction_amount: number | null
          sanction_date: string | null
          scheme: string | null
          sourcing_person_name: string | null
          stamping: number | null
          status: Database["public"]["Enums"]["loan_status"]
          tat: number | null
          tenure: number | null
          total_deduction: number | null
          total_emi: number | null
          total_interest: number | null
          track_status: string | null
          updated_at: string
          valuation: number | null
          vehicle_number: string | null
          vertical: string | null
        }
        Insert: {
          aadhaar?: string | null
          actual_loan_amount?: number | null
          address?: string | null
          advance_emi?: number | null
          agent_mobile_no?: string | null
          agreement_date?: string | null
          agreement_number?: string | null
          agriculture?: string | null
          applicant_name: string
          approval_date?: string | null
          assigned_bank_id?: string | null
          assigned_broker_id?: string | null
          booking_mode?: string | null
          booking_month?: string | null
          booking_year?: string | null
          bounce_charges?: number | null
          branch_id?: string | null
          branch_manager_name?: string | null
          car_make?: string | null
          car_model?: string | null
          car_variant?: string | null
          challan?: string | null
          co_applicant_mobile?: string | null
          co_applicant_name?: string | null
          created_at?: string
          created_by?: string | null
          current_address?: string | null
          current_district?: string | null
          current_pincode?: string | null
          current_tehsil?: string | null
          current_village?: string | null
          customer_id?: string | null
          customer_track_company?: string | null
          dealer_name?: string | null
          deferral_charges?: number | null
          disburse_branch_name?: string | null
          disburse_date?: string | null
          documentation_charges?: number | null
          down_payment?: number | null
          dto_location?: string | null
          emi?: number | null
          emi_amount?: number | null
          emi_end_date?: string | null
          emi_mode?: string | null
          emi_start_date?: string | null
          fc?: string | null
          file_charge?: number | null
          file_sign_date?: string | null
          file_stage?: string | null
          financier_address?: string | null
          financier_contact_no?: string | null
          financier_disburse_date?: string | null
          financier_email?: string | null
          financier_executive_name?: string | null
          financier_loan_id?: string | null
          financier_team_vertical?: string | null
          first_emi_amount?: number | null
          first_installment_due_date?: string | null
          first_payment_credited?: string | null
          for_closure?: string | null
          grid?: number | null
          gst?: number | null
          guarantor_mobile?: string | null
          guarantor_name?: string | null
          hold_amount?: number | null
          hpn_after_pdd?: string | null
          hpn_at_login?: string | null
          id: string
          idv?: number | null
          income_source?: string | null
          insurance_agent_contact?: string | null
          insurance_agent_name?: string | null
          insurance_company_name?: string | null
          insurance_coverage_amount?: number | null
          insurance_date?: string | null
          insurance_hpn?: string | null
          insurance_made_by?: string | null
          insurance_nominee?: string | null
          insurance_policy_number?: string | null
          insurance_renewal_date?: string | null
          insurance_status?: string | null
          insurance_transfer?: string | null
          insurance_type?: string | null
          insured_name?: string | null
          interest_rate?: number | null
          irr?: number | null
          loan_amount?: number
          loan_number?: string | null
          loan_suraksha?: number | null
          loan_type?: string | null
          loan_type_vehicle?: string | null
          login_date?: string | null
          ltv?: number | null
          maker_name?: string | null
          manager_id?: string | null
          mehar_disburse_date?: string | null
          mfg_year?: string | null
          mobile: string
          model_variant_name?: string | null
          model_year?: string | null
          monthly_income?: number | null
          net_disbursement_amount?: number | null
          net_received_amount?: number | null
          new_financier?: string | null
          nip_ip?: string | null
          on_road_price?: number | null
          other_charges?: number | null
          our_branch?: string | null
          pan?: string | null
          payment_received_date?: string | null
          penalty_charges?: number | null
          permanent_address?: string | null
          permanent_district?: string | null
          permanent_pincode?: string | null
          permanent_tehsil?: string | null
          permanent_village?: string | null
          premium_amount?: number | null
          previous_track_details?: string | null
          principal_amount?: number | null
          processing_fee?: number | null
          product_code?: string | null
          product_name?: string | null
          rc_expiry_date?: string | null
          rc_mfg_date?: string | null
          rc_owner_name?: string | null
          record?: string | null
          remark?: string | null
          rto_agent_name?: string | null
          rto_docs_handover_date?: string | null
          rto_papers?: string | null
          rto_rc_handover_date?: string | null
          rto_work_description?: string | null
          sanction_amount?: number | null
          sanction_date?: string | null
          scheme?: string | null
          sourcing_person_name?: string | null
          stamping?: number | null
          status?: Database["public"]["Enums"]["loan_status"]
          tat?: number | null
          tenure?: number | null
          total_deduction?: number | null
          total_emi?: number | null
          total_interest?: number | null
          track_status?: string | null
          updated_at?: string
          valuation?: number | null
          vehicle_number?: string | null
          vertical?: string | null
        }
        Update: {
          aadhaar?: string | null
          actual_loan_amount?: number | null
          address?: string | null
          advance_emi?: number | null
          agent_mobile_no?: string | null
          agreement_date?: string | null
          agreement_number?: string | null
          agriculture?: string | null
          applicant_name?: string
          approval_date?: string | null
          assigned_bank_id?: string | null
          assigned_broker_id?: string | null
          booking_mode?: string | null
          booking_month?: string | null
          booking_year?: string | null
          bounce_charges?: number | null
          branch_id?: string | null
          branch_manager_name?: string | null
          car_make?: string | null
          car_model?: string | null
          car_variant?: string | null
          challan?: string | null
          co_applicant_mobile?: string | null
          co_applicant_name?: string | null
          created_at?: string
          created_by?: string | null
          current_address?: string | null
          current_district?: string | null
          current_pincode?: string | null
          current_tehsil?: string | null
          current_village?: string | null
          customer_id?: string | null
          customer_track_company?: string | null
          dealer_name?: string | null
          deferral_charges?: number | null
          disburse_branch_name?: string | null
          disburse_date?: string | null
          documentation_charges?: number | null
          down_payment?: number | null
          dto_location?: string | null
          emi?: number | null
          emi_amount?: number | null
          emi_end_date?: string | null
          emi_mode?: string | null
          emi_start_date?: string | null
          fc?: string | null
          file_charge?: number | null
          file_sign_date?: string | null
          file_stage?: string | null
          financier_address?: string | null
          financier_contact_no?: string | null
          financier_disburse_date?: string | null
          financier_email?: string | null
          financier_executive_name?: string | null
          financier_loan_id?: string | null
          financier_team_vertical?: string | null
          first_emi_amount?: number | null
          first_installment_due_date?: string | null
          first_payment_credited?: string | null
          for_closure?: string | null
          grid?: number | null
          gst?: number | null
          guarantor_mobile?: string | null
          guarantor_name?: string | null
          hold_amount?: number | null
          hpn_after_pdd?: string | null
          hpn_at_login?: string | null
          id?: string
          idv?: number | null
          income_source?: string | null
          insurance_agent_contact?: string | null
          insurance_agent_name?: string | null
          insurance_company_name?: string | null
          insurance_coverage_amount?: number | null
          insurance_date?: string | null
          insurance_hpn?: string | null
          insurance_made_by?: string | null
          insurance_nominee?: string | null
          insurance_policy_number?: string | null
          insurance_renewal_date?: string | null
          insurance_status?: string | null
          insurance_transfer?: string | null
          insurance_type?: string | null
          insured_name?: string | null
          interest_rate?: number | null
          irr?: number | null
          loan_amount?: number
          loan_number?: string | null
          loan_suraksha?: number | null
          loan_type?: string | null
          loan_type_vehicle?: string | null
          login_date?: string | null
          ltv?: number | null
          maker_name?: string | null
          manager_id?: string | null
          mehar_disburse_date?: string | null
          mfg_year?: string | null
          mobile?: string
          model_variant_name?: string | null
          model_year?: string | null
          monthly_income?: number | null
          net_disbursement_amount?: number | null
          net_received_amount?: number | null
          new_financier?: string | null
          nip_ip?: string | null
          on_road_price?: number | null
          other_charges?: number | null
          our_branch?: string | null
          pan?: string | null
          payment_received_date?: string | null
          penalty_charges?: number | null
          permanent_address?: string | null
          permanent_district?: string | null
          permanent_pincode?: string | null
          permanent_tehsil?: string | null
          permanent_village?: string | null
          premium_amount?: number | null
          previous_track_details?: string | null
          principal_amount?: number | null
          processing_fee?: number | null
          product_code?: string | null
          product_name?: string | null
          rc_expiry_date?: string | null
          rc_mfg_date?: string | null
          rc_owner_name?: string | null
          record?: string | null
          remark?: string | null
          rto_agent_name?: string | null
          rto_docs_handover_date?: string | null
          rto_papers?: string | null
          rto_rc_handover_date?: string | null
          rto_work_description?: string | null
          sanction_amount?: number | null
          sanction_date?: string | null
          scheme?: string | null
          sourcing_person_name?: string | null
          stamping?: number | null
          status?: Database["public"]["Enums"]["loan_status"]
          tat?: number | null
          tenure?: number | null
          total_deduction?: number | null
          total_emi?: number | null
          total_interest?: number | null
          track_status?: string | null
          updated_at?: string
          valuation?: number | null
          vehicle_number?: string | null
          vertical?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loans_assigned_bank_id_fkey"
            columns: ["assigned_bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_assigned_broker_id_fkey"
            columns: ["assigned_broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          branch_id: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          branch_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          branch_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_manager_or_above: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "manager"
        | "bank"
        | "broker"
        | "employee"
      commission_status: "pending" | "paid" | "on_hold"
      doc_type:
        | "rc_copy"
        | "insurance"
        | "income_proof"
        | "bank_statement"
        | "nach"
        | "other"
      loan_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "approved"
        | "rejected"
        | "disbursed"
        | "cancelled"
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
        "super_admin",
        "admin",
        "manager",
        "bank",
        "broker",
        "employee",
      ],
      commission_status: ["pending", "paid", "on_hold"],
      doc_type: [
        "rc_copy",
        "insurance",
        "income_proof",
        "bank_statement",
        "nach",
        "other",
      ],
      loan_status: [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "disbursed",
        "cancelled",
      ],
    },
  },
} as const
