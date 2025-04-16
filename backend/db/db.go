package db

import (
	"database/sql"
	"encoding/csv"
	"fmt"
	"go-db-llm/dcleaning"
	"log"
	"os"
	"reflect"
	"strconv"

	_ "github.com/go-sql-driver/mysql"
)

var DB *sql.DB
var dbName string

// initDB initializes a MySQL database connection using the provided credentials and connection details.
func initDB(user string, pass string, host string, port string, dbname string) error {

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s", user, pass, host, port, dbname)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return fmt.Errorf("error opening database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return fmt.Errorf("error connecting to database: %w", err)
	}

	DB = db
	dbName = dbname
	fmt.Println(dbName)
	return nil
}

// CloseDB closes the global database connection if it is open.
func CloseDB() {
	if DB != nil {
		_ = DB.Close()
	}
}

// CreateDBConnection initializes a new connection if one doesn't already exist or is invalid.
func CreateDBConnection(data DBConnInfo) error {

	// Ping existing DB connection to confirm it's valid
	if DB != nil {
		if err := DB.Ping(); err == nil {
			return nil
		}
	}

	// Establish a new DB connection
	err := initDB(data.User, data.Pass, data.DBHost, data.DBPort, data.DBName)
	if err != nil {
		log.Println("Failed to connect to DB:", err)
	}
	return err
}

// GetDBConnection returns the current global database connection.
func GetDBConnection() *sql.DB {
	return DB
}

// GetDBName returns the name of the currently connected database.
func GetDBName() string {
	return dbName
}

// DBPrepareBulkInsert prepares for and performs a bulk insert of CSV data into a specified table.
// It dynamically builds a struct based on the table schema, parses the CSV data, and calls BulkInsert.
func DBPrepareBulkInsert(file string, tName string) (string, error) {

	// Retrieve the schema for dynamic struct generation
	schema, err := GetTableSchemaForDynamicStruct(DB, tName)
	if err != nil {
		return "Error", err
	}

	dynamicStruct := CreateDynamicStruct(schema)

	// Load and parse CSV data into struct format
	loadedInsertData, err := openCSV(dynamicStruct, file)
	if err != nil {
		fmt.Println("Error:", err)
		return "Error", err
	}

	// Attempt to insert parsed records into DB
	err = BulkInsert(DB, tName, loadedInsertData, dynamicStruct)
	if err != nil {
		fmt.Println("Insert error:", err)
		return "Failed", err
	} else {
		fmt.Println("Bulk insert successful!")
	}

	return "Success", nil
}

// openCSV reads and parses a CSV file into a slice of interface{} based on a given reflect.Type.
// The returned data can be inserted into a table matching the struct format.
func openCSV(structType reflect.Type, path string) ([]interface{}, error) {

	file, err := os.Open(path)

	if err != nil {
		return nil, err
	}
	defer file.Close()

	reader := csv.NewReader(file)
	rows, err := reader.ReadAll()
	if err != nil {
		return nil, err
	}

	// Require at least a header row and one data row
	if len(rows) < 2 {
		return nil, fmt.Errorf("CSV file is empty or missing headers")
	}

	headers := rows[0]

	var result []interface{}

	for _, row := range rows[1:] {
		instance := reflect.New(structType).Elem()

		// Map CSV columns to struct fields using camel case conversion
		for i, colName := range headers {
			field := instance.FieldByName(ConvertToCamelCase(colName))
			if !field.IsValid() {
				fmt.Println("invalid Field name:", field)
				continue

			}

			// Handle field types appropriately
			switch field.Kind() {
			case reflect.Int, reflect.Int64:
				val, err := strconv.Atoi(row[i])
				if err == nil {
					field.SetInt(int64(val))
				}
			case reflect.Float64:
				val, err := strconv.ParseFloat(row[i], 64)
				if err == nil {
					field.SetFloat(val)
				} else {
					val, err = dcleaning.FractionStrToDec(row[i])
					if err == nil {
						field.SetFloat(val)
					} else {

					}
				}
			case reflect.String:
				field.SetString(row[i])
			}
		}
		result = append(result, instance.Interface())
	}

	return result, nil
}

// ParseRows converts a *sql.Rows result into a slice of maps,
// where each map corresponds to a row with column name to value as a string.
func ParseRows(rows *sql.Rows, columnNames []string) ([]map[string]string, error) {

	var parsedRows []map[string]string

	for rows.Next() {
		values := make([]interface{}, len(columnNames))
		valuePtrs := make([]interface{}, len(columnNames))

		// Set up pointers to read row data
		for i := range values {
			valuePtrs[i] = &values[i]
		}

		// Read a row from result set
		if err := rows.Scan(valuePtrs...); err != nil {
			return nil, err
		}

		rowMap := make(map[string]string)
		for i, col := range columnNames {
			var val string
			if b, ok := values[i].([]byte); ok {
				val = string(b)
			} else if values[i] != nil {
				val = fmt.Sprintf("%v", values[i])
			} else {
				val = "NULL"
			}
			rowMap[col] = val
		}

		parsedRows = append(parsedRows, rowMap)
	}

	return parsedRows, nil
}
