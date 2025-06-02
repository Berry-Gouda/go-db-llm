export let selectedTable = '', selectedColumn = '', selectedJoin = '', fromTable = '', selectedSample = '';
export let columnsInOrder = [], displayColumnsInOrder = [], joinDataList = [], tablesNeedingJoins = [];
export let tData = {}

export function resetSchemaDisplay() {
    updateSelectedColumn('');
    updateSelectedTable('');
    ClearSelectedTableSchema();
}

//
//dynamic table generation updates including row highlights
//also contains utility functions to manipulate states.
//
//needs to be rewritten into a utility script that can be shared with the mainpage.js script.

export function updateSampleDataTable(data){
    const sampleTable = document.querySelector("#samples tbody");
    sampleTable.innerHTML = '';
    data.forEach(val => {
        const newRow = document.createElement("tr");
        newRow.innerHTML = `<td>${val}</td>`;
        setRowClickHighlight(newRow, "s-selected", updateSelectedSample)
        sampleTable.appendChild(newRow);
    })
}

export function updateResultExpectedTable(data){
    const resultsTable = document.getElementById("result-exp")
    resultsTable.innerHTML = '';
    data.forEach(val => {
        const newRow = document.createElement("tr");
        newRow.innerHTML = `<td>${val}</td>`;
        resultsTable.appendChild(newRow)
    })
}

export function updateJoinNeeds() {
    const tBody = document.querySelector('#join-req-table tbody');
    tBody.innerHTML = '';
    tablesNeedingJoins.forEach(table => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${table}</td>`;
        setRowClickHighlight(row, "join-selected", updateSelectedJoin);
        tBody.appendChild(row);
    });
}

export function updateQueryCols() {
    const tBody = document.querySelector('#query-data-table tbody');
    tBody.innerHTML = '';
    displayColumnsInOrder.forEach(col => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${col}</td>`;
        tBody.appendChild(row);
    });
}

export function UpdateTablesOverview(tAndC) {
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

export function DisplaySelectedSchema(table) {
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

export function ClearSelectedTableSchema() {
    document.querySelector('#selected-t-overview h3').textContent = 'Select Table For Info';
    document.querySelector('#table-schema tbody').innerHTML = '';
}

//utility function to set the correct select function to call for any selectable row.
export function setRowClickHighlight(row, idName, updater) {
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

export function updateSelectedColumn(cName) { selectedColumn = cName; }
export function updateSelectedTable(tName) { selectedTable = tName; selectedColumn = ''; }
export function updateSelectedJoin(jName) { selectedJoin = jName; }
export function updateSelectedSample(sName) {selectedSample = sName;}

export function highlightRow(row) {
    row.style.backgroundColor = "lightskyblue";
}

//reverts a row back to its original background based on position in the table
export function unselect(row) {
    const index = [...row.parentElement.children].indexOf(row);
    row.style.backgroundColor = index % 2 === 1 ? "lightgrey" : "";
}

//clears search results
export function ClearSearchResults(){
    console.log("clearSearch")
    const tH3 = document.querySelector("#search-results h3");
    const thead = document.querySelector("#search-table thead");
    const tbody = document.querySelector("#search-table tbody");
    console.log(tbody)
    tH3.textContent = "Select table or Search for results";
    thead.replaceChildren();
    tbody.replaceChildren();
}

export function setTData(data){
    tData = data
}

export function areMapsEqual(map1, map2){
    const keys1 = Object.keys(map1);
    const keys2 = Object.keys(map2);

    if (keys1.length !== keys2.length) return false;

    for (let key of keys1) {
        if (map1[key] !== map2[key]) {
            return false;
        }
    }

    return true;
}