/** Pipelines (amoCRM voronkalar) and record history for the record feed. */

export interface Pipeline {
  id: string
  name: string
  position: number
  is_default: boolean
}

export interface FieldChange {
  field: string
  old: string | number | boolean | null
  new: string | number | boolean | null
}

/** A system line of the record feed: created, field changes or a stage move. */
export type RecordEvent = { id: string; actor_id: string | null; created_at: string } & (
  | { kind: 'created'; changes: { stage_id?: string } }
  | { kind: 'updated'; changes: FieldChange[] }
  | { kind: 'stage_changed'; changes: { from: string; to: string } }
)

export interface StageTime {
  stage_id: string
  seconds: number
}

export interface StageMovement {
  stage_id: string
  deals_now: number
  entered: number
  avg_seconds: number | null
}

/** Which record a feed belongs to. */
export type RecordLink = 'deal_id' | 'company_id' | 'contact_id'
