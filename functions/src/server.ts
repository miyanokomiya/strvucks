import * as express from 'express'
import * as admin from 'firebase-admin'
import axios from 'axios'
admin.initializeApp()

const app = express()
const db = admin.database()

// const webHost = 'https://strvucks.firebaseapp.com'
const webHost = 'http://localhost:8000'

interface TokenData {
  token_type: string
  access_token: string
  refresh_token: string
  expires_at: number
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

// const refreshTokenData = async (refresh_token: string): Promise<TokenData> => {
//   const paramSnap = await db.ref('env/oauth').once('value')
//   const tokenRes = await axios.post('https://www.strava.com/oauth/token', {
//     ...paramSnap.val(),
//     refresh_token,
//     grant_type: 'refresh_token'
//   })
//   return tokenRes.data
// }

app.get('/oauth_success', async (req, res) => {
  const code = req.query.code
  try {
    const tokeData = await getTokenData(code)
    await db.ref('users/1').set(tokeData)
    res.redirect(webHost + '/')
  } catch (e) {
    console.error(e)
    res.redirect(webHost + '/error')
  }
})

export default app
