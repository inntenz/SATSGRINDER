function setcolormode() {
    const darkModeHighlightJS = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/github-dark.min.css";
    const lightModeHighlightJS = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/github.min.css";
    
    let pageLinkElement = document.getElementById('colorcss');

    let colorhref = pageLinkElement.href;
    colorhref = colorhref.split(".css")[0];
    colorhref = colorhref.split("-dark")[0];
    colorhref = colorhref.split("-white")[0];

    const darkModePage = `${colorhref}-dark.css`;
    const lightModePage = `${colorhref}-white.css`;

    let highlightLinkElement = document.getElementById('highlightjs-theme');
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        if (highlightLinkElement) {
            highlightLinkElement.href = darkModeHighlightJS;
        }
        pageLinkElement.href = darkModePage;
    } else {
        if (highlightLinkElement) {
            highlightLinkElement.href = lightModeHighlightJS;
        }
        pageLinkElement.href = lightModePage;
    }
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    setcolormode();
});

setcolormode();
