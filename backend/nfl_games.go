package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
)

const ballDontLieGamesURL = "https://api.balldontlie.io/nfl/v1/games"
const ballDontLieTeamsURL = "https://api.balldontlie.io/nfl/v1/teams"

type ballDontLieTeamsResponse struct {
	Data []ballDontLieTeam `json:"data"`
}

type ballDontLieTeam struct {
	ID           int    `json:"id"`
	Abbreviation string `json:"abbreviation"`
}

func nflGameDataFetchHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	teamID := r.URL.Query().Get("team_id")
	teamAbbreviation := r.URL.Query().Get("team")
	if teamID != "" && teamAbbreviation != "" {
		http.Error(w, `{"error":"provide team_id or team, not both"}`, http.StatusBadRequest)
		return
	}
	if teamID != "" {
		if _, err := strconv.Atoi(teamID); err != nil {
			http.Error(w, `{"error":"team_id must be a BALLDONTLIE numeric team ID"}`, http.StatusBadRequest)
			return
		}
	}
	if teamAbbreviation != "" {
		var err error
		teamID, err = findTeamID(r, teamAbbreviation)
		if err != nil {
			writeProviderError(w, err)
			return
		}
		if teamID == "" {
			http.Error(w, `{"error":"team must be a valid NFL team abbreviation"}`, http.StatusBadRequest)
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

// findTeamID translates the frontend's stable NFL abbreviation (for example,
// "ari") into the numeric ID required by the games endpoint.
func findTeamID(r *http.Request, abbreviation string) (string, error) {
	req, err := http.NewRequestWithContext(r.Context(), http.MethodGet, ballDontLieTeamsURL, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", apiKey)

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()
	if res.StatusCode < http.StatusOK || res.StatusCode >= http.StatusMultipleChoices {
		return "", &providerResponseError{statusCode: res.StatusCode}
	}

	var payload ballDontLieTeamsResponse
	if err := json.NewDecoder(res.Body).Decode(&payload); err != nil {
		return "", err
	}
	for _, team := range payload.Data {
		if strings.EqualFold(team.Abbreviation, abbreviation) {
			return strconv.Itoa(team.ID), nil
		}
	}
	return "", nil
}

type providerResponseError struct {
	statusCode int
}

func (err *providerResponseError) Error() string {
	return "BALLDONTLIE returned HTTP " + strconv.Itoa(err.statusCode)
}

func writeProviderError(w http.ResponseWriter, err error) {
	log.Println("BALLDONTLIE request error:", err)
	http.Error(w, `{"error":"Unable to reach BALLDONTLIE"}`, http.StatusBadGateway)
}
