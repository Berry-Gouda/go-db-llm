let selectedTable = ''
let selectedColumn = ''
let selectedJoin = ''
let tData

let fromTable = ''

let columnsInOrder = []
let displayColumnsInOrder = []
let joinDataList = []

let tablesNeedingJoins = []


document.addEventListener("DOMContentLoaded", () =>{
    buttonEvents();
})

window.electronAPI.onPromptData((data) => {
    tData = data
    UpdatePageData(tData)
})

function UpdatePageData(data){
    console.log(data.tablesOverview)
    UpdateTablesOverview(data.tablesOverview)
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

function updateSelectedJoin(jName){
    selectedJoin = jName

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
    
    Object.entries(tData.tableSchema[table]).forEach(val => {
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
            console.log(selectedColumn)
        })

        tBody.appendChild(newRow);
    });
}

function ClearSelectedTableSchema(){
    tBody = document.querySelector('#table-schema tbody');
    heading = document.querySelector('#selected-t-overview h3');
    heading.innerHTML = 'Select Table For Info';
    tBody.replaceChildren();
}

function buttonEvents(){
    const sc = document.getElementById("sc");
    const cd = document.getElementById("cd");
    const ij = document.getElementById("ij");
    const lj = document.getElementById("lj");
    const rj = document.getElementById("rj");

    sc.addEventListener("click", AddColumn);
    cd.addEventListener("click", ClearPromptData);
    ij.addEventListener("click", CreateInnerJoin);
    lj.addEventListener("click", CreateLeftJoin);
    rj.addEventListener("click", CreateRightJoin);
}

function AddColumn(){
    if(selectedColumn == '' || selectedTable == ''){
        alert("Must select a table and column")
        return
    }

    if(fromTable == ''){
        fromTable = selectedTable
    }

    AddTableToNeedJoin()

    col = selectedTable + '.' + selectedColumn
    columnsInOrder.push(col)

    let abr = '';
    if (typeof selectedTable === 'string') {
        selectedTable.split('_').forEach(val => {
            if (val.length > 0) abr += val[0];
        });
    }

    disCol = abr + '.' + selectedColumn
    displayColumnsInOrder.push(disCol)

    updateQueryCols()
    updateJoinNeeds()
}

function updateQueryCols(){
    tBody = document.querySelector('#query-data-table tbody');
    tBody.innerHTML = ''

    displayColumnsInOrder.forEach(val => {
        const newRow = document.createElement('tr');
        cNameCell = document.createElement('td');
        cNameCell.textContent = val
        newRow.appendChild(cNameCell)
        console.log(newRow)
        tBody.appendChild(newRow)
    })

}

function ClearPromptData(){
    fromTable = ''
    displayColumnsInOrder = []
    columnsInOrder = []
    updateQueryCols()
}

function AddTableToNeedJoin(){
    if(selectedTable != fromTable){
        for(const m of joinDataList){
            if(m.has("table") && m.get("table") === selectedTable)
                return
        }
        tablesNeedingJoins.push(selectedTable)
    }
}

function updateJoinNeeds(){
    tBody = document.querySelector('#join-req-table tbody');
    tBody.innerHTML = ''

    tablesNeedingJoins.forEach(val => {
        const newRow = document.createElement('tr');
        tNameCell = document.createElement('td');
        tNameCell.textContent = val;
        newRow.appendChild(tNameCell)

        newRow.addEventListener("click", function(){
            oldSelected = document.getElementById("join-selected");
            if(oldSelected){
                oldSelected.id="";
                unselect(oldSelected, selectedJoin)
            }

            if(oldSelected === newRow){
                updateSelectedJoin('')
                return
            }

            newRow.id = "join-selected";
            highlightRow(newRow)
        })

        tBody.appendChild(newRow)
    })
}

function CreateInnerJoin(){
    if(selectedJoin == ''){
        alert("Must select Table to join")
    }

    tSelected = document.getElementById("t-selected")
    cSelected = document.getElementById("c-selected")

    unselect(tSelected)
    unselect(cSelected)

    updateSelectedColumn('')
    updateSelectedTable('')

    ClearSelectedTableSchema();
    selectedTable = fromTable;
    DisplaySelectedSchema(fromTable)
    
    joinMap = new Map()
    joinMap.set("join", "inner")

    


}

function CreateLeftJoin(){
    if(selectedJoin == ''){
        alert("Must select Table to join")
    }

    tSelected = document.getElementById("t-selected")
    cSelected = document.getElementById("c-selected")

    unselect(tSelected)
    unselect(cSelected)

    updateSelectedColumn('')
    updateSelectedTable('')

    ClearSelectedTableSchema();
    DisplaySelectedSchema(fromTable)


    joinMap = new Map()
    joinMap.set("join", "right")

}

function CreateRightJoin(){
    if(selectedJoin == ''){
        alert("Must select Table to join")
    }

    tSelected = document.getElementById("t-selected")
    cSelected = document.getElementById("c-selected")

    unselect(tSelected)
    unselect(cSelected)

    updateSelectedColumn('')
    updateSelectedTable('')

    ClearSelectedTableSchema();
    DisplaySelectedSchema(fromTable)

    joinMap = new Map()
    joinMap.set("join", "left")

}