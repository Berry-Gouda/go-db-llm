document.addEventListener("DOMContentLoaded", function(){
    const loadingHeader = document.getElementById("header")
    let dots = 0
    setInterval(() => {
        dots = (dots + 1) % 4;
        loadingHeader.textContent = "Loading" + " . ".repeat(dots);
    }, 1000);
})