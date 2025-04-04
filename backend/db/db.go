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

func CloseDB() {
	if DB != nil {
		_ = DB.Close()
	}
}

func CreateDBConnection(data DBConnInfo) error {

	if DB != nil {
		if err := DB.Ping(); err == nil {
			return nil
		}
	}

	err := initDB(data.User, data.Pass, data.DBHost, data.DBPort, data.DBName)
	if err != nil {
		log.Println("Failed to connect to DB:", err)
	}
	return err
}

func GetDBConnection() *sql.DB {
	return DB
}

func GetDBName() string {
	return dbName
}

// DBPrepareBulkInsert Calls all the functions to create the Struct and load the bulk data from a csv file.
func DBPrepareBulkInsert(file string, tName string) (string, error) {

	schema, err := GetTableSchemaForDynamicStruct(DB, tName)
	if err != nil {
		return "Error", err
	}

	dynamicStruct := CreateDynamicStruct(schema)

	loadedInsertData, err := openCSV(dynamicStruct, file)
	if err != nil {
		fmt.Println("Error:", err)
		return "Error", err
	}

	counter := 0

	for _, record := range loadedInsertData {
		if counter == 20 {
			break
		}
		fmt.Printf("%v\n", record)
		counter += 1
	}

	err = BulkInsert(DB, tName, loadedInsertData, dynamicStruct)
	if err != nil {
		fmt.Println("Insert error:", err)
		return "Failed", err
	} else {
		fmt.Println("Bulk insert successful!")
	}

	return "Success", nil
}

// openCSV loads a CSV file of any format into a dynamically created struct. Returns a slice of an interface
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

	if len(rows) < 2 {
		return nil, fmt.Errorf("CSV file is empty or missing headers")
	}

	headers := rows[0]

	var result []interface{}

	for _, row := range rows[1:] {
		instance := reflect.New(structType).Elem()

		for i, colName := range headers {
			field := instance.FieldByName(ConvertToCamelCase(colName))
			if !field.IsValid() {
				fmt.Println("invalid Field name:", field)
				continue

			}

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
