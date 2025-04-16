document.addEventListener("DOMContentLoaded", async () => {
    async function satscounterupdater() {
        const authToken = getCookie("auth");
        if (!authToken) {
            showNotification("bad", "No authToken found, please login");
            window.location.href = '/signup';
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
                return;
            }

            const data = await response.json();
            let satstext;
            if (data.sats === 1) {
                satstext = `${data.sats} SAT`
            }
            else {
                satstext = `${data.sats} SATS`
            }
            document.getElementById("satscounter").textContent = satstext;
        } catch (error) {
            
        }
    }

    await satscounterupdater();

    setInterval(satscounterupdater, 10000);
});

async function counterupdater() {
    const authToken = getCookie("auth");
    if (!authToken) {
        showNotification("bad", "No authToken found, please login");
        window.location.href = '/signup';
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
            return;
        }

        const data = await response.json();
        let satstext;
        if (data.sats === 1) {
            satstext = `${data.sats} SAT`
        }
        else {
            satstext = `${data.sats} SATS`
        }
        document.getElementById("satscounter").textContent = satstext;
    } catch (error) {
        
    }
}
