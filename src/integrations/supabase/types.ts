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
      ambulances: {
        Row: {
          baladiya_id: number | null
          coverage_area: string | null
          created_at: string
          id: string
          is_24_7: boolean
          lat: number | null
          lng: number | null
          name: string
          owner_id: string | null
          phone: string | null
          photo_url: string | null
          updated_at: string
          verified: boolean
          wilaya_id: number | null
        }
        Insert: {
          baladiya_id?: number | null
          coverage_area?: string | null
          created_at?: string
          id?: string
          is_24_7?: boolean
          lat?: number | null
          lng?: number | null
          name: string
          owner_id?: string | null
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
          verified?: boolean
          wilaya_id?: number | null
        }
        Update: {
          baladiya_id?: number | null
          coverage_area?: string | null
          created_at?: string
          id?: string
          is_24_7?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
          verified?: boolean
          wilaya_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ambulances_baladiya_id_fkey"
            columns: ["baladiya_id"]
            isOneToOne: false
            referencedRelation: "baladiyas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambulances_wilaya_id_fkey"
            columns: ["wilaya_id"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string
          doctor_id: string | null
          fee: number | null
          id: string
          reason: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          user_id: string
          visit_type: string | null
        }
        Insert: {
          created_at?: string
          doctor_id?: string | null
          fee?: number | null
          id?: string
          reason?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          user_id: string
          visit_type?: string | null
        }
        Update: {
          created_at?: string
          doctor_id?: string | null
          fee?: number | null
          id?: string
          reason?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          user_id?: string
          visit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      baladiyas: {
        Row: {
          id: number
          name_ar: string
          name_en: string
          name_fr: string
          wilaya_id: number
        }
        Insert: {
          id?: number
          name_ar: string
          name_en: string
          name_fr: string
          wilaya_id: number
        }
        Update: {
          id?: number
          name_ar?: string
          name_en?: string
          name_fr?: string
          wilaya_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "baladiyas_wilaya_id_fkey"
            columns: ["wilaya_id"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      blood_donors: {
        Row: {
          address: string | null
          available: boolean | null
          baladiya_id: number | null
          blood_type: Database["public"]["Enums"]["blood_type"]
          created_at: string
          created_by: string | null
          emergency: boolean | null
          full_name: string
          id: string
          phone: string | null
          photo_url: string | null
          wilaya_id: number | null
        }
        Insert: {
          address?: string | null
          available?: boolean | null
          baladiya_id?: number | null
          blood_type: Database["public"]["Enums"]["blood_type"]
          created_at?: string
          created_by?: string | null
          emergency?: boolean | null
          full_name: string
          id?: string
          phone?: string | null
          photo_url?: string | null
          wilaya_id?: number | null
        }
        Update: {
          address?: string | null
          available?: boolean | null
          baladiya_id?: number | null
          blood_type?: Database["public"]["Enums"]["blood_type"]
          created_at?: string
          created_by?: string | null
          emergency?: boolean | null
          full_name?: string
          id?: string
          phone?: string | null
          photo_url?: string | null
          wilaya_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blood_donors_baladiya_id_fkey"
            columns: ["baladiya_id"]
            isOneToOne: false
            referencedRelation: "baladiyas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_donors_wilaya_id_fkey"
            columns: ["wilaya_id"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      blood_requests: {
        Row: {
          baladiya_id: number | null
          blood_type: Database["public"]["Enums"]["blood_type"]
          contact_phone: string
          created_at: string
          hospital_name: string | null
          id: string
          needed_by: string | null
          notes: string | null
          patient_name: string | null
          status: Database["public"]["Enums"]["blood_request_status"]
          units_needed: number
          updated_at: string
          urgency: Database["public"]["Enums"]["blood_urgency"]
          user_id: string
          wilaya_id: number | null
        }
        Insert: {
          baladiya_id?: number | null
          blood_type: Database["public"]["Enums"]["blood_type"]
          contact_phone: string
          created_at?: string
          hospital_name?: string | null
          id?: string
          needed_by?: string | null
          notes?: string | null
          patient_name?: string | null
          status?: Database["public"]["Enums"]["blood_request_status"]
          units_needed?: number
          updated_at?: string
          urgency?: Database["public"]["Enums"]["blood_urgency"]
          user_id: string
          wilaya_id?: number | null
        }
        Update: {
          baladiya_id?: number | null
          blood_type?: Database["public"]["Enums"]["blood_type"]
          contact_phone?: string
          created_at?: string
          hospital_name?: string | null
          id?: string
          needed_by?: string | null
          notes?: string | null
          patient_name?: string | null
          status?: Database["public"]["Enums"]["blood_request_status"]
          units_needed?: number
          updated_at?: string
          urgency?: Database["public"]["Enums"]["blood_urgency"]
          user_id?: string
          wilaya_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blood_requests_baladiya_id_fkey"
            columns: ["baladiya_id"]
            isOneToOne: false
            referencedRelation: "baladiyas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_requests_wilaya_id_fkey"
            columns: ["wilaya_id"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      charities: {
        Row: {
          address: string | null
          baladiya_id: number | null
          created_at: string
          description: string | null
          id: string
          lat: number | null
          lng: number | null
          name: string
          owner_id: string | null
          phone: string | null
          photo_url: string | null
          updated_at: string
          verified: boolean
          wilaya_id: number | null
        }
        Insert: {
          address?: string | null
          baladiya_id?: number | null
          created_at?: string
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          owner_id?: string | null
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
          verified?: boolean
          wilaya_id?: number | null
        }
        Update: {
          address?: string | null
          baladiya_id?: number | null
          created_at?: string
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
          verified?: boolean
          wilaya_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "charities_baladiya_id_fkey"
            columns: ["baladiya_id"]
            isOneToOne: false
            referencedRelation: "baladiyas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charities_wilaya_id_fkey"
            columns: ["wilaya_id"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      civil_protection_centers: {
        Row: {
          address: string | null
          baladiya_id: number | null
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          name: string
          owner_id: string | null
          phone: string | null
          photo_url: string | null
          updated_at: string
          verified: boolean
          wilaya_id: number | null
        }
        Insert: {
          address?: string | null
          baladiya_id?: number | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          owner_id?: string | null
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
          verified?: boolean
          wilaya_id?: number | null
        }
        Update: {
          address?: string | null
          baladiya_id?: number | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
          verified?: boolean
          wilaya_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "civil_protection_centers_baladiya_id_fkey"
            columns: ["baladiya_id"]
            isOneToOne: false
            referencedRelation: "baladiyas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civil_protection_centers_wilaya_id_fkey"
            columns: ["wilaya_id"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_reviews: {
        Row: {
          comment: string | null
          created_at: string
          doctor_id: string
          id: string
          stars: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          doctor_id: string
          id?: string
          stars: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          doctor_id?: string
          id?: string
          stars?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_reviews_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          about: string | null
          address: string | null
          baladiya_id: number | null
          created_at: string
          created_by: string | null
          experience_years: number | null
          fee: number | null
          full_name: string
          id: string
          lat: number | null
          lng: number | null
          patients_count: number | null
          phone: string | null
          photo_url: string | null
          rating: number | null
          reviews_count: number | null
          satisfaction: number | null
          specialty_id: number | null
          updated_at: string
          verified: boolean | null
          wilaya_id: number | null
        }
        Insert: {
          about?: string | null
          address?: string | null
          baladiya_id?: number | null
          created_at?: string
          created_by?: string | null
          experience_years?: number | null
          fee?: number | null
          full_name: string
          id?: string
          lat?: number | null
          lng?: number | null
          patients_count?: number | null
          phone?: string | null
          photo_url?: string | null
          rating?: number | null
          reviews_count?: number | null
          satisfaction?: number | null
          specialty_id?: number | null
          updated_at?: string
          verified?: boolean | null
          wilaya_id?: number | null
        }
        Update: {
          about?: string | null
          address?: string | null
          baladiya_id?: number | null
          created_at?: string
          created_by?: string | null
          experience_years?: number | null
          fee?: number | null
          full_name?: string
          id?: string
          lat?: number | null
          lng?: number | null
          patients_count?: number | null
          phone?: string | null
          photo_url?: string | null
          rating?: number | null
          reviews_count?: number | null
          satisfaction?: number | null
          specialty_id?: number | null
          updated_at?: string
          verified?: boolean | null
          wilaya_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_baladiya_id_fkey"
            columns: ["baladiya_id"]
            isOneToOne: false
            referencedRelation: "baladiyas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctors_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctors_wilaya_id_fkey"
            columns: ["wilaya_id"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          available: boolean | null
          baladiya_id: number | null
          condition: string | null
          created_at: string
          created_by: string | null
          id: string
          kind: string | null
          name: string
          phone: string | null
          photo_url: string | null
          wilaya_id: number | null
        }
        Insert: {
          available?: boolean | null
          baladiya_id?: number | null
          condition?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string | null
          name: string
          phone?: string | null
          photo_url?: string | null
          wilaya_id?: number | null
        }
        Update: {
          available?: boolean | null
          baladiya_id?: number | null
          condition?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          wilaya_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_baladiya_id_fkey"
            columns: ["baladiya_id"]
            isOneToOne: false
            referencedRelation: "baladiyas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_wilaya_id_fkey"
            columns: ["wilaya_id"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitals: {
        Row: {
          address: string | null
          baladiya_id: number | null
          created_at: string
          created_by: string | null
          id: string
          kind: string | null
          lat: number | null
          lng: number | null
          name: string
          phone: string | null
          photo_url: string | null
          rating: number | null
          updated_at: string
          wilaya_id: number | null
        }
        Insert: {
          address?: string | null
          baladiya_id?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string | null
          lat?: number | null
          lng?: number | null
          name: string
          phone?: string | null
          photo_url?: string | null
          rating?: number | null
          updated_at?: string
          wilaya_id?: number | null
        }
        Update: {
          address?: string | null
          baladiya_id?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string | null
          lat?: number | null
          lng?: number | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          rating?: number | null
          updated_at?: string
          wilaya_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hospitals_baladiya_id_fkey"
            columns: ["baladiya_id"]
            isOneToOne: false
            referencedRelation: "baladiyas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospitals_wilaya_id_fkey"
            columns: ["wilaya_id"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      labs: {
        Row: {
          address: string | null
          baladiya_id: number | null
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          name: string
          owner_id: string | null
          phone: string | null
          photo_url: string | null
          updated_at: string
          verified: boolean
          wilaya_id: number | null
        }
        Insert: {
          address?: string | null
          baladiya_id?: number | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          owner_id?: string | null
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
          verified?: boolean
          wilaya_id?: number | null
        }
        Update: {
          address?: string | null
          baladiya_id?: number | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
          verified?: boolean
          wilaya_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "labs_baladiya_id_fkey"
            columns: ["baladiya_id"]
            isOneToOne: false
            referencedRelation: "baladiyas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labs_wilaya_id_fkey"
            columns: ["wilaya_id"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string | null
          read: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string | null
          read?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string | null
          read?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      pharmacies: {
        Row: {
          address: string | null
          baladiya_id: number | null
          created_at: string
          created_by: string | null
          id: string
          is_24_7: boolean | null
          lat: number | null
          lng: number | null
          name: string
          open_until: string | null
          phone: string | null
          photo_url: string | null
          wilaya_id: number | null
        }
        Insert: {
          address?: string | null
          baladiya_id?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_24_7?: boolean | null
          lat?: number | null
          lng?: number | null
          name: string
          open_until?: string | null
          phone?: string | null
          photo_url?: string | null
          wilaya_id?: number | null
        }
        Update: {
          address?: string | null
          baladiya_id?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_24_7?: boolean | null
          lat?: number | null
          lng?: number | null
          name?: string
          open_until?: string | null
          phone?: string | null
          photo_url?: string | null
          wilaya_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacies_baladiya_id_fkey"
            columns: ["baladiya_id"]
            isOneToOne: false
            referencedRelation: "baladiyas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacies_wilaya_id_fkey"
            columns: ["wilaya_id"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_on_call: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          on_call_date: string
          pharmacy_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          on_call_date?: string
          pharmacy_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          on_call_date?: string
          pharmacy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_on_call_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          baladiya_id: number | null
          blood_type: Database["public"]["Enums"]["blood_type"] | null
          created_at: string
          email: string | null
          full_name: string | null
          language: string
          lat: number | null
          lng: number | null
          notify_blood_critical_same_baladiya: boolean
          notify_blood_enabled: boolean
          notify_blood_match_only: boolean
          phone: string | null
          updated_at: string
          user_id: string
          wilaya_id: number | null
        }
        Insert: {
          avatar_url?: string | null
          baladiya_id?: number | null
          blood_type?: Database["public"]["Enums"]["blood_type"] | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          language?: string
          lat?: number | null
          lng?: number | null
          notify_blood_critical_same_baladiya?: boolean
          notify_blood_enabled?: boolean
          notify_blood_match_only?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
          wilaya_id?: number | null
        }
        Update: {
          avatar_url?: string | null
          baladiya_id?: number | null
          blood_type?: Database["public"]["Enums"]["blood_type"] | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          language?: string
          lat?: number | null
          lng?: number | null
          notify_blood_critical_same_baladiya?: boolean
          notify_blood_enabled?: boolean
          notify_blood_match_only?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
          wilaya_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_baladiya_id_fkey"
            columns: ["baladiya_id"]
            isOneToOne: false
            referencedRelation: "baladiyas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_wilaya_id_fkey"
            columns: ["wilaya_id"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          created_at: string
          doctor_id: string | null
          id: string
          rating: number
          review_text: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          doctor_id?: string | null
          id?: string
          rating: number
          review_text?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          doctor_id?: string | null
          id?: string
          rating?: number
          review_text?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      specialties: {
        Row: {
          icon: string | null
          id: number
          name_ar: string
          name_en: string
          name_fr: string
          slug: string
        }
        Insert: {
          icon?: string | null
          id?: number
          name_ar: string
          name_en: string
          name_fr: string
          slug: string
        }
        Update: {
          icon?: string | null
          id?: number
          name_ar?: string
          name_en?: string
          name_fr?: string
          slug?: string
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wilayas: {
        Row: {
          code: string
          id: number
          name_ar: string
          name_en: string
          name_fr: string
        }
        Insert: {
          code: string
          id: number
          name_ar: string
          name_en: string
          name_fr: string
        }
        Update: {
          code?: string
          id?: number
          name_ar?: string
          name_en?: string
          name_fr?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      compatible_donor_types: {
        Args: { _recipient: Database["public"]["Enums"]["blood_type"] }
        Returns: Database["public"]["Enums"]["blood_type"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      appointment_status: "pending" | "confirmed" | "completed" | "cancelled"
      blood_request_status: "open" | "fulfilled" | "cancelled"
      blood_type: "O+" | "O-" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-"
      blood_urgency: "normal" | "urgent" | "critical"
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
      app_role: ["admin", "moderator", "user"],
      appointment_status: ["pending", "confirmed", "completed", "cancelled"],
      blood_request_status: ["open", "fulfilled", "cancelled"],
      blood_type: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"],
      blood_urgency: ["normal", "urgent", "critical"],
    },
  },
} as const
