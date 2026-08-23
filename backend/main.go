package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

const health_status_url string = "https://v1.american-football.api-sports.io/status"

var api_key string

// Health response struct
type HealthResponse struct {
	Status   string `json:"status"`
	Response struct {
		Requests struct {
			Current   int `json:"current"`
			Limit_day int `json:"limit_day"`
		} `json:"requests"`
	} `json:"response"`
}

// health handler processes health requests
func healthHandler(w http.ResponseWriter, r *http.Request) {
	//response to pass to frontend
	w.Header().Set("Content-Type", "application/json")
	var decoded_response HealthResponse
	decoded_response.Status = "ERROR"

	client := &http.Client{}
	req, err := http.NewRequest(http.MethodGet, health_status_url, nil)
	if err != nil {
		log.Println(err)
		return
	}
	req.Header.Add("x-apisports-key", api_key)
	res, err := client.Do(req)
	if err != nil {
		log.Println(err)
		return
	}
	defer res.Body.Close()

	err = json.NewDecoder(res.Body).Decode(&decoded_response)
	if err != nil {
		log.Println("Error decoding response:", err)
		return
	}
	if decoded_response.Response.Requests.Limit_day-decoded_response.Response.Requests.Current > 0 {
		decoded_response.Status = "OK"
		w.WriteHeader(http.StatusOK)
	}

	json.NewEncoder(w).Encode(decoded_response)

}

// Helper to resolve global api key
func resolveAPIKey() {
	api_key = ""
}

func main() {
	fmt.Println("starting webservice")
	//Resolve api key
	resolveAPIKey()
	// Route requests for health handler
	http.HandleFunc("/health", healthHandler)
	//Register frontend
	fileServer := http.FileServer(http.Dir("../frontend"))
	http.Handle("/", fileServer)
	// Start the server on port 8080
	fmt.Println("Server is running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
