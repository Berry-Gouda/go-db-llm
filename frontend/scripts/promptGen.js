
//selected table variables, arrays containing page data, and page element refrences
let selectedTable = '', selectedColumn = '', selectedJoin = '', fromTable = '', selectedSample = '';
let columnsInOrder = [], displayColumnsInOrder = [], joinDataList = [], tablesNeedingJoins = [];
let tData, opBtnDiv, submitDiv, subBtn, input, feedback;

//data for query and prompt
let where = new Map([["column", ""],["opperator", ""],["where", ""]])
let builtQuery
let instruction = ''
let sampleData = []
let exampleIO = []


//event for page start up sets page element refrences and calls setup button events
document.addEventListener("DOMContentLoaded", () => {
    opBtnDiv = document.getElementById("hidden-btns");
    submitDiv = document.getElementById("submit-div");
    subBtn = document.getElementById("sub-btn")
    input = document.getElementById("input-field");
    feedback = document.getElementById("feedback")
    setupButtonEvents();
});

//event to populate the starting page data when recieved.
window.electronAPI.onPromptData((data) => {
    tData = data;
    UpdateTablesOverview(data.tablesOverview);
});

//event to parse and the data from creating the db query opens the results window via api openResults.
window.electronAPI.onQueryData((data) => {
    
    builtQuery = data
    sd = {
        results: builtQuery.results,
        schema: columnsInOrder,
        isSearch: true,
    }
    window.electronAPI.openResults(sd)
    highlightRow(document.getElementById("qb-check"));
})

//event to parse the samples recieved from the results page.
window.electronAPI.onRecieveSamples((data) => {
    data.forEach((val) => {
        sampleData.push(val)
    })
    updateSampleDataTable(sampleData)
    if (data.length > 0){
        highlightRow(document.getElementById("ei-check"));
    }
})

//Sets up all button events.
function setupButtonEvents() {
    document.getElementById("sc").onclick = AddColumn;
    document.getElementById("cd").onclick = ClearPromptData;
    document.getElementById("ij").onclick = () => createJoin("inner");
    document.getElementById("lj").onclick = () => createJoin("left");
    document.getElementById("rj").onclick = () => createJoin("right");
    document.getElementById("w").onclick = SetWhere;
    document.getElementById("sds").onclick = SampleData;
    document.getElementById("fso").onclick = FormatSampleOutput;
    document.getElementById("ei").onclick = EnterInstructionPrompt;
    document.getElementById("sfd").onclick = SendFullData;
}

//adds a column to your query build. the name displayed is shortened compare to what is used in the backend.
function AddColumn() {
    if (!selectedTable || !selectedColumn) return alert("Must select a table and column");

    if (!fromTable) fromTable = selectedTable;
    AddTableToNeedJoin();

    const fullCol = CreateTableColumnName(selectedTable, selectedColumn)
    columnsInOrder.push(fullCol);

    const displayCol = selectedTable.split('_').map(v => v[0]).join('') + '.' + selectedColumn;
    displayColumnsInOrder.push(displayCol);

    updateQueryCols();
    updateJoinNeeds();
}

//adds table to joins need when more than one table is selected
function AddTableToNeedJoin() {
    if (selectedTable !== fromTable && !joinDataList.some(m => m.get("table") === selectedTable)) {
        tablesNeedingJoins.push(selectedTable);
    }
}

//displays the buttons and starts the process for making a join.
function createJoin(type) {
    if (!selectedJoin) return alert("Must select Table to join");

    clearSelection();
    resetSchemaDisplay();
    DisplaySelectedSchema(fromTable);

    const joinMap = createJoinMap(type);
    joinDataList.push(joinMap);

    opBtnDiv.style.display = 'flex';
    document.querySelectorAll(".comp-btn").forEach(btn => {
        btn.onclick = () => {
            const op = btn.getAttribute("data-op");
            CompButtonClick(joinMap, op);
        };
    });
    
}

//creates the data structure of needed join based on selected table and row
function createJoinMap(type) {
    return new Map([
        ["join", type],
        ["fTable", fromTable],
        ["joinedTable", selectedJoin]
    ]);
}

//comp button data pass
function CompButtonClick(joinMap, op) {
    joinMap.set("operator", op);
    joinMap.set("fCol", selectedColumn);
    opBtnDiv.style.display = 'none';
    submitDiv.style.display = 'flex'
    clearSelection();
    resetSchemaDisplay();

    op !== '=' ? JoinCompValue(joinMap) : JoinCompColumn(joinMap);
}

//handles the join based on comparison button
function JoinCompColumn(joinMap) {
    DisplaySelectedSchema(selectedJoin);
    subBtn.style.display = 'block'
    subBtn.textContent = "Complete Join"
    subBtn.onclick = () => {
        joinMap.set("compVal", selectedJoin+"."+selectedColumn);
        submitDiv.style.display = 'none';
        resetSchemaDisplay();
        RemoveTableFromJoinNeeds(selectedJoin);
        updateJoinNeeds();

    };
}

