export type CaseStatus = "active" | "closed";

export interface Advocate {
  id: number;
  full_name: string;
  email: string;
  created_at: string;
}

export interface Hearing {
  id: number;
  case_id: number;
  filing_date: string | null;
  court_name: string;
  party_name: string;
  position_stage: string;
  previous_date: string | null;
  upcoming_date: string | null;
  result: string | null;
  is_current: boolean;
  created_at: string;
}

export interface CaseListItem {
  id: number;
  case_id: string;
  name: string;
  status: CaseStatus;
  created_at: string;
  current_hearing: Hearing | null;
}

export interface CaseDetail {
  id: number;
  case_id: string;
  name: string;
  status: CaseStatus;
  created_at: string;
  updated_at: string;
  hearings: Hearing[];
}

export interface NewCasePayload {
  case_id: string;
  name: string;
  filing_date: string | null;
  court_name: string;
  party_name: string;
  position_stage: string;
  upcoming_date: string | null;
}

export interface HearingUpdatePayload {
  result: string;
  position_stage?: string | null;
  next_date?: string | null;
  end_matter: boolean;
}
