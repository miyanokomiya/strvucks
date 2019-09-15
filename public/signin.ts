import './initFirebase'
import * as firebase from 'firebase/app'
import 'firebase/auth'
import * as queryString from 'query-string'

const parsed = queryString.parse(location.search)
console.log(parsed)

firebase
  .auth()
  .signInWithCustomToken(parsed.token as string)
  .then(() => {
    window.location.href = '/index.html'
  })
  .catch(() => {
    window.location.href = '/index.html'
  })
