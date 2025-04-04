let compColumn = ''
let currentPage = 1;
const resultsPerPage = 20;
let searchResults = [];
let columnNames = [];
let totalPages = -1;
let rowCount;
let tData


window.electronAPI.onResultsData((data) => {
    console.log("Recieved data:", data)
    tData = data
    totalPages = Math.ceil(tData.results.length/resultsPerPage)

    DisplaySearchResults()
});

function DisplaySearchResults(){
    console.log("DisplaySearch")
    const tH3 = document.querySelector("#search-results h3");
    const thead = document.querySelector("#search-table thead");
    const tbody = document.querySelector("#search-table tbody");
    const columns = []

    tH3.textContent = tData.isSearch ? "Search Results" : "Top 20 Rows";

    Object.entries(tData.schema).forEach(([_, colInfo]) => {
        
        const headerCell = document.createElement('th');
        headerCell.textContent = colInfo.ColName;
        columns.push(colInfo.ColName);
        thead.appendChild(headerCell);
    });

    console.log(tData.results)

    const start = (currentPage - 1) * resultsPerPage;
    const paginatedResults = tData.results.slice(start, start + resultsPerPage);



    paginatedResults.forEach(row => {
        const tr = document.createElement('tr');

        columns.forEach(col => {
            const td = document.createElement('td');
            td.textContent = row[col] ?? "";
            tr.appendChild(td);
        });

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
                renderTable();
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
        renderTable();
    }
}

function increaseCurrentPage(){
    if(currentPage >= totalPages){
        return
    }
    else{
        currentPage += 1;
        renderTable();
    }
}