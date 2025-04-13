package handlers

import (
	"encoding/json"
	"fmt"
	"go-db-llm/genai"
	"net/http"
)

var LProcess *genai.LlamaProcess

func HandleStartLlama(w http.ResponseWriter, r *http.Request) {
	var err error
	LProcess, err = genai.StartPythonLoadLlama()
	if err != nil {
		fmt.Println("Failed to start Load Llama", err)
	}
	waitUntilRunning(w, r)

}

func HandleCloseLlama(w http.ResponseWriter, r *http.Request) {
	sendDataToLlama(`{"prompt": "Exit"}`)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Model Closed"})
}

func sendDataToLlama(prompt string) {
	if LProcess == nil {
		return
	}

	LProcess.Ch <- prompt
}

func waitUntilRunning(w http.ResponseWriter, r *http.Request) {

	ctx := r.Context()

	LProcess.Mu.Lock()
	defer LProcess.Mu.Unlock()

	for !LProcess.Running {
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

func buildPrompt() string {
	var prompt string

}

/* [{"role": "user", "content": "remove all words and symbols that are not a units or amounts make sure to include units and their measure that have spaces between them. Data like cookies or ribs count as a unit. Don't reply with any extra information"
 "For example [1, 1/2 Cup(aprx. 8ml) 243g] you should respond [1, 1/2Cup 8ml 243g]"
" data: [345, )(appprox 27ml) 2C], [6454, copkie], [2584, coookie], [755, tbsp mix (25g)makes 1 cookie] [6303, fl.oz . as prepared) | ( (45.0 ml) aprx]"},
 ]    ] */
