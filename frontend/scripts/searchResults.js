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

function setButtonEvents(){
    const sampleBtn = document.getElementById("cs");
    sampleBtn.onclick = () => SendSamples();
}

//display search results function adds the click events to select rows
//KNOWN BUG--Leaving a results page via pagination and coming back needs to highlight sampled rows again.
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

//builds the pagination buttons
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

//
//decreases page displayed
function reduceCurrentPage(){
    if (currentPage <= 1){
        return
    }
    else{
        currentPage -= 1;
        DisplaySearchResults();
    }
}

//increases page displayed
function increaseCurrentPage(){
    if(currentPage >= totalPages){
        return
    }
    else{
        currentPage += 1;
        DisplaySearchResults();
    }
}

//Handles selection of data for sampling adding to and removing from sample data to send.
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

//sends samples to prompt gen page needs to be reworked to allow functionality with mainPage.js.
function SendSamples(){
    window.electronAPI.submitSamples(sampleData);
    window.close();
}

//highlight row functions
//Needs to be rewritten into a utility script that can be shared with other files.

function highlightRow(row) {
    row.style.backgroundColor = "lightskyblue";
}

function unselect(row) {
    const index = [...row.parentElement.children].indexOf(row);
    row.style.backgroundColor = index % 2 === 1 ? "lightgrey" : "";
}
