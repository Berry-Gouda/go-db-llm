package genai

import (
	"bufio"
	"context"
	"os/exec"
	"sync"
)

type LlamaProcess struct {
	Cmd            *exec.Cmd
	Stdin          *bufio.Writer
	Stdout         *bufio.Scanner
	Stderr         *bufio.Scanner
	Ch             chan string
	Cancel         context.CancelFunc
	Mu             sync.Mutex
	Cond           *sync.Cond
	Running        bool
	OutputFinished bool
	Done           chan struct{}
	Output         []string `json:"outputResults"`
}

type PromptResponse struct {
	Results []string `json:"results"`
	Columns []string `json:"columns"`
}

// Data for creation of full prompt
type PromptToProcessRequest struct {
	Query    string              `json:"query"`
	Columns  []string            `json:"columns"`
	RawData  []map[string]string `json:"rawData"`
	Instruct string              `json:"instruct"`
	Example  [][]string          `json:"example"`
}
