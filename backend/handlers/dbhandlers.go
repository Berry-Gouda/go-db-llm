package handlers

import (
	"encoding/json"
	"fmt"
	"go-db-llm/db"
	"net/http"
	"path/filepath"
)

// variable to store mainpage info to reduce calls to db
var MainData = &db.MainPageInfo{}

func HandleCreateDBConnection(w http.ResponseWriter, r *http.Request) {

	success := true

	var req db.DBConnInfo
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid JSON data", http.StatusBadRequest)
		success = false
	}

	err = db.CreateDBConnection(req)
	if err != nil {
		http.Error(w, "Could not Create Connection", http.StatusBadRequest)
		success = false
	}

	response := map[string]interface{}{
		"success": success,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func HandleCloseDBConnection(w http.ResponseWriter, r *http.Request) {
	db.CloseDB()
}

// Handles the gathering of general database information returns a main page info struct from db package
func HandleLoadMainPage(w http.ResponseWriter, r *http.Request) {

	DB := db.GetDBConnection()

	MainData.DBName = db.GetDBName()

	tableNames, err := db.GetDBTableNames(DB)
	if err != nil {
		fmt.Println("Failed Getting Table Names:", err)
	}

	tableOverview := make(map[string]uint32)
	tableSchema := make(map[string][]db.TableSchemaInfo)
	tableTop := make(map[string][]map[string]string)

	for _, name := range tableNames {
		tableOverview[name], err = db.GetTableRowCount(DB, name)
		if err != nil {
			fmt.Println("Failed to get Row Count:", name, "\nError:", err)
		}
		err = nil
		tableSchema[name], err = db.GetTableSchema(DB, name)
		if err != nil {
			fmt.Println("Failed to get Table Schema:", name, "\nError:", err)
		}

		tableTop[name], err = db.GetTopRows(DB, name, 20)
		if err != nil {
			fmt.Println("Failed to get Top Rows:", name, "\nError:", err)
		}
	}

	MainData.TableOverview = tableOverview
	MainData.TableSchema = tableSchema
	MainData.Top20Rows = tableTop

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(MainData)
}

// Handles bulk insert request
func HandleBulkInsert(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var req db.BulkInsertRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid JSON data", http.StatusBadRequest)
		return
	}

	if req.File == "" {
		http.Error(w, "Missing 'file' parameter", http.StatusBadRequest)
		return
	}

	if filepath.Ext(req.File) != ".csv" {
		http.Error(w, "Must be a CSV file", http.StatusBadRequest)
		return
	}

	mssg, err := db.DBPrepareBulkInsert(req.File, req.Table)
	if err != nil {
		fmt.Println("Error:", err)
	}

	response := map[string]string{
		"message": mssg,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// handles simple comp column search returns the results
func HandleCompColumnSearch(w http.ResponseWriter, r *http.Request) {
	DB := db.GetDBConnection()

	var data db.CompColumnSearchRequest

	err := json.NewDecoder(r.Body).Decode(&data)
	if err != nil {
		http.Error(w, "Failed to parse json", http.StatusBadRequest)
		return
	}

	results, err := db.CompColumnSearch(DB, data.Table, data.SearchValue, data.CompColumn)
	if err != nil {
		http.Error(w, "failed to get results", http.StatusExpectationFailed)
	}

	var rtnData db.SearchResults
	rtnData.Results = results

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(rtnData)
}

// handles creation of query request returns the data and query generated
func HandleCreateQuery(w http.ResponseWriter, r *http.Request) {

	var data db.GenerateQueryRequest
	var rtnData db.SearchResults

	err := json.NewDecoder(r.Body).Decode(&data)
	if err != nil {
		fmt.Println("Failed to parse json", err)
		http.Error(w, "Failed to parse json", http.StatusBadRequest)
		return
	}

	DB := db.GetDBConnection()

	results, query, err := db.BuildQuery(DB, data)
	if err != nil {
		fmt.Println("Failed to exicute query:", err)
	}

	rtnData.Results = results
	rtnData.Query = query

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(rtnData)
}
