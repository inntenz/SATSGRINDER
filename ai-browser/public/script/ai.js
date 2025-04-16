let user = "";

async function userinfo() {
    user = readCookie("user");
    if (!user) {
        const response = await fetch("/api/intenz/createuser", {
            method: "POST",
            headers: {"Content-Type": "application/json" },
            cache: "no-store"
        });

        const data = await response.json();
        user = data.user;
        placeCookie("user", data.user);
    }
}

window.onload = async function () {
    await userinfo();  
};

document.getElementById('prompt').addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

async function checkInput() {
    const prompt = document.getElementById("prompt").value.trim();
    const submitBtn = document.getElementById("submitbtn");
    submitBtn.disabled = prompt.length === 0;
}

function escapeHTML(html) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(html));
    return div.innerHTML;
}

async function sendMessage() {
    await checkInput();
    const startElements = document.querySelectorAll('.start');
    if (startElements.length > 0) {
        startElements.forEach(element => {
            element.remove();
        });
    }
    const promptstart = document.querySelector('.prompt-start');
    if (promptstart) {
        promptstart.classList.replace('prompt-start', 'prompt');  
    }
    const prompt = document.getElementById("prompt").value;
    const model = document.getElementById("model").innerText;
    const textarea = document.getElementById("prompt");
    
    
    
    const responseDiv = document.getElementById("response");
    const symbol = document.getElementById("symbol");
    const submitBtn = document.getElementById("submitbtn");

    symbol.src = "https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/square-fill.svg";
    submitBtn.disabled = true;

    const newContent = document.createElement("div");
    newContent.classList.add("block");

    const escapedPrompt = escapeHTML(prompt);
    const promptDiv = document.createElement("div");
    promptDiv.classList.add("userprompt");
    promptDiv.innerHTML = `<p>${escapedPrompt}</p>`;
    newContent.appendChild(promptDiv);
    responseDiv.appendChild(newContent);

    newContent.scrollIntoView({ behavior: 'smooth', block: 'start' });

    textarea.value = "";
    textarea.blur();
    textarea.placeholder = prompt;    
    
    
    try {
        const response = await fetch("/api/intenz/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, model, user }),
            credentials: "include",
            cache: "no-store"
        });
        
        
        const data = await response.json();
        symbol.src = "https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/arrow-up.svg";

        if (!response.ok) {
            const errorMessage = "Error fetching response";
            const errorDiv = document.createElement("div");
            errorDiv.classList.add("error");
            errorDiv.innerHTML = `<p>${errorMessage}</p>`;
            responseDiv.appendChild(errorDiv);
            submitBtn.disabled = false;
            textarea.placeholder = "How can I help you?";
            return;
        }

        submitBtn.disabled = false;

        let reply = data.cleanedReply;
        let formattedReply = marked.parse(reply);
        textarea.placeholder = "How can I help you?";

        const responseDivElement = document.createElement("div");
        responseDivElement.classList.add("response");
        responseDivElement.innerHTML = formattedReply;
        newContent.appendChild(responseDivElement);

        document.querySelectorAll("pre code").forEach((block) => {
            hljs.highlightElement(block);
            const copyButton = document.createElement("button");
            copyButton.innerHTML = '<i class="fa-solid fa-copy"></i>';
            copyButton.className = "copy-btn";
            copyButton.onclick = () => copyCode(block.textContent, copyButton);
            block.parentElement.insertBefore(copyButton, block);
        });

        responseDiv.scrollTo({ top: responseDiv.scrollHeight, behavior: "smooth" });
    } catch (error) {
        const errorMessage = "Error while fetching the response";
        const errorDiv = document.createElement("div");
        errorDiv.classList.add("error");
        errorDiv.innerHTML = `<p>${errorMessage}</p>`;
        responseDiv.appendChild(errorDiv);
        console.error("Error:", error);
        symbol.src = "https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/arrow-up-square-fill.svg";
        submitBtn.disabled = false;
        textarea.placeholder = "How can I help you today?";
    }
}


function copyCode(codeContent, button) {
    navigator.clipboard.writeText(codeContent).then(() => {
    }).catch(err => console.error("Error copying:", err));
}
