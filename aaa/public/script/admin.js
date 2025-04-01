window.onload = async function () {
    const authToken = getCookie("auth");

    if (!authToken) {
        showNotification("bad", "No authToken found, please login");
        window.location.href = '/signup';
        return;
    }

    try {
        const response = await fetch("/admin", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ authToken }),
        });

        if (response.ok) {
            document.getElementById("password-section").style.display = "none";
            await showNotification("good", "Welcome to the admin panel!");
            document.getElementById("admin-panel").style.display = "block";
        } else {
            document.getElementById("password-error").style.display = "block";
        }
    } catch (error) {
        console.error("Error:", error);
    }
};
 
    
document.getElementById("panel").addEventListener("submit", async (e) => {
    e.preventDefault(); // Verhindert das Standardverhalten des Formulars

    const authToken = getCookie("auth");
    if (!authToken) {
        showNotification("bad", "No authToken found, please login");
        window.location.href = '/signup';
        return;
    }

    // Unterscheidung, welcher Button ausgelöst wurde
    const clickedButton = e.submitter?.id; // `e.submitter` gibt den Button zurück, der das Event ausgelöst hat

    if (clickedButton === "lookup-email") {
        const email = document.getElementById("email-search").value;
        if (!email) {
            showNotification("bad", "Please provide a valid email.");
            return;
        }

        try {
            const response = await fetch("/lookup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, authToken }),
            });

            if (!response.ok) {
                showNotification("bad", "User not found.");
                document.getElementById("user-info").style.display = "none";
                return;
            }

            const userData = await response.json();
            document.getElementById("username").textContent = `Username: ${userData.username}`;
            document.getElementById("email").textContent = `Email: ${userData.email}`;
            document.getElementById("userid").textContent = `User ID: ${userData.userid}`;
            document.getElementById("country").textContent = `Country: ${userData.country}`;
            document.getElementById("ip").textContent = `IP: ${userData.ip}`;
            document.getElementById("coins").textContent = `Balance: ${userData.coins} Sats`;
            document.getElementById("totalcashout").textContent = `Cashout: ${userData.totalcashout} Sats`;
            document.getElementById("registerdate").textContent = `Register-date: ${userData.registerday}`;
            document.getElementById("banned").textContent = `Banned: ${userData.banned ? "Yes" : "No"}`;
            document.getElementById("user-info").style.display = "block";
        } catch (error) {
            console.error("Error fetching user data:", error);
        }

    } else if (clickedButton === "banbutton") {
        const email = document.getElementById("email-search").value;
        if (!email) {
            showNotification("bad", "Please provide a valid email.");
            return;
        }

        try {
            const response = await fetch("/ban", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, authToken }),
            });

            if (response.ok) {
                showNotification("good", "User has been banned successfully.");
                document.getElementById("banned").textContent = `Banned: Yes`;
            } else {
                showNotification("bad", "Failed to ban the user.");
            }
        } catch (error) {
            console.error("Error banning user:", error);
        }
    } else {
        showNotification("bad", "Unknown action.");
    }
});
