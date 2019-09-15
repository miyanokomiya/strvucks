port module Main exposing (main)

import Browser
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Strava exposing (oauthUrl)
import Url.Parser exposing ((</>), (<?>), Parser, int, map, oneOf, s, string)
import Url.Parser.Query as Query


type Route
    = BlogPost Int String
    | BlogQuery (Maybe String)


routeParser : Parser (Route -> a) a
routeParser =
    oneOf
        [ map BlogPost (s "blog" </> int </> string)
        , map BlogQuery (s "blog" <?> Query.string "q")
        ]


type alias Athlete =
    { id : Int
    , username : String
    }


type alias Activity =
    { name : String
    , distance : Float
    , moving_time : Float
    , elapsed_time : Float
    , total_elevation_gain : Float
    , type_ : String
    , id : Int
    , start_date_local : String
    , average_speed : Float
    , max_speed : Float
    , average_cadence : Float
    , average_heartrate : Float
    , max_heartrate : Float
    }


type alias Model =
    { ready : Bool
    , athlete : Maybe Athlete
    , activities : List Activity
    }


init : () -> ( Model, Cmd Msg )
init _ =
    ( { ready = False
      , athlete = Nothing
      , activities = []
      }
    , Cmd.none
    )



-- UPDATE


type Msg
    = SetActivities (List Activity)
    | SetAthlete (Maybe Athlete)


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        SetActivities activities ->
            ( { model | activities = activities }, Cmd.none )

        SetAthlete athlete ->
            ( { model | athlete = athlete, ready = True }, Cmd.none )



-- SUBSCRIPTIONS


port setActivities : (List Activity -> msg) -> Sub msg


port setAthlete : (Maybe Athlete -> msg) -> Sub msg


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch [ setActivities SetActivities, setAthlete SetAthlete ]



-- VIEW


requireAuthView : Model -> Html Msg
requireAuthView _ =
    div [] [
      p [] [text "Sign In Strava"]
     , a [ href oauthUrl ] [ text oauthUrl ] ]


activityView : Activity -> Html Msg
activityView activity =
    div []
        [ ul []
            [ li [] [ text activity.name ]
            , li [] [ text activity.type_ ]
            , li [] [ text ("distance: " ++ String.fromFloat activity.distance) ]
            , li [] [ text ("average_speed" ++ String.fromFloat activity.average_speed) ]
            ]
        ]


activitiesView : List Activity -> Html Msg
activitiesView activities =
    ul []
        (List.map (\a -> li [] [ activityView a ]) activities)


view : Model -> Html Msg
view model =
    div [ id "app" ]
        (if model.ready == False then
            [ text "loading..." ]

         else
            case model.athlete of
                Nothing ->
                    [ requireAuthView model ]

                Just athlete ->
                    [ h3 [] [ text "Athlete" ]
                    , ul []
                        [ li [] [ text (String.fromInt athlete.id) ]
                        , li [] [ text athlete.username ]
                        ]
                    , h3 [] [ text "Activities" ]
                    , activitiesView
                        model.activities
                    ]
        )



-- INIT


main : Program () Model Msg
main =
    Browser.element
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }
