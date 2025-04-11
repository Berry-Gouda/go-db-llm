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
