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

// const webHost = 'https://strvucks.firebaseapp.com'
const webHost = 'http://localhost:1234'

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
    const token = await auth.createCustomToken(String(stravaTokenData.athlete.id))
    res.redirect(webHost + '/signin-callback.html?token=' + token)
  } catch (e) {
    console.error(e)
    res.redirect(webHost + '/index.html?error=' + e.message)
  }
})

// Creates the endpoint for our webhook
app.post('/webhook', async (req, res) => {
  const data = req.body as WebhookData
  if (data.object_type === 'activity') {
    await db.ref('webhooks').push(data)
  }
  res.status(200).send('EVENT_RECEIVED')
})

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {
  // Your verify token. Should be a random string.
  const VERIFY_TOKEN = 'STRAVA'
  // Parses the query params
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Verifies that the mode and token sent are valid
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED')
      res.json({ 'hub.challenge': challenge })
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403)
    }
  }
})

export default app
