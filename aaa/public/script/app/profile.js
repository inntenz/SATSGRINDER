async function loadprofile() {
    const authToken = getCookie("auth"); 

    if (!authToken) {
        await showNotification("bad", "No authToken found, please login");
        window.location.href='/signup';
        return;
    }

    
    try {
        const response = await fetch("/api/userinfo", {
            method: "POST", 
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ authToken }),
        });

        if (!response.ok) {
            throw new Error(`Fehler: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json(); 
        let challenges_count = 0;
        const challenges_data = data.challenges;

        challenges_data.forEach(id => {
            challenges_count += 1;
        });
        
        document.getElementById("username").textContent = `${data.username}`;
        document.getElementById("sats").textContent = `${data.sats} SATS`;
        document.getElementById("withdrawed_sats").textContent = `${data.totalcashout} SATS`;
        document.getElementById("faucet_claims").textContent = `${data.totalclaims} CLAIMS`;
        document.getElementById("registerdate").textContent = `${data.regdate}`;
        document.getElementById("challenges_done").textContent = `${challenges_count}`;

        if (!data.address) {
            document.getElementById("address").innerHTML = 
            `
            <form id="addressForm">
                <div class="addressinput">
                    <input id="inputaddress" type="text" placeholder="username@domain.gg" required pattern="^[^@]+@[^@]+$" title="Please input a valid lightning address"></input>
                    <button id="addressbutton">Set lightning address</button>
                </div>
            </form>
            `
        }
        if (data.address) {
            document.getElementById("address").innerHTML = 
            `
            <form id="addressForm">
                <div class="addressinput">
                    <input id="inputaddress" type="text" placeholder="${data.address}" required pattern="^[^@]+@[^@]+$" title="Please input a valid lightning address"></input>
                    <button id="addressbutton">Change lightning address</button>
                </div>
            </form>
            `
        }

        
    } catch (error) {
        console.error("Erros with API-Request:", error);
    }

}

window.onload = async function() {
    await loadprofile();
};

document.getElementById('address').addEventListener('submit', async (e) => {
    const addressbutton = document.getElementById("addressbutton");
    addressbutton.disabled = true;
    
    e.preventDefault();
    const authToken = getCookie("auth");
    const address = document.getElementById("inputaddress").value;
    
    const response = await fetch('/api/change-lnaddress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authToken, address })
    });

    if (response.ok) {
        loadprofile();
        await showNotification("good", "Changed Lightning address successfully!");
        addressbutton.disabled = false;
        
        return;
    } else {
        await showNotification("bad", "Error during the address changing process!");
        addressbutton.disabled = false;
        return;
    }
});
