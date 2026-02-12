export interface Story {
  id: string;
  title: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Fragment {
  id: string;
  content: string;
  story_id?: string;
  story?: Story;
  tags?: Tag[];
  sort_order: number;
  created_at: string;
  updated_at?: string;
}

export interface AIGroup {
  label: string;
  fragmentIds: string[];
}

export interface AIAnalysisResult {
  groups: AIGroup[];
  suggestions: string[];
}

export interface AIAnalysisHistory {
  id: string;
  fragment_ids: string[];
  target_fragment_id?: string;
  result: AIAnalysisResult;
  raw_text?: string;
  created_at: string;
}
