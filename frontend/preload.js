const {contextBridge, ipcRenderer} = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    submitCreds: (data) => ipcRenderer.send("submitCreds", data),
    loadCreds: () => ipcRenderer.send("loadCreds"),
    loadMain: () => ipcRenderer.invoke("loadMain"),
});