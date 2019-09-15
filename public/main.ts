import './initFirebase'
import * as firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/database'
import { Elm } from './elm'

firebase.auth().onAuthStateChanged(async auth => {
  if (auth) {
    const userSnap = await firebase
      .database()
      .ref('users/' + auth.uid)
      .once('value')
    const user = userSnap.val()
    console.log(user)
    Elm.Main.init({
      node: document.getElementById('elm-node'),
      flags: user.athlete
    })
  } else {
    Elm.Main.init({
      node: document.getElementById('elm-node'),
      flags: null
    })
  }
})
