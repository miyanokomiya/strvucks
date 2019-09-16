import * as functions from 'firebase-functions'
import app from './server'
import * as hooks from './hooks'

export const server = functions.https.onRequest(app)
export const onCreateWebhook = hooks.onCreateWebhook
export const onCreateActivity = hooks.onCreateActivity
