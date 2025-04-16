let selectedTable = '', selectedColumn = '', selectedJoin = '', fromTable = '';
let columnsInOrder = [], displayColumnsInOrder = [], joinDataList = [], tablesNeedingJoins = [];
let tData, opBtnDiv, submitDiv, subBtn, input;

let where = new Map([["column", ""],["opperator", ""],["where", ""]])

document.addEventListener("DOMContentLoaded", () => {
    opBtnDiv = document.getElementById("hidden-btns");
    submitDiv = document.getElementById("submit-div");
    subBtn = document.getElementById("sub-btn")
    input = document.getElementById("input-field");
    setupButtonEvents();
});

window.electronAPI.onPromptData((data) => {
    tData = data;
    UpdateTablesOverview(data.tablesOverview);
});

// Utility Functions
function clearSelection() {
    document.querySelectorAll("#t-selected, #c-selected").forEach(el => {
        unselect(el);
        el.removeAttribute("id");
    });
}

function resetSchemaDisplay() {
    updateSelectedColumn('');
    updateSelectedTable('');
    ClearSelectedTableSchema();
}

function createJoinMap(type) {
    return new Map([
        ["join", type],
        ["fTable", fromTable],
        ["joinedTable", selectedJoin]
    ]);
}

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

// Main Functions
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

function updateQueryCols() {
    const tBody = document.querySelector('#query-data-table tbody');
    tBody.innerHTML = '';
    displayColumnsInOrder.forEach(col => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${col}</td>`;
        tBody.appendChild(row);
    });
}

function ClearPromptData() {
    fromTable = '';
    columnsInOrder = [];
    displayColumnsInOrder = [];
    updateQueryCols();
}

function AddTableToNeedJoin() {
    if (selectedTable !== fromTable && !joinDataList.some(m => m.get("table") === selectedTable)) {
        tablesNeedingJoins.push(selectedTable);
    }
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

function CompButtonClick(joinMap, op) {
    joinMap.set("operator", op);
    joinMap.set("fCol", selectedColumn);
    opBtnDiv.style.display = 'none';
    submitDiv.style.display = 'flex'
    clearSelection();
    resetSchemaDisplay();

    op !== '=' ? JoinCompValue(joinMap) : JoinCompColumn(joinMap);
}

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
        console.log(joinDataList)
    };
}

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
        console.log(joinDataList)
    };
}

function RemoveTableFromJoinNeeds(table) {
    const idx = tablesNeedingJoins.indexOf(table);
    if (idx !== -1) tablesNeedingJoins.splice(idx, 1);
}

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
    console.log("This is the JoinDataBefore", joinDataList);
    subBtn.onclick = () => {
        where.set("where", input.value);
        console.log(input.value)
        where.set("column", fullName)
        submitDiv.style.display = 'none';
        input.value = '';
        input.placeholder = "";
        console.log("This is the JoinDataAfter", joinDataList);
    };
}

function SampleData()
{
    const data = CreateQueryJSON();

    window.electronAPI.generateQuery(data);
}

function setupButtonEvents() {
    document.getElementById("sc").onclick = AddColumn;
    document.getElementById("cd").onclick = ClearPromptData;
    document.getElementById("ij").onclick = () => createJoin("inner");
    document.getElementById("lj").onclick = () => createJoin("left");
    document.getElementById("rj").onclick = () => createJoin("right");
    document.getElementById("w").onclick = SetWhere;
    document.getElementById("sds").onclick = SampleData;
}

function updateSelectedColumn(cName) { selectedColumn = cName; }
function updateSelectedTable(tName) { selectedTable = tName; selectedColumn = ''; }
function updateSelectedJoin(jName) { selectedJoin = jName; }

function highlightRow(row) {
    row.style.backgroundColor = "lightskyblue";
}

function unselect(row) {
    const index = [...row.parentElement.children].indexOf(row);
    row.style.backgroundColor = index % 2 === 1 ? "lightgrey" : "";
}

function CreateTableColumnName(table, column){
    return `${table}.${column}`;
}

function CreateQueryJSON(){

    console.log(columnsInOrder)
    console.log(joinDataList)
    console.log(where)

    const data = {
        "columnsInOrder": columnsInOrder,
        "joinData": joinDataList,
        "where": where,
    }

    console.log(data);

    return data;
}

function CreateQueryJSON() {
    console.log(columnsInOrder);
    console.log(joinDataList);
    console.log(where);

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

    console.log(data);
    return data;
}