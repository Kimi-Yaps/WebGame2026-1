package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	workDir, _ := os.Getwd()

	mux := http.NewServeMux()
	
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Set headers required by Godot Engine
		w.Header().Set("Cross-Origin-Opener-Policy", "same-origin")
		w.Header().Set("Cross-Origin-Embedder-Policy", "require-corp")
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")

		// Serve index.html for root path
		path := r.URL.Path
		if path == "/" {
			path = "/index.html"
		}

		// Add crucial MIME types that browsers need for Godot
		if strings.HasSuffix(path, ".wasm") {
			w.Header().Set("Content-Type", "application/wasm")
		} else if strings.HasSuffix(path, ".pck") {
			w.Header().Set("Content-Type", "application/octet-stream")
		}

		fullPath := filepath.Join(workDir, path)
		
		// http.ServeFile natively supports HTTP Range requests and uses memory-efficient kernel streaming
		http.ServeFile(w, r, fullPath)
	})

	log.Printf("Starting ultra-low-memory Go server on port %s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatal(err)
	}
}
