package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

var apiKey string

const ballDontLieAvailabilityURL = "https://api.balldontlie.io/nfl/v1/teams"

var providerHealthClient = &http.Client{Timeout: 5 * time.Second}

type HealthResponse struct {
	Status string `json:"status"`
}

// healthHandler checks that the BALLDONTLIE API is reachable without sending
// this application's API key. An expected 401 proves the provider is online
// while avoiding any quota usage for the configured key.
func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if apiKey == "" || !ballDontLieAvailable(r) {
		w.WriteHeader(http.StatusServiceUnavailable)
		if err := json.NewEncoder(w).Encode(HealthResponse{Status: "NOT_OK"}); err != nil {
			log.Println("Error encoding health response:", err)
		}
		return
	}
	if err := json.NewEncoder(w).Encode(HealthResponse{Status: "OK"}); err != nil {
		log.Println("Error encoding health response:", err)
	}
}

func ballDontLieAvailable(r *http.Request) bool {
	req, err := http.NewRequestWithContext(r.Context(), http.MethodGet, ballDontLieAvailabilityURL, nil)
	if err != nil {
		log.Println("Unable to create BALLDONTLIE availability request:", err)
		return false
	}
	res, err := providerHealthClient.Do(req)
	if err != nil {
		log.Println("BALLDONTLIE availability check failed:", err)
		return false
	}
	defer res.Body.Close()
	return res.StatusCode == http.StatusUnauthorized || (res.StatusCode >= http.StatusOK && res.StatusCode < http.StatusMultipleChoices)
}

// resolveAPIKey reads BDL_API_KEY from the project .env file.
func resolveAPIKey() error {
	data, err := os.ReadFile("../.env")
	if err != nil {
		return errors.New("API key couldn't be found")
	}
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, found := strings.Cut(line, "=")
		if found && strings.TrimSpace(key) == "BDL_API_KEY" {
			apiKey = strings.TrimSpace(value)
			break
		}
	}
	if apiKey == "" {
		_, value, found := strings.Cut(strings.TrimSpace(string(data)), "=")
		if found {
			apiKey = strings.TrimSpace(value)
		}
	}
	if apiKey == "" {
		return errors.New("BDL_API_KEY couldn't be found")
	}
	return nil
}

func main() {
	fmt.Println("starting webservice")
	if err := resolveAPIKey(); err != nil {
		log.Println(err)
		os.Exit(1)
	}
	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/nfl_games", nflGameDataFetchHandler)
	http.Handle("/", http.FileServer(http.Dir("../frontend")))
	fmt.Println("Server is running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
