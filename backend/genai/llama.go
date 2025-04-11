package genai

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"sync"
)

var llamaMu sync.Mutex
var Llama *LlamaProcess

func StartPythonLoadLlama() (*LlamaProcess, error) {

	llamaMu.Lock()
	defer llamaMu.Unlock()

	if Llama != nil {
		return Llama, fmt.Errorf("Llama is already running")
	}

	ctx, cancel := context.WithCancel(context.Background())

	pythonPath := "/media/bg-labs/usb/fms/venv/bin/python3"
	scriptPath := "/media/bg-labs/usb/go-db-llm/backend/genai/llama_interface.py"

	cmd := exec.Command(pythonPath, scriptPath)
	cmd.Env = append(os.Environ(), "RANK=0")
	cmd.Env = append(cmd.Env, "PYTHONUNBUFFERED=1")

	stdinPipe, err := cmd.StdinPipe()
	if err != nil {
		fmt.Println("Error getting stdin pipe:", err)
		cancel()
		return nil, err
	}

	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		fmt.Println("Error getting stdout pipe:", err)
		cancel()
		return nil, err
	}

	stderrPipe, err := cmd.StderrPipe()
	if err != nil {
		fmt.Println("Error getting stderr pipe:", err)
		cancel()
		return nil, err
	}

	process := &LlamaProcess{
		Cmd:    cmd,
		Stdin:  bufio.NewWriter(stdinPipe),
		Stdout: bufio.NewScanner(stdoutPipe),
		Stderr: bufio.NewScanner(stderrPipe),
		Ch:     make(chan string),
		Cancel: cancel,
	}
	process.Cond = sync.NewCond(&process.Mu)
	Llama = process

	if err := cmd.Start(); err != nil {
		cancel()
		Llama = nil
		return nil, err
	}

	go scanStderr(ctx)
	go scanStdout(ctx)
	go writeStdin(ctx)
	go waitForTermination()

	return Llama, nil
}

func closeLlama() {
	llamaMu.Lock()
	defer llamaMu.Unlock()

	if Llama == nil {
		return
	}

	Llama.Cancel()
	_ = Llama.Cmd.Process.Kill()
	<-Llama.Done
	close(Llama.Ch)
	Llama = nil
}

func scanStderr(ctx context.Context) {
	for Llama.Stderr.Scan() {
		select {
		case <-ctx.Done():
			return
		default:
			fmt.Println("Python Error:", Llama.Stderr.Text())
		}
	}
}

func scanStdout(ctx context.Context) {
	for Llama.Stdout.Scan() {
		select {
		case <-ctx.Done():
			return
		default:
			line := Llama.Stdout.Text()
			if line == "Successful Loading of Model" {
				Llama.Mu.Lock()
				Llama.Running = true
				Llama.Cond.Broadcast()
				Llama.Mu.Unlock()
			}
			if line == "Model Unloaded" {
				closeLlama()
			}
			fmt.Println(line)
		}
	}
	if err := Llama.Stdout.Err(); err != nil {
		fmt.Println("Error reading stdout:", err)
	}
}

func writeStdin(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		case prompt, ok := <-Llama.Ch:
			if !ok {
				return
			}
			data := strings.TrimSpace(prompt)
			data = strings.ReplaceAll(data, "\n", " ")
			data = strings.ReplaceAll(data, "\r", " ")
			data = strings.ReplaceAll(data, "\t", " ")

			var compacted bytes.Buffer
			if err := json.Compact(&compacted, []byte(data)); err != nil {
				fmt.Println("Invalid JSON string:", err)
				continue
			}

			_, err := Llama.Stdin.Write(compacted.Bytes())
			if err != nil {
				fmt.Println("Error writing to stdin:", err)
				continue
			}
			_, _ = Llama.Stdin.Write([]byte("\n"))
			Llama.Stdin.Flush()
		}
	}
}

func waitForTermination() {
	err := Llama.Cmd.Wait()
	if err != nil {
		fmt.Println("Python process exited with error:", err)
	} else {
		fmt.Println("Python process exited successfully.")
	}
}
