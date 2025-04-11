package genai

import (
	"bufio"
	"context"
	"os/exec"
	"sync"
)

type GenAIPromptFromFrontEnd struct {
	UserPrompt string     `json:"prompt"`
	SentData   [][]string `json:"data"`
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
