import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import axios from 'axios'
import { WebhookData, Activity, TokenData } from './types'

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
  .onCreate(async (snapshot: any) => {
    const data = snapshot.val() as WebhookData
    const userSnap = await db.ref(`users/${data.owner_id}`).once('value')
    const user = userSnap.val() as TokenData

    await refreshTokenData(user.refresh_token)

    const activity = await getActivity(data.object_id, user.access_token)
    await db.ref(`activities/${activity.id}`).set(activity)
  })
