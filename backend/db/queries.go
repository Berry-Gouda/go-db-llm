package db

import (
	"database/sql"
	"fmt"
	"reflect"
	"strings"
)

func GetDBTableNames(db *sql.DB) ([]string, error) {
	var tNames []string

	query := `SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_type = 'BASE TABLE'`

	rows, err := db.Query(query, GetDBName())
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		tNames = append(tNames, name)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return tNames, nil
}

func GetTableRowCount(db *sql.DB, table string) (uint32, error) {
	var count uint32

	query := fmt.Sprintf("SELECT COUNT(*) FROM %s", table)
	err := db.QueryRow(query).Scan(&count)

	if err != nil {
		return count, err
	}

	return count, err
}

func GetTableSchema(db *sql.DB, table string) ([]TableSchemaInfo, error) {
	var tableInfo []TableSchemaInfo

	query :=
		`SELECT c.COLUMN_NAME, c.COLUMN_TYPE, c.IS_NULLABLE, c.COLUMN_DEFAULT, 
		IF(k.CONSTRAINT_NAME = 'PRIMARY', 'PRI', IF(k.REFERENCED_TABLE_NAME IS NOT NULL, 'FK', NULL)) AS KEY_TYPE
		FROM INFORMATION_SCHEMA.COLUMNS c
		LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
		ON c.TABLE_NAME = k.TABLE_NAME AND c.COLUMN_NAME = k.COLUMN_NAME AND c.TABLE_SCHEMA = k.TABLE_SCHEMA
		WHERE c.TABLE_NAME = ? AND c.TABLE_SCHEMA = DATABASE()
		ORDER BY c.ORDINAL_POSITION`

	results, err := db.Query(query, table)
	if err != nil {
		return nil, err
	}
	defer results.Close()

	for results.Next() {
		var col TableSchemaInfo
		var colDefault, kType sql.NullString

		if err := results.Scan(&col.ColName, &col.DType, &col.IsNull, &colDefault, &kType); err != nil {
			println(err)
			return tableInfo, err
		}

		if colDefault.Valid {
			col.ColDefault = colDefault.String
		} else {
			col.ColDefault = "N/A"
		}

		if kType.Valid {
			col.KeyType = kType.String
		} else {
			col.KeyType = "N/A"
		}

		tableInfo = append(tableInfo, col)
	}

	return tableInfo, nil
}

func GetTopRows(db *sql.DB, table string, count int) ([]map[string]string, error) {

	query := fmt.Sprintf("SELECT * FROM %s LIMIT %d", table, count)

	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	columnNames, err := rows.Columns()
	if err != nil {
		return nil, err
	}

	topRows, err := ParseRows(rows, columnNames)
	if err != nil {
		fmt.Println("Failed to Parse Rows \n", err)
		return nil, err
	}

	return topRows, nil
}

func GetTableSchemaForDynamicStruct(db *sql.DB, tName string) (map[string]string, error) {
	query := `
		SELECT COLUMN_NAME, DATA_TYPE
		FROM INFORMATION_SCHEMA.COLUMNS
		WHERE TABLE_NAME = ?
		ORDER BY ORDINAL_POSITION`

	rows, err := db.Query(query, tName)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	schema := make(map[string]string)
	for rows.Next() {
		var columnName, dataType string
		if err := rows.Scan(&columnName, &dataType); err != nil {
			return nil, err
		}
		schema[columnName] = dataType
	}

	return schema, nil
}

// BulkInsert preforms a bulk insert operation on a table.
func BulkInsert(db *sql.DB, tName string, data []interface{}, structType reflect.Type) error {

	batchSize := 1000

	if len(data) == 0 {
		return fmt.Errorf("no records to insert")
	}

	columnOrder, err := getColumnOrder(db, tName)
	if err != nil {
		return err
	}

	numCols := len(columnOrder)
	numRows := len(data)

	for start := 0; start < numRows; start += batchSize {
		end := start + batchSize
		if end > numRows {
			end = numRows
		}

		rowPlaceholders := make([]string, end-start)

		for i := range rowPlaceholders {
			rowPlaceholders[i] = "(" + strings.Repeat("?,", numCols)[:(numCols*2)-1] + ")"
		}

		placeholders := strings.Join(rowPlaceholders, ", ")

		query := fmt.Sprintf("INSERT INTO %s (%s) VALUES %s",
			tName, strings.Join(columnOrder, ", "), placeholders)

		var values []interface{}
		for _, record := range data[start:end] {
			recordValue := reflect.ValueOf(record)

			for _, column := range columnOrder {
				field := recordValue.FieldByName(ConvertToCamelCase(column))
				if field.IsValid() {
					values = append(values, field.Interface())
				} else {
					values = append(values, nil)
				}
			}
		}

		stmt, err := db.Prepare(query)
		if err != nil {
			return err
		}

		_, err = stmt.Exec(values...)
		if err != nil {
			stmt.Close()
			return err
		}
		stmt.Close()
	}
	return err
}

func getColumnOrder(db *sql.DB, tName string) ([]string, error) {

	query := fmt.Sprintf(`
		SELECT COLUMN_NAME
		FROM INFORMATION_SCHEMA.COLUMNS
		WHERE TABLE_NAME = '%s'
		ORDER BY ORDINAL_POSITION`, tName)

	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}

	var columns []string
	for rows.Next() {
		var columnName string
		if err := rows.Scan(&columnName); err != nil {
			return nil, err
		}
		columns = append(columns, columnName)
	}

	return columns, nil
}

func CompColumnSearch(db *sql.DB, table string, searchVal string, compColumn string) ([]map[string]string, error) {

	var query string

	isKeyCol, err := checkIfColumnIsKeyRefrence(db, table, compColumn)
	fmt.Println("Key Col?\t", isKeyCol)
	if err != nil {
		isKeyCol = false
	}
	if isKeyCol {
		query = `SELECT * FROM ` + table + ` WHERE ` + compColumn + ` = ?`
	} else {
		query = `SELECT * FROM ` + table + ` WHERE ` + compColumn + ` LIKE ?`
		searchVal = "%" + searchVal + "%"

	}

	rows, err := db.Query(query, searchVal)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	columnNames, err := rows.Columns()
	if err != nil {
		return nil, err
	}

	results, err := ParseRows(rows, columnNames)
	if err != nil {
		return nil, err
	}

	return results, nil

}

func checkIfColumnIsKeyRefrence(db *sql.DB, tName string, colName string) (bool, error) {
	var count int

	query := `
		SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
		WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = ?
		AND COLUMN_NAME = ?;
		`

	err := db.QueryRow(query, tName, colName).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}
