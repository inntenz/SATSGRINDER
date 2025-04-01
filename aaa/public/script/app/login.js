document.addEventListener('DOMContentLoaded', async () => {
    const authToken = getCookie("auth");
    if (authToken) {
        window.location.href = '/app-home';
        return;
    }

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        const ip = ipData.ip;

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const hcaptchaResponse = hcaptcha.getResponse();

        if (!hcaptchaResponse) {
            hcaptcha.reset();
            await showNotification("bad", 'Please do the Captcha first!');
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, hcaptchaResponse, ip }),
            });

            if (response.status === 408) {
                hcaptcha.reset();
                document.getElementById('password').value = "";
                await showNotification("bad", 'Invalid Password!');
                return;
            }
            if (response.status === 409) {
                hcaptcha.reset();
                await showNotification("bad", 'There is no account with this email! Go Signup first!');
                return;
            }
            if (response.status === 411) {
                hcaptcha.reset();
                await showNotification("bad", 'Please deactivate your VPN!');
                return;
            }
            if (!response.ok) {
                hcaptcha.reset();
                await showNotification("bad", 'Error during your login');
                return;
            }
            if (response.ok) {
                const authToken = await response.json();
                await showNotification("good", 'Successfully logged into your account!');
                setCookie("auth", authToken);
                window.location.href = "/app-home";
            }
        } catch (err) {

        }
    });
});