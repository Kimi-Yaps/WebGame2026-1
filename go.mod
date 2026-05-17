package main

import (
	"log"
	"net/http"
	"os"
)

func main() {
	// Get the port from Cloud Run's environment variable
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Create a standard static file handler pointing to your export directory
	fs := http.FileServer(http.Dir("."))

	// Optional but highly recommended: Explicitly set headers for Godot Web exports
	http.HandleFunc("/", func(w http.ResponseWriter, r http.Request) {
		// Stop the server from caching things while you're debugging
		w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
		
		// If your Godot export uses threads (SharedArrayBuffer), you MUST include these:
		w.Header().Set("Cross-Origin-Opener-Policy", "same-origin")
		w.Header().Set("Cross-Origin-Embedder-Policy", "require-corp")

		fs.ServeHTTP(w, r)
	})

	log.Printf("Serving Godot Web Game on port %s...", port)
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatal(err)
	}
}