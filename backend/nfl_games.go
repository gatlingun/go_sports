package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
)

const ballDontLieGamesURL = "https://api.balldontlie.io/nfl/v1/games"

func nflGameDataFetchHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	teamID := r.URL.Query().Get("team_id")
	if teamID != "" {
		if _, err := strconv.Atoi(teamID); err != nil {
			http.Error(w, `{"error":"team_id must be a BALLDONTLIE numeric team ID"}`, http.StatusBadRequest)
			return
		}
	}
	req, err := http.NewRequestWithContext(r.Context(), http.MethodGet, ballDontLieGamesURL, nil)
	if err != nil {
		writeProviderError(w, err)
		return
	}
	query := req.URL.Query()
	query.Set("seasons[]", "2026")
	query.Set("per_page", "100")
	if teamID != "" {
		query.Add("team_ids[]", teamID)
	}
	req.URL.RawQuery = query.Encode()
	req.Header.Set("Authorization", apiKey)

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		writeProviderError(w, err)
		return
	}
	defer res.Body.Close()

	if res.StatusCode < http.StatusOK || res.StatusCode >= http.StatusMultipleChoices {
		w.WriteHeader(res.StatusCode)
		if err := json.NewEncoder(w).Encode(map[string]string{"error": "BALLDONTLIE request failed"}); err != nil {
			log.Println("Error encoding provider error:", err)
		}
		return
	}

	var providerPayload any
	if err := json.NewDecoder(res.Body).Decode(&providerPayload); err != nil {
		writeProviderError(w, err)
		return
	}
	if err := json.NewEncoder(w).Encode(providerPayload); err != nil {
		log.Println("Error encoding games response:", err)
	}
}

func writeProviderError(w http.ResponseWriter, err error) {
	log.Println("BALLDONTLIE request error:", err)
	http.Error(w, `{"error":"Unable to reach BALLDONTLIE"}`, http.StatusBadGateway)
}
