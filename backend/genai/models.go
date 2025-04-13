package genai

import (
	"bufio"
	"context"
	"os/exec"
	"sync"
)

type DataToGeneratePrompt struct {
	ColumnsInOrder []string            `json:"columns"`
	ColData        map[string][]string `json:"colData"`
	TextPrompt     string              `json:"textPrompt"`
	SampleData     string              `json:"sampleData"`
	SampleResults  string              `json:"sampleResults"`
	On             string              `json:"on"`
	Where          string              `json:"where"`
}

type ProcessedPrompt struct {
	P string `json:"prompt"`
}

type LlamaProcess struct {
	Cmd     *exec.Cmd
	Stdin   *bufio.Writer
	Stdout  *bufio.Scanner
	Stderr  *bufio.Scanner
	Ch      chan string
	Cancel  context.CancelFunc
	Mu      sync.Mutex
	Cond    *sync.Cond
	Running bool
	Done    chan struct{}
}
