module Strava exposing (oauthUrl)


clientId : Int
clientId =
    38947


redirectUri : String
redirectUri =
    -- "https://strvucks.cloudfunctions.net/oauth_success"
    "http://localhost:5000/strvucks/us-central1/server/oauth_success"


oauthUrl : String
oauthUrl =
    "http://www.strava.com/oauth/authorize?client_id="
        ++ String.fromInt clientId
        ++ "&response_type=code&redirect_uri="
        ++ redirectUri
        ++ "&approval_prompt=force&scope=read"
