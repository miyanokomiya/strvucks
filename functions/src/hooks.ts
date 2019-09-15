import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import axios from 'axios'
import * as dateFns from 'date-fns'
import {
  WebhookData,
  Activity,
  TokenData,
  Summary,
  SummaryItem,
  Ifttt
} from './types'

const STRAVA_HOST = 'https://www.strava.com/api/v3'
const db = admin.database()

const refreshTokenData = async (refresh_token: string): Promise<TokenData> => {
  const paramSnap = await db.ref('env/oauth').once('value')
  const tokenRes = await axios.post('https://www.strava.com/oauth/token', {
    ...paramSnap.val(),
    grant_type: 'refresh_token',
    refresh_token
  })
  const stravaTokenData = tokenRes.data
  const uid = stravaTokenData.athlete.id
  await db.ref(`users/${uid}`).set(stravaTokenData)
  return stravaTokenData
}

const getActivity = async (
  id: number,
  access_token: string
): Promise<Activity> => {
  const res = await axios.get(STRAVA_HOST + '/activities' + id, {
    params: { access_token }
  })
  const activity = res.data as Activity
  return activity
}

export const onCreateWebhook = functions.database
  .ref('/webhooks')
  .onCreate(async snapshot => {
    const data = snapshot.val() as WebhookData
    const userSnap = await db.ref(`users/${data.owner_id}`).once('value')
    const user = userSnap.val() as TokenData

    await refreshTokenData(user.refresh_token)

    const activity = await getActivity(data.object_id, user.access_token)
    await db.ref(`activities/${user.athlete.id}/${activity.id}`).set(activity)
    await db.ref(`webhooks/${snapshot.key}`).remove()
  })

function createSummaryItem(): SummaryItem {
  return {
    distance: 0,
    moving_time: 0,
    total_elevation_gain: 0,
    calories: 0
  }
}

function createSummary(): Summary {
  const now = new Date()
  const startOfMonth = dateFns.startOfMonth(now)
  const startOfWeek = dateFns.startOfWeek(now)
  return {
    weekBaseDate: startOfWeek.getTime(),
    monthBaseDate: startOfMonth.getTime(),
    weekly: createSummaryItem(),
    monthly: createSummaryItem()
  }
}

function mergeSummaryItem(a: SummaryItem, b: Activity): SummaryItem {
  return {
    distance: a.distance + b.distance,
    moving_time: a.moving_time + b.moving_time,
    total_elevation_gain: a.total_elevation_gain + b.total_elevation_gain,
    calories: a.calories + b.calories
  }
}

function mergeSummary(a: Summary, b: Activity): Summary {
  const now = new Date()
  const baseWeek = new Date(a.weekBaseDate)
  const baseMonth = new Date(a.monthBaseDate)

  const isSameWeek = dateFns.isSameWeek(baseWeek, now)
  const isSameMonth = dateFns.isSameMonth(baseMonth, now)

  return {
    weekBaseDate: isSameWeek
      ? a.weekBaseDate
      : dateFns.startOfWeek(now).getTime(),
    monthBaseDate: isSameMonth
      ? a.monthBaseDate
      : dateFns.startOfMonth(now).getTime(),
    weekly: isSameWeek
      ? mergeSummaryItem(a.weekly, b)
      : mergeSummaryItem(createSummaryItem(), b),
    monthly: isSameWeek
      ? mergeSummaryItem(a.monthly, b)
      : mergeSummaryItem(createSummaryItem(), b)
  }
}

function createIftttUrl(ifttt: Ifttt): string {
  return `https://maker.ifttt.com/trigger/${ifttt.message}/with/key/${ifttt.key}`
}

function createTweetMessage(activity: Activity, summary: Summary): string {
  return [
    'new activity:',
    `${activity.distance / 1000}km`,
    `${activity.moving_time / 60}min`,
    `${activity.calories}cal`,
    '\nweekly:',
    `${summary.weekly.distance / 1000}km`,
    `${summary.weekly.moving_time / 60}min`,
    `${summary.weekly.calories}cal`,
    '\nmonthly:',
    `${summary.weekly.distance / 1000}km`,
    `${summary.weekly.moving_time / 60}min`,
    `${summary.weekly.calories}cal`
  ].join(' ')
}

export const onCreateActivity = functions.database
  .ref('/activities/{userId}')
  .onCreate(async snapshot => {
    const activity = snapshot.val() as Activity

    const summaryRef = db.ref(`summaries/${activity.athlete.id}`)
    const summarySnap = await summaryRef.once('value')
    const summary: Summary = summarySnap.exists()
      ? summarySnap.val()
      : createSummary()
    const newSummary = mergeSummary(summary, activity)
    await summaryRef.set(newSummary)

    const iftttSnap = await db.ref(`ifttt/${activity.athlete.id}`).once('value')
    if (iftttSnap.exists()) {
      const ifttt = iftttSnap.val()
      await axios.post(createIftttUrl(ifttt), {
        value1: createTweetMessage(activity, newSummary)
      })
    }

    await db.ref(`activities/${activity.athlete.id}/${activity.id}`).remove()
  })
