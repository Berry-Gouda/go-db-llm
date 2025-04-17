let compColumn = ''
let currentPage = 1;
const resultsPerPage = 20;
let searchResults = [];
let columnNames = [];
let totalPages = -1;
let rowCount;
let tData;

let sampleData = []


window.electronAPI.onResultsData((data) => {
    tData = data
    totalPages = Math.ceil(tData.results.length/resultsPerPage)

    setButtonEvents();
    DisplaySearchResults();

});

function DisplaySearchResults(){
    const tH3 = document.querySelector("#search-results h3");
    const thead = document.querySelector("#search-table thead");
    const tbody = document.querySelector("#search-table tbody");

    tH3.innerHTML = ""
    thead.innerHTML = ""
    tbody.innerHTML = ""

    const columns = tData.schema

    tH3.textContent = tData.isSearch ? "Search Results" : "Top 20 Rows";

    columns.forEach((col) => {
        
        const headerCell = document.createElement('th');
        headerCell.textContent = col;
        thead.appendChild(headerCell);
    });

    const start = (currentPage - 1) * resultsPerPage;
    const paginatedResults = tData.results.slice(start, start + resultsPerPage);

    paginatedResults.forEach(row => {
        const tr = document.createElement('tr');

        const rowData = []

        columns.forEach(col => {
            const td = document.createElement('td');
            td.textContent = row[col] ?? "";
            tr.appendChild(td);
            rowData.push(row[col] ?? "");
        });

        tr.onclick = () => rowClick(tr, rowData)

        tbody.appendChild(tr);
    });

    renderPagination()
}

function renderPagination(){
    const paginationContainer = document.getElementById("pagination");
    paginationContainer.innerHTML = "";

    
    if (totalPages > 1){
        if (currentPage > 1){
            const button = document.createElement("button");
            button.textContent = "<-";
            button.onclick = reduceCurrentPage;
            paginationContainer.appendChild(button);
        }
        let counter = 0
        while(counter + currentPage <= totalPages && counter <= 2){
            let textCont = counter + currentPage
            const button = document.createElement("button");
            button.textContent = textCont;
            button.onclick = () => {
                currentPage = textCont;
                DisplaySearchResults();
            }
            if(textCont === currentPage){
                button.style.fontWeight = "bold";
            }
            paginationContainer.appendChild(button);
            counter += 1
        }
        if (counter < totalPages){
            const button = document.createElement("button");
            button.textContent = "->";
            button.onclick = increaseCurrentPage;
            paginationContainer.appendChild(button)
        }
    }
}

function reduceCurrentPage(){
    if (currentPage <= 1){
        return
    }
    else{
        currentPage -= 1;
        DisplaySearchResults();
    }
}

function increaseCurrentPage(){
    if(currentPage >= totalPages){
        return
    }
    else{
        currentPage += 1;
        DisplaySearchResults();
    }
}

function rowClick(tr, data){
    if (tr.className == "selected"){
        tr.removeAttribute("class");
        unselect(tr);
        removeFromSample(data);
    }else{
        tr.className = "selected"
        addToSample(data);
        highlightRow(tr)
    }
}

function addToSample(data){
    sampleData.push(data)
}

function removeFromSample(data){
    const index = sampleData.indexOf(data)
    if (index !== -1){
        sampleData.splice(index, 1);
    }
}

function highlightRow(row) {
    row.style.backgroundColor = "lightskyblue";
}

function unselect(row) {
    const index = [...row.parentElement.children].indexOf(row);
    row.style.backgroundColor = index % 2 === 1 ? "lightgrey" : "";
}

function setButtonEvents(){
    const sampleBtn = document.getElementById("cs");
    sampleBtn.onclick = () => SendSamples();
}

function SendSamples(){
    console.log(sampleData);
    window.electronAPI.submitSamples(sampleData);
    window.close();
}