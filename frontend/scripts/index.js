// Declare global variables to store form input values
let dbUser = "";
let dbName = "";
let password = "";
let dbHost = "";
let dbPort = "";
let goHost = "";
let goPort = "";
let saveCreds = false;

// Wait until the DOM is fully loaded before setting up event listeners
document.addEventListener("DOMContentLoaded", function() {
    // Add click event listener to the submit button
    const btn = document.getElementById("submit");
    btn.addEventListener("click", function() {
        gatherAllFormData();      // Collect input values from the form
        sendFormDataFrontEnd();   // Send the collected data to the main Electron process
    });

    // Add click event listener to the "use saved credentials" button
    const btn2 = document.getElementById("use-saved");
    btn2.addEventListener("click", function() {
        // Trigger the Electron API to load saved credentials (if any)
        window.electronAPI.loadCreds();
    });
});

/**
 * Gathers all form input values and assigns them to global variables.
 * This includes DB credentials, host information, and save preferences.
 */
function gatherAllFormData() {
    dbUser = document.getElementById("db-user").value;
    dbName = document.getElementById("db-name").value;
    password = document.getElementById("db-password").value;
    dbHost = document.getElementById("db-host").value;
    dbPort = document.getElementById("db-port").value;
    goHost = document.getElementById("go-host").value;
    goPort = document.getElementById("go-port").value;
    saveCreds = document.getElementById("save-creds").checked;
}

/**
 * Packages the gathered form data into a JSON string and sends it
 * to the backend (main process) via the exposed Electron API.
 */
function sendFormDataFrontEnd() {
    const data = JSON.stringify({
        user: dbUser,
        db: dbName,
        pass: password,
        dbhost: dbHost,
        dbport: dbPort,
        gohost: goHost,
        goport: goPort,
        save: saveCreds
    });

    // Send the JSON-formatted credentials to the backend
    window.electronAPI.submitCreds(data);
}