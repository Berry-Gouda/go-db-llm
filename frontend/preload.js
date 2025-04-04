const {contextBridge, ipcRenderer} = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    submitCreds: (data) => ipcRenderer.send("submit-creds", data),
    loadCreds: () => ipcRenderer.send("load-creds"),
    loadMain: () => ipcRenderer.invoke("load-main"),
    openResults: (data) => ipcRenderer.send("open-results", data),
    onResultsData: (callback) => ipcRenderer.on("results-data", (event, data) => callback(data)),
    bulkInsert: async (table) => {return await ipcRenderer.invoke("bulk-insert", table)},

});
