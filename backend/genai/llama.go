package genai

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"sync"
)

var Llama *LlamaProcess
var once sync.Once

func StartPythonLoadLlama() *LlamaProcess {

	pythonPath := "/media/bg-labs/usb/fms/venv/bin/python3"
	scriptPath := "/media/bg-labs/usb/go-db-llm/backend/genai/llama_interface.py"

	once.Do(func() {
		cmd := exec.Command(pythonPath, scriptPath)
		cmd.Env = append(os.Environ(), "RANK=0")
		cmd.Env = append(cmd.Env, "PYTHONUNBUFFERED=1")

		stdinPipe, err := cmd.StdinPipe()
		if err != nil {
			fmt.Println("Error getting stdin pipe:", err)
			return
		}

		stdoutPipe, err := cmd.StdoutPipe()
		if err != nil {
			fmt.Println("Error getting stdout pipe:", err)
			return
		}

		process := &LlamaProcess{
			Cmd:    cmd,
			Stdin:  bufio.NewWriter(stdinPipe),
			Stdout: bufio.NewScanner(stdoutPipe),
			Ch:     make(chan string),
		}
		process.Cond = sync.NewCond(&process.Mu)

		stderrPipe, err := cmd.StderrPipe()
		if err != nil {
			fmt.Println("Error getting stderr pipe:", err)
			return
		}
		stderrScanner := bufio.NewScanner(stderrPipe)

		if err := cmd.Start(); err != nil {
			fmt.Println("Error starting Python script:", err)
			return
		}

		Llama = process

		go func() {
			for stderrScanner.Scan() {
				fmt.Println("Python Error:", stderrScanner.Text())
			}
		}()

		go func() {
			err := cmd.Wait()
			if err != nil {
				fmt.Println("Python process exited with error:", err)
			} else {
				fmt.Println("Python process exited successfully.")
			}
		}()

		go func() {
			for process.Stdout.Scan() {
				line := process.Stdout.Text()
				fmt.Println("line: -> ", line)
				if line == "Successful Loading of Model" {
					fmt.Println("\nWe are in if statement")
					Llama.Mu.Lock()
					Llama.Running = true
					Llama.Cond.Broadcast()
					Llama.Mu.Unlock()
				}
				fmt.Println(line)
			}
			if err := process.Stdout.Err(); err != nil {
				fmt.Println("Error reading Python output:", err)
			}
		}()

		go func() {
			for prompt := range process.Ch {
				fmt.Println("\n***************\n", prompt, "\n*********************")
				data := strings.TrimSpace(prompt)
				data = strings.ReplaceAll(data, "\n", " ")
				data = strings.ReplaceAll(data, "\r", " ")
				data = strings.ReplaceAll(data, "\t", " ")

				var compacted bytes.Buffer
				if err := json.Compact(&compacted, []byte(data)); err != nil {
					fmt.Println("Invalid JSON string:", err)
					continue
				}

				_, err := process.Stdin.Write(compacted.Bytes())
				if err != nil {
					fmt.Println("Error writing to stdin:", err)
					continue
				}
				_, _ = process.Stdin.Write([]byte("\n"))
				//process.Stdin.Flush()
				fmt.Println("Sent to Python")
			}
		}()

	})
	return Llama
}

/*func CallPythonScript(prompt string) (map[string]interface{}, error) {

	cmd := exec.Command("bash", "-c", fmt.Sprintf("python3 ./genai/llama_interface.py '%s'", prompt))
	stdin, _ := cmd.StdinPipe()
	stdout, _ := cmd.StdoutPipe()

	err := cmd.Run()
	if err != nil {
		return nil, fmt.Errorf("error running script: %w", err)
	}

	var result map[string]interface{}
	err = json.Unmarshal(out.Bytes(), &result)
	if err != nil {
		return nil, fmt.Errorf("error parsing JSON output: %w", err)
	}

	return result, nil
}

   Sample Prompt for cleaning units.

[{"role": "user", "content": "remove all words and symbols that are not a units or amounts make sure to include units and their measure that have spaces between them. Data like cookies or ribs count as a unit. Don't reply with any extra information"
        "For example [1, 1/2 Cup(aprx. 8ml) 243g] you should respond [1, 1/2Cup 8ml 243g]"
        " data: [345, )(appprox 27ml) 2C], [6454, copkie], [2584, coookie], [755, tbsp mix (25g)makes 1 cookie] [6303, fl.oz . as prepared) | ( (45.0 ml) aprx]"}*/
