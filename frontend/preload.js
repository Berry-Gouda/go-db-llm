const {contextBridge, ipcRenderer} = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    submitCreds: (data) => ipcRenderer.send("submit-creds", data),
    loadCreds: () => ipcRenderer.send("load-creds"),
    loadMain: () => ipcRenderer.invoke("load-main"),
    openResults: (data) => ipcRenderer.send("open-results", data),
    onResultsData: (callback) => ipcRenderer.on("results-data", (event, data) => callback(data)),
    bulkInsert: async (table) => {return await ipcRenderer.invoke("bulk-insert", table)},
    sendSearch: async (data) => {return await ipcRenderer.invoke("send-search", data)},
    generateQuery: async (data) => ipcRenderer.invoke("generate-query", data),
    startLLM: () => ipcRenderer.invoke("start-llm"),
    closeLLM: () => ipcRenderer.invoke("close-llm"),
    openPromptWindow: (data) => ipcRenderer.send("open-prompt-window", data),
    onPromptData: (callback) => ipcRenderer.on("prompt-win-start-data", (event, data) => callback(data)),
    onQueryData: (callback) => ipcRenderer.on("prompt-query-return", (event, data) => callback(data)),
    submitSamples: (data) => ipcRenderer.send("submit-samples", (data)),
    onRecieveSamples: (callback) => ipcRenderer.on("return-samples", (event, data) => callback(data)),
});
