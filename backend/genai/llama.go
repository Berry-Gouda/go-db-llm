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

// global variables.
var llamaMu sync.Mutex
var Llama *LlamaProcess

// starts the python script to load llama
func StartPythonLoadLlama() (*LlamaProcess, error) {

	llamaMu.Lock()
	defer llamaMu.Unlock()

	if Llama != nil {
		return Llama, fmt.Errorf("Llama is already running")
	}

	ctx, cancel := context.WithCancel(context.Background())

	//path to python interetor and the script to be called
	pythonPath := ""
	scriptPath := ""

	//declares the command session and sets env variables
	cmd := exec.Command(pythonPath, scriptPath)
	cmd.Env = append(os.Environ(), "RANK=0")
	cmd.Env = append(cmd.Env, "PYTHONUNBUFFERED=1")

	//input pipe
	stdinPipe, err := cmd.StdinPipe()
	if err != nil {
		fmt.Println("Error getting stdin pipe:", err)
		cancel()
		return nil, err
	}

	//output pipe
	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		fmt.Println("Error getting stdout pipe:", err)
		cancel()
		return nil, err
	}

	//error pipe
	stderrPipe, err := cmd.StderrPipe()
	if err != nil {
		fmt.Println("Error getting stderr pipe:", err)
		cancel()
		return nil, err
	}

	//creates and sets the llama process struct
	process := &LlamaProcess{
		Cmd:    cmd,
		Stdin:  bufio.NewWriter(stdinPipe),
		Stdout: bufio.NewScanner(stdoutPipe),
		Stderr: bufio.NewScanner(stderrPipe),
		Ch:     make(chan string),
		Cancel: cancel,
	}
	//creates the condition and sets global to this process.
	process.Cond = sync.NewCond(&process.Mu)
	Llama = process

	//starts the command
	if err := cmd.Start(); err != nil {
		cancel()
		Llama = nil
		return nil, err
	}

	//starts go routines for writing input and reading output.
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

// reads error stream and outputs to terminal
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

// reads data from output stream and prints them to terminal
func scanStdout(ctx context.Context) {

	var output []string
	for Llama.Stdout.Scan() {
		select {
		case <-ctx.Done():
			return
		default:
			line := Llama.Stdout.Text()
			if line == "Successful Loading of Model" {
				Llama.Running = true
				Llama.Cond.Broadcast()
				continue
			}
			if line == "Model Unloaded" {
				closeLlama()
			}
			if line == "End Output" {
				Llama.OutputFinished = true
				Llama.Cond.Broadcast()
				continue
			}
			Llama.Output = append(output, line)
			fmt.Println(line)
		}
	}
	if err := Llama.Stdout.Err(); err != nil {
		fmt.Println("Error reading stdout:", err)
	}
}

// writes data to input stream
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
