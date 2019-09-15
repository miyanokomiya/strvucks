import './initFirebase'
import * as firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/database'
import { Elm } from './elm'

const db = firebase.database()

const app = Elm.Main.init({
  node: document.getElementById('elm-node'),
  flags: null
})

firebase.auth().onAuthStateChanged(async auth => {
  if (auth) {
    try {
      const userSnap = await db.ref(`users/${auth.uid}`).once('value')
      const user = userSnap.val()
      app.ports.setAthlete.send(user.athlete)

      await db.ref(`activities/${user.athlete.id}`).on('value', snap => {
        const val = snap.val()
        const activities = Object.keys(val).map(key => ({
          ...val[key],
          type_: val[key].type
        }))
        app.ports.setActivities.send(activities)
      })

      const iftttRef = db.ref(`ifttt/${user.athlete.id}`)
      await iftttRef.on('value', snap => {
        const val = snap.val()
        app.ports.setIfttt.send(val)
      })

      app.ports.saveIfttt.subscribe(ifttt => {
        iftttRef.set(ifttt)
      })
    } catch (e) {
      console.error(e)
    }
  } else {
    app.ports.setAthlete.send(null)
  }
})
