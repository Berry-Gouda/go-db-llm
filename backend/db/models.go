package db

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

type MainPageInfo struct {
	DBName        string                         `json:"dbName"`
	TableOverview map[string]uint32              `json:"tablesOverview"`
	TableSchema   map[string][]TableSchemaInfo   `json:"tableSchema"`
	Top20Rows     map[string][]map[string]string `json:"top20"`
}
