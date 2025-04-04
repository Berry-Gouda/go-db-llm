const { app, BrowserWindow, ipcMain } = require("electron");
const Store = require('electron-store').default;
const store = new Store({name: 'creds'});
const {dialog} = require("electron");
const path = require("path");

let win;
let basePath = "./templates/"

let user = "";
let db = "";
let pass = "";
let dbhost = "";
let dbport = "";
let gohost = "";
let goport = "";
let baseURL = "";

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

ipcMain.on("submitCreds", (event, data) => {
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

    console.log(data)

    buildGoURL();
    createDBConnection();
});

ipcMain.on("loadCreds", (event) => {
    loadCreds();
    buildGoURL();
    createDBConnection();
});

app.on("window-all-closed", () => {
    if(process.platform !== "darwin"){
        app.quit()
    }
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
            win.loadFile(basePath + "/main.html")
        } else {
            console.log("Failed To Connect To DB");
        }

    } catch (err) {
        console.error("Error in createDBConnection:", err.message || err);
    }
}

ipcMain.handle("loadMain",  async()=>{
    
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