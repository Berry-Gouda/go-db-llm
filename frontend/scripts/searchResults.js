


function DisplaySearchResults(table, isSearch, results){
    console.log("DisplaySearch")
    const tH3 = document.querySelector("#search-results h3");
    const thead = document.querySelector("#search-table thead");
    const tbody = document.querySelector("#search-table tbody");
    const columns = []

    tH3.textContent = isSearch ? "Search Results" : "Top 20 Rows";

    Object.entries(totalData.tableSchema[table]).forEach(([_, colInfo]) => {
        const headerCell = document.createElement('th');
        headerCell.textContent = colInfo.ColName;
        columns.push(colInfo.ColName);
        thead.appendChild(headerCell);
    });

    console.log(results)

    results.forEach(row => {
        const tr = document.createElement('tr');

        columns.forEach(col => {
            const td = document.createElement('td');
            td.textContent = row[col] ?? "";
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}
