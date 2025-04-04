package handlers

import (
	"encoding/json"
	"fmt"
	"go-db-llm/db"
	"net/http"
	"path/filepath"
)

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
