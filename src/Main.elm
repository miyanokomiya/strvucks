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


type alias Model =
    { athlete : Maybe Athlete }


init : Maybe Athlete -> ( Model, Cmd Msg )
init athlete =
    ( { athlete = athlete
      }
    , Cmd.none
    )



-- UPDATE


type Msg
    = Tmp


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Tmp ->
            ( model, Cmd.none )



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none



-- VIEW


requireAuthView : Model -> Html Msg
requireAuthView _ =
    div [] [ a [ href oauthUrl ] [ text oauthUrl ] ]


view : Model -> Html Msg
view model =
    div [ id "app" ]
        [ case model.athlete of
            Nothing ->
                requireAuthView model

            Just athlete ->
                ul []
                    [ li [] [ text (String.fromInt athlete.id) ]
                    , li [] [ text athlete.username ]
                    ]
        ]



-- INIT


main : Program (Maybe Athlete) Model Msg
main =
    Browser.element
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }
