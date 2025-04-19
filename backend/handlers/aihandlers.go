package handlers

import (
	"encoding/json"
	"fmt"
	"go-db-llm/genai"
	"net/http"
	"strings"
)

var LProcess *genai.LlamaProcess

// handles starting llama via python script
func HandleStartLlama(w http.ResponseWriter, r *http.Request) {
	var err error
	LProcess, err = genai.StartPythonLoadLlama()
	if err != nil {
		fmt.Println("Failed to start Load Llama", err)
	}
	waitUntilRunning(w, r)
}

// handles request to close llama
func HandleCloseLlama(w http.ResponseWriter, r *http.Request) {
	sendDataToLlama(`{"prompt": "Exit"}`)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Model Closed"})
}

// Handles processing prompt request
func HandleProcessPrompt(w http.ResponseWriter, r *http.Request) {

	LProcess.OutputFinished = false

	var data genai.PromptToProcessRequest
	err := json.NewDecoder(r.Body).Decode(&data)
	if err != nil {
		fmt.Println("Failed to Process JSON", err)
		json.NewEncoder(w).Encode(map[string]string{"message": "Failure"})
	}
	fmtData := formatRawData(data.RawData, data.Columns)
	for _, d := range fmtData {
		prompt := createPrompt(data.Instruct, data.Example, d)

		sendDataToLlama(prompt)
	}

	waitForOutput(w, r)

	var response genai.PromptResponse
	response.Columns = data.Columns
	response.Results = LProcess.Output

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)

}

// sends data to llama via input stream
func sendDataToLlama(prompt string) {
	if LProcess == nil {
		return
	}

	LProcess.Ch <- prompt
}

// waits until llama is running
// BUGS
func waitUntilRunning(w http.ResponseWriter, r *http.Request) {

	ctx := r.Context()

	LProcess.Mu.Lock()
	defer LProcess.Mu.Unlock()

	for !LProcess.Running {
		fmt.Println("We are waiting for start.")
		waitCH := make(chan struct{})
		go func() {
			LProcess.Cond.Wait()
			close(waitCH)
		}()

		select {
		case <-ctx.Done():
			http.Error(w, "Client canceled or timed out", http.StatusRequestTimeout)
			return

		case <-waitCH:
			//recheck condition
		}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Model loaded"})
}

// waits for finished output
// BUGS
func waitForOutput(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	for !LProcess.OutputFinished {
		fmt.Println("Waiting for output finish")
		// Unlock temporarily while waiting for either context cancellation or signal
		done := make(chan struct{})
		go func() {
			LProcess.Cond.Wait() // Wait releases the lock internally
			close(done)
		}()

		select {
		case <-ctx.Done():
			http.Error(w, "Client canceled or timed out", http.StatusRequestTimeout)
			return
		case <-done:
			// continue to check the condition
		}
	}

}

// Creates the prompt to send to llama
func createPrompt(instruct string, sample [][]string, data []string) string {
	prompt := createOpening(instruct)
	prompt += addSampleData(sample)
	prompt += addData(data)

	return prompt
}

func createOpening(instruct string) string {
	opening := `{"role": "user", "content":"`
	rtnVal := opening + "" + instruct
	return rtnVal
}

func addSampleData(sampleData [][]string) string {
	opening := " For example "
	rtnVal := opening

	for _, val := range sampleData {
		fullSample := fmt.Sprintf("[%s] return [%s], ", val[0], val[1])
		rtnVal += fullSample
	}

	return rtnVal
}

func addData(data []string) string {

	opening := " Here is data to Process - "
	rtnVal := opening
	for _, val := range data {
		fmtData := fmt.Sprintf("[%s], ", val)
		rtnVal += fmtData
	}

	return rtnVal + `"}`
}

func formatRawData(input []map[string]string, cols []string) [][]string {

	var fmtData []string

	for _, row := range input {
		var values []string
		for _, col := range cols {
			val := row[col]
			if strings.Contains(val, ",") {
				val = `'` + val + `'`
			}
			values = append(values, val)
		}
		fmtData = append(fmtData, strings.Join(values, ","))
	}

	return chunckSlice(fmtData)
}

func chunckSlice(input []string) [][]string {

	var output [][]string
	for i := 0; i < len(input); i += 5 {
		end := i + 5
		if end > len(input) {
			end = len(input)
		}
		output = append(output, input[i:end])
	}
	return output
}

/* [{"role": "user", "content": "remove all words and symbols that are not a units or amounts make sure to include units and their measure that have spaces between them. Data like cookies or ribs count as a unit. Don't reply with any extra information"


"For example [1, 1/2 Cup(aprx. 8ml) 243g] you should respond [1, 1/2Cup 8ml 243g]"

" data: [345, )(appprox 27ml) 2C], [6454, copkie], [2584, coookie], [755, tbsp mix (25g)makes 1 cookie] [6303, fl.oz . as prepared) | ( (45.0 ml) aprx]"},
 ]    ] */
