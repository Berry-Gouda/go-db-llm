package db

import (
	"fmt"
	"reflect"
	"strings"

	"golang.org/x/text/cases"
	"golang.org/x/text/language"
)

type DBConnInfo struct {
	User   string `json:"user"`
	Pass   string `json:"pass"`
	DBHost string `json:"dbhost"`
	DBPort string `json:"dbport"`
	DBName string `json:"db"`
}

type TableSchemaInfo struct {
	ColName    string
	DType      string
	KeyType    string
	IsNull     string
	ColDefault string
}

type SearchResults struct {
	Results []map[string]string `json:"results"`
	Query   string              `json:"query"`
}

type MainPageInfo struct {
	DBName        string                         `json:"dbName"`
	TableOverview map[string]uint32              `json:"tablesOverview"`
	TableSchema   map[string][]TableSchemaInfo   `json:"tableSchema"`
	Top20Rows     map[string][]map[string]string `json:"top20"`
}

type BulkInsertRequest struct {
	File  string `json:"file"`
	Table string `json:"table"`
}

// CreateDynamicStruct creates a struct based on a table's schema.
func CreateDynamicStruct(schema map[string]string) reflect.Type {
	var fields []reflect.StructField

	for col, dtype := range schema {
		var fieldType reflect.Type

		switch dtype {
		case "int", "bigint", "int unsigned":
			fieldType = reflect.TypeOf(int(0))
		case "float", "double", "decimal":
			fieldType = reflect.TypeOf(float64(0))
		case "varchar", "text":
			fieldType = reflect.TypeOf("")
		default:
			fieldType = reflect.TypeOf(interface{}(nil))
		}
		fields = append(fields, reflect.StructField{
			Name: ConvertToCamelCase(col),
			Type: fieldType,
			Tag:  reflect.StructTag(fmt.Sprintf(`json:"%s"`, col)),
		})
	}
	return reflect.StructOf(fields)
}

// ConvertToCamelCase Converts a table name into the correct format for a go struct.
func ConvertToCamelCase(input string) string {
	parts := strings.Split(input, "_")
	for i := range parts {
		parts[i] = cases.Title(language.Und).String(parts[i])
	}
	return strings.Join(parts, "")
}

type CompColumnSearchRequest struct {
	Table       string `json:"table"`
	CompColumn  string `json:"compColumn"`
	SearchValue string `json:"searchVal"`
}

type GenerateQueryRequest struct {
	Columns  []string   `json:"columnsInOrder"`
	JoinData []JoinData `json:"joinData"`
	Where    WhereData  `json:"where"`
}

type JoinData struct {
	FromTable  string `json:"fTable"`
	FromColumn string `json:"fCol"`
	JoinTable  string `json:"joinedTable"`
	Join       string `json:"join"`
	Opp        string `json:"operator"`
	CompVal    string `json:"compVal"`
}

type WhereData struct {
	Column string `json:"column"`
	Opp    string `json:"opperator"`
	Where  string `json:"where"`
}
