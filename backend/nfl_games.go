package main

import (
	"encoding/json"
	"log"
	"net/http"
)

//MAJOR TODO api-sports.io doesn't provide unoccured games in free tier
//Need new data source

const games_url string = "https://v1.american-football.api-sports.io/games"

// Enum for nfl team ids per api-sports.io doc reference
// https://dashboard.api-football.com/nfl/ids/teams
type nfl_team int

const (
	las_vegas_raiders    nfl_team = 1
	jacksonville_jaguars nfl_team = 2
	new_england_patriots nfl_team = 3
	new_york_giants      nfl_team = 4
	balitmore_ravens     nfl_team = 5
	tennesse_titans      nfl_team = 6
	detroit_lions        nfl_team = 7
	//TODO finish team list
)

func nfl_game_data_fetch_handler(w http.ResponseWriter, r *http.Request) {
	//response to pass to frontend
	w.Header().Set("Content-Type", "application/json")

	client := &http.Client{}
	req, err := http.NewRequest(http.MethodGet, games_url, nil)
	if err != nil {
		log.Println(err)
		return
	}
	query_params := req.URL.Query()
	//TODO pass team id from frontend to here
	query_params.Add("team", "7")
	//Minor TODO maybe query current year so we can update automatically?
	query_params.Add("season", "2024")
	req.URL.RawQuery = query_params.Encode()
	req.Header.Add("x-apisports-key", api_key)
	res, err := client.Do(req)
	if err != nil {
		log.Println(err)
		return
	}
	defer res.Body.Close()

	var client_payload map[string]any

	err = json.NewDecoder(res.Body).Decode(&client_payload)
	if err != nil {
		log.Println("Error decoding response:", err)
		return
	}
	w.WriteHeader(http.StatusOK)

	//TODO transform data to better formatted json for frontend

	json.NewEncoder(w).Encode(client_payload)
}
