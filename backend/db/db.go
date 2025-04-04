package db

import (
	"database/sql"
	"fmt"
	"log"

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
