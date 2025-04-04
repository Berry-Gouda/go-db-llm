package db

import (
	"database/sql"
	"fmt"
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

	var topRows []map[string]string

	for rows.Next() {
		values := make([]interface{}, len(columnNames))
		valuePtrs := make([]interface{}, len(columnNames))

		for i := range values {
			valuePtrs[i] = &values[i]
		}

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

		topRows = append(topRows, rowMap)

	}

	return topRows, nil
}
