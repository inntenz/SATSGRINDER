async function loadchallenges() {
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

        const challenges = data.challenges;

        document.getElementById("1").disabled = false;
        document.getElementById("2").disabled = false;
        document.getElementById("3").disabled = false;

        challenges.forEach(id => {
            const button = document.getElementById(`${id}`);
            if (button) {
                button.innerText = "Completed";
                button.disabled = true;
            }
        });
        

        


        
    } catch (error) {
        console.error("Erros with API-Request:", error);
    }

}

loadchallenges();
counterupdater();

document.getElementById("1").addEventListener("click", async () => {
    const challenge1 = document.getElementById("1");
    challenge1.disabled = true;
    challenge1.innerText = "Completed";
    const authToken = getCookie("auth");
    const id = "1";
    const response = await fetch('/api/do-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authToken, id }),
        keepalive: true,
    });

    if (response.ok) {
        showNotification("good", "Challenge completed successful!");
        challenge1.innerText = "Completed";
        counterupdater();
    } else {
        showNotification("bad", "Error during the challenge process!");
        challenge1.disabled = false;
    }
});
document.getElementById("2").addEventListener("click", async () => {
    const challenge2 = document.getElementById("2");
    challenge2.disabled = true;
    challenge2.innerText = "Completed";
    const authToken = getCookie("auth");
    const id = "2";
    const response = await fetch('/api/do-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authToken, id }),
        keepalive: true,
    });

    if (response.ok) {
        showNotification("good", "Challenge completed successful!");
        challenge2.innerText = "Completed";
        counterupdater();
    } else {
        showNotification("bad", "Error during the challenge process!");
        challenge2.disabled = false;
    }
});
document.getElementById("3").addEventListener("click", async () => {
    const challenge3 = document.getElementById("3");
    challenge3.disabled = true;
    challenge3.innerText = "Completed";
    const authToken = getCookie("auth");
    const id = "3";
    const response = await fetch('/api/do-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authToken, id }),
        keepalive: true,
    });

    if (response.ok) {
        showNotification("good", "Challenge completed successful!");
        challenge3.innerText = "Completed";
        counterupdater();
    } else {
        showNotification("bad", "Error during the challenge process!");
        challenge3.disabled = false;
    }
});
