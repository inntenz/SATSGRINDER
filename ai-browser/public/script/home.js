async function stats() {
    const usageelement = document.getElementById("usageelement");
    const launchelement = document.getElementById("launchelement");
    try {
        const response = await fetch("/api/intenz/home", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store"
        });

        const data = await response.json();
        const usage = data.usage;
        const launchdate = data.launchdate;

        usageelement.innerText = `Total requests: ${usage}`;
        launchelement.innerText = `${launchdate}`;
        
    } catch (error) {
    }
}


window.onload = async function() {
    stats();
    setInterval(stats, 10000); 
}

