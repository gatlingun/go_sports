package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

// Health response struct
type HealthResponse struct {
	Status string `json:"status"`
}

// health handler processes health requests
// If call is success we're healthly so just return status OK
func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(HealthResponse{Status: "OK"})
	w.WriteHeader(http.StatusOK)
}

func main() {
	fmt.Println("starting webservice")

	// Route requests for health handler
	http.HandleFunc("/health", healthHandler)
	// Start the server on port 8080
	fmt.Println("Server is running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
