const { app, BrowserWindow, ipcMain, IpcMainServiceWorker } = require("electron");
const Store = require('electron-store').default;
const store = new Store({name: 'creds'});
const {dialog} = require("electron");
const path = require("path");

let dbData = {
            "dbName":"",
            "tableSchema":"",
            "tablesOverview":"",
            "top20":"",
            "searchResults":"",
};

ipcMain.handle('get-dbData', async () => {
    return dbData;
});

ipcMain.handle('set-dbData', async(event, data)=>{
    dbData = data;
    console.log(dbData)
});

let win;
let aiWindow;
let promptWindow;
let resultsWindow;
let basePath = "./templates/"

let user = "";
let db = "";
let pass = "";
let dbhost = "";
let dbport = "";
let gohost = "";
let goport = "";
let baseURL = "";

//start up and shutdown functions and events
app.whenReady().then(() =>{
    start();

    app.on("acvtivate", () => {
        if(BrowserWindow.getAllWindows().length() === 0) start();
    });
});

function start(){
    win = new BrowserWindow({
        width:1500,
        height:1125,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
        },
    });

    win.loadFile(basePath + "index.html");
}

app.on("window-all-closed", () => {
    if(process.platform !== "darwin"){
        app.quit()
    }
});

//credential submit and retreive
ipcMain.on("submit-creds", (event, data) => {
    const parsed = JSON.parse(data);
    if(parsed.save){
        store.set('user', parsed.user);
        store.set('db', parsed.db);
        store.set('pass', parsed.pass);
        store.set('dbhost', parsed.dbhost);
        store.set('dbport', parsed.dbport);
        store.set('gohost', parsed.gohost);
        store.set('goport', parsed.goport);
        loadCreds();
    }
    user = parsed.user;
    db = parsed.db;
    pass = parsed.pass;
    dbhost = parsed.dbhost;
    dbport = parsed.dbport;
    gohost = parsed.gohost;
    goport = parsed.goport;

    buildGoURL();
    createDBConnection();
});

ipcMain.on("load-creds", (event) => {
    loadCreds();
    buildGoURL();
    createDBConnection();
});

function loadCreds(){
    user = store.get('user');
    db = store.get('db');
    pass = store.get('pass');
    dbhost = store.get('dbhost');
    dbport = store.get('dbport');
    gohost = store.get('gohost');
    goport = store.get('goport');
}

//connection init functions
function buildGoURL(){
    baseURL = "http://" + gohost + ":" + goport + "/"
}

async function createDBConnection(){
    try {
        const data = JSON.stringify({
            user: user,
            pass: pass,
            dbhost: dbhost,
            dbport: dbport,
            db: db
        });

        const reqURL = baseURL + "create-db-connection";

        const response = await fetch(reqURL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: data,
        });

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const result = await response.json();

        const parsed = typeof result === "string" ? JSON.parse(result) : result;

        if (parsed.success) {
            console.log("Connected");
            win.loadFile(basePath + "main.html")
        } else {
            console.log("Failed To Connect To DB");
        }

    } catch (err) {
        console.error("Error in createDBConnection:", err.message || err);
    }
}

//event to handle loading main page
ipcMain.handle("load-main",  async()=>{
    
    url = baseURL + "load-main"
    const response = await fetch(url, {
        method: "POST",
        headers:{
            "Content-Type": "application/json"
        }
    });

    const data = await response.json();

    return data;

})

ipcMain.on("open-results", (event, data) => {
    resultsWin = new BrowserWindow({
        width: 1000,
        height: 1000,
        webPreferences:{
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
        }
    });

    resultsWin.loadFile(basePath + "searchResults.html")

    resultsWin.webContents.on("did-finish-load", () => {
        resultsWin.webContents.send("results-data", data);
    });
})

ipcMain.handle("bulk-insert", async(event, table) => {
    let filePath = null;

    if (win) {
        const result = await dialog.showOpenDialog(win, {
            properties: ['openFile'],
            filters: [{ extensions: ["csv"] }]
        });

        if (result.canceled || result.filePaths.length === 0) {
            console.log("User canceled file selection.");
            return; // or send a cancellation response
        }

        filePath = result.filePaths[0];
    }

    const response = await fetch(baseURL + "bulk-insert", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            file: filePath,
            table: table
        }),
    });

    const data = await response.json();
    return {message: data.message};
});

ipcMain.handle("send-search", async(event, data) =>{
    url = baseURL + "comp-column-search";
    const response = await fetch(url, {
        method: "POST",
        headers:{
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    const results = await response.json();
    dbData.searchResults = JSON.parse(results)
    
})

//Events to handle llm connections
ipcMain.handle("start-llm", async (event)=>{
    url = baseURL + "start-llm"
    aiWindow = new BrowserWindow({
        width: 1200,
        height: 1000,
        webPreferences:{
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js")
        }
    })
    aiWindow.loadFile(path.join(basePath, "loading.html"))

    const response = await fetch(url, {
        method: "POST",
        headers:{
            "Content-Type": "application/json",
        }
    });

    if(response){
        aiWindow.close()
    }
})

ipcMain.handle("close-llm", async (event) =>{
    url = baseURL + "close-llm";
    const response = await fetch (url, {
        method: "POST",
        headers:{
            "Content-Type": "application/json",
        }
    });

    const msg = await response.json();
    if (msg.message == 'Model Closed'){
        aiWindow.close()
    }
})

//Events to generate prompts and pass to llm
ipcMain.on("open-prompt-window", (event) => {    

    promptWindow = new BrowserWindow({
        width: 1200,
        height: 1500,
        webPreferences:{
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js")
        }
    })
    promptWindow.loadFile(path.join(basePath, "promptWindow.html"))
})

ipcMain.handle("generate-query", async (event, data) =>{
    const url = baseURL + "create-query";
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        const resultsData = await response.json();

        event.sender.send("prompt-query-return", resultsData);
        
    } catch (error) {
        console.error("Fetch error:", error);
    }


})

ipcMain.on("submit-samples", (event, data) => {

    if (promptWindow){
        promptWindow.webContents.send("return-samples", data);
    }else{

        alert("Open Prompt Window to Send Samples")
    }
})

ipcMain.handle("send-prompt", async (event, data) => {


    url = baseURL + "send-full-prompt"
    const response = await fetch(url, {
        method: "POST",
        headers:{
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
    const result = await response.json();
})