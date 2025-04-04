let dbUser = "";
let dbName = "";
let password = "";
let dbHost = "";
let dbPort = "";
let goHost = "";
let goPort = "";
let saveCreds = false;

document.addEventListener("DOMContentLoaded", function() {
    const btn = document.getElementById("submit");
    btn.addEventListener("click", function(){
        gatherAllFormData();
        sendFormDataFrontEnd();
    });

    const btn2 = document.getElementById("use-saved");
    btn2.addEventListener("click", function() {
        window.electronAPI.loadCreds();
    });
})

function gatherAllFormData(){
    dbUser = document.getElementById("db-user").value;
    dbName = document.getElementById("db-name").value;
    password = document.getElementById("db-password").value;
    dbHost = document.getElementById("db-host").value;
    dbPort = document.getElementById("db-port").value;
    goHost = document.getElementById("go-host").value;
    goPort = document.getElementById("go-port").value;
    saveCreds = document.getElementById("save-creds").checked;

}

function sendFormDataFrontEnd(){
    data = JSON.stringify({
        user: dbUser,
        db: dbName,
        pass: password,
        dbhost: dbHost,
        dbport: dbPort,
        gohost: goHost,
        goport: goPort,
        save: saveCreds
    });

    window.electronAPI.submitCreds(data);
}


