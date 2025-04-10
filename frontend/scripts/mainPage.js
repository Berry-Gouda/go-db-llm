let selectedTable = ''
let selectedColumn = ''
let totalData
let isSearch = false
let sResults = null

document.addEventListener("DOMContentLoaded", async() => {
    try{
        const data = await window.electronAPI.loadMain();
        const parsedData = typeof data === "string" ? JSON.parse(data) : data;
        totalData = parsedData;
    }
    catch{
        console.error("error getting db data");
    }
    UpdatePageData(totalData);
    SetButtonListeners();
    console.log(totalData);
})

function UpdatePageData(data){
    UpdateHeader(data.dbName)
    UpdateTablesOverview(data.tablesOverview)
}

function UpdateHeader(dbName){
    console.log(dbName)
    const header = document.getElementById("db-name");
    header.innerHTML = dbName;
}

function UpdateTablesOverview(tAndC){
    const tOTable = document.querySelector('#tables-overview tbody');
    
    Object.entries(tAndC).forEach(([key, value]) => {
        const newRow = document.createElement('tr');
        const tableCell = document.createElement('td');
        tableCell.textContent = String(key);
        const countCell = document.createElement('td');
        countCell.textContent = String(value);

        newRow.appendChild(tableCell);
        newRow.appendChild(countCell);

        newRow.addEventListener("click", function(){
            
            oldSelected = document.getElementById("t-selected")
            if (oldSelected){
                oldSelected.id = "";
                unselect(oldSelected, selectedTable)
            }

            if(oldSelected === newRow){
                ClearSelectedTableSchema()
                updateSelectedTable('')
                console.log(selectedTable)
                return
            }

            newRow.id = "t-selected";
            updateSelectedTable(newRow.firstElementChild.innerHTML)
            highlightRow(newRow)
            ClearSelectedTableSchema()
            DisplaySelectedSchema(selectedTable)
            console.log(selectedTable)
        });

        tOTable.appendChild(newRow);
        
    });
}

function unselect(tr){
    let allRows = Array.from(tr.parentElement.children);
    let index = allRows.indexOf(tr); 
    tr.style.backgroundColor = index % 2 === 1 ? "lightgrey" : "";

}

function updateSelectedColumn(cName){
    selectedColumn = cName
}

function updateSelectedTable(tName){
    selectedTable = tName
    selectedColumn = ''
}

function highlightRow(tr){
    if(tr.style.backgroundColor == "lightskyblue"){
        unselect(tr)
        return
    }
    tr.style.backgroundColor = "lightskyblue"
}

function DisplaySelectedSchema(table){
    tBody = document.querySelector('#table-schema tbody');
    heading = document.querySelector('#selected-t-overview h3');
    heading.innerHTML = table + ' Schema';
    
    Object.entries(totalData.tableSchema[table]).forEach(val => {
        const newRow = document.createElement('tr');
        cNameCell = document.createElement('td');
        dTypeCell = document.createElement('td');
        kTypeCell = document.createElement('td');
        nullCell = document.createElement('td');
        defaultValCell = document.createElement('td');            
        cNameCell.textContent = String(val[1]['ColName']);
        dTypeCell.textContent = String(val[1]['DType']);
        kTypeCell.textContent = String(val[1]['KeyType']);
        nullCell.textContent = String(val[1]['IsNull']);
        defaultValCell.textContent = String(val[1]['ColDefault']);

        newRow.appendChild(cNameCell);
        newRow.appendChild(dTypeCell);
        newRow.appendChild(kTypeCell);
        newRow.appendChild(nullCell);
        newRow.appendChild(defaultValCell);

        newRow.addEventListener("click", function(){
            oldSelected = document.getElementById("c-selected");
            if (oldSelected){
                oldSelected.id = "";
                unselect(oldSelected, selectedColumn);
            }

            if(oldSelected === newRow){
                updateSelectedColumn('')
                console.log(selectedColumn)
                return
            }

            newRow.id = "c-selected";
            updateSelectedColumn(newRow.firstElementChild.innerHTML);
            highlightRow(newRow);
        })

        tBody.appendChild(newRow);
    });
    console.log(totalData.top20[table])
}

function ClearSelectedTableSchema(){
    tBody = document.querySelector('#table-schema tbody');
    heading = document.querySelector('#selected-t-overview h3');
    heading.innerHTML = 'Select Table For Info';
    tBody.replaceChildren();
}

function ClearSearchResults(){
    console.log("clearSearch")
    const tH3 = document.querySelector("#search-results h3");
    const thead = document.querySelector("#search-table thead");
    const tbody = document.querySelector("#search-table tbody");
    console.log(tbody)
    tH3.textContent = "Select table or Search for results";
    thead.replaceChildren();
    tbody.replaceChildren();
}

function SetButtonListeners(){
    const t20 = document.getElementById("t20");
    const bi = document.getElementById("bi");
    const sLLM = document.getElementById("sLLM");
    const cLLM = document.getElementById("cLLM");
    const opg = document.getElementById("opg");
    const search = document.getElementById("search");

    t20.addEventListener("click", ShowResults);
    bi.addEventListener("click", BulkInsert);
    sLLM.addEventListener("click", StartLLM);
    cLLM.addEventListener("click", CloseLLM);
    opg.addEventListener("click", OpenPromptWindow);
    search.addEventListener("click", SendSearch);
}

function ShowResults(){
    window.electronAPI.openResults(sResults ?   data = {results: sResults.results.results, 
                                                        schema: totalData.tableSchema[selectedTable], 
                                                        isSearch: isSearch} : 
                                                data = {results: totalData.top20[selectedTable],
                                                        schema: totalData.tableSchema[selectedTable], 
                                                        isSearch: isSearch})
}

async function BulkInsert(){
    const msg = await window.electronAPI.bulkInsert(selectedTable);
    alert(msg.message);
}

async function SendSearch(){
    const input = document.getElementById("search-input");
    searchValToSend = input.value
    const data = {
        table: selectedTable,
        compColumn: selectedColumn,
        searchVal: searchValToSend,
    };

    isSearch = true;
    sResults = await window.electronAPI.sendSearch(data);

    console.log(sResults.results)
    
}

function StartLLM(){
    window.electronAPI.startLLM();
}

function CloseLLM(){
    window.electronAPI.closeLLM();
}

function OpenPromptWindow(){

}