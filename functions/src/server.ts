import express from 'express'
import * as admin from 'firebase-admin'

import axios from 'axios'

admin.initializeApp({
  // export GOOGLE_APPLICATION_CREDENTIALS=[full-path-to-service.json]
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://strvucks.firebaseio.com'
})

const app = express()
const db = admin.database()
const auth = admin.auth()

// const webHost = 'https://strvucks.firebaseapp.com'
const webHost = 'http://localhost:1234'

interface TokenData {
  token_type: string
  access_token: string
  refresh_token: string
  expires_at: number
  athlete: Athlete
}

interface Athlete {
  id: number
  username: string
}

const getTokenData = async (code: string): Promise<TokenData> => {
  const paramSnap = await db.ref('env/oauth').once('value')
  const tokenRes = await axios.post('https://www.strava.com/oauth/token', {
    ...paramSnap.val(),
    code,
    grant_type: 'authorization_code' // 'refresh_token'
  })
  return tokenRes.data
}

app.get('/oauth_success', async (req, res) => {
  const code = req.query.code
  try {
    const stravaTokenData = await getTokenData(code)
    const uid = stravaTokenData.athlete.id
    const token = await auth.createCustomToken(String(uid))
    await db.ref(`users/${uid}`).set(stravaTokenData)
    res.redirect(webHost + '/signin-callback.html?token=' + token)
  } catch (e) {
    console.error(e)
    res.redirect(webHost + '/index.html?error=' + e.message)
  }
})

export default app
