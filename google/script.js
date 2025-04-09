document.getElementById("google-login").addEventListener("click", async () => {
    const response = await fetch("/auth/url");
    const { url } = await response.json();
    window.location.href = url;
});
