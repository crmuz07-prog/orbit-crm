export type FieldType = 'text' | 'number' | 'select' | 'multiselect' | 'date'
/** A custom value as stored in `deal.custom[key]`. */
export type CustomValue = string | number | string[] | null

interface Row {
  id: string
  created_at: string
  updated_at: string
}

export interface CustomField extends Row {
  entity: 'deal'
  key: string
  label: string
  type: FieldType
  options: string[]
  /** List values that need attention (e.g. below the minimum order), shown in red. */
  warn_options: string[]
  position: number
}

export interface LostReason extends Row {
  name: string
  position: number
}

export type ImportTarget =
  | 'ignore' | 'external_id' | 'title' | 'contact_name' | 'phone' | 'email' | 'created_at' | 'stage' | 'owner' | 'amount' | 'source'
  | 'lost_reason' | 'note' | 'next_contact' | 'platform' | 'campaign' | 'adset' | 'ad_name' | 'form_name' | 'custom' | 'new_custom'

export interface ColumnMap {
  column: number
  header: string
  samples: string[]
  target: ImportTarget
  field_key: string | null
  new_label: string | null
  new_type: FieldType | null
}

export interface ImportPreview {
  rows: number
  columns: ColumnMap[]
}

export interface ImportResult {
  created: number
  updated: number
  skipped: number
  stages_created: string[]
  fields_created: string[]
  unmatched_owners: string[]
  tasks_created: number
}

export interface ReportTotals {
  total: number
  open: number
  won: number
  lost: number
  won_value: number
  conversion: number
  warnings: number
  tasks_overdue: number
  tasks_today: number
  no_task: number
}

export interface ReportStage {
  stage_id: string
  name: string
  color: string
  is_won: boolean
  is_lost: boolean
  count: number
  share: number
  warnings: number
}

export interface GroupRow {
  label: string | null
  total: number
  open: number
  won: number
  lost: number
}

export interface Breakdown {
  key: string
  label: string | null
  rows: GroupRow[]
}

export interface LeadReport {
  totals: ReportTotals
  stages: ReportStage[]
  breakdowns: Breakdown[]
}

export interface Attribution {
  channel: string
  platform: string | null
  campaign: string | null
  adset: string | null
  ad_name: string | null
  form_name: string | null
  created_at: string
}
