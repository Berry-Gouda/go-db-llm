package main

import (
	"fmt"
	"go-db-llm/handlers"
	"log"
	"net/http"
	"path/filepath"
)

func main() {
	staticDir, _ := filepath.Abs(filepath.Join("../", "frontend"))
	http.Handle("/static/", http.StripPrefix("/static", http.FileServer(http.Dir(staticDir))))
	http.HandleFunc("/create-db-connection", handlers.HandleCreateDBConnection)
	http.HandleFunc("/close-db", handlers.HandleCloseDBConnection)
	http.HandleFunc("/load-main", handlers.HandleLoadMainPage)
	http.HandleFunc("/bulk-insert", handlers.HandleBulkInsert)
	http.HandleFunc("/comp-column-search", handlers.HandleCompColumnSearch)
	http.HandleFunc("/create-query", handlers.HandleCreateQuery)
	http.HandleFunc("/start-llm", handlers.HandleStartLlama)
	http.HandleFunc("/close-llm", handlers.HandleCloseLlama)
	fmt.Println("Go Server Running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
