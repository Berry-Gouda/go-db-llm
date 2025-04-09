package genai

import (
	"bufio"
	"os/exec"
	"sync"
)

type GenAIPromptFromFrontEnd struct {
	UserPrompt string     `json:"prompt"`
	SentData   [][]string `json:"data"`
}

type ProcessedPrompt struct {
	p string `json:"prompt"`
}

type LlamaProcess struct {
	Cmd     *exec.Cmd
	Running bool
	Stdin   *bufio.Writer
	Stdout  *bufio.Scanner
	Ch      chan string

	Mu   sync.Mutex
	Cond *sync.Cond
}
