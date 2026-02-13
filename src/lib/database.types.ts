// Supabase 数据库类型定义
export type Database = {
  public: {
    Tables: {
      fragments: {
        Row: {
          id: string;
          content: string;
          story_id: string | null;
          user_id: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          content: string;
          story_id?: string | null;
          user_id: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          content?: string;
          story_id?: string | null;
          user_id?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      stories: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          color: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          color?: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          color?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          name: string;
          color: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      fragment_tags: {
        Row: {
          fragment_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          fragment_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: {
          fragment_id?: string;
          tag_id?: string;
          created_at?: string;
        };
      };
      ai_analysis_history: {
        Row: {
          id: string;
          fragment_ids: string[];
          target_fragment_id: string | null;
          result: any;
          raw_text: string | null;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          fragment_ids: string[];
          target_fragment_id?: string | null;
          result: any;
          raw_text?: string | null;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          fragment_ids?: string[];
          target_fragment_id?: string | null;
          result?: any;
          raw_text?: string | null;
          user_id?: string;
          created_at?: string;
        };
      };
    };
  };
};
