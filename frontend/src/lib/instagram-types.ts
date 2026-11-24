/** Instagram channel: connection settings and lead analytics. */

export interface InstagramSettings {
  /** Path of the callback URL Meta calls (prefix it with the API origin). */
  webhook_path: string
  verify_token: string
  ig_account_id: string | null
  stage_id: string | null
  owner_id: string | null
  has_app_secret: boolean
  has_access_token: boolean
  last_event_at: string | null
}

export type InstagramPatch = Partial<Pick<InstagramSettings, 'ig_account_id' | 'stage_id' | 'owner_id'>> & {
  /** Write-only; "" clears. */
  app_secret?: string
  access_token?: string
}

export interface InstagramStats {
  leads: number
  messages: number
  lead_forms: number
  won: number
  conversion: number
  avg_first_response_seconds: number | null
  unanswered: number
  per_day: { date: string; messages: number; lead_forms: number }[]
  top_ads: { ad_id: string; leads: number; won: number }[]
}

export type SimulateKind = 'message' | 'lead_form'
