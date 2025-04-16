let user = "";

async function language() {
    let language = getCookie("language");
    const errorinfo = document.getElementById("errorinfo");
    const textarea = document.getElementById("prompt");
    if (!language) {
        const response = await fetch("/api/intenz/language", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store"
        });

        const data = await response.json();
        function sanitizeString(str) {
            return str.replace(/[&<>#%{}|\\^~\[\]`]/g, '');
        }
        
        const promptMessage = sanitizeString(data.promptmessage);
        const errorInfoMessage = sanitizeString(data.errorinfomessage);
        
        setCookie("language", `${promptMessage} :-: ${errorInfoMessage}`);
  
        language = getCookie("language");
    }
    const [textareatext, errorinfotext] = language.split(" :-: ");
    textarea.placeholder = textareatext;
    errorinfo.innerText = errorinfotext;
        
}



async function userinfo() {
    user = readCookie("user");
    if (!user) {
        const response = await fetch("/api/intenz/createuser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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

function checkInput() {
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
    let prompt = document.getElementById("prompt").value.trim();
    document.getElementById("prompt").value = "";
    checkInput();
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
    newContent.scrollIntoView({ behavior: "smooth" });

    try {
        
        const response = await fetch("/api/intenz/websearch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, user }),
            cache: "no-store"
        });

        const data = await response.json();
        symbol.src = "https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/arrow-up-square-fill.svg";

        if (!response.ok) {
            const errorMessage = "Error fetching response";
            const errorDiv = document.createElement("div");
            errorDiv.classList.add("error");
            errorDiv.innerHTML = `<p>${errorMessage}</p>`;
            responseDiv.appendChild(errorDiv);
            submitBtn.disabled = false;
            return;
        }

        submitBtn.disabled = false;

        let reply = data.content;
        let formattedReply = marked.parse(reply);

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
        submitBtn.disabled = false;
    }
}


function copyCode(codeContent, button) {
    navigator.clipboard.writeText(codeContent).then(() => {
    }).catch(err => console.error("Error copying:", err));
}