//resets the input feild and shows the submit button to finalize the join clause
function JoinCompValue(joinMap) {
    resetSchemaDisplay();
    input.placeholder = "Enter Comparison Value";
    subBtn.style.display = 'block'
    subBtn.textContent = "Complete Join"
    subBtn.onclick = () => {
        joinMap.set("compVal", input.value);
        submitDiv.style.display = 'none';
        input.value = '';
        RemoveTableFromJoinNeeds(selectedJoin);
        updateJoinNeeds();
        input.placeholder = "";

    };
}

//removes table from list of tables that need a join
function RemoveTableFromJoinNeeds(table) {
    const idx = tablesNeedingJoins.indexOf(table);
    if (idx !== -1) tablesNeedingJoins.splice(idx, 1);
}

//where comparison functions 
function SetWhere(){
    if(selectedColumn == '' || selectedTable == ''){
        alert("Must select Column and Table ");
        return;
    }

    fullName = CreateTableColumnName(selectedTable, selectedColumn)

    opBtnDiv.style.display = 'flex';

    document.querySelectorAll(".comp-btn").forEach(btn => {
        btn.onclick = () => {
            const op = btn.getAttribute("data-op");
            WhereCompButtonClick(op, fullName);
        };
    });

}

function WhereCompButtonClick(op, fullName){
    where.set("opperator", op);
    opBtnDiv.style.display = 'none';
    submitDiv.style.display = 'flex';
    subBtn.textContent = "Submit Where Comparison";
    input.placeholder = "Enter Where Comparison";
    subBtn.onclick = () => {
        where.set("where", input.value);

        where.set("column", fullName)
        submitDiv.style.display = 'none';
        input.value = '';
        input.placeholder = "";

    };
}

//sends the data to the back end where it will build query and reply 
//with results opening the results page to allow sampleing of data
//starts by checking if a query has already been built to save server cycles
function SampleData()
{
    if (!(builtQuery && Object.keys(builtQuery).length)){
        const data = CreateQueryJSON();
        window.electronAPI.generateQuery(data);
    }else{
        sd = {
            results: builtQuery.results,
            schema: columnsInOrder,
            isSearch: true,
        }
        window.electronAPI.openResults(sd)
    }
}

//Button to allow sample data to be explained how to clean.
function FormatSampleOutput(){

    const rowSample = document.getElementById("s-selected");
    const inputExample = rowSample.firstChild.textContent;
    feedback.innerHTML=inputExample;
    submitDiv.style.display = 'flex'
    subBtn.textContent = 'Submit Output Expectation'
    input.placeholder = "Enter Expected Output"
    subBtn.onclick = () => {
        output = input.value
        tempIO = [];
        tempIO.push(inputExample);
        tempIO.push(output);
        input.placeholder = '';
        input.value = "";
        feedback.textContent = '';
        updateSelectedSample('');
        exampleIO.push(tempIO)
        submitDiv.style.display = 'none'
        if( exampleIO.length == sampleData.length){
            inputs = []
            outputs = []
            exampleIO.forEach(([input, output])=>{
                inputs.push(input)
                outputs.push(output)
            })
            highlightRow(document.getElementById("eo-check"));
            updateSampleDataTable(inputs)
            updateResultExpectedTable(outputs)
        }
    }
}

//the natural language instruction you would like to send to the llm
function EnterInstructionPrompt(){
    submitDiv.style.display = 'flex'
    subBtn.textContent = 'Submit Instruction';
    input.placeholder = "Enter Instruction";
    subBtn.onclick = () => {
        instruction = input.value
        input.value = '';
        input.placeholder = '';
        if(instruction.length > 0){
            highlightRow(document.getElementById("i-check"))
        }
        submitDiv.style.display = 'none';
    }
}

//appends the column name to table name with . 
function CreateTableColumnName(table, column){
    return `${table}.${column}`;
}

//Creates the JSON to send to the back end containing the data to build db query
function CreateQueryJSON() {

    // Convert where (Map) → plain object
    const whereObject = Object.fromEntries(where);

    // Convert joinDataList Array(Map) 
    const joinData = joinDataList.map(entry =>
        entry instanceof Map ? Object.fromEntries(entry) : entry
    );

    const data = {
        columnsInOrder: columnsInOrder,
        joinData: joinData,
        where: whereObject,
    };

    return data;
}

//Sends all data for the Prompt to the backend
function SendFullData(){

    let queryToSend = '';
    let results = [];

    if ((builtQuery && Object.keys(builtQuery).length)){
        queryToSend = builtQuery.query
        results = builtQuery.results
    }
    FullData = {
        query: queryToSend,
        columns: columnsInOrder,
        rawData: results,
        instruct: instruction,
        example: exampleIO,
    }

    

    window.electronAPI.sendFullPrompt(FullData)

}

