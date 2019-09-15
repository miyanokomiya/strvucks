export interface TokenData {
  token_type: string
  access_token: string
  refresh_token: string
  expires_at: number
  athlete: Athlete
}

export interface Athlete {
  id: number
  username: string
}

// see https://developers.strava.com/docs/webhooks/
export interface WebhookData {
  aspect_type: 'create' | 'update' | 'delete'
  event_time: number
  object_id: number // activity's ID or athlete's ID.
  object_type: 'activity' | 'athlete'
  owner_id: number // The athlete's ID.
  subscription_id: number
  updates: {
    title: string
    type: string
    private: boolean
  }
}

// https://developers.strava.com/docs/reference/#api-models-DetailedActivity
export interface Activity {
  athlete: {
    id: number
  }
  name: string // '夕方のランニング'
  distance: number // 5479.2
  moving_time: number // 1798
  elapsed_time: number // 2084
  total_elevation_gain: number // 40.6
  type: string // 'Run'
  id: number
  start_date: string // '2019-09-13T09:03:48Z'
  start_date_local: string // '2019-09-13T18:03:48Z'
  timezone: string // '(GMT+09:00) Asia/Tokyo'
  utc_offset: number // 32400.0
  private: false
  visibility: string // 'everyone'
  average_speed: number // 3.047
  max_speed: number // 4.3
  average_cadence: number // 93.0
  has_heartrate: boolean
  average_heartrate: number // 170.0
  max_heartrate: number // 194.0
  heartrate_opt_out: boolean
  display_hide_heartrate_option: boolean
  elev_high: number // 15.4
  elev_low: number // 0.8
  calories: number // 266.0
  splits_metric: SplitsMetric[]
  splits_standard: SplitsStandard[]
  best_efforts: BestEffort[]
  embed_token: string // '2f9ce68295ffba5bbe3edfb8002b7e24ca034d45'
  similar_activities: {
    effort_count: number // 5
    average_speed: number // 2.607714797698765
    min_average_speed: number // 2.4191745485812555
    mid_average_speed: number // 2.697183564954425
    max_average_speed: number // 3.0473859844271414
    pr_rank: number // 1
    frequency_milestone: number // 5
    trend: {
      speeds: number[]
      current_activity_index: number // 4
      min_speed: number // 2.4191745485812555
      mid_speed: number // 2.697183564954425
      max_speed: number // 3.0473859844271414
      direction: number // 1
    }
    resource_state: number // 2
  }
}

export interface SplitsMetric {
  distance: number // 1001.7
  elapsed_time: number // 504
  elevation_difference: number // -0.1
  moving_time: number // 384
  split: number // 1
  average_speed: number // 2.61
  average_heartrate: number // 135.27604166666666
  pace_zone: number // 0
}
export interface SplitsStandard {
  distance: number // 1629.0
  elapsed_time: number // 716
  elevation_difference: number // -2.6
  moving_time: number // 596
  split: number // 1
  average_speed: number // 2.73
  average_heartrate: number // 145.16107382550337
  pace_zone: number // 0
}

export interface BestEffort {
  id: number
  resource_state: number // 2
  name: string // '400m'
  elapsed_time: number // 115
  moving_time: number // 117
  start_date: string // '2019-09-13T09:24:07Z'
  start_date_local: string // '2019-09-13T18:24:07Z'
  distance: number // 400
  start_index: number // 206
  end_index: number // 227
  pr_rank: null
}
