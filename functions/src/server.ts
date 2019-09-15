import express from 'express'
import * as admin from 'firebase-admin'

import axios from 'axios'
import bodyParser from 'body-parser'
import { TokenData, WebhookData } from './types'

admin.initializeApp({
  // export GOOGLE_APPLICATION_CREDENTIALS=[full-path-to-service.json]
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://strvucks.firebaseio.com'
})

const app = express()
app.use(bodyParser.json())
const db = admin.database()
const auth = admin.auth()

const webHost =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:1234'
    : 'https://strvucks.firebaseapp.com'

const getTokenData = async (code: string): Promise<TokenData> => {
  const paramSnap = await db.ref('env/oauth').once('value')
  const tokenRes = await axios.post('https://www.strava.com/oauth/token', {
    ...paramSnap.val(),
    grant_type: 'authorization_code',
    code
  })
  const stravaTokenData = tokenRes.data
  const uid = stravaTokenData.athlete.id
  await db.ref(`users/${uid}`).set(stravaTokenData)
  return stravaTokenData
}

app.get('/oauth_success', async (req, res) => {
  const code = req.query.code
  try {
    const stravaTokenData = await getTokenData(code)
    const token = await auth.createCustomToken(
      String(stravaTokenData.athlete.id)
    )
    res.redirect(webHost + '/signin-callback.html?token=' + token)
  } catch (e) {
    console.error(e)
    res.redirect(webHost + '/index.html?error=' + e.message)
  }
})

app.post('/webhook', async (req, res) => {
  const data = req.body as WebhookData
  if (data.object_type === 'activity') {
    await db.ref('webhooks').push(data)
  }
  res.status(200).send('EVENT_RECEIVED')
  return Promise.resolve()
})

// https://developers.strava.com/docs/webhooks/
app.get('/webhook', async (req, res) => {
  const paramSnap = await db.ref('env/oauth').once('value')
  const VERIFY_TOKEN = paramSnap.val().VERIFY_TOKEN
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED')
      res.json({ 'hub.challenge': challenge })
    } else {
      res.sendStatus(403)
    }
  }
  return Promise.resolve()
})

export default app