//Clears all stored Prompt data and resets all page state....needs revision
function ClearPromptData() {
    fromTable = '';
    columnsInOrder = [];
    displayColumnsInOrder = [];
    updateQueryCols();
    query = ''
    instruction = ''
    sampleData = []
    exampleIO = []
    columnsInOrder = []
    dispplayColumnsInOrder = []
    joinDataList = []
    tablesNeedingJoins = []
    updateSampleDataTable(sampleData)
    updateResultExpectedTable(sampleData)
    ClearSelectedTableSchema();
    updateJoinNeeds();
    unselect(document.getElementById("qb-check"))
    unselect(document.getElementById("ei-check"))
    unselect(document.getElementById("eo-check"))
    unselect(document.getElementById("i-check"))
}

function clearSelection() {
    document.querySelectorAll("#t-selected, #c-selected", "#join-selected").forEach(el => {
        unselect(el);
        el.removeAttribute("id");
    });


}

function resetSchemaDisplay() {
    updateSelectedColumn('');
    updateSelectedTable('');
    ClearSelectedTableSchema();
}

//
//dynamic table generation updates including row highlights
//also contains utility functions to manipulate states.
//
//needs to be rewritten into a utility script that can be shared with the mainpage.js script.

function updateSampleDataTable(data){
    const sampleTable = document.querySelector("#samples tbody");
    sampleTable.innerHTML = '';
    data.forEach(val => {
        const newRow = document.createElement("tr");
        newRow.innerHTML = `<td>${val}</td>`;
        setRowClickHighlight(newRow, "s-selected", updateSelectedSample)
        sampleTable.appendChild(newRow);
    })
}

function updateResultExpectedTable(data){
    const resultsTable = document.getElementById("result-exp")
    resultsTable.innerHTML = '';
    data.forEach(val => {
        const newRow = document.createElement("tr");
        newRow.innerHTML = `<td>${val}</td>`;
        resultsTable.appendChild(newRow)
    })
}

function updateJoinNeeds() {
    const tBody = document.querySelector('#join-req-table tbody');
    tBody.innerHTML = '';
    tablesNeedingJoins.forEach(table => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${table}</td>`;
        setRowClickHighlight(row, "join-selected", updateSelectedJoin);
        tBody.appendChild(row);
    });
}

function updateQueryCols() {
    const tBody = document.querySelector('#query-data-table tbody');
    tBody.innerHTML = '';
    displayColumnsInOrder.forEach(col => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${col}</td>`;
        tBody.appendChild(row);
    });
}

function UpdateTablesOverview(tAndC) {
    const tbody = document.querySelector('#tables-overview tbody');
    tbody.innerHTML = '';
    Object.entries(tAndC).forEach(([key, value]) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${key}</td><td>${value}</td>`;
        setRowClickHighlight(row, "t-selected", updateSelectedTable);
        row.addEventListener("click", () => {
            ClearSelectedTableSchema();
            DisplaySelectedSchema(selectedTable);
        });
        tbody.appendChild(row);
    });
}

function DisplaySelectedSchema(table) {
    const tBody = document.querySelector('#table-schema tbody');
    const heading = document.querySelector('#selected-t-overview h3');
    heading.textContent = `${table} Schema`;
    tBody.innerHTML = '';

    Object.values(tData.tableSchema[table]).forEach(col => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${col.ColName}</td>
            <td>${col.DType}</td>
            <td>${col.KeyType}</td>
            <td>${col.IsNull}</td>
            <td>${col.ColDefault}</td>
        `;
        setRowClickHighlight(row, "c-selected", updateSelectedColumn);
        tBody.appendChild(row);
    });
}

function ClearSelectedTableSchema() {
    document.querySelector('#selected-t-overview h3').textContent = 'Select Table For Info';
    document.querySelector('#table-schema tbody').innerHTML = '';
}

//utility function to set the correct select function to call for any selectable row.
function setRowClickHighlight(row, idName, updater) {
    row.addEventListener("click", () => {
        const oldSelected = document.getElementById(idName);
        if (oldSelected) {
            oldSelected.removeAttribute("id");
            unselect(oldSelected);
        }

        if (oldSelected === row) {
            updater('');
            return;
        }
        row.id = idName;
        updater(row.firstElementChild.textContent);
        highlightRow(row);
    });
}

function updateSelectedColumn(cName) { selectedColumn = cName; }
function updateSelectedTable(tName) { selectedTable = tName; selectedColumn = ''; }
function updateSelectedJoin(jName) { selectedJoin = jName; }
function updateSelectedSample(sName) {selectedSample = sName;}

function highlightRow(row) {
    row.style.backgroundColor = "lightskyblue";
}

//reverts a row back to its original background based on position in the table
function unselect(row) {
    const index = [...row.parentElement.children].indexOf(row);
    row.style.backgroundColor = index % 2 === 1 ? "lightgrey" : "";
}