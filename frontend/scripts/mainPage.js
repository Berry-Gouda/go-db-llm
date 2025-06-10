import * as utils from './utils.js'

let searchValToSend = ""
let searchedTable = ""
let schemaData
let isSearch = false


//page loading functions and events
document.addEventListener("DOMContentLoaded", async() => {
    try{
        const data = await window.electronAPI.loadMain();
        const parsedData = typeof data === "string" ? JSON.parse(data) : data;
        window.electronAPI.setGlobalData(parsedData)

    }
    catch{
        console.error("error getting db data");
    }
    UpdatePageData()
    SetButtonListeners();
})

function UpdatePageData(){
    UpdateHeader(utils.dbData.dbName)
    utils.UpdateTablesOverview()
}

function UpdateHeader(dbName){
    const header = document.getElementById("db-name");
    header.innerHTML = dbName;
}

function SetButtonListeners(){
    const t20 = document.getElementById("t20");
    const bi = document.getElementById("bi");
    const cs = document.getElementById("cs");
    const sLLM = document.getElementById("sLLM");
    const cLLM = document.getElementById("cLLM");
    const opg = document.getElementById("opg");
    const search = document.getElementById("search");

    t20.addEventListener("click", ShowResults);
    bi.addEventListener("click", BulkInsert);
    cs.addEventListener("click", resetSearch);
    sLLM.addEventListener("click", StartLLM);
    cLLM.addEventListener("click", CloseLLM);
    opg.addEventListener("click", window.electronAPI.openPromptWindow);
    search.addEventListener("click", SendSearch);
}


//displays search results in new window
function ShowResults() {
    let data = {}

    console.log("isSearch:\t", isSearch)

    if (isSearch)
    {
        data = {
            table: searchedTable,
            isSearch: isSearch
        };
        console.log("Data Sending:\n",data)
        window.electronAPI.openResults(data);
        return
    }

    if(!utils.selectedTable ){
        alert("Select Table To View")
        return
    }
    schemaData = Object.values(utils.dbData.tableSchema[utils.selectedTable])
                        .map(item => item.ColName);

    data = {
            results: utils.dbData.top20[utils.selectedTable],
            schema: schemaData,
            isSearch: isSearch
    };
    console.log("Data Sending:\n",data)
    window.electronAPI.openResults(data);
}
//bulk insert button calls event to open a dialoge box to select the csv and sends the path to backend for insertion.
async function BulkInsert(){
    const msg = await window.electronAPI.bulkInsert(selectedTable);
    alert(msg.message);
}

//sends a simple comp column search query to backend
async function SendSearch(){
    if(!utils.selectedColumn){
        alert("No Comp Column Seleceted")
        return
    }
    let data = {}
    const input = document.getElementById("search-input");
    searchValToSend = input.value
    data = {
        table: utils.selectedTable,
        compColumn: utils.selectedColumn,
        searchVal: searchValToSend,
    };

    isSearch = true;
    searchedTable = data.table
    await window.electronAPI.sendSearch(data);
    utils.setData()
}

//start and close llm button functions
function StartLLM(){
    window.electronAPI.startLLM();
}

function CloseLLM(){
    window.electronAPI.closeLLM();
}

function resetSearch(){
    isSearch = false
}