import * as utils from './utils.js'

let totalData
let searchValToSend = ""
let schemaData
let isSearch = false
let sResults = null


//page loading functions and events
document.addEventListener("DOMContentLoaded", async() => {
    try{
        const data = await window.electronAPI.loadMain();
        const parsedData = typeof data === "string" ? JSON.parse(data) : data;
        totalData = parsedData;
        utils.setTData(totalData)
    }
    catch{
        console.error("error getting db data");
    }
    UpdatePageData(totalData);
    SetButtonListeners();
    console.log(utils.tData);
})

function UpdatePageData(data){
    UpdateHeader(utils.tData.dbName)
    utils.UpdateTablesOverview(data.tablesOverview)
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
    opg.addEventListener("click", OpenPromptWindow);
    search.addEventListener("click", SendSearch);
}


//displays search results in new window
function ShowResults() {
    let data = {}

    if (isSearch)
    {
        data = {
            results: sResults.results.results,
            schema: schemaData,
            isSearch: isSearch
        };

        window.electronAPI.openResults(data);
        return
    }
    
    console.log(utils.tData.tableSchema[utils.selectedTable])
    schemaData = Object.values(utils.tData.tableSchema[utils.selectedTable])
                              .map(item => item.ColName);
    


    data = {
            results: utils.tData.top20[utils.selectedTable],
            schema: schemaData,
            isSearch: isSearch
    };

    window.electronAPI.openResults(data);
}
//bulk insert button calls event to open a dialoge box to select the csv and sends the path to backend for insertion.
async function BulkInsert(){
    const msg = await window.electronAPI.bulkInsert(selectedTable);
    alert(msg.message);
}

//sends a simple comp column search query to backend
async function SendSearch(){
    let data = {}
    const input = document.getElementById("search-input");
    searchValToSend = input.value
    data = {
        table: utils.selectedTable,
        compColumn: utils.selectedColumn,
        searchVal: searchValToSend,
    };

    isSearch = true;
    sResults = await window.electronAPI.sendSearch(data);
    
}

//start and close llm button functions
function StartLLM(){
    window.electronAPI.startLLM();
}

function CloseLLM(){
    window.electronAPI.closeLLM();
}

//Opens the prompt window 
function OpenPromptWindow(){

    data = {
        tablesOverview: totalData.tablesOverview,
        tableSchema: totalData.tableSchema,
        results: sResults
    }

    window.electronAPI.openPromptWindow(data)
}

function resetSearch(){
    isSearch = false
}